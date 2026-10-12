import "server-only";

import { z } from "zod";
import { remainingApiTime } from "@/lib/apiDeadline";
import { generateGeminiJson } from "@/lib/gemini";
import type { GeneratedCityPageDraft } from "@/types/city/CityPageGeneration";
import type {
  SeoAiReport,
  SeoPageBlueprint,
  SeoPageBlueprintSection,
} from "@/types/city/SeoAnalysis";
import type {
  CityServiceBlock,
  CityServiceBlockTone,
  CityServiceKey,
} from "@/types/city/CityServicePage";
import {
  enforceCityServiceContentPolicy,
  mergePreservedBuilderBlocks,
  serviceGenerationRules,
} from "@/lib/cityServiceContentPolicy";

const generatedSectionSchema = z.object({
  order: z.number().int().positive(),
  blockType: z.enum([
    "hero",
    "text",
    "cards",
    "checklist",
    "process",
    "pricing",
    "faq",
    "cta",
    "contact",
  ]),
  heading: z.string().trim().min(1).max(500),
  body: z.string().trim().max(20_000).optional().default(""),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(500),
        text: z.string().trim().min(1).max(5_000),
      }),
    )
    .max(12)
    .default([]),
  steps: z.array(z.string().trim().min(1).max(5_000)).max(10).default([]),
  faqItems: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(500),
        answer: z.string().trim().min(1).max(5_000),
      }),
    )
    .max(12)
    .default([]),
  cta: z
    .object({
      title: z.string().trim().min(1).max(500),
      text: z.string().trim().min(1).max(5_000),
      label: z.string().trim().min(1).max(100),
    })
    .optional(),
});

const generatedChunkSchema = z.object({
  sections: z.array(generatedSectionSchema).min(1),
});

type GeneratedSection = z.infer<typeof generatedSectionSchema>;

type GenerateBlueprintPageInput = {
  cityName: string;
  pageLabel: string;
  image: string;
  imageAlt: string;
  report: SeoAiReport;
  blueprint: SeoPageBlueprint;
  verifiedClaims: string[];
  serviceKey?: CityServiceKey;
  currentBlocks?: CityServiceBlock[];
  deadlineAt?: number;
};

function countWords(value: unknown): number {
  if (typeof value === "string") {
    return value.trim() ? value.trim().split(/\s+/u).length : 0;
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countWords(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce(
      (total, item) => total + countWords(item),
      0,
    );
  }
  return 0;
}

function splitSections(
  sections: SeoPageBlueprintSection[],
  recommendedWordCount: number,
) {
  const chunkCount = Math.max(1, Math.ceil(recommendedWordCount / 1_000));
  const chunks: SeoPageBlueprintSection[][] = [];
  let cursor = 0;

  for (let index = 0; index < chunkCount && cursor < sections.length; index += 1) {
    const remainingSections = sections.length - cursor;
    const remainingChunks = Math.min(chunkCount - index, remainingSections);
    const desiredSize = Math.ceil(remainingSections / remainingChunks);
    chunks.push(sections.slice(cursor, cursor + desiredSize));
    cursor += desiredSize;
  }

  return chunks;
}

async function generateChunk(input: {
  chunkIndex: number;
  chunkCount: number;
  targetWords: number;
  sections: SeoPageBlueprintSection[];
  pageLabel: string;
  cityName: string;
  blueprint: SeoPageBlueprint;
  report: SeoAiReport;
  verifiedClaims: string[];
  serviceKey?: CityServiceKey;
  retryReason?: string;
  deadlineAt?: number;
  internalLinks: Array<{
    anchorText: string;
    targetPage: string;
    sectionOrder?: number;
  }>;
}): Promise<GeneratedSection[]> {
  const generated = await generateGeminiJson({
    temperature: 0.35,
    timeoutMs: input.deadlineAt
      ? remainingApiTime(input.deadlineAt)
      : undefined,
    systemInstruction: `Du bist Senior SEO- und Conversion-Copywriter für deutsche lokale Dienstleistungsseiten.
Du schreibst einen zusammenhängenden Teil einer größeren Seite exakt nach einem vorgegebenen SEO-Blueprint.

Verbindliche Regeln:
- Erzeuge ausschließlich die übergebenen Abschnitte und behalte deren order-Werte und Reihenfolge exakt bei.
- Der gesamte sichtbare Text dieses Pakets muss zwischen 750 und 1.000 Wörtern liegen.
- Orientiere dich möglichst genau an targetWords.
- Setze Zweck, Content-Briefing, Kernpunkte, Keywords und CTA jedes Abschnitts vollständig um.
- Schreibe conversion-stark: Beantworte die Suchintention konkret, reduziere Einwände, schaffe Vertrauen und führe natürlich zur passenden Handlungsaufforderung.
- Schreibe natürliches, hilfreiches und seriöses Deutsch in direkter Sie-Ansprache.
- Vermeide Keyword-Stuffing, Wiederholungen, Floskeln und überlange Einleitungen.
- Erfinde keine Preise, Bewertungen, Auszeichnungen, Garantien, Standorte, Referenzen oder Unternehmensdaten.
- Verwende ausschließlich die gelieferten verifiedClaims als Unternehmensbehauptungen.
- Kopiere keine Formulierungen von Wettbewerbern.
- Wähle blockType passend zum Abschnitt. Der erste H1-Abschnitt muss "hero" sein.
- body enthält den ausformulierten Fließtext. Nutze items für Karten/Listen, steps für Abläufe, faqItems für FAQ und cta für Handlungsaufforderungen.
- Inhalte in items, steps, faqItems und cta zählen zur geforderten Wortzahl.
- Baue jeden Eintrag aus internalLinks genau einmal in den zugeordneten Abschnitt ein.
- Formatiere interne Links exakt als Markdown: [anchorText](targetPage). Verändere weder anchorText noch targetPage.
- Integriere Links kontextuell in hilfreiche Sätze. Erzeuge keine separate Linkliste und erfinde keine weiteren URLs.
- Verwende keine Markdown-Überschriften wie #, ## oder ### in heading, body oder anderen Textfeldern.
- Gib niemals einen Link nur als [anchorText] ohne unmittelbar folgende Ziel-URL aus.

Antworte ausschließlich als JSON:
{
  "sections":[{
    "order":number,
    "blockType":"hero"|"text"|"cards"|"checklist"|"process"|"pricing"|"faq"|"cta"|"contact",
    "heading":string,
    "body":string,
    "items":{"title":string,"text":string}[],
    "steps":string[],
    "faqItems":{"question":string,"answer":string}[],
    "cta"?:{"title":string,"text":string,"label":string}
  }]
}`,
      prompt: JSON.stringify({
        task: `Textpaket ${input.chunkIndex + 1} von ${input.chunkCount}`,
        targetWords: input.targetWords,
        requiredWordRange: { min: 750, max: 1_000 },
        page: input.pageLabel,
        city: input.cityName,
        strategy: {
          searchIntent: input.blueprint.searchIntent,
          targetAudience: input.blueprint.targetAudience,
          primaryKeyword: input.blueprint.primaryKeyword,
          secondaryKeywords: input.blueprint.secondaryKeywords,
          tone: input.blueprint.tone,
          primaryCta: input.blueprint.primaryCta,
          secondaryCta: input.blueprint.secondaryCta,
        },
        sectionsToWrite: input.sections,
        suggestedFaqs: input.report.suggestedFaqs,
        internalLinks: input.internalLinks,
        verifiedClaims: input.verifiedClaims,
        serviceRules: input.serviceKey
          ? serviceGenerationRules(input.serviceKey)
          : [],
        correction: input.retryReason,
      }),
    });
  const result = generatedChunkSchema.safeParse(generated);
  if (!result.success) {
    const reason = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "Antwort"}: ${issue.message}`)
      .join("; ");
    if (!input.retryReason) {
      return generateChunk({
        ...input,
        retryReason: `Die JSON-Struktur war unvollständig: ${reason}`,
      });
    }
    throw new Error(
      `KI-Textpaket ${input.chunkIndex + 1} war auch nach der Korrektur unvollständig: ${reason}`,
    );
  }
  const parsed = result.data;

  const expectedOrders = input.sections.map((section) => section.order);
  const actualOrders = parsed.sections.map((section) => section.order);
  const allSectionsPresent =
    expectedOrders.length === actualOrders.length &&
    expectedOrders.every((order, index) => order === actualOrders[index]);
  const wordCount = countWords(parsed.sections);
  const serializedSections = JSON.stringify(parsed.sections);
  const missingInternalLinks = input.internalLinks.filter(
    (link) => !serializedSections.includes(`](${link.targetPage})`),
  );

  if (
    !allSectionsPresent ||
    wordCount < 750 ||
    wordCount > 1_000 ||
    missingInternalLinks.length
  ) {
    if (!input.retryReason) {
      const reason = !allSectionsPresent
        ? "Nicht alle vorgegebenen Abschnitte wurden in der richtigen Reihenfolge geliefert."
        : missingInternalLinks.length
          ? `Diese geplanten internen Links fehlen: ${missingInternalLinks
              .map((link) => link.targetPage)
              .join(", ")}.`
        : `Das erste Ergebnis hatte ${wordCount} statt 750 bis 1.000 Wörter.`;
      return generateChunk({ ...input, retryReason: reason });
    }
    throw new Error(
      `KI-Textpaket ${input.chunkIndex + 1} konnte nicht mit 750 bis 1.000 Wörtern erstellt werden.`,
    );
  }

  return parsed.sections;
}

function joinedBody(section: GeneratedSection) {
  const itemText = section.items
    .map((item) => `${item.title}: ${item.text}`)
    .join("\n\n");
  const stepText = section.steps.join("\n");
  const faqText = section.faqItems
    .map((item) => `${item.question}\n${item.answer}`)
    .join("\n\n");
  return [section.body, itemText, stepText, faqText]
    .filter(Boolean)
    .join("\n\n");
}

function blockTone(index: number): CityServiceBlockTone {
  return index % 2 === 0 ? "white" : "muted";
}

function createBlock(
  section: GeneratedSection,
  index: number,
  input: GenerateBlueprintPageInput,
): CityServiceBlock {
  const id = `ai-${section.order}-${section.blockType}`;
  const tone = blockTone(index);
  const cta = section.cta;

  if (section.blockType === "hero" || index === 0) {
    return {
      id,
      type: "hero",
      enabled: true,
      tone: "navy",
      title: section.heading,
      description: joinedBody(section),
      image: input.image,
      imageAlt: input.imageAlt,
      formTitle: cta?.title || "Jetzt kostenlos anfragen",
      formText: cta?.text || input.blueprint.primaryCta,
    };
  }

  if (section.blockType === "cards" && section.items.length >= 2) {
    return {
      id,
      type: "cardGrid",
      enabled: true,
      tone,
      heading: section.heading,
      intro: section.body,
      cards: section.items,
      columns: section.items.length >= 3 ? 3 : 2,
      numbered: false,
    };
  }

  if (section.blockType === "checklist" && section.items.length >= 2) {
    return {
      id,
      type: "checkList",
      enabled: true,
      tone,
      heading: section.heading,
      intro: section.body,
      items: section.items.map((item) => `${item.title}: ${item.text}`),
      columns: 2,
    };
  }

  if (section.blockType === "process" && section.steps.length >= 2) {
    return {
      id,
      type: "process",
      enabled: true,
      tone,
      heading: section.heading,
      intro: section.body,
      steps: section.steps,
    };
  }

  if (section.blockType === "pricing") {
    return {
      id,
      type: "pricing",
      enabled: true,
      tone,
      heading: section.heading,
      text: section.body,
      factors: section.items.map((item) => `${item.title}: ${item.text}`),
      ctaTitle: cta?.title || "Individuelles Angebot erhalten",
      ctaText: cta?.text || input.blueprint.primaryCta,
      ctaLabel: cta?.label || "Kostenlos anfragen",
    };
  }

  if (section.blockType === "faq" && section.faqItems.length >= 2) {
    return {
      id,
      type: "faq",
      enabled: true,
      tone,
      heading: section.heading,
      items: section.faqItems,
      includeLocalQuestion: false,
    };
  }

  if (section.blockType === "cta") {
    return {
      id,
      type: "cta",
      enabled: true,
      tone: "navy",
      heading: cta?.title || section.heading,
      text: [section.body, cta?.text].filter(Boolean).join("\n\n"),
      primaryLabel: cta?.label || "Kostenlos anfragen",
      primaryUrl: "#kontakt",
    };
  }

  if (section.blockType === "contact") {
    return {
      id,
      type: "contact",
      enabled: true,
      tone: "accent",
      heading: section.heading,
      text: joinedBody(section),
      showPhone: true,
      showEmail: true,
      showForm: true,
    };
  }

  return {
    id,
    type: "intro",
    enabled: true,
    tone,
    headingLevel: section.order === 1 ? 2 : 2,
    heading: section.heading,
    text: joinedBody(section),
  };
}

export async function generatePageFromSeoBlueprint(
  input: GenerateBlueprintPageInput,
): Promise<GeneratedCityPageDraft> {
  const chunks = splitSections(
    input.blueprint.sections,
    input.blueprint.recommendedWordCount,
  );
  const targetWords = Math.max(
    750,
    Math.min(1_000, Math.round(input.blueprint.recommendedWordCount / chunks.length)),
  );
  const generatedChunks = await Promise.all(
    chunks.map((sections, chunkIndex) => {
      const sectionOrders = new Set(sections.map((section) => section.order));
      const internalLinks = input.blueprint.internalLinkSuggestions.filter(
        (link) =>
          typeof link.sectionOrder === "number"
            ? sectionOrders.has(link.sectionOrder)
            : chunkIndex === 0,
      );
      return generateChunk({
        chunkIndex,
        chunkCount: chunks.length,
        targetWords,
        sections,
        pageLabel: input.pageLabel,
        cityName: input.cityName,
        blueprint: input.blueprint,
        report: input.report,
        verifiedClaims: input.verifiedClaims,
        serviceKey: input.serviceKey,
        deadlineAt: input.deadlineAt,
        internalLinks,
      });
    }),
  );
  const generatedSections = generatedChunks.flat();

  const generatedDraft: GeneratedCityPageDraft = {
    blocks: mergePreservedBuilderBlocks(
      generatedSections.map((section, index) =>
      createBlock(section, index, input),
      ),
      input.currentBlocks ?? [],
    ),
    seo: {
      title: input.report.suggestedTitle,
      description: input.report.suggestedMetaDescription,
      image: input.image,
      imageAlt: input.imageAlt,
      schemaDescription: input.report.summary,
      keywords: [
        input.blueprint.primaryKeyword,
        ...input.blueprint.secondaryKeywords,
      ].filter((keyword, index, keywords) => keywords.indexOf(keyword) === index),
    },
    strategy: {
      primaryKeyword: input.blueprint.primaryKeyword,
      searchIntent: input.blueprint.searchIntent,
      conversionGoal: input.blueprint.primaryCta,
      differentiators: input.blueprint.trustElements,
    },
  };
  return input.serviceKey
    ? enforceCityServiceContentPolicy(input.serviceKey, generatedDraft)
    : generatedDraft;
}
