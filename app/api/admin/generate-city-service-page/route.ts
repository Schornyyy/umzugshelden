import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { remainingApiTime } from "@/lib/apiDeadline";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  GeminiInvalidJsonError,
  generateGeminiJson,
} from "@/lib/gemini";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import {
  applySeoInternalLinkPass,
  assessSeoPageQuality,
  buildPageFromSeoSections,
  createFallbackSeoSection,
  generateSeoBlueprintSection,
  type GeneratedSeoSection,
  type SeoQualityAssessment,
} from "@/lib/seoBlueprintPageGenerator";
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
import type {
  SeoAnalysisRun,
} from "@/types/city/SeoAnalysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const CITY_SERVICE_GENERATION_WORK_BUDGET_MS = 55_000;
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
const GENERATION_JOB_COLLECTION = "cityServiceGenerationJobs";
const MAX_QUALITY_REPAIRS = 2;

type LoadedAnalysis = Pick<
  SeoAnalysisRun,
  "keywords" | "pages" | "report" | "targetRank"
> & {
  analysisWarning?: string;
};

type GenerationJobData = {
  ownerId: string;
  pageKey: string;
  analysisId: string;
  status: "running" | "completed";
  sections?: Record<string, GeneratedSeoSection>;
  linkedSections?: GeneratedSeoSection[];
  quality?: SeoQualityAssessment;
  repairAttempts?: number;
  warnings?: string[];
  proposalId?: string;
};

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
    analysisWarning:
      typeof data.analysisWarning === "string"
        ? data.analysisWarning
        : undefined,
    targetRank:
      typeof data.targetRank === "number" ? data.targetRank : undefined,
  } as LoadedAnalysis;
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
    analysisWarning:
      typeof data.analysisWarning === "string"
        ? data.analysisWarning
        : undefined,
    targetRank:
      typeof data.targetRank === "number" ? data.targetRank : undefined,
  } as LoadedAnalysis;
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

function isRecoverableGenerationError(error: unknown) {
  return (
    error instanceof GeminiInvalidJsonError ||
    (error instanceof Error &&
      (error.message.includes("Zeitlimit") ||
        error.message.startsWith("KI-Textpaket")))
  );
}

async function saveProposal(input: {
  request: z.infer<typeof requestSchema>;
  draft: GeneratedCityPageDraft;
  previous: Awaited<ReturnType<typeof loadCurrentSnapshot>>;
  targetRank?: number;
  generationMode: "ai" | "analysis-fallback";
  generationWarning?: string;
  qualityScore?: number;
  qualitySummary?: string;
  generationJobReference?: FirebaseFirestore.DocumentReference;
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
      generationMode: input.generationMode,
      generationWarning: input.generationWarning ?? null,
      qualityScore: input.qualityScore ?? null,
      qualitySummary: input.qualitySummary ?? null,
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
    if (input.generationJobReference) {
      transaction.set(
        input.generationJobReference,
        {
          status: "completed",
          proposalId: proposalReference.id,
          completedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    }
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
  const deadlineAt =
    Date.now() + CITY_SERVICE_GENERATION_WORK_BUDGET_MS;
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
    let generationMode: "ai" | "analysis-fallback" = "ai";
    let generationWarning = analysis?.analysisWarning;
    if (input.analysisId && !analysis?.report.pageBlueprint) {
      throw new Error(
        "Diese ältere Analyse enthält noch keinen vollständigen KI-Blueprint. Bitte eine neue SEO-Analyse starten.",
      );
    }
    if (analysis?.report.pageBlueprint) {
      const blueprint = analysis.report.pageBlueprint;
      const pageKey = `${input.citySlug}/${input.serviceKey}`;
      const jobId = input.analysisId ?? optimizationStateId(
        input.ownerId,
        input.citySlug,
        input.serviceKey,
      );
      const jobReference = getAdminDatabase()
        .collection(GENERATION_JOB_COLLECTION)
        .doc(jobId);
      let jobSnapshot = await jobReference.get();
      if (!jobSnapshot.exists) {
        await jobReference.create({
          ownerId: input.ownerId,
          pageKey,
          analysisId: input.analysisId ?? jobId,
          status: "running",
          sections: {},
          repairAttempts: 0,
          warnings: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } satisfies GenerationJobData & {
          createdAt: number;
          updatedAt: number;
        });
        jobSnapshot = await jobReference.get();
      }
      const job = jobSnapshot.data() as GenerationJobData;
      if (job.ownerId !== input.ownerId || job.pageKey !== pageKey) {
        throw new Error("Der gespeicherte Generierungsauftrag ist ungültig.");
      }
      if (job.status === "completed" && job.proposalId) {
        return NextResponse.json({
          success: true,
          proposalId: job.proposalId,
          generationMode: "ai",
          reviewUrl: `/admin/${encodeURIComponent(input.ownerId)}/citys/${encodeURIComponent(input.citySlug)}/services/${input.serviceKey}/optimierungen/${job.proposalId}`,
        });
      }

      const sectionsByOrder = job.sections ?? {};
      const nextSection = [...blueprint.sections]
        .sort((left, right) => left.order - right.order)
        .find((section) => !sectionsByOrder[String(section.order)]);
      if (nextSection) {
        let generatedSection: GeneratedSeoSection;
        let sectionWarning: string | undefined;
        try {
          generatedSection = await generateSeoBlueprintSection({
            section: nextSection,
            sectionIndex: blueprint.sections.findIndex(
              (section) => section.order === nextSection.order,
            ),
            sectionCount: blueprint.sections.length,
            pageLabel: `${input.serviceName} ${input.cityName}`,
            cityName: input.cityName,
            blueprint,
            report: analysis.report,
            verifiedClaims: [
              "kostenlose und unverbindliche Anfrage",
              "persönliche Planung",
              "kombinierbare Leistungen",
            ],
            serviceKey: input.serviceKey,
            deadlineAt,
          });
        } catch (error) {
          if (!isRecoverableGenerationError(error)) throw error;
          console.warn(
            "SEO section generation incomplete; using section fallback",
            nextSection.order,
            error,
          );
          generatedSection = createFallbackSeoSection(nextSection);
          sectionWarning = `Sektion ${nextSection.order} wurde aus dem geprüften SEO-Briefing aufgebaut, weil die KI-Textantwort unvollständig war.`;
        }
        await jobReference.update({
          [`sections.${nextSection.order}`]: generatedSection,
          ...(sectionWarning
            ? { warnings: FieldValue.arrayUnion(sectionWarning) }
            : {}),
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          stage: "section",
          sectionOrder: nextSection.order,
          completedSections: Object.keys(sectionsByOrder).length + 1,
          totalSections: blueprint.sections.length,
        });
      }

      const orderedSections = blueprint.sections.map(
        (section) => sectionsByOrder[String(section.order)],
      );
      if (!job.linkedSections) {
        const linked = await applySeoInternalLinkPass({
          sections: orderedSections,
          blueprint,
          pageLabel: `${input.serviceName} ${input.cityName}`,
          deadlineAt,
        });
        await jobReference.update({
          linkedSections: linked.sections,
          ...(linked.warning
            ? { warnings: FieldValue.arrayUnion(linked.warning) }
            : {}),
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          stage: "internal-links",
          completedSections: blueprint.sections.length,
          totalSections: blueprint.sections.length,
        });
      }

      if (!job.quality) {
        const quality = await assessSeoPageQuality({
          sections: job.linkedSections,
          blueprint,
          report: analysis.report,
          pageLabel: `${input.serviceName} ${input.cityName}`,
          deadlineAt,
        });
        await jobReference.update({
          quality,
          updatedAt: Date.now(),
        });
        return NextResponse.json({
          success: true,
          pending: true,
          stage: "quality-check",
          qualityScore: quality.score,
        });
      }

      const repairAttempts = job.repairAttempts ?? 0;
      const repairIssue = job.quality.issues.find(
        (issue) => issue.severity !== "niedrig",
      );
      if (
        job.quality.score < 85 &&
        repairIssue &&
        repairAttempts < MAX_QUALITY_REPAIRS
      ) {
        const sectionBlueprint = blueprint.sections.find(
          (section) => section.order === repairIssue.sectionOrder,
        );
        if (sectionBlueprint) {
          let repairedSection: GeneratedSeoSection;
          try {
            repairedSection = await generateSeoBlueprintSection({
              section: sectionBlueprint,
              sectionIndex: blueprint.sections.findIndex(
                (section) => section.order === sectionBlueprint.order,
              ),
              sectionCount: blueprint.sections.length,
              pageLabel: `${input.serviceName} ${input.cityName}`,
              cityName: input.cityName,
              blueprint,
              report: analysis.report,
              verifiedClaims: [
                "kostenlose und unverbindliche Anfrage",
                "persönliche Planung",
                "kombinierbare Leistungen",
              ],
              serviceKey: input.serviceKey,
              deadlineAt,
              correction: `${repairIssue.problem} Reparaturauftrag: ${repairIssue.instruction}`,
            });
          } catch (error) {
            if (!isRecoverableGenerationError(error)) throw error;
            repairedSection = createFallbackSeoSection(sectionBlueprint);
            await jobReference.update({
              warnings: FieldValue.arrayUnion(
                `Die Qualitätsreparatur für Sektion ${sectionBlueprint.order} wurde aus dem SEO-Briefing aufgebaut.`,
              ),
            });
          }
          await jobReference.update({
            [`sections.${sectionBlueprint.order}`]: repairedSection,
            linkedSections: FieldValue.delete(),
            quality: FieldValue.delete(),
            repairAttempts: repairAttempts + 1,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            stage: "section-repair",
            sectionOrder: sectionBlueprint.order,
            repairAttempt: repairAttempts + 1,
          });
        }
      }

      generationWarning = [
        analysis?.analysisWarning,
        ...(job.warnings ?? []),
        job.quality.score < 85
          ? `Die abschließende SEO-Qualitätsprüfung erreichte ${job.quality.score} von 100 Punkten.`
          : undefined,
      ]
        .filter((warning): warning is string => Boolean(warning))
        .join(" ");
      generationMode = job.warnings?.length
        ? "analysis-fallback"
        : "ai";
      draft = buildPageFromSeoSections(
        {
          cityName: input.cityName,
          pageLabel: `${input.serviceName} ${input.cityName}`,
          image: input.currentImage,
          imageAlt: input.currentImageAlt,
          serviceKey: input.serviceKey,
          currentBlocks: previous.blocks,
          report: analysis.report,
          blueprint,
          verifiedClaims: [
            "kostenlose und unverbindliche Anfrage",
            "persönliche Planung",
            "kombinierbare Leistungen",
          ],
        },
        job.linkedSections,
      );

      const proposalId = await saveProposal({
        request: input,
        draft,
        previous,
        targetRank: analysis?.targetRank,
        generationMode,
        generationWarning: generationWarning || undefined,
        qualityScore: job.quality.score,
        qualitySummary: job.quality.summary,
        generationJobReference: jobReference,
      });
      return NextResponse.json({
        success: true,
        draft,
        usedAnalysis: true,
        proposalId,
        generationMode,
        warning: generationWarning || undefined,
        qualityScore: job.quality.score,
        reviewUrl: `/admin/${encodeURIComponent(input.ownerId)}/citys/${encodeURIComponent(input.citySlug)}/services/${input.serviceKey}/optimierungen/${proposalId}`,
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
      generationMode,
      generationWarning,
    });
    return NextResponse.json({
      success: true,
      draft,
      usedAnalysis: Boolean(analysis),
      proposalId,
      generationMode,
      warning: generationWarning,
      reviewUrl: `/admin/${encodeURIComponent(input.ownerId)}/citys/${encodeURIComponent(input.citySlug)}/services/${input.serviceKey}/optimierungen/${proposalId}`,
    });
  } catch (error) {
    console.error("City service page generation error", error);
    const isRetryableAiError = isRecoverableGenerationError(error);
    if (isRetryableAiError) {
      return NextResponse.json(
        {
          success: false,
          retryable: true,
          error:
            "Der KI-Entwurf konnte noch nicht vollständig erstellt werden.",
        },
        { status: 503 },
      );
    }
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
