import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { remainingApiTime } from "@/lib/apiDeadline";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { generateGeminiJson } from "@/lib/gemini";
import { discoverSeoSearchResults } from "@/lib/googleSeoSearch";
import { analyzeSeoPage } from "@/lib/seoPageAnalyzer";
import { rawCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceBlock,
  type CityServiceKey,
} from "@/types/city/CityServicePage";
import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import { slugify } from "@/utils/slugify";

export const runtime = "nodejs";
export const maxDuration = 60;

const BLOG_GENERATION_WORK_BUDGET_MS = 55_000;
const WORKFLOW_COLLECTION = "blogGenerationWorkflows";
const PROPOSAL_COLLECTION = "blogGenerationProposals";
const ROTATION_COLLECTION = "blogGenerationRotation";
const BLOG_COLLECTION = "blogPages_umzugshelden";
const SUBCATEGORY_COLLECTION = "blogSubcategories_umzugshelden";
const IMAGE_PLACEHOLDER = "/images/image.png";
const BLOG_OPTIMIZATION_INTERVAL_MS = 30 * 24 * 60 * 60 * 1_000;

const requestSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  serviceKey: z.enum(CITY_SERVICE_KEYS).optional(),
  workflowId: z.string().trim().min(1).max(200).optional(),
  mode: z.enum(["run", "queue"]).default("run"),
  count: z.number().int().min(1).max(50).default(1),
  operation: z.enum(["optimize", "create"]).default("optimize"),
});

const keywordSchema = z.object({
  serviceKey: z.enum(CITY_SERVICE_KEYS),
  keyword: z.string().trim().min(3).max(150),
  titleIdea: z.string().trim().min(10).max(200),
  searchIntent: z.string().trim().min(10).max(500),
  supportingKeywords: z.array(z.string().trim().min(2).max(100)).min(3).max(12),
});

const contentSchema = z.object({
  title: z.string().trim().min(10).max(200),
  description: z.string().trim().min(30).max(500),
  metaDescription: z.string().trim().min(120).max(165),
  keywords: z.array(z.string().trim().min(2).max(100)).min(3).max(20),
  sections: z.array(
    z.object({
      type: z.enum([
        "text",
        "imageText",
        "cards",
        "checklist",
        "process",
        "faq",
        "cta",
      ]),
      heading: z.string().trim().min(3).max(300),
      body: z.string().trim().max(15_000).default(""),
      imageAlt: z.string().trim().max(300).optional(),
      items: z
        .array(
          z.object({
            title: z.string().trim().min(2).max(300),
            text: z.string().trim().min(5).max(3_000),
          }),
        )
        .max(12)
        .default([]),
      faqItems: z
        .array(
          z.object({
            question: z.string().trim().min(5).max(300),
            answer: z.string().trim().min(10).max(3_000),
          }),
        )
        .max(12)
        .default([]),
    }),
  ).min(4).max(16),
});

type GeneratedContent = z.infer<typeof contentSchema>;
const additionalSectionsSchema = z.object({
  sections: contentSchema.shape.sections.min(3).max(8),
});
const linkAuditSchema = z.object({
  links: z.array(
    z.object({
      sectionIndex: z.number().int().nonnegative(),
      anchorText: z.string().trim().min(2).max(150),
      targetUrl: z.string().trim().min(2).max(2_048),
    }),
  ).min(1).max(12),
});

const blueprintSchema = z.object({
  title: z.string().trim().min(10).max(200),
  description: z.string().trim().min(30).max(500),
  metaDescription: z.string().trim().min(120).max(165),
  keywords: z.array(z.string().trim().min(2).max(100)).min(3).max(20),
  sections: z.array(
    z.object({
      type: z.enum([
        "text",
        "imageText",
        "cards",
        "checklist",
        "process",
        "faq",
        "cta",
      ]),
      heading: z.string().trim().min(3).max(300),
      purpose: z.string().trim().min(10).max(1_000),
      contentBrief: z.string().trim().min(20).max(2_000),
      keyPoints: z.array(z.string().trim().min(3).max(500)).min(2).max(8),
      targetWords: z.number().int().min(80).max(500),
      keywords: z.array(z.string().trim().min(2).max(100)).max(8),
    }),
  ).min(6).max(16),
});

const generatedBlogSectionSchema = contentSchema.shape.sections.element;
const qualitySchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(2_000),
  issues: z.array(
    z.object({
      sectionIndex: z.number().int().nonnegative(),
      severity: z.enum(["hoch", "mittel", "niedrig"]),
      problem: z.string().trim().min(1).max(1_000),
      instruction: z.string().trim().min(1).max(2_000),
    }),
  ).max(12),
});

function categoryForService(serviceKey: CityServiceKey): AdminBlogMainCategory {
  if (serviceKey === "entruempelung") return "entrümpelung";
  if (serviceKey === "anstricharbeiten") return "streicharbeit";
  if (serviceKey === "moebel-service") return "ratgeber";
  return "umzug";
}

function countWords(value: unknown): number {
  if (typeof value === "string") {
    return value.trim() ? value.trim().split(/\s+/u).length : 0;
  }

  if (Array.isArray(value)) {
    return value.reduce((total, entry) => total + countWords(entry), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce(
      (total, entry) => total + countWords(entry),
      0,
    );
  }
  return 0;
}

function stripGeneratedLinks(content: GeneratedContent): GeneratedContent {
  const strip = (value: string) =>
    value.replace(
      /\[([^\]\n]+)\]\((?:https?:\/\/|\/)[^)\s]+\)/gu,
      "$1",
    );
  return {
    ...content,
    sections: content.sections.map((section) => ({
      ...section,
      body: strip(section.body),
      items: section.items.map((item) => ({
        ...item,
        text: strip(item.text),
      })),
      faqItems: section.faqItems.map((item) => ({
        ...item,
        answer: strip(item.answer),
      })),
    })),
  };
}

function applyAuditedLinks(
  content: GeneratedContent,
  links: z.infer<typeof linkAuditSchema>["links"],
  allowedUrls: Set<string>,
): GeneratedContent {
  const sections = content.sections.map((section) => ({ ...section }));
  for (const link of links) {
    if (!allowedUrls.has(link.targetUrl)) continue;
    const section = sections[link.sectionIndex];
    if (!section || !section.body.includes(link.anchorText)) continue;
    section.body = section.body.replace(
      link.anchorText,
      `**[${link.anchorText}](${link.targetUrl})**`,
    );
  }
  return { ...content, sections };
}

function createBlocks(content: GeneratedContent): CityServiceBlock[] {
  const blocks = content.sections
    .filter((section) => section.type !== "cta")
    .map((section, index) => {
    const base = {
      id: `blog-ai-${index + 1}-${section.type}`,
      enabled: true,
      tone: index % 2 === 0 ? ("white" as const) : ("muted" as const),
      headingLevel: 2 as const,
    };
    if (section.type === "imageText") {
      return {
        ...base,
        type: "imageText" as const,
        heading: section.heading,
        paragraphs: [section.body],
        image: IMAGE_PLACEHOLDER,
        imageAlt: section.imageAlt || section.heading,
        imagePosition: index % 2 === 0 ? ("left" as const) : ("right" as const),
      };
    }
    if (section.type === "cards" && section.items.length >= 2) {
      return {
        ...base,
        type: "cardGrid" as const,
        heading: section.heading,
        intro: section.body,
        cards: section.items,
        columns: section.items.length >= 3 ? (3 as const) : (2 as const),
        numbered: false,
      };
    }
    if (section.type === "checklist" && section.items.length >= 2) {
      return {
        ...base,
        type: "checkList" as const,
        heading: section.heading,
        intro: section.body,
        items: section.items.map((item) => `${item.title}: ${item.text}`),
        columns: 2 as const,
      };
    }
    if (section.type === "process" && section.items.length >= 2) {
      return {
        ...base,
        type: "process" as const,
        heading: section.heading,
        intro: section.body,
        steps: section.items.map((item) => `${item.title}: ${item.text}`),
      };
    }
    if (section.type === "faq" && section.faqItems.length >= 3) {
      return {
        ...base,
        type: "faq" as const,
        heading: section.heading,
        items: section.faqItems,
        includeLocalQuestion: false,
      };
    }
    return {
      ...base,
      type: "intro" as const,
      heading: section.heading,
      text: section.body,
    };
    });
  return [
    ...blocks,
    {
      id: "blog-contact",
      type: "contact",
      enabled: true,
      tone: "accent",
      headingLevel: 2,
      heading: "Jetzt kostenlos und unverbindlich anfragen",
      text: "Beschreiben Sie kurz Ihr Vorhaben. Wir melden uns persönlich bei Ihnen und besprechen die nächsten Schritte.",
      showPhone: true,
      showEmail: true,
      showForm: true,
    },
  ];
}

function createFallbackBlogSection(
  section: z.infer<typeof blueprintSchema>["sections"][number],
): z.infer<typeof generatedBlogSectionSchema> {
  return {
    type: section.type,
    heading: section.heading,
    body: [section.contentBrief, ...section.keyPoints]
      .filter(Boolean)
      .join("\n\n"),
    imageAlt: section.type === "imageText" ? section.heading : undefined,
    items: [],
    faqItems: [],
  };
}

function createFallbackBlogBlueprint(input: {
  keyword: string;
  titleIdea: string;
  cityName: string;
}) {
  const definitions = [
    ["imageText", "Überblick und wichtigste Grundlagen", "Suchintention direkt beantworten"],
    ["checklist", "Die richtige Vorbereitung", "Konkrete Vorbereitungsschritte vermitteln"],
    ["process", "Schritt für Schritt zum Ziel", "Einen nachvollziehbaren Ablauf erklären"],
    ["text", "Wichtige Entscheidungen", "Optionen und Entscheidungskriterien einordnen"],
    ["cards", "Typische Herausforderungen vermeiden", "Fehler und passende Lösungen darstellen"],
    ["text", `Besonderheiten in ${input.cityName}`, "Hilfreichen lokalen Bezug herstellen"],
    ["faq", "Häufig gestellte Fragen", "Zentrale Nutzerfragen konkret beantworten"],
    ["cta", "Persönliche Unterstützung anfragen", "Natürlich zur passenden Dienstleistung führen"],
  ] as const;
  const metaDescription =
    `${input.keyword}: praktische Tipps, klare Schritte und wichtige Hinweise für eine sichere Planung. Jetzt verständlich informieren und persönlich beraten lassen.`;
  return blueprintSchema.parse({
    title: input.titleIdea,
    description: `Ausführlicher Ratgeber zu ${input.keyword} mit konkreten Schritten, Entscheidungshilfen und lokalem Bezug zu ${input.cityName}.`,
    metaDescription: metaDescription.slice(0, 165),
    keywords: [
      input.keyword,
      `${input.keyword} Tipps`,
      `${input.keyword} ${input.cityName}`,
    ],
    sections: definitions.map(([type, heading, purpose]) => ({
      type,
      heading,
      purpose,
      contentBrief: `${purpose}. Den Abschnitt konkret, hilfreich und ohne unbelegte Aussagen für das Thema ${input.keyword} ausarbeiten.`,
      keyPoints: [
        "Konkreten Nutzwert bieten",
        "Suchintention vollständig beantworten",
        `Bezug zu ${input.keyword} halten`,
      ],
      targetWords: type === "cta" ? 100 : 160,
      keywords: [input.keyword],
    })),
  });
}

async function loadBlogCatalog() {
  const snapshot = await getAdminDatabase().collection(BLOG_COLLECTION).get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    const mainCategory = data.mainCategory as
      | AdminBlogMainCategory
      | undefined;
    const inferredServiceKey: CityServiceKey =
      mainCategory === "entrümpelung"
        ? "entruempelung"
        : mainCategory === "streicharbeit"
          ? "anstricharbeiten"
          : "umzugsservice";
    return {
      id: document.id,
      title: String(data.titel || ""),
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      cityName: typeof data.cityName === "string" ? data.cityName : undefined,
      serviceKey:
        typeof data.serviceKey === "string"
          ? data.serviceKey
          : inferredServiceKey,
      url: `/blog/${String(data.path || "")}`,
      path: String(data.path || ""),
      description: String(data.description || ""),
      metaDescription: String(data.meta_description || ""),
      mainCategory,
      subcategorySlug:
        typeof data.subcategorySlug === "string"
          ? data.subcategorySlug
          : undefined,
      blocks: Array.isArray(data.serviceBlocks) ? data.serviceBlocks : [],
      updatedAt: Number(data.updatedAt || 0),
      lastOptimizedAt: Number(data.lastOptimizedAt || 0),
    };
  });
}

async function chooseSubcategory(mainCategory: AdminBlogMainCategory) {
  const snapshot = await getAdminDatabase()
    .collection(SUBCATEGORY_COLLECTION)
    .where("mainCategory", "==", mainCategory)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  if (!document) {
    throw new Error(
      `Für die Blog-Hauptkategorie ${mainCategory} fehlt eine Unterkategorie.`,
    );
  }
  return String(document.get("slug"));
}

function normalizeKeyword(value: string) {
  return value.trim().toLocaleLowerCase("de").replace(/\s+/gu, " ");
}

function zodCorrection(error: z.ZodError) {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "Antwort"}: ${issue.message}`)
    .join("; ");
}

async function createQueuedWorkflows(input: {
  ownerId: string;
  count: number;
  serviceKey?: CityServiceKey;
  operation: "optimize" | "create";
  catalog: Awaited<ReturnType<typeof loadBlogCatalog>>;
}) {
  const database = getAdminDatabase();
  const [workflowSnapshot, proposalSnapshot] = await Promise.all([
    database
      .collection(WORKFLOW_COLLECTION)
      .where("ownerId", "==", input.ownerId)
      .get(),
    database
      .collection(PROPOSAL_COLLECTION)
      .where("ownerId", "==", input.ownerId)
      .get(),
  ]);
  const usedCitiesByService = new Map<CityServiceKey, Set<string>>();
  CITY_SERVICE_KEYS.forEach((serviceKey) => {
    usedCitiesByService.set(
      serviceKey,
      new Set(
        [
          ...input.catalog
            .filter((page) => page.serviceKey === serviceKey)
            .map((page) => page.cityName),
          ...workflowSnapshot.docs
            .filter((document) => document.get("serviceKey") === serviceKey)
            .map((document) => document.get("cityName")),
          ...proposalSnapshot.docs
            .filter((document) => document.get("serviceKey") === serviceKey)
            .map((document) => document.get("cityName")),
        ].filter((city): city is string => typeof city === "string"),
      ),
    );
  });

  if (input.operation === "optimize") {
    const activeBlogIds = new Set(
      [
        ...workflowSnapshot.docs.map((document) =>
          document.get("targetBlogId"),
        ),
        ...proposalSnapshot.docs
          .filter((document) => document.get("status") === "pending")
          .map((document) => document.get("targetBlogId")),
      ].filter((id): id is string => typeof id === "string"),
    );
    const candidates = input.catalog
      .filter(
        (page) =>
          page.serviceKey &&
          (CITY_SERVICE_KEYS as readonly string[]).includes(page.serviceKey) &&
          !activeBlogIds.has(page.id) &&
          (!page.lastOptimizedAt ||
            Date.now() - page.lastOptimizedAt >=
              BLOG_OPTIMIZATION_INTERVAL_MS),
      )
      .sort(
        (left, right) =>
          (left.lastOptimizedAt || left.updatedAt) -
          (right.lastOptimizedAt || right.updatedAt),
      )
      .slice(0, input.count);
    const now = Date.now();
    const batch = database.batch();
    const ids = candidates.map((page) => {
      const reference = database.collection(WORKFLOW_COLLECTION).doc();
      const serviceKey = page.serviceKey as CityServiceKey;
      batch.create(reference, {
        ownerId: input.ownerId,
        operation: "optimize",
        targetBlogId: page.id,
        serviceKey,
        cityName: page.cityName ?? "Deutschland",
        mainCategory: page.mainCategory ?? categoryForService(serviceKey),
        subcategorySlug: page.subcategorySlug ?? "",
        keyword: page.keywords[0] || page.title,
        titleIdea: page.title,
        searchIntent:
          "Den bestehenden Ratgeber inhaltlich, semantisch und strukturell verbessern.",
        supportingKeywords: page.keywords.slice(1, 12),
        previousBlog: {
          title: page.title,
          path: page.path,
          description: page.description,
          metaDescription: page.metaDescription,
          keywords: page.keywords,
          blocks: page.blocks,
          updatedAt: page.updatedAt,
        },
        stage: "research",
        rejectedKeywords: [],
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return reference.id;
    });
    if (ids.length) await batch.commit();
    return ids;
  }

  let rotationIndex = 0;
  const rotationReference = database
    .collection(ROTATION_COLLECTION)
    .doc(encodeURIComponent(input.ownerId.trim().toLowerCase()));
  await database.runTransaction(async (transaction) => {
    const rotationDocument = await transaction.get(rotationReference);
    rotationIndex =
      typeof rotationDocument.get("nextServiceIndex") === "number"
        ? rotationDocument.get("nextServiceIndex")
        : 0;
    transaction.set(
      rotationReference,
      {
        ownerId: input.ownerId,
        nextServiceIndex:
          (rotationIndex + input.count) % CITY_SERVICE_KEYS.length,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  });

  const subcategories = new Map<AdminBlogMainCategory, string>();
  const planned: Array<{
    reference: FirebaseFirestore.DocumentReference;
    serviceKey: CityServiceKey;
    cityName: string;
    mainCategory: AdminBlogMainCategory;
    subcategorySlug: string;
  }> = [];
  for (let index = 0; index < input.count; index += 1) {
    const serviceKey =
      input.serviceKey ??
      CITY_SERVICE_KEYS[
        (rotationIndex + index) % CITY_SERVICE_KEYS.length
      ];
    const usedCities = usedCitiesByService.get(serviceKey)!;
    const cityName =
      rawCities.find((city) => !usedCities.has(city)) ??
      rawCities[index % rawCities.length];
    usedCities.add(cityName);
    const mainCategory = categoryForService(serviceKey);
    let subcategorySlug = subcategories.get(mainCategory);
    if (!subcategorySlug) {
      subcategorySlug = await chooseSubcategory(mainCategory);
      subcategories.set(mainCategory, subcategorySlug);
    }
    planned.push({
      reference: database.collection(WORKFLOW_COLLECTION).doc(),
      serviceKey,
      cityName,
      mainCategory,
      subcategorySlug,
    });
  }

  const now = Date.now();
  const batch = database.batch();
  planned.forEach((workflow) => {
    batch.create(workflow.reference, {
      ownerId: input.ownerId,
      serviceKey: workflow.serviceKey,
      cityName: workflow.cityName,
      mainCategory: workflow.mainCategory,
      subcategorySlug: workflow.subcategorySlug,
      stage: "keyword",
      operation: "create",
      rejectedKeywords: [],
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  });
  await batch.commit();
  return planned.map((workflow) => workflow.reference.id);
}

export async function POST(request: Request) {
  const deadlineAt = Date.now() + BLOG_GENERATION_WORK_BUDGET_MS;
  try {
    const input = requestSchema.parse(await request.json());
    if (!(await authorizeAdminOwnerOrCron(request, input.ownerId))) {
      return NextResponse.json(
        { success: false, error: "Nicht autorisiert" },
        { status: 401 },
      );
    }
    const database = getAdminDatabase();
    const catalog = await loadBlogCatalog();
    if (input.mode === "queue") {
      const workflowIds = await createQueuedWorkflows({
        ownerId: input.ownerId,
        count: input.count,
        serviceKey: input.serviceKey,
        operation: input.operation,
        catalog,
      });
      return NextResponse.json({
        success: true,
        pending: true,
        queued: workflowIds.length,
        workflowIds,
        stage: "queued",
        message: `${workflowIds.length} ${
          workflowIds.length === 1
            ? "Blog wurde"
            : "Blogs wurden"
        } dauerhaft eingeplant.`,
      });
    }
    const workflowReference = input.workflowId
      ? database.collection(WORKFLOW_COLLECTION).doc(input.workflowId)
      : database.collection(WORKFLOW_COLLECTION).doc();
    let workflowDocument = input.workflowId
      ? await workflowReference.get()
      : undefined;
    if (
      workflowDocument &&
      (!workflowDocument.exists ||
        workflowDocument.get("ownerId") !== input.ownerId)
    ) {
      return NextResponse.json(
        { success: false, error: "Blog-Workflow nicht gefunden" },
        { status: 404 },
      );
    }

    if (!workflowDocument) {
      const [workflowId] = await createQueuedWorkflows({
        ownerId: input.ownerId,
        count: 1,
        serviceKey: input.serviceKey,
        operation: input.operation,
        catalog,
      });
      if (!workflowId && input.operation === "optimize") {
        return NextResponse.json({
          success: true,
          pending: false,
          stage: "idle",
          message: "Kein Blogartikel ist aktuell fällig.",
        });
      }
      const createdReference = database
        .collection(WORKFLOW_COLLECTION)
        .doc(workflowId);
      workflowDocument = await createdReference.get();
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId,
        stage: "queued",
        message: "Der Blog-Workflow wurde angelegt.",
      });
    }

    const workflow = workflowDocument.data()!;
    const stage = String(workflow.stage);
    const serviceKey = workflow.serviceKey as CityServiceKey;
    const cityName = String(workflow.cityName);

    if (stage === "keyword") {
      const rejectedKeywords = Array.isArray(workflow.rejectedKeywords)
        ? workflow.rejectedKeywords
        : [];
      const keywordResponse = await generateGeminiJson({
          temperature: 0.45,
          timeoutMs: remainingApiTime(deadlineAt),
          maxOutputTokens: 1_024,
          thinkingBudget: 0,
          systemInstruction: `Du bist deutscher SEO-Stratege für ein Umzugsunternehmen.
Finde genau ein informationsorientiertes Blog-Keyword mit möglichst hoher realer Suchnachfrage, das zur übergebenen Dienstleistung und Stadt passt und qualifizierte Interessenten erreicht.
Das Thema muss ausschließlich zur angegebenen serviceKey gehören. Wähle niemals ein Thema einer anderen Dienstleistung.
Bei serviceKey "umzugsservice" sind Entrümpelung, Wertstoffhöfe und Entsorgung ausdrücklich ausgeschlossen.
Vermeide alle vorhandenen Blogthemen und rejectedKeywords. Das Keyword muss einen klaren, eigenständigen Suchintent besitzen.
Für Entrümpelung sind lokale Entsorgung, Wertstoffhöfe, Sperrmüll und kommunale Anlaufstellen besonders relevant.
Erfinde keine konkrete Suchvolumen-Zahl.
Antworte ausschließlich als JSON:
{"serviceKey":"umzugsservice"|"anstricharbeiten"|"moebel-service"|"senior-umzug"|"entruempelung","keyword":string,"titleIdea":string,"searchIntent":string,"supportingKeywords":string[]}`,
          prompt: JSON.stringify({
            serviceKey,
            cityName,
            existingBlogs: catalog.map((page) => ({
              title: page.title,
              keywords: page.keywords,
            })),
            rejectedKeywords,
            correction: workflow.validationFeedback,
          }),
        });
      const keywordResult = keywordSchema.safeParse(keywordResponse);
      let generated: z.infer<typeof keywordSchema>;
      if (!keywordResult.success) {
        const correction = zodCorrection(keywordResult.error);
        const retryCount = Number(workflow.retryCount || 0) + 1;
        if (retryCount >= 3) {
          generated = keywordSchema.parse({
            serviceKey,
            keyword: `${serviceKey.replaceAll("-", " ")} ${cityName} Ratgeber`,
            titleIdea: `${serviceKey.replaceAll("-", " ")} in ${cityName}: der praktische Ratgeber`,
            searchIntent:
              "Nutzer suchen praktische Informationen, Vorbereitungsschritte und Entscheidungshilfen zur lokalen Dienstleistung.",
            supportingKeywords: [
              `${serviceKey.replaceAll("-", " ")} Tipps`,
              `${serviceKey.replaceAll("-", " ")} vorbereiten`,
              `${serviceKey.replaceAll("-", " ")} Ablauf`,
            ],
          });
          await workflowReference.update({
            warnings: FieldValue.arrayUnion(
              "Das Hauptkeyword wurde nach wiederholt ungültigen KI-Antworten regelbasiert festgelegt.",
            ),
          });
        } else {
          await workflowReference.update({
            validationFeedback: correction,
            retryCount,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            workflowId: workflowReference.id,
            stage: "keyword",
            message: "Das Keyword-Format wird automatisch korrigiert.",
          });
        }
      } else {
        generated = keywordResult.data;
      }
      if (generated.serviceKey !== serviceKey) {
        await workflowReference.update({
          validationFeedback: `Die Antwort gehörte zu ${generated.serviceKey}, erforderlich ist ausschließlich ${serviceKey}.`,
          retryCount: Number(workflow.retryCount || 0) + 1,
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          workflowId: workflowReference.id,
          stage: "keyword",
          message:
            "Das Thema gehörte zur falschen Dienstleistung und wird neu gewählt.",
        });
      }
      const normalized = normalizeKeyword(generated.keyword);
      const duplicate = catalog.some(
        (page) =>
          normalizeKeyword(page.title) === normalized ||
          page.keywords.some(
            (keyword: string) => normalizeKeyword(keyword) === normalized,
          ),
      );
      if (duplicate) {
        await workflowReference.update({
          rejectedKeywords: [...rejectedKeywords, generated.keyword],
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          workflowId: workflowReference.id,
          stage: "keyword",
          message: "Das Thema existiert bereits; ein neuer Versuch ist nötig.",
        });
      }
      await workflowReference.update({
        keyword: generated.keyword,
        titleIdea: generated.titleIdea,
        searchIntent: generated.searchIntent,
        supportingKeywords: generated.supportingKeywords,
        validationFeedback: null,
        retryCount: 0,
        stage: "research",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "research",
        message: `Keyword festgelegt: ${generated.keyword}`,
      });
    }

    if (stage === "research") {
      const keyword = String(workflow.keyword);
      const targetUrl = `${
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
        "https://www.umzugshelden.io"
      }/blog`;
      const [search, disposalSearch] = await Promise.all([
        discoverSeoSearchResults(keyword, targetUrl, 5),
        serviceKey === "entruempelung"
          ? discoverSeoSearchResults(
              `Wertstoffhof Entsorgung ${cityName}`,
              targetUrl,
              5,
            ).catch(() => ({ competitorUrls: [] }))
          : Promise.resolve({ competitorUrls: [] }),
      ]);
      const results = await Promise.allSettled(
        search.competitorUrls.map((url) => analyzeSeoPage(url, [keyword])),
      );
      const pages = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      await workflowReference.update({
        competitorPages: pages,
        regionalResourceCandidates: disposalSearch.competitorUrls,
        stage: "blueprint",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "blueprint",
        message: pages.length
          ? "Google-Wettbewerber wurden analysiert."
          : "Es waren keine lesbaren Wettbewerber verfügbar; der eigene SEO-Plan wird erstellt.",
      });
    }

    if (stage === "blueprint") {
      const competitorSummary = Array.isArray(workflow.competitorPages)
        ? workflow.competitorPages.map(
            (page: {
              url?: string;
              title?: string;
              metaDescription?: string;
              headings?: { h1?: string[]; h2?: string[] };
              wordCount?: number;
              topKeywords?: unknown[];
            }) => ({
              url: page.url,
              title: page.title,
              metaDescription: page.metaDescription,
              h1: page.headings?.h1,
              h2: page.headings?.h2,
              wordCount: page.wordCount,
              topKeywords: page.topKeywords?.slice(0, 10),
            }),
          )
        : [];
      const blueprintResponse = await generateGeminiJson({
        temperature: 0.2,
        timeoutMs: remainingApiTime(deadlineAt),
        maxOutputTokens: 6_144,
        thinkingBudget: 0,
        systemInstruction: `Du bist Senior SEO-Stratege für den Ratgeber eines deutschen Umzugsunternehmens.
Erstelle einen vollständigen Artikel-Blueprint, der den angegebenen Suchintent bestmöglich erfüllt.
Lege Titel, Meta-Daten, Haupt- und Nebenkeywords sowie 8 bis 14 logisch aufeinander aufbauende Sektionen fest.
Jede Sektion benötigt einen klaren Zweck, ein detailliertes Content-Briefing, konkrete Kernpunkte, Zielwortzahl und eigene Keywords.
Nutze Wettbewerber nur als messbare Orientierung und kopiere keine Inhalte. Wenn keine Wettbewerber vorliegen, plane eigenständig anhand von Keyword und Suchintent.
Der Artikel muss ausschließlich zur angegebenen serviceKey gehören und natürlich zur passenden Dienstleistung führen.
Erfinde keine Preise, Garantien, Bewertungen, Suchvolumen oder Unternehmensfakten.
Plane mindestens einen imageText-Abschnitt, einen praktischen Prozess oder eine Checkliste, FAQ und einen abschließenden CTA.

Antworte ausschließlich als JSON:
{"title":string,"description":string,"metaDescription":string,"keywords":string[],"sections":[{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"purpose":string,"contentBrief":string,"keyPoints":string[],"targetWords":number,"keywords":string[]}]}`,
        prompt: JSON.stringify({
          serviceKey,
          cityName,
          keyword: workflow.keyword,
          titleIdea: workflow.titleIdea,
          searchIntent: workflow.searchIntent,
          supportingKeywords: workflow.supportingKeywords,
          competitorPages: competitorSummary,
          currentArticle: workflow.previousBlog || null,
          correction: workflow.validationFeedback,
        }),
      });
      const blueprintResult = blueprintSchema.safeParse(blueprintResponse);
      let blueprint: z.infer<typeof blueprintSchema>;
      if (!blueprintResult.success) {
        const retryCount = Number(workflow.retryCount || 0) + 1;
        if (retryCount >= 3) {
          blueprint = createFallbackBlogBlueprint({
            keyword: String(workflow.keyword),
            titleIdea: String(workflow.titleIdea),
            cityName,
          });
          await workflowReference.update({
            warnings: FieldValue.arrayUnion(
              "Der SEO-Blueprint wurde nach wiederholt ungültigen KI-Antworten regelbasiert vervollständigt.",
            ),
          });
        } else {
          await workflowReference.update({
            validationFeedback: zodCorrection(blueprintResult.error),
            retryCount,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            workflowId: workflowReference.id,
            stage: "blueprint",
            message: "Der SEO-Seitenplan wird automatisch korrigiert.",
          });
        }
      } else {
        blueprint = blueprintResult.data;
      }
      await workflowReference.update({
        blueprint,
        generatedSections: {},
        validationFeedback: null,
        retryCount: 0,
        stage: "sections",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "sections",
        completedSections: 0,
        totalSections: blueprint.sections.length,
        message: "Der SEO-Seitenplan wurde gespeichert.",
      });
    }

    if (stage === "sections") {
      const blueprint = blueprintSchema.parse(workflow.blueprint);
      const generatedSections =
        workflow.generatedSections &&
        typeof workflow.generatedSections === "object"
          ? (workflow.generatedSections as Record<string, unknown>)
          : {};
      const nextIndex = blueprint.sections.findIndex(
        (_, index) => !generatedSections[String(index)],
      );
      if (nextIndex < 0) {
        const content = contentSchema.parse({
          title: blueprint.title,
          description: blueprint.description,
          metaDescription: blueprint.metaDescription,
          keywords: blueprint.keywords,
          sections: blueprint.sections.map((_, index) =>
            generatedBlogSectionSchema.parse(
              generatedSections[String(index)],
            ),
          ),
        });
        await workflowReference.update({
          generatedContent: stripGeneratedLinks(content),
          stage: "links",
          validationFeedback: null,
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          workflowId: workflowReference.id,
          stage: "links",
          message: "Alle Sektionen sind fertig und werden intern verlinkt.",
        });
      }

      const sectionPlan = blueprint.sections[nextIndex];
      let generatedSection: z.infer<typeof generatedBlogSectionSchema>;
      let sectionWarning: string | undefined;
      try {
        const sectionResponse = await generateGeminiJson({
          temperature: 0.35,
          timeoutMs: remainingApiTime(deadlineAt),
          maxOutputTokens: 4_096,
          thinkingBudget: 0,
          systemInstruction: `Du bist Senior SEO-Redakteur für einen deutschen Ratgeber.
Schreibe ausschließlich die eine übergebene Sektion exakt nach dem SEO-Briefing.
Erfülle Suchintention, Zweck, Kernpunkte und Keywords vollständig, natürlich und ohne Keyword-Stuffing.
Vermeide Wiederholungen zu alreadyGeneratedHeadings und führe logisch durch den Gesamtartikel.
Erfinde keine Preise, Garantien, Bewertungen, Suchvolumen, Orte oder Unternehmensfakten.
Nutze keine internen Links; diese werden erst nach Fertigstellung aller Sektionen ergänzt.
Der sichtbare Umfang soll ungefähr targetWords entsprechen.
Verwende keine Markdown-Überschriften in Textfeldern.

Antworte ausschließlich als JSON:
{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"body":string,"imageAlt"?:string,"items":{"title":string,"text":string}[],"faqItems":{"question":string,"answer":string}[]}`,
          prompt: JSON.stringify({
            article: {
              title: blueprint.title,
              keyword: workflow.keyword,
              searchIntent: workflow.searchIntent,
              cityName,
              serviceKey,
            },
            sectionIndex: nextIndex,
            section: sectionPlan,
            alreadyGeneratedHeadings: Object.values(generatedSections).flatMap(
              (section) =>
                section &&
                typeof section === "object" &&
                "heading" in section &&
                typeof section.heading === "string"
                  ? [section.heading]
                  : [],
            ),
            serviceRules:
              serviceKey === "anstricharbeiten"
                ? [
                    "Das Unternehmen niemals als Maler- oder Meisterbetrieb bezeichnen.",
                    "Nur zulassungsfreie Schönheitsreparaturen beschreiben.",
                  ]
                : [],
          }),
        });
        generatedSection = generatedBlogSectionSchema.parse(sectionResponse);
      } catch (error) {
        console.warn(
          "Blog section generation failed; using blueprint fallback",
          nextIndex,
          error,
        );
        generatedSection = createFallbackBlogSection(sectionPlan);
        sectionWarning = `Sektion ${nextIndex + 1} wurde aus dem SEO-Briefing aufgebaut, weil die KI-Antwort unvollständig war.`;
      }
      await workflowReference.update({
        [`generatedSections.${nextIndex}`]: generatedSection,
        ...(sectionWarning
          ? { warnings: FieldValue.arrayUnion(sectionWarning) }
          : {}),
        validationFeedback: null,
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "sections",
        completedSections: Object.keys(generatedSections).length + 1,
        totalSections: blueprint.sections.length,
        message: `Sektion ${nextIndex + 1} von ${blueprint.sections.length} wurde gespeichert.`,
      });
    }

    if (stage === "content" || stage === "expand") {
      const relevantInternalLinks = catalog
        .filter((page) => page.url !== "/blog/")
        .sort(
          (left, right) =>
            Number(right.serviceKey === serviceKey) -
            Number(left.serviceKey === serviceKey),
        )
        .slice(0, 20)
        .map((page) => ({ title: page.title, url: page.url }));
      const competitorSummary = Array.isArray(workflow.competitorPages)
        ? workflow.competitorPages.map(
            (page: {
              url?: string;
              title?: string;
              metaDescription?: string;
              headings?: { h1?: string[]; h2?: string[] };
              wordCount?: number;
              topKeywords?: unknown[];
            }) => ({
              url: page.url,
              title: page.title,
              metaDescription: page.metaDescription,
              h1: page.headings?.h1,
              h2: page.headings?.h2,
              wordCount: page.wordCount,
              topKeywords: page.topKeywords?.slice(0, 10),
            }),
          )
        : [];
      let generated: GeneratedContent;
      if (stage === "content") {
        const contentResponse = await generateGeminiJson({
          temperature: 0.35,
          timeoutMs: remainingApiTime(deadlineAt),
          maxOutputTokens: 4_096,
          thinkingBudget: 0,
          systemInstruction: `Du bist Senior SEO- und Conversion-Redakteur für den Blog eines deutschen Umzugsunternehmens.
Erstelle einen einzigartigen, hilfreichen Blogartikel, der den Suchintent besser erfüllt als die analysierten Top-5-Seiten und natürlich zur passenden Dienstleistung führt.
Alle Inhalte müssen ausschließlich zur angegebenen serviceKey passen. Vermische die Dienstleistung nicht mit Entrümpelung oder anderen Services.
Erstelle in diesem Paket den ersten zusammenhängenden Seitenteil mit 500 bis 700 Wörtern und 4 bis 7 Abschnitten. Nutze klare H2-/H3-Inhalte, konkrete Schritte und Einwandbehandlung.
Die metaDescription muss zwingend 120 bis 155 Zeichen lang sein.
Nutze mindestens einen imageText-Abschnitt; Bilder werden später als Platzhalter eingesetzt.
Verwende interne Links ausschließlich aus internalLinks und formatiere sie als [Anchor](URL).
Für Entrümpelung: Verlinke passende regionale Entsorgungsstellen nur, wenn eine plausible offizielle oder kommunale URL in regionalResourceCandidates vorhanden ist. Erfinde keine Anlaufstellen oder URLs.
Kopiere keine Formulierungen der Wettbewerber. Erfinde keine Preise, Garantien, Bewertungen oder Unternehmensfakten.
Verwende keine Markdown-Überschriften in Textfeldern und keine unvollständigen Links.
Antworte ausschließlich als JSON:
{"title":string,"description":string,"metaDescription":string,"keywords":string[],"sections":[{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"body":string,"imageAlt"?:string,"items":{"title":string,"text":string}[],"faqItems":{"question":string,"answer":string}[]}]}`,
          prompt: JSON.stringify({
            serviceKey,
            cityName,
            keyword: workflow.keyword,
            titleIdea: workflow.titleIdea,
            searchIntent: workflow.searchIntent,
            supportingKeywords: workflow.supportingKeywords,
            competitorPages: competitorSummary,
            internalLinks: relevantInternalLinks,
            regionalResourceCandidates:
              workflow.regionalResourceCandidates || [],
            correction: workflow.validationFeedback,
          }),
          });
        const contentResult = contentSchema.safeParse(contentResponse);
        if (!contentResult.success) {
          const correction = zodCorrection(contentResult.error);
          await workflowReference.update({
            validationFeedback: correction,
            retryCount: Number(workflow.retryCount || 0) + 1,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            workflowId: workflowReference.id,
            stage: "content",
            message: "Der Artikelaufbau wird automatisch korrigiert.",
          });
        }
        generated = contentResult.data;
      } else {
        const firstPart = contentSchema.parse(workflow.generatedContent);
        const additionalResponse = await generateGeminiJson({
            temperature: 0.35,
            timeoutMs: remainingApiTime(deadlineAt),
            maxOutputTokens: 4_096,
            thinkingBudget: 0,
            systemInstruction: `Du ergänzt den zweiten Teil eines deutschen SEO-Blogartikels.
Bleibe ausschließlich bei der angegebenen serviceKey und vermische keine anderen Dienstleistungen.
Schreibe 400 bis 650 neue Wörter in 3 bis 6 neuen Abschnitten. Wiederhole keine vorhandenen Überschriften oder Aussagen.
Schließe offene Aspekte des Suchintents, regionale Praxishinweise, FAQ und einen zurückhaltenden Conversion-CTA ab.
Nutze mindestens einen imageText-Abschnitt. Verwende nur gelieferte interne oder regionale URLs als vollständige Markdown-Links.
Erfinde keine Preise, Garantien, Bewertungen, Anlaufstellen oder URLs.
Antworte ausschließlich als JSON:
{"sections":[{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"body":string,"imageAlt"?:string,"items":{"title":string,"text":string}[],"faqItems":{"question":string,"answer":string}[]}]}`,
            prompt: JSON.stringify({
              serviceKey,
              cityName,
              keyword: workflow.keyword,
              searchIntent: workflow.searchIntent,
              existingSections: firstPart.sections,
              internalLinks: relevantInternalLinks.slice(0, 10),
              regionalResourceCandidates:
                workflow.regionalResourceCandidates || [],
              correction: workflow.validationFeedback,
            }),
          });
        const additionalResult =
          additionalSectionsSchema.safeParse(additionalResponse);
        if (!additionalResult.success) {
          const correction = zodCorrection(additionalResult.error);
          await workflowReference.update({
            validationFeedback: correction,
            retryCount: Number(workflow.retryCount || 0) + 1,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            workflowId: workflowReference.id,
            stage: "expand",
            message: "Die Artikelerweiterung wird automatisch korrigiert.",
          });
        }
        const additional = additionalResult.data;
        generated = contentSchema.parse({
          ...firstPart,
          sections: [...firstPart.sections, ...additional.sections],
        });
      }
      if (countWords(generated.sections) < 900 && stage === "content") {
        await workflowReference.update({
          generatedContent: generated,
          validationFeedback: null,
          stage: "expand",
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          workflowId: workflowReference.id,
          stage: "expand",
          message: "Der Artikel wird in einem dritten KI-Schritt erweitert.",
        });
      }
      await workflowReference.update({
        generatedContent: stripGeneratedLinks(generated),
        validationFeedback: null,
        stage: "links",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "links",
        message: "Der Artikel wird abschließend intern verlinkt.",
      });
    }

    if (stage === "links") {
      const generated = contentSchema.parse(workflow.generatedContent);
      const internalLinks = catalog
        .filter((page) => page.url !== "/blog/")
        .sort(
          (left, right) =>
            Number(right.serviceKey === serviceKey) -
            Number(left.serviceKey === serviceKey),
        )
        .slice(0, 30)
        .map((page) => ({ title: page.title, url: page.url }));
      const allowedUrls = new Set(internalLinks.map((link) => link.url));
      let linkedContent = generated;
      if (internalLinks.length) {
        const auditResponse = await generateGeminiJson({
            temperature: 0.1,
            timeoutMs: remainingApiTime(deadlineAt),
            maxOutputTokens: 1_024,
            thinkingBudget: 0,
            systemInstruction: `Du bist Redakteur für interne SEO-Verlinkung.
Prüfe den fertigen Blogartikel und wähle 3 bis 8 wirklich hilfreiche interne Links aus allowedInternalLinks.
Jeder anchorText muss exakt und unverändert als zusammenhängender Text in body des angegebenen sectionIndex vorkommen.
Verwende jede Ziel-URL höchstens einmal. Nutze ausschließlich URLs aus allowedInternalLinks und keine externen URLs.
Bevorzuge thematisch passende Artikel und natürliche Ankertexte; vermeide generische Wörter wie "hier" oder "mehr".
Antworte ausschließlich als JSON:
{"links":[{"sectionIndex":number,"anchorText":string,"targetUrl":string}]}`,
            prompt: JSON.stringify({
              article: {
                title: generated.title,
                keyword: workflow.keyword,
                sections: generated.sections.map((section, sectionIndex) => ({
                  sectionIndex,
                  heading: section.heading,
                  body: section.body,
                })),
              },
              allowedInternalLinks: internalLinks,
              correction: workflow.validationFeedback,
            }),
          });
        const auditResult = linkAuditSchema.safeParse(auditResponse);
        if (!auditResult.success) {
          await workflowReference.update({
            warnings: FieldValue.arrayUnion(
              "Die interne Link-KI lieferte kein gültiges Format; geprüfte Links wurden regelbasiert ergänzt.",
            ),
          });
          linkedContent = {
            ...generated,
            sections: generated.sections.map((section, index) => {
              const link = internalLinks[index];
              return link
                ? {
                    ...section,
                    body: `${section.body}\n\nWeitere Informationen bietet unser Beitrag **[${link.title}](${link.url})**.`,
                  }
                : section;
            }),
          };
        } else {
          const audit = auditResult.data;
          linkedContent = applyAuditedLinks(
            generated,
            audit.links,
            allowedUrls,
          );
        }
      }
      await workflowReference.update({
        linkedContent,
        validationFeedback: null,
        stage: "quality",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "quality",
        message: "Die internen Links sind gesetzt; die SEO-Qualität wird geprüft.",
      });
    }

    if (stage === "quality") {
      const linkedContent = contentSchema.parse(workflow.linkedContent);
      let quality: z.infer<typeof qualitySchema>;
      try {
        const qualityResponse = await generateGeminiJson({
          temperature: 0.1,
          timeoutMs: remainingApiTime(deadlineAt),
          maxOutputTokens: 3_072,
          thinkingBudget: 0,
          systemInstruction: `Du bist der abschließende SEO-Qualitätsprüfer eines deutschen Ratgeberartikels.
Bewerte Suchintention, Hauptkeyword, thematische Vollständigkeit, lokale Relevanz, Redundanzen, Faktentreue, Lesbarkeit, interne Links und Conversion.
Erfinde keine Messwerte. Ordne konkrete Probleme einer vorhandenen sectionIndex zu.
Ein Score ab 85 ist freigabefähig. Unter 85 müssen die wichtigsten Sektionen gezielt repariert werden.

Antworte ausschließlich als JSON:
{"score":number,"summary":string,"issues":[{"sectionIndex":number,"severity":"hoch"|"mittel"|"niedrig","problem":string,"instruction":string}]}`,
          prompt: JSON.stringify({
            keyword: workflow.keyword,
            searchIntent: workflow.searchIntent,
            serviceKey,
            cityName,
            blueprint: workflow.blueprint,
            article: linkedContent,
          }),
        });
        quality = qualitySchema.parse(qualityResponse);
      } catch (error) {
        console.warn("Blog quality AI failed; using structural score", error);
        const words = countWords(linkedContent.sections);
        const hasLinks = JSON.stringify(linkedContent).includes("](/blog/");
        quality = {
          score: words >= 900 && hasLinks ? 85 : 75,
          summary:
            "Strukturelle Prüfung anhand von Umfang, Seitenaufbau und interner Verlinkung.",
          issues:
            words < 900
              ? [
                  {
                    sectionIndex: 0,
                    severity: "mittel",
                    problem: "Der Artikel ist kürzer als der geplante Umfang.",
                    instruction:
                      "Konkrete, suchintentreue Informationen ergänzen.",
                  },
                ]
              : [],
        };
      }

      const repairAttempts = Number(workflow.repairAttempts || 0);
      const repairIssue = quality.issues.find(
        (issue) => issue.severity !== "niedrig",
      );
      const blueprintResult = blueprintSchema.safeParse(workflow.blueprint);
      if (
        quality.score < 85 &&
        repairIssue &&
        repairAttempts < 2 &&
        blueprintResult.success &&
        blueprintResult.data.sections[repairIssue.sectionIndex]
      ) {
        const sectionPlan =
          blueprintResult.data.sections[repairIssue.sectionIndex];
        let repaired = createFallbackBlogSection(sectionPlan);
        try {
          const response = await generateGeminiJson({
            temperature: 0.25,
            timeoutMs: remainingApiTime(deadlineAt),
            maxOutputTokens: 4_096,
            thinkingBudget: 0,
            systemInstruction: `Du reparierst genau eine Sektion eines deutschen SEO-Ratgeberartikels.
Setze das ursprüngliche Briefing und den Qualitätsauftrag vollständig um.
Erfinde keine Fakten, Preise, Bewertungen, Garantien oder URLs.
Nutze keine internen Links; diese werden anschließend neu gesetzt.
Antworte ausschließlich als JSON:
{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"body":string,"imageAlt"?:string,"items":{"title":string,"text":string}[],"faqItems":{"question":string,"answer":string}[]}`,
            prompt: JSON.stringify({
              articleTitle: linkedContent.title,
              keyword: workflow.keyword,
              section: sectionPlan,
              currentSection:
                linkedContent.sections[repairIssue.sectionIndex],
              qualityProblem: repairIssue.problem,
              repairInstruction: repairIssue.instruction,
            }),
          });
          repaired = generatedBlogSectionSchema.parse(response);
        } catch (error) {
          console.warn("Blog section repair failed; using briefing", error);
        }
        await workflowReference.update({
          [`generatedSections.${repairIssue.sectionIndex}`]: repaired,
          generatedContent: FieldValue.delete(),
          linkedContent: FieldValue.delete(),
          quality: FieldValue.delete(),
          stage: "sections",
          repairAttempts: repairAttempts + 1,
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          workflowId: workflowReference.id,
          stage: "section-repair",
          sectionIndex: repairIssue.sectionIndex,
          qualityScore: quality.score,
          message: `Sektion ${repairIssue.sectionIndex + 1} wird gezielt verbessert.`,
        });
      }

      const proposalReference = database
        .collection(PROPOSAL_COLLECTION)
        .doc();
      const mainCategory = workflow.mainCategory as AdminBlogMainCategory;
      const draft = {
        title: linkedContent.title,
        slug: slugify(linkedContent.title),
        description: linkedContent.description,
        metaDescription: linkedContent.metaDescription,
        keywords: linkedContent.keywords,
        cityName,
        serviceKey,
        mainCategory,
        subcategorySlug: String(workflow.subcategorySlug),
        blocks: createBlocks(linkedContent),
      };
      const now = Date.now();
      await database.runTransaction(async (transaction) => {
        transaction.create(proposalReference, {
          ownerId: input.ownerId,
          status: "pending",
          operation:
            workflow.operation === "optimize" ? "optimize" : "create",
          targetBlogId:
            typeof workflow.targetBlogId === "string"
              ? workflow.targetBlogId
              : null,
          previousBlog: workflow.previousBlog || null,
          serviceKey,
          cityName,
          keyword: workflow.keyword,
          draft,
          qualityScore: quality.score,
          qualitySummary: quality.summary,
          generationWarnings: Array.isArray(workflow.warnings)
            ? workflow.warnings
            : [],
          createdAt: now,
        });
        transaction.update(workflowReference, {
          stage: "completed",
          proposalId: proposalReference.id,
          quality,
          updatedAt: now,
        });
      });
      return NextResponse.json({
        success: true,
        pending: false,
        workflowId: workflowReference.id,
        proposalId: proposalReference.id,
        stage: "completed",
        qualityScore: quality.score,
        message: "Der Blogentwurf wartet auf Freigabe.",
      });
    }

    return NextResponse.json({
      success: true,
      pending: false,
      workflowId: workflowReference.id,
      proposalId: workflow.proposalId,
      stage: "completed",
    });
  } catch (error) {
    console.error("Blog generation failed", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof z.ZodError
            ? "Die KI-Antwort hatte nicht das erwartete Blogformat."
            : error instanceof Error
              ? error.message
              : "Die Bloggenerierung ist fehlgeschlagen.",
      },
      { status: error instanceof z.ZodError ? 422 : 500 },
    );
  }
}
