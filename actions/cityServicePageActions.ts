"use server";

import { database } from "@/config/firebase";
import { createDefaultCityLandingTemplate } from "@/lib/cityLandingDefaults";
import { createDefaultCityServiceTemplate } from "@/lib/cityServiceDefaults";
import { cities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityLandingPage,
  type CityLandingTemplate,
  type CityServiceBlock,
  type CityServiceKey,
  type CityServicePage,
  type CityServiceSeoSettings,
  type CityServiceTemplate,
  type ResolvedCityServicePage,
  type ResolvedCityLandingPage,
} from "@/types/city/CityServicePage";
import type { CityFAQ } from "@/types/city/CityFAQType";
import type { CityPageSection } from "@/types/city/CityPageSection";
import { slugify } from "@/utils/slugify";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TEMPLATE_COLLECTION = "cityServiceTemplates";
const PAGE_COLLECTION = "cityServicePages";
const LANDING_TEMPLATE_COLLECTION = "cityLandingTemplates";
const LANDING_PAGE_COLLECTION = "cityLandingPages";
const LEGACY_CITY_PAGE_COLLECTION = "cityPages";

const toneSchema = z.enum(["white", "muted", "navy", "accent"]);
const colorSchema = z
  .string()
  .regex(/^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i, "Ungültige Farbe");
const blockStyleSchema = z.object({
  backgroundColor: colorSchema.optional(),
  backgroundImage: z.string().trim().min(1).max(2_048).optional(),
  backgroundPosition: z.enum(["top", "center", "bottom"]).optional(),
  overlayColor: colorSchema.optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
  textColor: colorSchema.optional(),
  accentColor: colorSchema.optional(),
  contentWidth: z.enum(["narrow", "boxed", "wide", "full"]).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  headingSize: z.number().int().min(16).max(96).optional(),
  textSize: z.number().int().min(10).max(32).optional(),
  paddingTop: z.number().int().min(0).max(240).optional(),
  paddingBottom: z.number().int().min(0).max(240).optional(),
  marginTop: z.number().int().min(0).max(160).optional(),
  marginBottom: z.number().int().min(0).max(160).optional(),
  minHeight: z.number().int().min(0).max(1_000).optional(),
  borderRadius: z.number().int().min(0).max(64).optional(),
  hideOnDesktop: z.boolean().optional(),
  hideOnTablet: z.boolean().optional(),
  hideOnMobile: z.boolean().optional(),
});
const baseBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),
  enabled: z.boolean(),
  tone: toneSchema,
  style: blockStyleSchema.optional(),
});
const templateText = z.string().max(20_000);
const shortText = z.string().max(500);
const assetPath = z.string().trim().min(1).max(2_048);
const safeLink = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine(
    (value) => value.startsWith("/") || value.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(value),
    "Ungültiger Link",
  );

const heroBlockSchema = baseBlockSchema.extend({
  type: z.literal("hero"),
  title: shortText,
  description: templateText,
  image: assetPath,
  imageAlt: shortText,
  formTitle: shortText,
  formText: templateText,
});
const introBlockSchema = baseBlockSchema.extend({
  type: z.literal("intro"),
  heading: shortText,
  text: templateText,
});
const imageTextBlockSchema = baseBlockSchema.extend({
  type: z.literal("imageText"),
  eyebrow: shortText.optional(),
  heading: shortText,
  paragraphs: z.array(templateText).min(1).max(10),
  image: assetPath,
  imageAlt: shortText,
  imagePosition: z.enum(["left", "right"]),
  ctaLabel: z.string().max(100).optional(),
  ctaUrl: safeLink.optional(),
});
const localAreaBlockSchema = baseBlockSchema.extend({
  type: z.literal("localArea"),
  heading: shortText,
  eyebrow: shortText,
  nearbyLimit: z.number().int().min(1).max(12),
  showFacts: z.boolean(),
});
const cardSchema = z.object({ title: shortText, text: templateText });
const cardGridBlockSchema = baseBlockSchema.extend({
  type: z.literal("cardGrid"),
  eyebrow: shortText.optional(),
  heading: shortText,
  intro: templateText.optional(),
  cards: z.array(cardSchema).min(1).max(12),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  numbered: z.boolean(),
});
const checkListBlockSchema = baseBlockSchema.extend({
  type: z.literal("checkList"),
  heading: shortText,
  intro: templateText.optional(),
  items: z.array(templateText).min(1).max(30),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
const processBlockSchema = baseBlockSchema.extend({
  type: z.literal("process"),
  heading: shortText,
  intro: templateText.optional(),
  steps: z.array(templateText).min(1).max(12),
});
const pricingBlockSchema = baseBlockSchema.extend({
  type: z.literal("pricing"),
  eyebrow: shortText.optional(),
  heading: shortText,
  text: templateText,
  factors: z.array(templateText).min(1).max(20),
  ctaTitle: shortText,
  ctaText: templateText,
  ctaLabel: z.string().max(100),
});
const faqBlockSchema = baseBlockSchema.extend({
  type: z.literal("faq"),
  heading: shortText,
  items: z
    .array(z.object({ question: shortText, answer: templateText }))
    .max(30),
  includeLocalQuestion: z.boolean(),
});
const contactBlockSchema = baseBlockSchema.extend({
  type: z.literal("contact"),
  heading: shortText,
  text: templateText,
  showPhone: z.boolean(),
  showEmail: z.boolean(),
  showForm: z.boolean(),
});
const nearbyCitiesBlockSchema = baseBlockSchema.extend({
  type: z.literal("nearbyCities"),
  heading: shortText,
  intro: templateText,
  limit: z.number().int().min(1).max(30),
  radiusKm: z.number().int().min(1).max(150),
  showDistance: z.boolean(),
});
const otherServicesBlockSchema = baseBlockSchema.extend({
  type: z.literal("otherServices"),
  heading: shortText,
});
const serviceCardsBlockSchema = baseBlockSchema.extend({
  type: z.literal("serviceCards"),
  heading: shortText,
  serviceKeys: z.array(z.enum(CITY_SERVICE_KEYS)).min(1).max(5),
});
const ctaBlockSchema = baseBlockSchema.extend({
  type: z.literal("cta"),
  eyebrow: shortText.optional(),
  heading: shortText,
  text: templateText,
  primaryLabel: z.string().trim().min(1).max(100),
  primaryUrl: safeLink,
  secondaryLabel: z.string().trim().max(100).optional(),
  secondaryUrl: safeLink.optional(),
});
const statsBlockSchema = baseBlockSchema.extend({
  type: z.literal("stats"),
  heading: shortText.optional(),
  items: z
    .array(z.object({ value: shortText, label: shortText }))
    .min(1)
    .max(8),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});
const testimonialsBlockSchema = baseBlockSchema.extend({
  type: z.literal("testimonials"),
  heading: shortText,
  items: z
    .array(
      z.object({
        quote: templateText,
        name: shortText,
        role: shortText.optional(),
        avatar: assetPath.optional(),
        source: shortText.optional(),
        rating: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5),
        ]),
      }),
    )
    .min(1)
    .max(9),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
const galleryBlockSchema = baseBlockSchema.extend({
  type: z.literal("gallery"),
  heading: shortText,
  intro: templateText.optional(),
  images: z
    .array(
      z.object({
        src: assetPath,
        alt: shortText,
        caption: shortText.optional(),
      }),
    )
    .min(1)
    .max(18),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  aspectRatio: z.enum(["square", "landscape", "portrait"]),
});
const videoBlockSchema = baseBlockSchema.extend({
  type: z.literal("video"),
  heading: shortText,
  text: templateText.optional(),
  videoUrl: safeLink.or(z.literal("")),
  poster: assetPath.optional(),
  caption: shortText.optional(),
});
const logoCloudBlockSchema = baseBlockSchema.extend({
  type: z.literal("logoCloud"),
  heading: shortText,
  logos: z
    .array(
      z.object({
        src: assetPath,
        alt: shortText,
        url: safeLink.optional(),
      }),
    )
    .min(1)
    .max(18),
  columns: z.union([
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
});
const accordionBlockSchema = baseBlockSchema.extend({
  type: z.literal("accordion"),
  heading: shortText,
  intro: templateText.optional(),
  items: z
    .array(z.object({ title: shortText, content: templateText }))
    .min(1)
    .max(20),
});
const spacerBlockSchema = baseBlockSchema.extend({
  type: z.literal("spacer"),
  height: z.number().int().min(0).max(300),
  showDivider: z.boolean(),
  dividerColor: colorSchema,
  dividerWidth: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
const carouselBlockSchema = baseBlockSchema.extend({
  type: z.literal("carousel"),
  heading: shortText.optional(),
  intro: templateText.optional(),
  slides: z
    .array(
      z.object({
        image: assetPath,
        imageAlt: shortText,
        heading: shortText.optional(),
        text: templateText.optional(),
        linkLabel: z.string().trim().max(100).optional(),
        linkUrl: safeLink.optional(),
      }),
    )
    .min(1)
    .max(12),
  autoplay: z.boolean(),
  interval: z.number().int().min(2_000).max(20_000),
  showArrows: z.boolean(),
  showDots: z.boolean(),
});
const imageCollageBlockSchema = baseBlockSchema.extend({
  type: z.literal("imageCollage"),
  eyebrow: shortText.optional(),
  heading: shortText,
  text: templateText,
  images: z
    .array(z.object({ src: assetPath, alt: shortText }))
    .min(2)
    .max(5),
  imagePosition: z.enum(["left", "right"]),
  layout: z.enum(["stacked", "fan", "mosaic"]),
});
const beforeAfterBlockSchema = baseBlockSchema.extend({
  type: z.literal("beforeAfter"),
  heading: shortText,
  text: templateText.optional(),
  beforeImage: assetPath,
  beforeAlt: shortText,
  beforeLabel: z.string().trim().min(1).max(50),
  afterImage: assetPath,
  afterAlt: shortText,
  afterLabel: z.string().trim().min(1).max(50),
});
const imageCardsBlockSchema = baseBlockSchema.extend({
  type: z.literal("imageCards"),
  heading: shortText,
  intro: templateText.optional(),
  cards: z
    .array(
      z.object({
        image: assetPath,
        imageAlt: shortText,
        title: shortText,
        text: templateText,
        linkLabel: z.string().trim().max(100).optional(),
        linkUrl: safeLink.optional(),
      }),
    )
    .min(1)
    .max(12),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  overlay: z.boolean(),
});
const teamBlockSchema = baseBlockSchema.extend({
  type: z.literal("team"),
  heading: shortText,
  intro: templateText.optional(),
  members: z
    .array(
      z.object({
        image: assetPath,
        imageAlt: shortText,
        name: shortText,
        role: shortText,
        text: templateText.optional(),
      }),
    )
    .min(1)
    .max(12),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  introBlockSchema,
  imageTextBlockSchema,
  localAreaBlockSchema,
  cardGridBlockSchema,
  checkListBlockSchema,
  processBlockSchema,
  pricingBlockSchema,
  faqBlockSchema,
  contactBlockSchema,
  nearbyCitiesBlockSchema,
  otherServicesBlockSchema,
  serviceCardsBlockSchema,
  ctaBlockSchema,
  statsBlockSchema,
  testimonialsBlockSchema,
  galleryBlockSchema,
  videoBlockSchema,
  logoCloudBlockSchema,
  accordionBlockSchema,
  spacerBlockSchema,
  carouselBlockSchema,
  imageCollageBlockSchema,
  beforeAfterBlockSchema,
  imageCardsBlockSchema,
  teamBlockSchema,
]);

const seoSchema = z.object({
  title: shortText,
  description: z.string().max(500),
  image: assetPath,
  imageAlt: shortText,
  schemaDescription: z.string().max(1_000),
  keywords: z.array(z.string().trim().min(1).max(100)).max(30),
});

const templateEditSchema = z.object({
  serviceName: z.string().trim().min(1).max(100),
  primaryKeyword: z.string().trim().min(1).max(100),
  blocks: z.array(blockSchema).min(1).max(40),
  seo: seoSchema,
});

const landingTemplateEditSchema = z.object({
  blocks: z.array(blockSchema).min(1).max(40),
  seo: seoSchema,
});

const pageEditSchema = z.object({
  inheritTemplate: z.boolean(),
  blocks: z.array(blockSchema).min(1).max(40).optional(),
  seo: seoSchema.partial().optional(),
  published: z.boolean(),
});

type TemplateEditInput = z.input<typeof templateEditSchema>;
type LandingTemplateEditInput = z.input<typeof landingTemplateEditSchema>;
type PageEditInput = z.input<typeof pageEditSchema>;

function configuredOwnerId(ownerId?: string) {
  return ownerId?.trim() || process.env.NEXT_PUBLIC_OWNERID?.trim() || "default";
}

function assertOwner(ownerId: string) {
  const configured = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId || (configured && configured !== ownerId)) {
    throw new Error("Unzulässige Unternehmens-ID.");
  }
}

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

function templateId(ownerId: string, serviceKey: CityServiceKey) {
  return `${safeDocumentPart(ownerId)}__${serviceKey}`;
}

function pageId(
  ownerId: string,
  citySlug: string,
  serviceKey: CityServiceKey,
) {
  return `${safeDocumentPart(ownerId)}__${citySlug}__${serviceKey}`;
}

function landingTemplateId(ownerId: string) {
  return `${safeDocumentPart(ownerId)}__city-overview`;
}

function landingPageId(ownerId: string, citySlug: string) {
  return `${safeDocumentPart(ownerId)}__${citySlug}`;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)]),
    ) as T;
  }
  return value;
}

function fallbackTemplate(ownerId: string, serviceKey: CityServiceKey) {
  return {
    ...createDefaultCityServiceTemplate(serviceKey, ownerId, 0),
    id: templateId(ownerId, serviceKey),
  };
}

function fallbackPage(
  ownerId: string,
  cityName: string,
  citySlug: string,
  serviceKey: CityServiceKey,
): CityServicePage {
  return {
    id: pageId(ownerId, citySlug, serviceKey),
    ownerId,
    cityName,
    citySlug,
    serviceKey,
    templateId: templateId(ownerId, serviceKey),
    inheritTemplate: true,
    published: true,
    createdAt: 0,
    updatedAt: 0,
  };
}

async function readTemplate(ownerId: string, serviceKey: CityServiceKey) {
  const id = templateId(ownerId, serviceKey);
  const snapshot = await getDoc(doc(database, TEMPLATE_COLLECTION, id));
  if (!snapshot.exists()) return fallbackTemplate(ownerId, serviceKey);
  return { id: snapshot.id, ...snapshot.data() } as CityServiceTemplate;
}

async function readPage(
  ownerId: string,
  cityName: string,
  citySlug: string,
  serviceKey: CityServiceKey,
) {
  const id = pageId(ownerId, citySlug, serviceKey);
  const snapshot = await getDoc(doc(database, PAGE_COLLECTION, id));
  if (!snapshot.exists()) {
    return fallbackPage(ownerId, cityName, citySlug, serviceKey);
  }
  return { id: snapshot.id, ...snapshot.data() } as CityServicePage;
}

function resolvePage(
  page: CityServicePage,
  template: CityServiceTemplate,
): ResolvedCityServicePage {
  return {
    page,
    template,
    blocks:
      page.inheritTemplate || !page.blocks?.length
        ? template.blocks
        : page.blocks,
    seo: { ...template.seo, ...page.seo },
  };
}

function fallbackLandingTemplate(ownerId: string) {
  return {
    ...createDefaultCityLandingTemplate(ownerId, 0),
    id: landingTemplateId(ownerId),
  };
}

function fallbackLandingPage(
  ownerId: string,
  cityName: string,
  citySlug: string,
): CityLandingPage {
  return {
    id: landingPageId(ownerId, citySlug),
    ownerId,
    cityName,
    citySlug,
    templateId: landingTemplateId(ownerId),
    inheritTemplate: true,
    published: true,
    createdAt: 0,
    updatedAt: 0,
  };
}

async function readLandingTemplate(ownerId: string) {
  const id = landingTemplateId(ownerId);
  const snapshot = await getDoc(doc(database, LANDING_TEMPLATE_COLLECTION, id));
  if (!snapshot.exists()) return fallbackLandingTemplate(ownerId);
  return { id: snapshot.id, ...snapshot.data() } as CityLandingTemplate;
}

async function readLandingPage(
  ownerId: string,
  cityName: string,
  citySlug: string,
) {
  const id = landingPageId(ownerId, citySlug);
  const snapshot = await getDoc(doc(database, LANDING_PAGE_COLLECTION, id));
  if (!snapshot.exists()) {
    return fallbackLandingPage(ownerId, cityName, citySlug);
  }
  return { id: snapshot.id, ...snapshot.data() } as CityLandingPage;
}

function resolveLandingPage(
  page: CityLandingPage,
  template: CityLandingTemplate,
): ResolvedCityLandingPage {
  return {
    page,
    template,
    blocks:
      page.inheritTemplate || !page.blocks?.length
        ? template.blocks
        : page.blocks,
    seo: { ...template.seo, ...page.seo },
  };
}

function revalidateCityServicePage(
  citySlug: string,
  serviceKey: CityServiceKey,
) {
  try {
    revalidatePath(`/stadt/${citySlug}/${serviceKey}`);
    revalidatePath("/sitemaps/companycity/sitemap.xml");
  } catch {
    // CLI migrations run without a Next request context.
  }
}

function revalidateCityLandingPage(citySlug: string) {
  try {
    revalidatePath(`/stadt/${citySlug}`);
    revalidatePath("/sitemaps/companycity/sitemap.xml");
  } catch {
    // CLI migrations run without a Next request context.
  }
}

function revalidateAllCityServicePages() {
  try {
    revalidatePath("/stadt", "layout");
    revalidatePath("/sitemaps/companycity/sitemap.xml");
  } catch {
    // CLI migrations run without a Next request context.
  }
}

export async function getResolvedCityServicePage(input: {
  ownerId?: string;
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
}): Promise<ResolvedCityServicePage> {
  const ownerId = configuredOwnerId(input.ownerId);
  const [template, page] = await Promise.all([
    readTemplate(ownerId, input.serviceKey),
    readPage(ownerId, input.cityName, input.citySlug, input.serviceKey),
  ]);
  return resolvePage(page, template);
}

export async function getResolvedCityLandingPage(input: {
  ownerId?: string;
  cityName: string;
  citySlug: string;
}): Promise<ResolvedCityLandingPage> {
  const ownerId = configuredOwnerId(input.ownerId);
  const [template, page] = await Promise.all([
    readLandingTemplate(ownerId),
    readLandingPage(ownerId, input.cityName, input.citySlug),
  ]);
  return resolveLandingPage(page, template);
}

export async function getCityLandingEditorData(input: {
  ownerId: string;
  cityName: string;
  citySlug: string;
}) {
  assertOwner(input.ownerId);
  const [template, page] = await Promise.all([
    readLandingTemplate(input.ownerId),
    readLandingPage(input.ownerId, input.cityName, input.citySlug),
  ]);
  return { template, page, resolved: resolveLandingPage(page, template) };
}

export async function getCityLandingTemplateEditorData(ownerId: string) {
  assertOwner(ownerId);
  return readLandingTemplate(ownerId);
}

export async function getCityLandingSitemapRecords(ownerId?: string) {
  const resolvedOwnerId = configuredOwnerId(ownerId);
  const snapshot = await getDocs(
    query(
      collection(database, LANDING_PAGE_COLLECTION),
      where("ownerId", "==", resolvedOwnerId),
    ),
  );
  return snapshot.docs.map((pageSnapshot) => {
    const page = pageSnapshot.data() as CityLandingPage;
    return {
      citySlug: page.citySlug,
      published: page.published,
      updatedAt: page.updatedAt,
    };
  });
}

export async function getCityServiceSitemapRecords(ownerId?: string) {
  const resolvedOwnerId = configuredOwnerId(ownerId);
  const snapshot = await getDocs(
    query(
      collection(database, PAGE_COLLECTION),
      where("ownerId", "==", resolvedOwnerId),
    ),
  );
  return snapshot.docs.map((pageSnapshot) => {
    const page = pageSnapshot.data() as CityServicePage;
    return {
      citySlug: page.citySlug,
      serviceKey: page.serviceKey,
      published: page.published,
      updatedAt: page.updatedAt,
    };
  });
}

export async function getCityServiceEditorData(input: {
  ownerId: string;
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
}) {
  assertOwner(input.ownerId);
  const [template, page] = await Promise.all([
    readTemplate(input.ownerId, input.serviceKey),
    readPage(input.ownerId, input.cityName, input.citySlug, input.serviceKey),
  ]);
  return { template, page, resolved: resolvePage(page, template) };
}

export async function getCityServiceTemplateEditorData(
  ownerId: string,
  serviceKey: CityServiceKey,
) {
  assertOwner(ownerId);
  return readTemplate(ownerId, serviceKey);
}

export async function saveCityServiceTemplate(
  ownerId: string,
  serviceKey: CityServiceKey,
  input: TemplateEditInput,
) {
  assertOwner(ownerId);
  const parsed = templateEditSchema.parse(input);
  const current = await readTemplate(ownerId, serviceKey);
  const now = Date.now();
  const next: CityServiceTemplate = {
    ...current,
    id: templateId(ownerId, serviceKey),
    ownerId,
    serviceKey,
    serviceName: parsed.serviceName,
    primaryKeyword: parsed.primaryKeyword,
    blocks: parsed.blocks as CityServiceBlock[],
    seo: parsed.seo as CityServiceSeoSettings,
    createdAt: current.createdAt || now,
    updatedAt: now,
    version: (current.version || 0) + 1,
  };
  await setDoc(
    doc(database, TEMPLATE_COLLECTION, next.id),
    stripUndefinedDeep(next),
  );
  revalidateAllCityServicePages();
  return next;
}

export async function saveCityServicePage(
  ownerId: string,
  cityName: string,
  citySlug: string,
  serviceKey: CityServiceKey,
  input: PageEditInput,
) {
  assertOwner(ownerId);
  const parsed = pageEditSchema.parse(input);
  const current = await readPage(ownerId, cityName, citySlug, serviceKey);
  const now = Date.now();
  const next: CityServicePage = {
    ...current,
    id: pageId(ownerId, citySlug, serviceKey),
    ownerId,
    cityName,
    citySlug,
    serviceKey,
    templateId: templateId(ownerId, serviceKey),
    inheritTemplate: parsed.inheritTemplate,
    blocks: parsed.inheritTemplate
      ? undefined
      : (parsed.blocks as CityServiceBlock[] | undefined),
    seo: parsed.seo as Partial<CityServiceSeoSettings> | undefined,
    published: parsed.published,
    createdAt: current.createdAt || now,
    updatedAt: now,
  };
  await setDoc(
    doc(database, PAGE_COLLECTION, next.id),
    stripUndefinedDeep(next),
  );
  revalidateCityServicePage(citySlug, serviceKey);
  return next;
}

export async function saveCityLandingTemplate(
  ownerId: string,
  input: LandingTemplateEditInput,
) {
  assertOwner(ownerId);
  const parsed = landingTemplateEditSchema.parse(input);
  const current = await readLandingTemplate(ownerId);
  const now = Date.now();
  const next: CityLandingTemplate = {
    ...current,
    id: landingTemplateId(ownerId),
    ownerId,
    blocks: parsed.blocks as CityServiceBlock[],
    seo: parsed.seo as CityServiceSeoSettings,
    createdAt: current.createdAt || now,
    updatedAt: now,
    version: (current.version || 0) + 1,
  };
  await setDoc(
    doc(database, LANDING_TEMPLATE_COLLECTION, next.id),
    stripUndefinedDeep(next),
  );
  revalidateAllCityServicePages();
  return next;
}

export async function saveCityLandingPage(
  ownerId: string,
  cityName: string,
  citySlug: string,
  input: PageEditInput,
) {
  assertOwner(ownerId);
  const parsed = pageEditSchema.parse(input);
  const current = await readLandingPage(ownerId, cityName, citySlug);
  const now = Date.now();
  const next: CityLandingPage = {
    ...current,
    id: landingPageId(ownerId, citySlug),
    ownerId,
    cityName,
    citySlug,
    templateId: landingTemplateId(ownerId),
    inheritTemplate: parsed.inheritTemplate,
    blocks: parsed.inheritTemplate
      ? undefined
      : (parsed.blocks as CityServiceBlock[] | undefined),
    seo: parsed.seo as Partial<CityServiceSeoSettings> | undefined,
    published: parsed.published,
    createdAt: current.createdAt || now,
    updatedAt: now,
  };
  await setDoc(
    doc(database, LANDING_PAGE_COLLECTION, next.id),
    stripUndefinedDeep(next),
  );
  revalidateCityLandingPage(citySlug);
  return next;
}

type LegacyCityPageData = {
  city?: string;
  ownerId?: string;
  ownerid?: string;
  faq?: CityFAQ[];
  sections?: CityPageSection[];
  title?: string;
  description?: string;
};

function applyLegacyCityPage(
  template: CityLandingTemplate,
  legacy?: LegacyCityPageData,
) {
  if (!legacy) return {};

  const hasFaq = Boolean(legacy.faq?.length);
  const hasSections = Boolean(legacy.sections?.length);
  const hasSeo = Boolean(legacy.title || legacy.description);
  if (!hasFaq && !hasSections && !hasSeo) return {};

  const blocks = structuredClone(template.blocks);
  if (hasFaq) {
    const faqIndex = blocks.findIndex((block) => block.type === "faq");
    if (faqIndex >= 0 && blocks[faqIndex].type === "faq") {
      blocks[faqIndex] = {
        ...blocks[faqIndex],
        items: legacy.faq!.map((item) => ({ ...item })),
      };
    }
  }
  if (hasSections) {
    const insertionIndex = Math.max(
      1,
      blocks.findIndex((block) => block.type === "serviceCards"),
    );
    const legacyBlocks: CityServiceBlock[] = legacy.sections!.map(
      (section, index) =>
        section.image
          ? {
              id: `legacy-section-${index}`,
              type: "imageText",
              enabled: true,
              tone: index % 2 === 0 ? "white" : "muted",
              heading: section.titel,
              paragraphs: [section.text],
              image: section.image,
              imageAlt: section.titel,
              imagePosition: index % 2 === 0 ? "left" : "right",
              ctaLabel: section.link ? "Mehr erfahren" : undefined,
              ctaUrl: section.link,
            }
          : {
              id: `legacy-section-${index}`,
              type: "intro",
              enabled: true,
              tone: index % 2 === 0 ? "white" : "muted",
              heading: section.titel,
              text: section.text,
            },
    );
    blocks.splice(insertionIndex, 0, ...legacyBlocks);
  }

  return {
    inheritTemplate: false,
    blocks,
    seo: hasSeo
      ? {
          ...(legacy.title ? { title: legacy.title } : {}),
          ...(legacy.description ? { description: legacy.description } : {}),
        }
      : undefined,
  };
}

export async function migrateCityServicePages(ownerId: string) {
  assertOwner(ownerId);
  const [
    templateSnapshot,
    pageSnapshot,
    landingTemplateSnapshot,
    landingPageSnapshot,
    legacyCityPageSnapshot,
  ] = await Promise.all([
    getDocs(
      query(
        collection(database, TEMPLATE_COLLECTION),
        where("ownerId", "==", ownerId),
      ),
    ),
    getDocs(
      query(
        collection(database, PAGE_COLLECTION),
        where("ownerId", "==", ownerId),
      ),
    ),
    getDocs(
      query(
        collection(database, LANDING_TEMPLATE_COLLECTION),
        where("ownerId", "==", ownerId),
      ),
    ),
    getDocs(
      query(
        collection(database, LANDING_PAGE_COLLECTION),
        where("ownerId", "==", ownerId),
      ),
    ),
    getDocs(collection(database, LEGACY_CITY_PAGE_COLLECTION)),
  ]);
  const existingTemplates = new Set(
    templateSnapshot.docs.map((snapshot) => snapshot.id),
  );
  const existingPages = new Set(pageSnapshot.docs.map((snapshot) => snapshot.id));
  const existingLandingTemplates = new Set(
    landingTemplateSnapshot.docs.map((snapshot) => snapshot.id),
  );
  const existingLandingPages = new Set(
    landingPageSnapshot.docs.map((snapshot) => snapshot.id),
  );
  const legacyPageBySlug = new Map<string, LegacyCityPageData>();
  for (const snapshot of legacyCityPageSnapshot.docs) {
    const data = snapshot.data() as LegacyCityPageData;
    if (data.ownerId !== ownerId && data.ownerid !== ownerId) continue;
    const citySlug = data.city ? slugify(data.city) : snapshot.id;
    legacyPageBySlug.set(citySlug, data);
  }
  const now = Date.now();
  const batch = writeBatch(database);
  let templatesCreated = 0;
  let pagesCreated = 0;
  let landingTemplatesCreated = 0;
  let landingPagesCreated = 0;

  for (const serviceKey of CITY_SERVICE_KEYS) {
    const id = templateId(ownerId, serviceKey);
    if (!existingTemplates.has(id)) {
      const template = {
        ...createDefaultCityServiceTemplate(serviceKey, ownerId, now),
        id,
      };
      batch.set(
        doc(database, TEMPLATE_COLLECTION, id),
        stripUndefinedDeep(template),
      );
      templatesCreated++;
    }
  }

  const cityTemplateDocumentId = landingTemplateId(ownerId);
  const cityTemplate = {
    ...createDefaultCityLandingTemplate(ownerId, now),
    id: cityTemplateDocumentId,
  };
  if (!existingLandingTemplates.has(cityTemplateDocumentId)) {
    batch.set(
      doc(database, LANDING_TEMPLATE_COLLECTION, cityTemplateDocumentId),
      stripUndefinedDeep(cityTemplate),
    );
    landingTemplatesCreated++;
  }

  for (const cityName of cities) {
    const citySlug = slugify(cityName);
    const cityDocumentId = landingPageId(ownerId, citySlug);
    if (!existingLandingPages.has(cityDocumentId)) {
      const legacy = applyLegacyCityPage(
        cityTemplate,
        legacyPageBySlug.get(citySlug),
      );
      const landingPage: CityLandingPage = {
        ...fallbackLandingPage(ownerId, cityName, citySlug),
        ...legacy,
        id: cityDocumentId,
        createdAt: now,
        updatedAt: now,
        migratedAt: now,
      };
      batch.set(
        doc(database, LANDING_PAGE_COLLECTION, cityDocumentId),
        stripUndefinedDeep(landingPage),
      );
      landingPagesCreated++;
    }
    for (const serviceKey of CITY_SERVICE_KEYS) {
      const id = pageId(ownerId, citySlug, serviceKey);
      if (existingPages.has(id)) continue;
      const page: CityServicePage = {
        ...fallbackPage(ownerId, cityName, citySlug, serviceKey),
        id,
        createdAt: now,
        updatedAt: now,
        migratedAt: now,
      };
      batch.set(doc(database, PAGE_COLLECTION, id), page);
      pagesCreated++;
    }
  }

  if (
    templatesCreated ||
    pagesCreated ||
    landingTemplatesCreated ||
    landingPagesCreated
  ) {
    await batch.commit();
    revalidateAllCityServicePages();
  }

  return {
    templatesCreated,
    templatesSkipped: CITY_SERVICE_KEYS.length - templatesCreated,
    pagesCreated,
    pagesSkipped: cities.length * CITY_SERVICE_KEYS.length - pagesCreated,
    landingTemplatesCreated,
    landingTemplatesSkipped: 1 - landingTemplatesCreated,
    landingPagesCreated,
    landingPagesSkipped: cities.length - landingPagesCreated,
  };
}