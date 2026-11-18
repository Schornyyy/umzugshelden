import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { remainingApiTime } from "@/lib/apiDeadline";
import { createDefaultCityLandingTemplate } from "@/lib/cityLandingDefaults";
import {
  CITY_LANDING_PAGE_COLLECTION,
  CITY_LANDING_TEMPLATE_COLLECTION,
  CITY_SERVICE_PAGE_COLLECTION,
  CITY_SERVICE_TEMPLATE_COLLECTION,
  cityLandingPageId,
  cityLandingTemplateId,
  cityServicePageId,
  cityServicePath,
  cityServiceTemplateId,
} from "@/lib/cityPageIds";
import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";
import { serviceGenerationRules } from "@/lib/cityServiceContentPolicy";
import { createDefaultCityServiceTemplate, getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { buildCityServiceRenderContext } from "@/lib/cityServiceRenderContext";
import { resolveCityServiceText } from "@/lib/cityServiceTemplate";
import { linkCityBlocks } from "@/lib/cityInternalLinks";
import { buildCityImagePool, loadProjectImages, type ProjectImageSource } from "@/lib/cityImagePool";
import { containment, contentFingerprint } from "@/lib/contentSimilarity";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { fetchRenderedFingerprint, type RenderedFingerprint } from "@/lib/renderedPageContent";
import { filterGenerationContent, type GenerationPage } from "@/lib/generationPagePolicy";
import { getGenerationPages } from "@/lib/generationPages";
import { GeminiInvalidJsonError, generateGeminiJson } from "@/lib/gemini";
import { mapDeepStrings, seoLengthField } from "@/lib/seoGeneratedContent";
import { cities, getNearbyCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceBlock,
  type CityServiceKey,
  type CityServiceSeoSettings,
} from "@/types/city/CityServicePage";
import type {
  CityDuplicateReport,
  CityDuplicateRow,
  CityLocalizationResult,
  CityLocalizationSettings,
  CityPageKind,
} from "@/types/city/CityLocalization";
import { slugify } from "@/utils/slugify";

export const CITY_LOCALIZATION_RUN_COLLECTION = "cityLocalizationRuns";
export const CITY_LOCALIZATION_SETTINGS_COLLECTION = "cityLocalizationSettings";
export const DEFAULT_SIMILARITY_THRESHOLD = 0.4;
const PAGES_PER_STEP = 3;
const LOCK_GRACE_MS = 5_000;
const COMPARISON_PAGES = 8;
/** Felder, die nie umgeschrieben werden (Struktur, Ziele, Zahlenwerte). */
const FIXED_KEYS = new Set([
  "id", "type", "tone", "style", "enabled", "headingLevel", "image", "src", "href", "url", "ctaUrl",
  "primaryUrl", "secondaryUrl", "backgroundImage", "imagePosition", "columns", "aspectRatio", "serviceKeys",
  "icon", "avatar", "videoUrl", "embedUrl", "value", "rating", "nearbyLimit", "limit", "radiusKm",
  "showFacts", "showDistance", "showPhone", "showEmail", "showForm", "numbered", "includeLocalQuestion",
]);
/** Blöcke ohne eigenen Fließtext bzw. mit globalem Inhalt. */
const SKIPPED_BLOCK_TYPES = new Set(["testimonials", "spacer", "video"]);

export type CityPageTarget = {
  key: string;
  kind: CityPageKind;
  cityName: string;
  citySlug: string;
  serviceKey?: CityServiceKey;
};

type TemplateSet = Record<CityPageKind, { blocks: CityServiceBlock[]; seo: CityServiceSeoSettings }>;
type PageDocument = FirebaseFirestore.DocumentData & {
  inheritTemplate?: boolean;
  published?: boolean;
  blocks?: CityServiceBlock[];
  seo?: Partial<CityServiceSeoSettings>;
  localizedBy?: string;
};

export const CITY_PAGE_KINDS: CityPageKind[] = ["stadt", ...CITY_SERVICE_KEYS];

export function cityPageTargets(): CityPageTarget[] {
  return cities.flatMap((cityName) => {
    const citySlug = slugify(cityName);
    return CITY_PAGE_KINDS.map((kind) => ({
      key: `${citySlug}/${kind}`,
      kind,
      cityName,
      citySlug,
      serviceKey: kind === "stadt" ? undefined : kind,
    }));
  });
}

export function targetFromKey(key: string): CityPageTarget | null {
  return cityPageTargets().find((target) => target.key === key) ?? null;
}

function pageReference(ownerId: string, target: CityPageTarget) {
  const database = getAdminDatabase();
  return target.serviceKey
    ? database.collection(CITY_SERVICE_PAGE_COLLECTION).doc(cityServicePageId(ownerId, target.citySlug, target.serviceKey))
    : database.collection(CITY_LANDING_PAGE_COLLECTION).doc(cityLandingPageId(ownerId, target.citySlug));
}

export async function loadCityTemplates(ownerId: string): Promise<TemplateSet> {
  const database = getAdminDatabase();
  const [landing, ...services] = await Promise.all([
    database.collection(CITY_LANDING_TEMPLATE_COLLECTION).doc(cityLandingTemplateId(ownerId)).get(),
    ...CITY_SERVICE_KEYS.map((serviceKey) =>
      database.collection(CITY_SERVICE_TEMPLATE_COLLECTION).doc(cityServiceTemplateId(ownerId, serviceKey)).get(),
    ),
  ]);
  const pick = (snapshot: FirebaseFirestore.DocumentSnapshot, fallback: { blocks: CityServiceBlock[]; seo: CityServiceSeoSettings }) =>
    snapshot.exists ? { blocks: snapshot.get("blocks") as CityServiceBlock[], seo: snapshot.get("seo") as CityServiceSeoSettings } : fallback;
  const set = { stadt: pick(landing, createDefaultCityLandingTemplate(ownerId, 0)) } as TemplateSet;
  CITY_SERVICE_KEYS.forEach((serviceKey, index) => {
    set[serviceKey] = pick(services[index], createDefaultCityServiceTemplate(serviceKey, ownerId, 0));
  });
  return set;
}

async function loadAllPages(ownerId: string) {
  const database = getAdminDatabase();
  const [landingPages, servicePages] = await Promise.all([
    database.collection(CITY_LANDING_PAGE_COLLECTION).where("ownerId", "==", ownerId).get(),
    database.collection(CITY_SERVICE_PAGE_COLLECTION).where("ownerId", "==", ownerId).get(),
  ]);
  const pages = new Map<string, PageDocument>();
  landingPages.docs.forEach((document) => pages.set(`${document.get("citySlug")}/stadt`, document.data()));
  servicePages.docs.forEach((document) =>
    pages.set(`${document.get("citySlug")}/${document.get("serviceKey")}`, document.data()),
  );
  return pages;
}

function renderContext(target: CityPageTarget) {
  return buildCityServiceRenderContext({
    cityName: target.cityName,
    serviceKey: target.serviceKey ?? "umzugsservice",
  });
}

/** Ersetzt alle Platzhalter der Vorlage durch die Werte dieser Stadt. */
function resolveForCity<T>(value: T, target: CityPageTarget): T {
  const { context } = renderContext(target);
  return mapDeepStrings(value, (text) => resolveCityServiceText(text, context));
}

function isIndividual(page: PageDocument | undefined) {
  return page?.inheritTemplate === false && Array.isArray(page.blocks) && page.blocks.length > 0;
}

function countImages(blocks: CityServiceBlock[]) {
  const urls = new Set<string>();
  JSON.stringify(blocks, (key, value) => {
    if ((key === "image" || key === "src") && typeof value === "string" && value) urls.add(value);
    return value;
  });
  return urls.size;
}

/* ------------------------------------------------------------------ */
/* Duplikat-Report                                                      */
/* ------------------------------------------------------------------ */

export async function buildCityDuplicateReport(
  ownerId: string,
  threshold: number,
  options: {
    /** Nur einen Seitentyp prüfen (Vergleiche finden ohnehin nur innerhalb eines Typs statt). */
    kind?: CityPageKind;
    /** Wenn gesetzt, wird die ausgelieferte Seite gemessen statt nur der gespeicherten Blöcke. */
    origin?: string;
  } = {},
): Promise<CityDuplicateReport> {
  const [templates, pages] = await Promise.all([loadCityTemplates(ownerId), loadAllPages(ownerId)]);
  const targets = cityPageTargets().filter((target) => !options.kind || target.kind === options.kind);
  const rendered = options.origin ? await fetchRenderedFingerprints(options.origin, targets) : new Map<string, RenderedFingerprint>();
  const entries = targets.flatMap((target) => {
    const page = pages.get(target.key);
    if (page?.published === false) return [];
    const individual = isIndividual(page);
    const blocks = individual ? page!.blocks! : resolveForCity(templates[target.kind].blocks, target);
    return [{
      target,
      status: individual ? (page?.localizedBy === "ai" ? "localized" as const : "individual" as const) : "template" as const,
      fingerprint: contentFingerprint(blocks, [target.cityName]),
      templateFingerprint: contentFingerprint(resolveForCity(templates[target.kind].blocks, target), [target.cityName]),
      images: countImages(blocks),
      rendered: rendered.get(target.key),
    }];
  });

  const rows: CityDuplicateRow[] = entries.map((entry) => {
    const sameKind = entries.filter((other) => other.target.kind === entry.target.kind && other !== entry);
    // Ausgelieferte Seiten vergleichen, wenn gemessen – das ist, was Google sieht
    const printOf = (candidate: typeof entry) => candidate.rendered?.shingles ?? candidate.fingerprint.shingles;
    const maxOther = sameKind.reduce(
      (max, other) => Math.max(max, containment(printOf(entry), printOf(other))),
      0,
    );
    return {
      key: entry.target.key,
      kind: entry.target.kind,
      cityName: entry.target.cityName,
      path: cityServicePath(entry.target.citySlug, entry.target.serviceKey),
      status: entry.status,
      similarityToTemplate: containment(entry.fingerprint.shingles, entry.templateFingerprint.shingles),
      maxSimilarityToOthers: maxOther,
      wordCount: entry.rendered?.wordCount ?? entry.fingerprint.wordCount,
      imageCount: entry.rendered?.imageCount ?? entry.images,
      measured: entry.rendered ? "rendered" : "stored",
    };
  });
  const score = (row: CityDuplicateRow) => Math.max(row.similarityToTemplate, row.maxSimilarityToOthers);
  return {
    threshold,
    generatedAt: Date.now(),
    totalPages: rows.length,
    duplicatePages: rows.filter((row) => score(row) > threshold).length,
    averageSimilarity: rows.length ? rows.reduce((sum, row) => sum + score(row), 0) / rows.length : 0,
    rows: rows.sort((left, right) => score(right) - score(left)),
  };
}

async function fetchRenderedFingerprints(origin: string, targets: readonly CityPageTarget[]) {
  const result = new Map<string, RenderedFingerprint>();
  const concurrency = 8;
  for (let offset = 0; offset < targets.length; offset += concurrency) {
    const batch = targets.slice(offset, offset + concurrency);
    const prints = await Promise.all(
      batch.map((target) =>
        fetchRenderedFingerprint(origin, cityServicePath(target.citySlug, target.serviceKey), target.cityName).catch(() => null),
      ),
    );
    prints.forEach((print, index) => {
      if (print) result.set(batch[index].key, print);
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Text-Slots: nur sichtbarer Text geht als flache Liste an die KI      */
/* ------------------------------------------------------------------ */

/**
 * Flache Abbildung "Pfad → Text", z. B. "3.cards.0.title". Ein flaches Objekt
 * hält die KI-Antwort robust (keine Verschachtelung, die kaputtgehen kann) und
 * garantiert, dass die Block-Struktur unverändert bleibt.
 */
export function flattenTexts(blocks: readonly CityServiceBlock[]): Record<string, string> {
  const texts: Record<string, string> = {};
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (value.trim()) texts[path] = value;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${path}.${index}`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (!FIXED_KEYS.has(key)) walk(child, `${path}.${key}`);
      }
    }
  };
  blocks.forEach((block, index) => {
    if (!SKIPPED_BLOCK_TYPES.has(block.type)) walk(block, String(index));
  });
  return texts;
}

/** Schreibt umformulierte Texte nur an bestehende Text-Pfade zurück. */
export function applyTexts(
  blocks: readonly CityServiceBlock[],
  original: Record<string, string>,
  rewritten: Record<string, unknown>,
): CityServiceBlock[] {
  const result = structuredClone(blocks) as unknown as Record<string, unknown>[];
  for (const path of Object.keys(original)) {
    const value = rewritten[path];
    if (typeof value !== "string" || !value.trim()) continue;
    const segments = path.split(".");
    let cursor: Record<string, unknown> = result as unknown as Record<string, unknown>;
    for (const segment of segments.slice(0, -1)) {
      cursor = cursor[segment] as Record<string, unknown>;
      if (!cursor || typeof cursor !== "object") break;
    }
    const last = segments[segments.length - 1];
    if (cursor && typeof cursor[last] === "string") cursor[last] = value.trim();
  }
  return result as unknown as CityServiceBlock[];
}

const localizationSchema = z.object({
  texts: z.record(z.unknown()),
  localFaq: z.array(z.object({ question: z.string().trim().min(5).max(300), answer: z.string().trim().min(10).max(1_500) })).max(3).default([]),
  metaTitle: seoLengthField(20, 60),
  metaDescription: seoLengthField(110, 160),
  heroImageAlt: z.string().trim().min(5).max(160),
});

async function rewriteForCity(input: {
  target: CityPageTarget;
  texts: Record<string, string>;
  timeoutMs: number;
  feedback?: string;
}) {
  const { localSeo } = renderContext(input.target);
  const serviceName = input.target.serviceKey ? getDefaultCityServiceName(input.target.serviceKey) : "Umzugs- und Renovierungsservice";
  const response = await generateGeminiJson({
    temperature: 0.8,
    timeoutMs: input.timeoutMs,
    maxOutputTokens: 16_000,
    thinkingBudget: 0,
    systemInstruction: `Du schreibst eine lokale Leistungsseite eines regionalen Umzugs- und Dienstleistungsunternehmens für genau eine Stadt komplett neu.
Ziel: Die Seite darf mit den Seiten anderer Städte und mit der Vorlage höchstens zu einem kleinen Teil wörtlich übereinstimmen (kein Duplicate Content).
Regeln:
- texts ist eine flache Liste "Pfad → Text". Gib für JEDEN Pfad aus dem Input genau einen neuen Text unter demselben Pfad zurück. Keine neuen oder fehlenden Pfade.
- Schreibe jeden Text in eigenen Worten neu: andere Satzanfänge, anderer Satzbau, andere Beispiele und Blickwinkel, passend zu ${input.target.cityName}. Übernimm keine Sätze aus dem Input.
- Inhaltlich bleiben Leistungen und Aussagen gleich. Kurze Texte (Überschriften, Labels, Buttons) bleiben ähnlich kurz. Ändere keine Zahlenwerte.
- Nutze nur die gelieferten lokalen Fakten (Region, Nachbarorte mit Entfernung). Erfinde keine Straßen, Stadtteile, Sehenswürdigkeiten, Vorschriften, Preise, Bewertungen oder Unternehmensfakten.
- Nenne ${input.target.cityName} natürlich, aber nicht in jedem Satz. Keine Platzhalter wie {city}. Keine Links, keine Markdown-Überschriften.
- localFaq: 2–3 zusätzliche Fragen, die speziell für ${input.target.cityName} und die Region relevant sind, mit hilfreichen Antworten ohne erfundene Fakten.
- metaTitle max. 60 Zeichen, metaDescription 120–155 Zeichen, beide mit Stadtname.
${input.target.serviceKey ? serviceGenerationRules(input.target.serviceKey).join("\n") : ""}
${input.feedback ? `WICHTIG: Der letzte Entwurf war nicht verwendbar (${input.feedback}). Formuliere deutlich freier und eigenständiger.` : ""}
Antworte ausschließlich als JSON:
{"texts":{"<Pfad>":string},"localFaq":[{"question":string,"answer":string}],"metaTitle":string,"metaDescription":string,"heroImageAlt":string}`,
    prompt: JSON.stringify({
      city: input.target.cityName,
      service: serviceName,
      localFacts: {
        region: localSeo.regionName,
        facts: localSeo.localFacts,
        nearbyCities: getNearbyCities(input.target.cityName, 6).map((city) => `${city.name} (${city.distanceKm} km)`),
      },
      texts: input.texts,
    }),
  });
  return localizationSchema.parse(response);
}

/* ------------------------------------------------------------------ */
/* Bilder                                                               */
/* ------------------------------------------------------------------ */

function imagePoolFor(
  target: CityPageTarget,
  settings: CityLocalizationSettings,
  projects: readonly ProjectImageSource[],
) {
  return buildCityImagePool({
    cityName: target.cityName,
    serviceKey: target.serviceKey,
    configuredPools: settings.imagePools,
    projects,
  }).map((image) => image.src);
}

function applyImages(blocks: CityServiceBlock[], pool: string[], target: CityPageTarget, altBase: string) {
  if (!pool.length) return blocks;
  let cursor = 0;
  const next = () => pool[cursor++ % pool.length];
  const withImages = blocks.map((block) =>
    block.type === "hero" || block.type === "imageText" ? { ...block, image: next() } : block,
  );
  if (pool.length < 3 || withImages.some((block) => block.type === "gallery")) return withImages;
  const gallery = createCityServiceBlock("gallery");
  if (gallery.type !== "gallery") return withImages;
  const images = Array.from({ length: Math.min(6, pool.length) }, (_, index) => pool[(cursor + index) % pool.length]);
  const galleryBlock: CityServiceBlock = {
    ...gallery,
    id: `gallery-${target.citySlug}`,
    heading: `Einblicke: ${altBase}`,
    intro: "",
    images: images.map((src, index) => ({ src, alt: `${altBase} – Einblick ${index + 1}` })),
  };
  const insertAt = withImages.findIndex((block) => block.type === "faq" || block.type === "contact");
  return insertAt < 0
    ? [...withImages, galleryBlock]
    : [...withImages.slice(0, insertAt), galleryBlock, ...withImages.slice(insertAt)];
}

/* ------------------------------------------------------------------ */
/* Eine Seite lokalisieren                                              */
/* ------------------------------------------------------------------ */

async function loadComparisonFingerprints(ownerId: string, target: CityPageTarget) {
  const database = getAdminDatabase();
  const query = target.serviceKey
    ? database.collection(CITY_SERVICE_PAGE_COLLECTION).where("ownerId", "==", ownerId).where("serviceKey", "==", target.serviceKey)
    : database.collection(CITY_LANDING_PAGE_COLLECTION).where("ownerId", "==", ownerId);
  const snapshot = await query.where("localizedBy", "==", "ai").limit(COMPARISON_PAGES + 1).get();
  return snapshot.docs
    .filter((document) => document.get("citySlug") !== target.citySlug)
    .slice(0, COMPARISON_PAGES)
    .map((document) => contentFingerprint(document.get("blocks"), [String(document.get("cityName") ?? "")]).shingles);
}

export async function localizeCityPage(input: {
  ownerId: string;
  target: CityPageTarget;
  templates: TemplateSet;
  settings: CityLocalizationSettings;
  projects: readonly ProjectImageSource[];
  deadlineAt: number;
  /** Nur berechnen, nichts speichern (Tests/Vorschau). */
  dryRun?: boolean;
  /** Auch individuelle Seiten neu schreiben (Basis ist dann die bestehende Seite). */
  allowIndividual?: boolean;
  /** Veröffentlichte eigene Seiten = einzig erlaubte Linkziele. */
  availablePages: readonly GenerationPage[];
}): Promise<CityLocalizationResult & { blocks?: CityServiceBlock[] }> {
  const { target } = input;
  const reference = pageReference(input.ownerId, target);
  const current = (await reference.get()).data() as PageDocument | undefined;
  if (current?.published === false || (isIndividual(current) && !input.allowIndividual)) {
    return { key: target.key, cityName: target.cityName, kind: target.kind, status: "skipped", finishedAt: Date.now() };
  }

  const template = input.templates[target.kind];
  const resolvedTemplate = resolveForCity(template.blocks, target);
  const templatePrint = contentFingerprint(resolvedTemplate, [target.cityName]).shingles;
  // Bereits individuelle Seiten behalten Struktur und Bilder, nur der Text wird neu geschrieben.
  // Falsche Links (z. B. example.com) gar nicht erst an die KI geben
  const resolved = filterGenerationContent(
    isIndividual(current) ? current!.blocks! : resolvedTemplate,
    input.availablePages,
  );
  const texts = flattenTexts(resolved);
  const others = await loadComparisonFingerprints(input.ownerId, target);
  const threshold = input.settings.similarityThreshold;

  let feedback: string | undefined;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const budget = remainingApiTime(input.deadlineAt) - LOCK_GRACE_MS;
    if (budget < 15_000) break;
    let rewrite: z.infer<typeof localizationSchema>;
    try {
      rewrite = await rewriteForCity({ target, texts, timeoutMs: Math.min(budget, 50_000), feedback });
    } catch (error) {
      // Ungültiges JSON oder Format: im nächsten Versuch erneut schreiben lassen
      if (!(error instanceof GeminiInvalidJsonError || error instanceof z.ZodError)) throw error;
      feedback = "ungültiges Antwortformat";
      continue;
    }
    let blocks = applyTexts(resolved, texts, rewrite.texts);
    if (rewrite.localFaq.length) {
      blocks = blocks.map((block) =>
        block.type === "faq" ? { ...block, items: [...rewrite.localFaq, ...block.items].slice(0, 12) } : block,
      );
    }

    const print = contentFingerprint(blocks, [target.cityName]).shingles;
    const similarityToTemplate = containment(print, templatePrint);
    const maxSimilarityToOthers = others.reduce((max, other) => Math.max(max, containment(print, other)), 0);
    if (Math.max(similarityToTemplate, maxSimilarityToOthers) > threshold) {
      feedback = `${Math.round(similarityToTemplate * 100)} % wie die Vorlage, ${Math.round(maxSimilarityToOthers * 100)} % wie eine andere Stadt`;
      continue;
    }

    const serviceName = target.serviceKey ? getDefaultCityServiceName(target.serviceKey) : "Umzugshelden";
    const altBase = `${serviceName} in ${target.cityName}`;
    blocks = await linkCityBlocks({
      blocks,
      cityName: target.cityName,
      citySlug: target.citySlug,
      serviceKey: target.serviceKey,
      keyword: target.serviceKey ? serviceName : "Umzugsservice",
      availablePages: input.availablePages,
      timeoutMs: Math.min(remainingApiTime(input.deadlineAt) - LOCK_GRACE_MS, 15_000),
    });
    blocks = applyImages(blocks, imagePoolFor(target, input.settings, input.projects), target, altBase);
    const heroImage = blocks.find((block) => block.type === "hero");
    const now = Date.now();
    if (input.dryRun) {
      return {
        key: target.key,
        cityName: target.cityName,
        kind: target.kind,
        status: "localized",
        similarity: Math.max(similarityToTemplate, maxSimilarityToOthers),
        finishedAt: now,
        blocks,
      };
    }
    await reference.set(
      JSON.parse(JSON.stringify({
        id: reference.id,
        ownerId: input.ownerId,
        cityName: target.cityName,
        citySlug: target.citySlug,
        ...(target.serviceKey
          ? { serviceKey: target.serviceKey, templateId: cityServiceTemplateId(input.ownerId, target.serviceKey) }
          : { templateId: cityLandingTemplateId(input.ownerId) }),
        inheritTemplate: false,
        blocks,
        seo: {
          ...filterGenerationContent(current?.seo ?? {}, input.availablePages),
          title: rewrite.metaTitle,
          description: rewrite.metaDescription,
          ...(heroImage?.type === "hero" ? { image: heroImage.image } : {}),
          imageAlt: rewrite.heroImageAlt,
        },
        published: current?.published ?? true,
        createdAt: current?.createdAt || now,
        updatedAt: now,
        localizedBy: "ai",
        localizedAt: now,
        localizationSimilarity: { template: similarityToTemplate, others: maxSimilarityToOthers },
      })),
    );
    revalidatePath(cityServicePath(target.citySlug, target.serviceKey));
    return {
      key: target.key,
      cityName: target.cityName,
      kind: target.kind,
      status: "localized",
      similarity: Math.max(similarityToTemplate, maxSimilarityToOthers),
      finishedAt: now,
    };
  }
  return {
    key: target.key,
    cityName: target.cityName,
    kind: target.kind,
    status: feedback && feedback !== "ungültiges Antwortformat" ? "too_similar" : "failed",
    error: !feedback
      ? "Zu wenig Zeit für diese Seite."
      : feedback === "ungültiges Antwortformat"
        ? "Die KI lieferte zweimal kein gültiges Format."
        : `Zu ähnlich: ${feedback}`,
    finishedAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* Einstellungen & Lauf                                                 */
/* ------------------------------------------------------------------ */

export async function readCityLocalizationSettings(ownerId: string): Promise<CityLocalizationSettings> {
  const snapshot = await getAdminDatabase().collection(CITY_LOCALIZATION_SETTINGS_COLLECTION).doc(ownerId).get();
  return {
    imagePools: (snapshot.get("imagePools") as CityLocalizationSettings["imagePools"]) ?? {},
    similarityThreshold: Number(snapshot.get("similarityThreshold")) || DEFAULT_SIMILARITY_THRESHOLD,
  };
}

export function cityLocalizationRunReference(ownerId: string) {
  return getAdminDatabase().collection(CITY_LOCALIZATION_RUN_COLLECTION).doc(ownerId);
}

/** Alle Seiten, die noch die Vorlage erben (bereits bearbeitete werden übersprungen). */
export async function pendingLocalizationKeys(ownerId: string) {
  const pages = await loadAllPages(ownerId);
  return cityPageTargets()
    .filter((target) => {
      const page = pages.get(target.key);
      return page?.published !== false && !isIndividual(page);
    })
    .map((target) => target.key);
}

/** Individuelle Seiten, die trotzdem über der Übereinstimmungs-Schwelle liegen. */
export async function duplicateIndividualKeys(ownerId: string, threshold: number) {
  const report = await buildCityDuplicateReport(ownerId, threshold);
  return report.rows
    .filter((row) => row.status !== "template" && Math.max(row.similarityToTemplate, row.maxSimilarityToOthers) > threshold)
    .map((row) => row.key);
}

async function acquireLock(reference: FirebaseFirestore.DocumentReference, deadlineAt: number) {
  return getAdminDatabase().runTransaction(async (transaction) => {
    const document = await transaction.get(reference);
    if (!document.exists || document.get("status") !== "running") return false;
    if (Number(document.get("lockedUntil") || 0) > Date.now()) return false;
    transaction.update(reference, { lockedUntil: deadlineAt + LOCK_GRACE_MS });
    return true;
  });
}

/** Lokalisiert die nächsten Seiten des Laufs (Admin-Direktlauf und Cron). */
export async function runCityLocalizationStep(ownerId: string, deadlineAt: number) {
  const reference = cityLocalizationRunReference(ownerId);
  if (!(await acquireLock(reference, deadlineAt))) {
    const snapshot = await reference.get();
    return { pending: snapshot.get("status") === "running", message: "Kein Schritt nötig oder ein anderer Schritt läuft." };
  }
  try {
    const run = (await reference.get()).data()!;
    const queue = run.queue as string[];
    const cursor = Number(run.cursor || 0);
    const batch = queue.slice(cursor, cursor + PAGES_PER_STEP).flatMap((key) => {
      const target = targetFromKey(key);
      return target ? [target] : [];
    });
    if (!batch.length) {
      await reference.update({ status: "completed", finishedAt: Date.now(), lockedUntil: 0 });
      return { pending: false, message: "Alle Seiten sind abgearbeitet." };
    }
    const [templates, settings, projects, availablePages] = await Promise.all([
      loadCityTemplates(ownerId),
      readCityLocalizationSettings(ownerId),
      loadProjectImages(),
      getGenerationPages(),
    ]);
    const results = await Promise.all(
      batch.map((target) =>
        localizeCityPage({
          ownerId,
          target,
          templates,
          settings,
          projects,
          deadlineAt,
          availablePages,
          allowIndividual: run.includeIndividualDuplicates === true,
        }).catch(
          (error): CityLocalizationResult => {
            console.error("City localization failed", target.key, error);
            return {
              key: target.key,
              cityName: target.cityName,
              kind: target.kind,
              status: "failed",
              error: error instanceof Error ? error.message.slice(0, 300) : "Unbekannter Fehler",
              finishedAt: Date.now(),
            };
          },
        ),
      ),
    );
    const count = (status: CityLocalizationResult["status"]) => results.filter((result) => result.status === status).length;
    const nextCursor = cursor + batch.length;
    const done = nextCursor >= queue.length;
    await reference.update({
      cursor: nextCursor,
      results: FieldValue.arrayUnion(...results),
      "stats.localized": FieldValue.increment(count("localized")),
      "stats.skipped": FieldValue.increment(count("skipped")),
      "stats.tooSimilar": FieldValue.increment(count("too_similar")),
      "stats.failed": FieldValue.increment(count("failed")),
      heartbeatAt: Date.now(),
      lockedUntil: 0,
      ...(done ? { status: "completed", finishedAt: Date.now() } : {}),
    });
    return {
      pending: !done,
      message: results.map((result) => `${result.cityName} (${result.kind}): ${result.status}`).join(", "),
    };
  } catch (error) {
    await reference.update({ lockedUntil: 0, lastError: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
