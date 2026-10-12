import { NextResponse } from "next/server";
import { z } from "zod";
import { API_WORK_BUDGET_MS, remainingApiTime } from "@/lib/apiDeadline";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { generateGeminiJson } from "@/lib/gemini";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import { generatePageFromSeoBlueprint } from "@/lib/seoBlueprintPageGenerator";
import type { GeneratedCityPageDraft } from "@/types/city/CityPageGeneration";
import {
  CITY_SERVICE_IMAGE_PLACEHOLDER,
  enforceCityServiceContentPolicy,
  ensureSeoImagePlaceholders,
  mergePreservedBuilderBlocks,
  serviceGenerationRules,
} from "@/lib/cityServiceContentPolicy";
import {
  CITY_SERVICE_KEYS,
  type CityServiceBlock,
  type CityServiceSeoSettings,
} from "@/types/city/CityServicePage";
import type { SeoAnalysisRun } from "@/types/city/SeoAnalysis";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  cityName: z.string().trim().min(1).max(150),
  citySlug: z.string().trim().min(1).max(200),
  serviceKey: z.enum(CITY_SERVICE_KEYS),
  serviceName: z.string().trim().min(1).max(150),
  primaryKeyword: z.string().trim().min(1).max(150),
  keywords: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  currentImage: z.string().trim().min(1).max(2_048),
  currentImageAlt: z.string().trim().min(1).max(500),
  analysisId: z.string().trim().min(1).max(200).optional(),
  source: z.enum(["manual", "cron"]).default("manual"),
  currentBlocks: z.array(z.record(z.unknown())).max(40).optional(),
  currentSeo: z.record(z.unknown()).optional(),
});

const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1_000;
const PROPOSAL_COLLECTION = "cityServiceOptimizationProposals";
const STATE_COLLECTION = "cityServiceOptimizationStates";

const shortText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(8_000);
const generatedServiceCopySchema = z.object({
  strategy: z.object({
    primaryKeyword: shortText,
    searchIntent: shortText,
    conversionGoal: shortText,
    differentiators: z.array(shortText).min(3).max(8),
  }),
  seo: z.object({
    title: z.string().trim().min(30).max(65),
    description: z.string().trim().min(120).max(165),
    schemaDescription: z.string().trim().min(80).max(500),
    keywords: z.array(z.string().trim().min(1).max(100)).min(3).max(20),
  }),
  hero: z.object({
    title: shortText,
    description: longText,
    formTitle: shortText,
    formText: longText,
  }),
  overview: z.object({
    eyebrow: shortText,
    heading: shortText,
    paragraphs: z.array(longText).min(3).max(6),
  }),
  services: z.object({
    heading: shortText,
    intro: longText,
    cards: z.array(z.object({ title: shortText, text: longText })).min(4).max(8),
  }),
  checklist: z.object({
    heading: shortText,
    intro: longText,
    items: z.array(longText).min(5).max(12),
  }),
  process: z.object({
    heading: shortText,
    intro: longText,
    steps: z.array(longText).min(4).max(7),
  }),
  pricing: z.object({
    heading: shortText,
    text: longText,
    factors: z.array(longText).min(4).max(10),
    ctaTitle: shortText,
    ctaText: longText,
    ctaLabel: z.string().trim().min(1).max(100),
  }),
  benefits: z.object({
    heading: shortText,
    cards: z.array(z.object({ title: shortText, text: longText })).min(4).max(8),
  }),
  faq: z.object({
    heading: shortText,
    items: z.array(z.object({ question: shortText, answer: longText })).min(6).max(12),
  }),
  contact: z.object({
    heading: shortText,
    text: longText,
  }),
});

async function getLatestAnalysis(ownerId: string, pageKey: string) {
  const snapshot = await getAdminDatabase()
    .collection("seoAnalyses")
    .where("ownerId", "==", ownerId)
    .where("pageKey", "==", pageKey)
    .limit(20)
    .get();
  const latest = snapshot.docs.sort((a, b) => {
    const left = a.get("createdAt")?.toMillis?.() ?? 0;
    const right = b.get("createdAt")?.toMillis?.() ?? 0;
    return right - left;
  })[0];
  if (!latest) return null;
  const data = latest.data();
  return {
    keywords: data.keywords ?? [],
    pages: data.pages ?? [],
    report: data.report,
    targetRank:
      typeof data.targetRank === "number" ? data.targetRank : undefined,
  } as Pick<SeoAnalysisRun, "keywords" | "pages" | "report" | "targetRank">;
}

async function getAnalysis(
  ownerId: string,
  pageKey: string,
  analysisId?: string,
) {
  if (!analysisId) return getLatestAnalysis(ownerId, pageKey);

  const document = await getAdminDatabase()
    .collection("seoAnalyses")
    .doc(analysisId)
    .get();
  if (
    !document.exists ||
    document.get("ownerId") !== ownerId ||
    document.get("pageKey") !== pageKey
  ) {
    throw new Error("Die ausgewählte SEO-Analyse wurde nicht gefunden.");
  }
  const data = document.data();
  if (!data) throw new Error("Die ausgewählte SEO-Analyse enthält keine Daten.");
  return {
    keywords: data.keywords ?? [],
    pages: data.pages ?? [],
    report: data.report,
    targetRank:
      typeof data.targetRank === "number" ? data.targetRank : undefined,
  } as Pick<SeoAnalysisRun, "keywords" | "pages" | "report" | "targetRank">;
}

async function generateCopy(input: {
  cityName: string;
  serviceName: string;
  primaryKeyword: string;
  keywords: string[];
  analysis: Pick<SeoAnalysisRun, "keywords" | "pages" | "report"> | null;
  serviceKey: (typeof CITY_SERVICE_KEYS)[number];
  deadlineAt: number;
}) {
  const parsed = await generateGeminiJson({
    temperature: 0.35,
    timeoutMs: remainingApiTime(input.deadlineAt),
    systemInstruction: `Du bist Senior SEO-Stratege und Conversion-Copywriter für lokale deutsche Dienstleistungsseiten.
Erstelle eine vollständige Landingpage für genau eine Dienstleistung in einer Stadt.

Verbindliche Regeln:
- Schreibe natürliches, seriöses Deutsch in direkter Sie-Ansprache.
- Optimiere auf lokale transaktionale Suchintention, Vertrauen und qualifizierte Anfragen.
- Verwende eine H1 und logisch aufgebaute H2-Inhalte ohne Keyword-Stuffing.
- Behandle Leistungsumfang, Vorbereitung, Ablauf, Kostenfaktoren, Vorteile, Einwände und FAQ ausführlich.
- Der Inhalt soll mindestens 1.000 Wörter ermöglichen und jede Sektion muss substanziell sein.
- Erfinde keine Preise, Bewertungen, Garantien, Auszeichnungen, Standorte oder Unternehmensgrößen.
- Kopiere keine Formulierungen von Wettbewerbern.
- Titel: 30-65 Zeichen. Meta-Description: 120-165 Zeichen.
- FAQ-Antworten müssen konkret und schema-tauglich sein.
${serviceGenerationRules(input.serviceKey).map((rule) => `- ${rule}`).join("\n")}

Antworte ausschließlich als JSON:
{
  "strategy":{"primaryKeyword":string,"searchIntent":string,"conversionGoal":string,"differentiators":string[]},
  "seo":{"title":string,"description":string,"schemaDescription":string,"keywords":string[]},
  "hero":{"title":string,"description":string,"formTitle":string,"formText":string},
  "overview":{"eyebrow":string,"heading":string,"paragraphs":string[]},
  "services":{"heading":string,"intro":string,"cards":{"title":string,"text":string}[]},
  "checklist":{"heading":string,"intro":string,"items":string[]},
  "process":{"heading":string,"intro":string,"steps":string[]},
  "pricing":{"heading":string,"text":string,"factors":string[],"ctaTitle":string,"ctaText":string,"ctaLabel":string},
  "benefits":{"heading":string,"cards":{"title":string,"text":string}[]},
  "faq":{"heading":string,"items":{"question":string,"answer":string}[]},
  "contact":{"heading":string,"text":string}
}`,
    prompt: JSON.stringify({
      city: input.cityName,
      service: input.serviceName,
      primaryKeyword: input.primaryKeyword,
      requestedKeywords: input.keywords,
      seoAnalysis: input.analysis,
      company: "Umzugshelden",
      verifiedClaims: [
        "kostenlose und unverbindliche Anfrage",
        "persönliche Planung",
        "kombinierbare Leistungen",
      ],
    }),
  });
  return generatedServiceCopySchema.parse(parsed);
}

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

function optimizationStateId(
  ownerId: string,
  citySlug: string,
  serviceKey: string,
) {
  return `${safeDocumentPart(ownerId)}__${citySlug}__${serviceKey}`;
}

async function loadCurrentSnapshot(input: z.infer<typeof requestSchema>) {
  const database = getAdminDatabase();
  const stateId = optimizationStateId(
    input.ownerId,
    input.citySlug,
    input.serviceKey,
  );
  const [templateDocument, pageDocument] = await Promise.all([
    database
      .collection("cityServiceTemplates")
      .doc(`${safeDocumentPart(input.ownerId)}__${input.serviceKey}`)
      .get(),
    database.collection("cityServicePages").doc(stateId).get(),
  ]);
  const template = templateDocument.data() ?? {};
  const page = pageDocument.data() ?? {};
  const suppliedBlocks = input.currentBlocks as CityServiceBlock[] | undefined;
  const suppliedSeo = input.currentSeo as CityServiceSeoSettings | undefined;
  const blocks =
    suppliedBlocks?.length
      ? suppliedBlocks
      : page.inheritTemplate || !Array.isArray(page.blocks)
        ? (template.blocks as CityServiceBlock[] | undefined)
        : (page.blocks as CityServiceBlock[]);
  const rawSeo = suppliedSeo ?? {
    ...(template.seo as CityServiceSeoSettings | undefined),
    ...(page.seo as Partial<CityServiceSeoSettings> | undefined),
  };
  if (!blocks?.length || !rawSeo?.title) {
    throw new Error(
      "Der aktuelle Seitenstand konnte für den Vergleich nicht geladen werden.",
    );
  }
  const seo: CityServiceSeoSettings = {
    title: rawSeo.title,
    description: rawSeo.description ?? "",
    image: rawSeo.image ?? input.currentImage,
    imageAlt: rawSeo.imageAlt ?? input.currentImageAlt,
    schemaDescription: rawSeo.schemaDescription ?? "",
    keywords: rawSeo.keywords ?? [],
  };
  return {
    blocks,
    seo: ensureSeoImagePlaceholders(
      {
        ...seo,
        image: seo.image || input.currentImage || CITY_SERVICE_IMAGE_PLACEHOLDER,
        imageAlt:
          seo.imageAlt ||
          input.currentImageAlt ||
          `${input.serviceName} in ${input.cityName}`,
      },
      `${input.serviceName} in ${input.cityName}`,
    ),
    updatedAt: Math.max(
      typeof page.updatedAt === "number" ? page.updatedAt : 0,
      typeof template.updatedAt === "number" ? template.updatedAt : 0,
    ),
  };
}

class OptimizationConflict extends Error {}

async function saveProposal(input: {
  request: z.infer<typeof requestSchema>;
  draft: GeneratedCityPageDraft;
  previous: Awaited<ReturnType<typeof loadCurrentSnapshot>>;
  targetRank?: number;
}) {
  const database = getAdminDatabase();
  const stateId = optimizationStateId(
    input.request.ownerId,
    input.request.citySlug,
    input.request.serviceKey,
  );
  const stateReference = database.collection(STATE_COLLECTION).doc(stateId);
  const proposalReference = database.collection(PROPOSAL_COLLECTION).doc();
  const now = Date.now();

  await database.runTransaction(async (transaction) => {
    const stateDocument = await transaction.get(stateReference);
    const state = stateDocument.data();
    const lastGeneratedAt =
      typeof state?.lastGeneratedAt === "number" ? state.lastGeneratedAt : 0;
    if (state?.pendingProposalId) {
      throw new OptimizationConflict(
        "Für diese Seite wartet bereits ein KI-Vorschlag auf Freigabe.",
      );
    }
    if (lastGeneratedAt && now - lastGeneratedAt < MONTH_IN_MS) {
      const nextDate = new Date(lastGeneratedAt + MONTH_IN_MS).toLocaleDateString(
        "de-DE",
      );
      throw new OptimizationConflict(
        `Diese Seite darf erst ab ${nextDate} erneut optimiert werden.`,
      );
    }
    transaction.create(proposalReference, {
      ownerId: input.request.ownerId,
      cityName: input.request.cityName,
      citySlug: input.request.citySlug,
      serviceKey: input.request.serviceKey,
      pageKey: `${input.request.citySlug}/${input.request.serviceKey}`,
      analysisId: input.request.analysisId ?? null,
      source: input.request.source,
      status: "pending",
      previous: input.previous,
      draft: input.draft,
      targetRank: input.targetRank ?? null,
      createdAt: now,
    });
    transaction.set(
      stateReference,
      {
        ownerId: input.request.ownerId,
        citySlug: input.request.citySlug,
        serviceKey: input.request.serviceKey,
        pendingProposalId: proposalReference.id,
        lastGeneratedAt: now,
        targetRank: input.targetRank ?? null,
        suspendedForTopFive: false,
        updatedAt: now,
      },
      { merge: true },
    );
  });
  return proposalReference.id;
}

function createBlocks(
  input: z.infer<typeof requestSchema>,
  copy: z.infer<typeof generatedServiceCopySchema>,
): CityServiceBlock[] {
  return [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      tone: "navy",
      title: copy.hero.title,
      description: copy.hero.description,
      image: input.currentImage,
      imageAlt: input.currentImageAlt,
      formTitle: copy.hero.formTitle,
      formText: copy.hero.formText,
    },
    {
      id: "overview",
      type: "imageText",
      enabled: true,
      tone: "white",
      eyebrow: copy.overview.eyebrow,
      heading: copy.overview.heading,
      paragraphs: copy.overview.paragraphs,
      image: input.currentImage,
      imageAlt: input.currentImageAlt,
      imagePosition: "right",
      ctaLabel: "Kostenlos anfragen",
      ctaUrl: "#kontakt",
    },
    {
      id: "service-details",
      type: "cardGrid",
      enabled: true,
      tone: "accent",
      heading: copy.services.heading,
      intro: copy.services.intro,
      cards: copy.services.cards,
      columns: 3,
      numbered: false,
    },
    {
      id: "checklist",
      type: "checkList",
      enabled: true,
      tone: "white",
      heading: copy.checklist.heading,
      intro: copy.checklist.intro,
      items: copy.checklist.items,
      columns: 2,
    },
    {
      id: "process",
      type: "process",
      enabled: true,
      tone: "muted",
      heading: copy.process.heading,
      intro: copy.process.intro,
      steps: copy.process.steps,
    },
    {
      id: "pricing",
      type: "pricing",
      enabled: true,
      tone: "white",
      eyebrow: "Transparent planen",
      heading: copy.pricing.heading,
      text: copy.pricing.text,
      factors: copy.pricing.factors,
      ctaTitle: copy.pricing.ctaTitle,
      ctaText: copy.pricing.ctaText,
      ctaLabel: copy.pricing.ctaLabel,
    },
    {
      id: "benefits",
      type: "cardGrid",
      enabled: true,
      tone: "navy",
      heading: copy.benefits.heading,
      cards: copy.benefits.cards,
      columns: 3,
      numbered: false,
    },
    {
      id: "local-area",
      type: "localArea",
      enabled: true,
      tone: "white",
      eyebrow: "Regional für Sie im Einsatz",
      heading: `${input.serviceName} in ${input.cityName} und Umgebung`,
      nearbyLimit: 4,
      showFacts: true,
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      tone: "muted",
      heading: copy.faq.heading,
      items: copy.faq.items,
      includeLocalQuestion: false,
    },
    {
      id: "other-services",
      type: "otherServices",
      enabled: true,
      tone: "white",
      heading: "Weitere Leistungen aus einer Hand",
    },
    {
      id: "contact",
      type: "contact",
      enabled: true,
      tone: "accent",
      heading: copy.contact.heading,
      text: copy.contact.text,
      showPhone: true,
      showEmail: true,
      showForm: true,
    },
  ];
}

export async function POST(request: Request) {
  const deadlineAt = Date.now() + API_WORK_BUDGET_MS;
  try {
    const input = requestSchema.parse(await request.json());
    if (!(await authorizeAdminOwnerOrCron(request, input.ownerId))) {
      return NextResponse.json(
        { success: false, error: "Nicht autorisiert" },
        { status: 401 },
      );
    }
    const analysis = await getAnalysis(
      input.ownerId,
      `${input.citySlug}/${input.serviceKey}`,
      input.analysisId,
    );
    if (analysis?.targetRank && analysis.targetRank <= 5) {
      return NextResponse.json(
        {
          success: false,
          suspended: true,
          targetRank: analysis.targetRank,
          error: `Die Seite rankt bereits auf Position ${analysis.targetRank} und wird deshalb nicht weiter verändert.`,
        },
        { status: 409 },
      );
    }
    const previous = await loadCurrentSnapshot(input);
    let draft: GeneratedCityPageDraft;
    if (input.analysisId && !analysis?.report.pageBlueprint) {
      throw new Error(
        "Diese ältere Analyse enthält noch keinen vollständigen KI-Blueprint. Bitte eine neue SEO-Analyse starten.",
      );
    }
    if (analysis?.report.pageBlueprint) {
      draft = await generatePageFromSeoBlueprint({
        cityName: input.cityName,
        pageLabel: `${input.serviceName} ${input.cityName}`,
        image: input.currentImage,
        imageAlt: input.currentImageAlt,
        serviceKey: input.serviceKey,
        currentBlocks: previous.blocks,
        report: analysis.report,
        blueprint: analysis.report.pageBlueprint,
        deadlineAt,
        verifiedClaims: [
          "kostenlose und unverbindliche Anfrage",
          "persönliche Planung",
          "kombinierbare Leistungen",
        ],
      });
    } else {
      const keywords = [
        ...new Set([...input.keywords, ...(analysis?.keywords ?? [])]),
      ];
      const copy = await generateCopy({
        cityName: input.cityName,
        serviceName: input.serviceName,
        primaryKeyword: input.primaryKeyword,
        keywords,
        analysis,
        serviceKey: input.serviceKey,
        deadlineAt,
      });
      draft = enforceCityServiceContentPolicy(input.serviceKey, {
        blocks: mergePreservedBuilderBlocks(
          createBlocks(input, copy),
          previous.blocks,
        ),
        seo: ensureSeoImagePlaceholders(
          {
            ...copy.seo,
            image: input.currentImage,
            imageAlt: input.currentImageAlt,
          },
          `${input.serviceName} in ${input.cityName}`,
        ),
        strategy: copy.strategy,
      });
    }
    const proposalId = await saveProposal({
      request: input,
      draft,
      previous,
      targetRank: analysis?.targetRank,
    });
    return NextResponse.json({
      success: true,
      draft,
      usedAnalysis: Boolean(analysis),
      proposalId,
      reviewUrl: `/admin/${encodeURIComponent(input.ownerId)}/citys/${encodeURIComponent(input.citySlug)}/services/${input.serviceKey}/optimierungen/${proposalId}`,
    });
  } catch (error) {
    console.error("City service page generation error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Der KI-Entwurf entsprach nicht vollständig der Seitenstruktur. Bitte erneut versuchen.",
        },
        { status: 422 },
      );
    }
    if (error instanceof OptimizationConflict) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Die Dienstleistungsseite konnte nicht erstellt werden",
      },
      { status: 500 },
    );
  }
}
