import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { API_WORK_BUDGET_MS, remainingApiTime } from "@/lib/apiDeadline";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  GeminiInvalidJsonError,
  generateGeminiJson,
} from "@/lib/gemini";
import { discoverSeoSearchResults } from "@/lib/googleSeoSearch";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import { analyzeSeoPage } from "@/lib/seoPageAnalyzer";
import { slugify } from "@/utils/slugify";
import type {
  SeoAiReport,
  SeoAnalysisRun,
  SeoPageMetrics,
} from "@/types/city/SeoAnalysis";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  ownerId: z.string().min(1).max(200),
  citySlug: z.string().min(1).max(200),
  pageKey: z.string().min(1).max(400),
  targetUrl: z.string().url(),
  keyword: z.string().trim().min(1).max(150),
  keywords: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});

const reportSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).max(6),
  competitorAdvantages: z.array(z.string()).max(6),
  recommendations: z.array(
    z.object({
      priority: z.enum(["hoch", "mittel", "niedrig"]),
      area: z.string(),
      finding: z.string(),
      action: z.string(),
      competitorExample: z
        .string()
        .nullish()
        .transform((value) => value ?? undefined),
    })
  ).max(10),
  suggestedTitle: z.string(),
  suggestedMetaDescription: z.string(),
  suggestedH1: z.string(),
  contentOutline: z.array(
    z.object({
      heading: z.string(),
      goal: z.string(),
      keywords: z.array(z.string()),
    })
  ).max(12),
  suggestedFaqs: z.array(
    z.object({ question: z.string(), answerGuidance: z.string() })
  ).max(10),
  pageBlueprint: z.object({
    searchIntent: z.string(),
    targetAudience: z.string(),
    primaryKeyword: z.string(),
    secondaryKeywords: z.array(z.string()).max(12),
    recommendedWordCount: z.number().int().min(750).max(5_000),
    tone: z.string(),
    sections: z.array(
      z.object({
        order: z.number().int().positive(),
        sectionType: z.string(),
        headingLevel: z.enum(["H1", "H2", "H3", "ohne Überschrift"]),
        heading: z.string(),
        purpose: z.string(),
        contentBrief: z.string(),
        keyPoints: z.array(z.string()).max(6),
        targetWordCount: z.number().int().min(50).max(1_000),
        keywords: z.array(z.string()).max(8),
        cta: z
          .string()
          .nullish()
          .transform((value) => value ?? undefined),
      })
    ).min(8).max(20),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    trustElements: z.array(z.string()).max(8),
    internalLinkSuggestions: z.array(
      z.object({
        anchorText: z.string(),
        targetPage: z.string(),
        sectionOrder: z.number().int().positive(),
      })
    ).max(12),
    schemaRecommendations: z.array(z.string()).max(6),
  }),
});

type BlogLinkCandidate = {
  title: string;
  url: string;
};

async function getPublishedBlogLinks(): Promise<BlogLinkCandidate[]> {
  const snapshot = await getAdminDatabase()
    .collection("blogPages_umzugshelden")
    .get();
  const links = snapshot.docs.flatMap((document) => {
    const data = document.data();
    if (data.visible !== true || typeof data.titel !== "string") return [];
    const rawPath =
      typeof data.path === "string" && data.path.trim()
        ? data.path
        : [data.mainCategory, data.subcategorySlug, data.slug]
            .filter((part): part is string => typeof part === "string")
            .join("/");
    const path = rawPath
      .split("/")
      .map((part) => slugify(part.trim().toLocaleLowerCase("de")))
      .filter(Boolean)
      .join("/");
    if (!path) return [];
    return [{ title: data.titel.trim(), url: `/blog/${path}` }];
  });

  return links
    .filter(
      (link, index) =>
        links.findIndex((candidate) => candidate.url === link.url) === index,
    )
    .sort((left, right) => left.title.localeCompare(right.title, "de"));
}

function serializeRun(
  id: string,
  data: FirebaseFirestore.DocumentData
): SeoAnalysisRun {
  const createdAtValue = data.createdAt;
  const createdAt =
    typeof createdAtValue?.toDate === "function"
      ? createdAtValue.toDate().toISOString()
      : new Date().toISOString();
  return {
    id,
    ownerId: data.ownerId,
    citySlug: data.citySlug,
    urls: data.urls,
    keywords: data.keywords,
    pages: data.pages,
    failures: data.failures ?? [],
    report: data.report,
    targetRank:
      typeof data.targetRank === "number" ? data.targetRank : undefined,
    createdAt,
  };
}

async function createAiReport(
  citySlug: string,
  pageKey: string,
  keywords: string[],
  pages: SeoPageMetrics[],
  targetUrl: string,
  blogLinks: BlogLinkCandidate[],
  deadlineAt: number,
): Promise<SeoAiReport> {
  const parsed = await generateGeminiJson({
    temperature: 0.2,
    timeoutMs: remainingApiTime(deadlineAt),
    maxOutputTokens: 6_144,
    thinkingBudget: 0,
    systemInstruction:
      `Du bist ein erfahrener deutscher SEO-, Content- und Conversion-Berater.
targetUrl bezeichnet die zu optimierende Seite, alle anderen URLs sind Wettbewerber.
Falls für targetUrl wegen eines Abruffehlers keine Messwerte vorhanden sind, benenne diese Einschränkung und behandle keine Wettbewerberseite als Zielseite.
Vergleiche ausschließlich die gelieferten Messwerte und erfinde keine gemessenen Eigenschaften.

Erstelle zusätzlich zu Analyse und Empfehlungen eine vollständige, direkt umsetzbare Seitenarchitektur für das bestmögliche SEO- und Conversion-Ergebnis:
- Erstelle in diesem Schritt nur die grobe Seitenstruktur und detaillierte Content-Briefings, noch keine ausformulierten Seitentexte.
- Leite Suchintention, Zielgruppe, primäres Keyword, Nebenkeywords, Tonalität und sinnvollen Gesamtumfang ab.
- Plane die gesamte Seite vom Hero bis zum Abschluss-CTA in einer logischen Reihenfolge.
- Nutze genau eine H1 und eine saubere H2-/H3-Hierarchie.
- Plane je Abschnitt Typ, Zweck, detailliertes Content-Briefing, konkrete Kernpunkte, Zielwortzahl, Keywords und gegebenenfalls CTA.
- Berücksichtige lokale Relevanz, Leistungen, Prozess, Vorteile, Vertrauen, Social Proof, FAQ und Conversion-Elemente, sofern sie zur Seite passen.
- Der Prompt enthält den vollständigen Katalog der aktuell veröffentlichten Blogartikel. Wähle daraus nur thematisch passende interne Links aus.
- Verwende für interne Links ausschließlich unveränderte URLs aus availableBlogLinks. Erfinde keine Linkziele.
- Ordne jeden Link über sectionOrder genau dem Abschnitt zu, in dem er später natürlich und hilfreich eingebaut werden soll.
- Plane interne Links nutzerorientiert als Vertiefung konkreter Aussagen und nicht als isolierte Linkliste.
- Gib konkrete Vertrauenselemente und geeignete Schema.org-Typen an.
- Erstelle mindestens 8 substanzielle Seitenabschnitte. Vermeide generische oder doppelte Abschnitte.
- Halte den JSON-Report kompakt: höchstens 6 Stärken, 6 Wettbewerbsvorteile, 10 Empfehlungen, 10 FAQ, 12 Nebenkeywords, 8 Vertrauenselemente und 12 interne Links.
- Formuliere Analysefelder prägnant. Verwende pro Kernpunkt und Empfehlung höchstens zwei kurze Sätze.
- Formuliere alles auf Deutsch, konkret für die übergebene Seite und ohne Erfolgsgarantien.
${pageKey.endsWith("/anstricharbeiten") ? `- Sonderregel Anstricharbeiten: Bezeichne das Unternehmen niemals als Malerbetrieb, Malerfachbetrieb, Malermeister oder Meisterbetrieb.
- Plane ausschließlich zulassungsfreie Anstricharbeiten und Schönheitsreparaturen ohne meisterpflichtige Tätigkeiten.` : ""}

Antworte nur als JSON passend zu diesem Schema:
{
  summary:string,
  strengths:string[],
  competitorAdvantages:string[],
  recommendations:{priority:'hoch'|'mittel'|'niedrig',area:string,finding:string,action:string,competitorExample?:string}[],
  suggestedTitle:string,
  suggestedMetaDescription:string,
  suggestedH1:string,
  contentOutline:{heading:string,goal:string,keywords:string[]}[],
  suggestedFaqs:{question:string,answerGuidance:string}[],
  pageBlueprint:{
    searchIntent:string,
    targetAudience:string,
    primaryKeyword:string,
    secondaryKeywords:string[],
    recommendedWordCount:number,
    tone:string,
    sections:{
      order:number,
      sectionType:string,
      headingLevel:'H1'|'H2'|'H3'|'ohne Überschrift',
      heading:string,
      purpose:string,
      contentBrief:string,
      keyPoints:string[],
      targetWordCount:number,
      keywords:string[],
      cta?:string
    }[],
    primaryCta:string,
    secondaryCta:string,
    trustElements:string[],
    internalLinkSuggestions:{anchorText:string,targetPage:string,sectionOrder:number}[],
    schemaRecommendations:string[]
  }
}`,
    prompt: JSON.stringify({
      citySlug,
      targetUrl,
      targetKeywords: keywords,
      pages,
      availableBlogLinks: blogLinks,
    }),
  });
  return reportSchema.parse(parsed);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") ?? "";
  const citySlug = url.searchParams.get("citySlug") ?? "";
  const pageKey = url.searchParams.get("pageKey") ?? citySlug;
  if (!ownerId || !citySlug || !pageKey) {
    return NextResponse.json({ success: false, error: "Parameter fehlen" }, { status: 400 });
  }
  try {
    if (!(await authorizeAdminOwnerOrCron(request, ownerId))) {
      return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
    }
    const snapshot = await getAdminDatabase()
      .collection("seoAnalyses")
      .where("ownerId", "==", ownerId)
      .where("pageKey", "==", pageKey)
      .limit(20)
      .get();
    const runs = snapshot.docs
      .map((document) => serializeRun(document.id, document.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
    return NextResponse.json({ success: true, runs });
  } catch (error) {
    console.error("SEO analysis history error", error);
    return NextResponse.json(
      { success: false, error: "Gespeicherte Analysen konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const deadlineAt = Date.now() + API_WORK_BUDGET_MS;
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch (error) {
    console.warn("Invalid SEO analysis request", error);
    return NextResponse.json(
      { success: false, error: "Ziel-URL oder Hauptkeyword ist ungültig" },
      { status: 400 },
    );
  }

  try {
    if (!(await authorizeAdminOwnerOrCron(request, input.ownerId))) {
      return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
    }
    const targetUrl = new URL(input.targetUrl).toString();
    const [searchDiscovery, blogLinks] = await Promise.all([
      discoverSeoSearchResults(input.keyword, targetUrl, 5),
      getPublishedBlogLinks(),
    ]);
    const competitorUrls = searchDiscovery.competitorUrls;
    const uniqueUrls = [targetUrl, ...competitorUrls];
    const keywords = [
      ...new Set(
        [input.keyword, ...input.keywords].map((keyword) =>
          keyword.toLocaleLowerCase("de"),
        ),
      ),
    ];
    const pageResults = await Promise.allSettled(
      uniqueUrls.map((url) => analyzeSeoPage(url, keywords)),
    );
    const pages: SeoPageMetrics[] = [];
    const failures: Array<{ url: string; error: string }> = [];
    pageResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        pages.push(result.value);
        return;
      }
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : "Die Seite konnte nicht abgerufen werden";
      failures.push({ url: uniqueUrls[index], error: reason });
      console.warn("SEO page skipped", uniqueUrls[index], reason);
    });
    if (!pages.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Keine der angegebenen URLs konnte analysiert werden",
          failures,
        },
        { status: 422 },
      );
    }
    const report = await createAiReport(
      input.citySlug,
      input.pageKey,
      keywords,
      pages,
      uniqueUrls[0],
      blogLinks,
      deadlineAt,
    );
    const document = await getAdminDatabase().collection("seoAnalyses").add({
      ownerId: input.ownerId,
      citySlug: input.citySlug,
      pageKey: input.pageKey,
      urls: uniqueUrls,
      keywords,
      pages,
      failures,
      report,
      targetRank: searchDiscovery.targetRank ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    const run: SeoAnalysisRun = {
      id: document.id,
      ownerId: input.ownerId,
      citySlug: input.citySlug,
      urls: uniqueUrls,
      keywords,
      pages,
      failures,
      report,
      targetRank: searchDiscovery.targetRank,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, run });
  } catch (error) {
    const isRetryableAiError =
      error instanceof GeminiInvalidJsonError ||
      (error instanceof Error &&
        error.message.includes("Zeitlimit überschritten"));
    if (isRetryableAiError) {
      console.warn("SEO analysis deferred after retryable Gemini response");
      return NextResponse.json(
        {
          success: false,
          retryable: true,
          error:
            error instanceof GeminiInvalidJsonError
              ? "Die KI-Antwort war unvollständig und wird automatisch neu erzeugt."
              : "Die KI-Auswertung benötigt einen weiteren Cron-Lauf und wird automatisch erneut versucht.",
        },
        { status: 503 },
      );
    }
    console.error("SEO analysis error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Die KI-Auswertung hatte ein ungültiges Format" },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "SEO-Analyse fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
