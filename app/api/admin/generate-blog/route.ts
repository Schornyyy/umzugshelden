import { NextResponse } from "next/server";
import { z } from "zod";
import { API_WORK_BUDGET_MS, remainingApiTime } from "@/lib/apiDeadline";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
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
export const maxDuration = 30;

const WORKFLOW_COLLECTION = "blogGenerationWorkflows";
const PROPOSAL_COLLECTION = "blogGenerationProposals";
const ROTATION_COLLECTION = "blogGenerationRotation";
const BLOG_COLLECTION = "blogPages_umzugshelden";
const SUBCATEGORY_COLLECTION = "blogSubcategories_umzugshelden";
const IMAGE_PLACEHOLDER = "/images/image.png";

const requestSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  serviceKey: z.enum(CITY_SERVICE_KEYS).optional(),
  workflowId: z.string().trim().min(1).max(200).optional(),
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

async function loadBlogCatalog() {
  const snapshot = await getAdminDatabase().collection(BLOG_COLLECTION).get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      title: String(data.titel || ""),
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      cityName: typeof data.cityName === "string" ? data.cityName : undefined,
      serviceKey:
        typeof data.serviceKey === "string" ? data.serviceKey : undefined,
      url: `/blog/${String(data.path || "")}`,
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
    const database = getAdminDatabase();
    const catalog = await loadBlogCatalog();
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
      let selectedServiceKey: CityServiceKey = CITY_SERVICE_KEYS[0];
      const rotationReference = database
        .collection(ROTATION_COLLECTION)
        .doc(encodeURIComponent(input.ownerId.trim().toLowerCase()));
      await database.runTransaction(async (transaction) => {
        const rotationDocument = await transaction.get(rotationReference);
        const currentIndex =
          typeof rotationDocument.get("nextServiceIndex") === "number"
            ? rotationDocument.get("nextServiceIndex")
            : 0;
        const normalizedIndex =
          ((currentIndex % CITY_SERVICE_KEYS.length) +
            CITY_SERVICE_KEYS.length) %
          CITY_SERVICE_KEYS.length;
        selectedServiceKey = CITY_SERVICE_KEYS[normalizedIndex];
        transaction.set(
          rotationReference,
          {
            ownerId: input.ownerId,
            nextServiceIndex:
              (normalizedIndex + 1) % CITY_SERVICE_KEYS.length,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      });
      const usedCities = new Set(
        [
          ...catalog
            .filter((page) => page.serviceKey === selectedServiceKey)
            .map((page) => page.cityName),
          ...workflowSnapshot.docs
            .filter(
              (document) =>
                document.get("serviceKey") === selectedServiceKey,
            )
            .map((document) => document.get("cityName")),
          ...proposalSnapshot.docs
            .filter(
              (document) =>
                document.get("serviceKey") === selectedServiceKey,
            )
            .map((document) => document.get("cityName")),
        ].filter((city): city is string => typeof city === "string"),
      );
      const cityName =
        rawCities.find((city) => !usedCities.has(city)) || rawCities[0];
      const mainCategory = categoryForService(selectedServiceKey);
      const subcategorySlug = await chooseSubcategory(mainCategory);
      await workflowReference.set({
        ownerId: input.ownerId,
        serviceKey: selectedServiceKey,
        cityName,
        mainCategory,
        subcategorySlug,
        stage: "keyword",
        rejectedKeywords: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workflowDocument = await workflowReference.get();
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
      if (!keywordResult.success) {
        const correction = zodCorrection(keywordResult.error);
        await workflowReference.update({
          validationFeedback: correction,
          retryCount: Number(workflow.retryCount || 0) + 1,
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
      const generated = keywordResult.data;
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
      if (!pages.length) {
        throw new Error("Die Top-5-Seiten konnten nicht analysiert werden.");
      }
      await workflowReference.update({
        competitorPages: pages,
        regionalResourceCandidates: disposalSearch.competitorUrls,
        stage: "content",
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: true,
        workflowId: workflowReference.id,
        stage: "content",
        message: "Google-Top-5 wurden analysiert.",
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
          const correction = zodCorrection(auditResult.error);
          await workflowReference.update({
            validationFeedback: correction,
            retryCount: Number(workflow.retryCount || 0) + 1,
            updatedAt: Date.now(),
          });
          return NextResponse.json({
            success: true,
            pending: true,
            workflowId: workflowReference.id,
            stage: "links",
            message: "Die internen Links werden automatisch korrigiert.",
          });
        }
        const audit = auditResult.data;
        linkedContent = applyAuditedLinks(
          generated,
          audit.links,
          allowedUrls,
        );
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
      await proposalReference.set({
        ownerId: input.ownerId,
        status: "pending",
        serviceKey,
        cityName,
        keyword: workflow.keyword,
        draft,
        createdAt: Date.now(),
      });
      await workflowReference.update({
        stage: "completed",
        proposalId: proposalReference.id,
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        success: true,
        pending: false,
        workflowId: workflowReference.id,
        proposalId: proposalReference.id,
        stage: "completed",
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
