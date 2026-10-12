import { NextResponse } from "next/server";
import { z } from "zod";
import { API_WORK_BUDGET_MS, remainingApiTime } from "@/lib/apiDeadline";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { generateGeminiJson } from "@/lib/gemini";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { generatePageFromSeoBlueprint } from "@/lib/seoBlueprintPageGenerator";
import type { GeneratedCityPageDraft } from "@/types/city/CityPageGeneration";
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
  keywords: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  currentImage: z.string().trim().min(1).max(2_048),
  currentImageAlt: z.string().trim().min(1).max(500),
  analysisId: z.string().trim().min(1).max(200).optional(),
});

const shortText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(5_000);
const generatedCopySchema = z.object({
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
  intro: z.object({
    heading: shortText,
    text: longText,
  }),
  trust: z.object({
    heading: shortText,
    intro: longText,
    cards: z
      .array(z.object({ title: shortText, text: longText }))
      .min(3)
      .max(6),
  }),
  process: z.object({
    heading: shortText,
    intro: longText,
    steps: z.array(longText).min(3).max(6),
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
    cards: z
      .array(z.object({ title: shortText, text: longText }))
      .min(4)
      .max(8),
  }),
  faq: z.object({
    heading: shortText,
    items: z
      .array(z.object({ question: shortText, answer: longText }))
      .min(5)
      .max(10),
  }),
  contact: z.object({
    heading: shortText,
    text: longText,
  }),
});

async function getLatestAnalysis(
  ownerId: string,
  citySlug: string,
): Promise<Pick<SeoAnalysisRun, "keywords" | "pages" | "report"> | null> {
  const snapshot = await getAdminDatabase()
    .collection("seoAnalyses")
    .where("ownerId", "==", ownerId)
    .where("pageKey", "==", citySlug)
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
  };
}

async function getAnalysis(
  ownerId: string,
  citySlug: string,
  analysisId?: string,
) {
  if (!analysisId) return getLatestAnalysis(ownerId, citySlug);

  const document = await getAdminDatabase()
    .collection("seoAnalyses")
    .doc(analysisId)
    .get();
  if (
    !document.exists ||
    document.get("ownerId") !== ownerId ||
    document.get("pageKey") !== citySlug
  ) {
    throw new Error("Die ausgewählte SEO-Analyse wurde nicht gefunden.");
  }
  const data = document.data();
  if (!data) throw new Error("Die ausgewählte SEO-Analyse enthält keine Daten.");
  return {
    keywords: data.keywords ?? [],
    pages: data.pages ?? [],
    report: data.report,
  } as Pick<SeoAnalysisRun, "keywords" | "pages" | "report">;
}

async function generateCopy(input: {
  cityName: string;
  keywords: string[];
  analysis: Pick<SeoAnalysisRun, "keywords" | "pages" | "report"> | null;
  deadlineAt: number;
}) {
  const parsed = await generateGeminiJson({
    temperature: 0.35,
    timeoutMs: remainingApiTime(input.deadlineAt),
    systemInstruction: `Du bist Senior SEO-Stratege und Conversion-Copywriter für ein deutsches Umzugsunternehmen.
Erstelle eine vollständige Stadt-Landingpage, die organische Sichtbarkeit und qualifizierte Anfragen maximiert.

Verbindliche Regeln:
- Schreibe natürliches, seriöses Deutsch in direkter Sie-Ansprache.
- Decke transaktionale und lokale Suchintention ab, ohne Keyword-Stuffing.
- Nutze eine klare H1, logisch aufeinander aufbauende H2-Bereiche, konkrete Vorteile, Ablauf, Preistreiber, Einwandbehandlung, FAQ und starke Handlungsaufforderungen.
- Erfinde keine Preise, Bewertungen, Auszeichnungen, Garantien, Standorte, Mitarbeiterzahlen oder andere nicht gelieferte Tatsachen.
- Behaupte keine Vorteile der Konkurrenz als eigene Leistung.
- Verwende den Stadtnamen sinnvoll, aber nicht in jedem Satz.
- Titel: 30-65 Zeichen. Meta-Description: 120-165 Zeichen.
- FAQ-Antworten müssen eigenständig, konkret und schema-tauglich sein.
- Texte müssen einzigartig sein und dürfen keine Passagen der Wettbewerber kopieren.
- Die Zielseite soll mindestens 900 Wörter ermöglichen; liefere deshalb substanziellen Text.

Antworte ausschließlich als JSON mit exakt dieser Struktur:
{
  "strategy":{"primaryKeyword":string,"searchIntent":string,"conversionGoal":string,"differentiators":string[]},
  "seo":{"title":string,"description":string,"schemaDescription":string,"keywords":string[]},
  "hero":{"title":string,"description":string,"formTitle":string,"formText":string},
  "intro":{"heading":string,"text":string},
  "trust":{"heading":string,"intro":string,"cards":{"title":string,"text":string}[]},
  "process":{"heading":string,"intro":string,"steps":string[]},
  "pricing":{"heading":string,"text":string,"factors":string[],"ctaTitle":string,"ctaText":string,"ctaLabel":string},
  "benefits":{"heading":string,"cards":{"title":string,"text":string}[]},
  "faq":{"heading":string,"items":{"question":string,"answer":string}[]},
  "contact":{"heading":string,"text":string}
}`,
    prompt: JSON.stringify({
      city: input.cityName,
      requestedKeywords: input.keywords,
      seoAnalysis: input.analysis,
      companyFacts: {
        name: "Umzugshelden",
        services: [
          "Umzugsservice",
          "Anstricharbeiten",
          "Möbelservice",
          "Seniorenumzug",
          "Entrümpelung",
        ],
        verifiedClaims: [
          "kostenlose und unverbindliche Anfrage",
          "persönliche Planung",
          "kombinierbare Leistungen",
        ],
      },
    }),
  });
  return generatedCopySchema.parse(parsed);
}

function createBlocks(
  cityName: string,
  image: string,
  imageAlt: string,
  copy: z.infer<typeof generatedCopySchema>,
): CityServiceBlock[] {
  return [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      tone: "navy",
      title: copy.hero.title,
      description: copy.hero.description,
      image,
      imageAlt,
      formTitle: copy.hero.formTitle,
      formText: copy.hero.formText,
    },
    {
      id: "intro",
      type: "intro",
      enabled: true,
      tone: "white",
      heading: copy.intro.heading,
      text: copy.intro.text,
    },
    {
      id: "trust",
      type: "cardGrid",
      enabled: true,
      tone: "accent",
      heading: copy.trust.heading,
      intro: copy.trust.intro,
      cards: copy.trust.cards,
      columns: 3,
      numbered: false,
    },
    {
      id: "services",
      type: "serviceCards",
      enabled: true,
      tone: "white",
      heading: `Unsere Leistungen in ${cityName}`,
      serviceKeys: [...CITY_SERVICE_KEYS],
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
      id: "local-area",
      type: "localArea",
      enabled: true,
      tone: "white",
      eyebrow: "Regional für Sie im Einsatz",
      heading: `Umzugsservice in ${cityName} und Umgebung`,
      nearbyLimit: 4,
      showFacts: true,
    },
    {
      id: "pricing",
      type: "pricing",
      enabled: true,
      tone: "muted",
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
      id: "faq",
      type: "faq",
      enabled: true,
      tone: "white",
      heading: copy.faq.heading,
      items: copy.faq.items,
      includeLocalQuestion: false,
    },
    {
      id: "nearby-cities",
      type: "nearbyCities",
      enabled: true,
      tone: "muted",
      heading: `Weitere Einsatzorte rund um ${cityName}`,
      intro: "Entdecken Sie unsere Leistungen in weiteren Städten der Region.",
      limit: 12,
      radiusKm: 50,
      showDistance: true,
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
    if (!(await authorizeAdminOwner(request, input.ownerId))) {
      return NextResponse.json(
        { success: false, error: "Nicht autorisiert" },
        { status: 401 },
      );
    }
    const analysis = await getAnalysis(
      input.ownerId,
      input.citySlug,
      input.analysisId,
    );
    if (input.analysisId && !analysis?.report.pageBlueprint) {
      throw new Error(
        "Diese ältere Analyse enthält noch keinen vollständigen KI-Blueprint. Bitte eine neue SEO-Analyse starten.",
      );
    }
    if (analysis?.report.pageBlueprint) {
      const draft = await generatePageFromSeoBlueprint({
        cityName: input.cityName,
        pageLabel: `Stadtseite ${input.cityName}`,
        image: input.currentImage,
        imageAlt: input.currentImageAlt,
        report: analysis.report,
        blueprint: analysis.report.pageBlueprint,
        deadlineAt,
        verifiedClaims: [
          "kostenlose und unverbindliche Anfrage",
          "persönliche Planung",
          "kombinierbare Leistungen",
        ],
      });
      return NextResponse.json({
        success: true,
        draft,
        usedAnalysis: true,
        promptCount: Math.max(
          1,
          Math.ceil(analysis.report.pageBlueprint.recommendedWordCount / 1_000),
        ),
      });
    }
    const keywords = [...new Set([...input.keywords, ...(analysis?.keywords ?? [])])];
    const copy = await generateCopy({
      cityName: input.cityName,
      keywords,
      analysis,
      deadlineAt,
    });
    const seo: CityServiceSeoSettings = {
      ...copy.seo,
      image: input.currentImage,
      imageAlt: input.currentImageAlt,
    };
    const draft: GeneratedCityPageDraft = {
      blocks: createBlocks(
        input.cityName,
        input.currentImage,
        input.currentImageAlt,
        copy,
      ),
      seo,
      strategy: copy.strategy,
    };
    return NextResponse.json({ success: true, draft, usedAnalysis: Boolean(analysis) });
  } catch (error) {
    console.error("City page generation error", error);
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
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Die Stadtseite konnte nicht erstellt werden",
      },
      { status: 500 },
    );
  }
}
