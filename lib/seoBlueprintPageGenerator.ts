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

const internalLinkPlanSchema = z.object({
  placements: z.array(
    z.object({
      sectionOrder: z.number().int().positive(),
      anchorText: z.string().trim().min(1).max(200),
      targetPage: z.string().trim().min(1).max(2_048),
      sentence: z.string().trim().min(1).max(1_000),
    }),
  ).max(12),
});

const seoQualitySchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(2_000),
  issues: z.array(
    z.object({
      sectionOrder: z.number().int().positive(),
      severity: z.enum(["hoch", "mittel", "niedrig"]),
      problem: z.string().trim().min(1).max(1_000),
      instruction: z.string().trim().min(1).max(2_000),
    }),
  ).max(12),
});

export type GeneratedSeoSection = z.infer<typeof generatedSectionSchema>;
export type SeoQualityAssessment = z.infer<typeof seoQualitySchema>;

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
  minWords?: number;
  maxWords?: number;
  internalLinks: Array<{
    anchorText: string;
    targetPage: string;
    sectionOrder?: number;
  }>;
}): Promise<GeneratedSeoSection[]> {
  const minWords = input.minWords ?? 750;
  const maxWords = input.maxWords ?? 1_000;
  const generated = await generateGeminiJson({
    temperature: 0.35,
    maxOutputTokens: 8_192,
    thinkingBudget: 0,
    timeoutMs: input.deadlineAt
      ? remainingApiTime(input.deadlineAt)
      : undefined,
    systemInstruction: `Du bist Senior SEO- und Conversion-Copywriter für deutsche lokale Dienstleistungsseiten.
Du schreibst einen zusammenhängenden Teil einer größeren Seite exakt nach einem vorgegebenen SEO-Blueprint.

Verbindliche Regeln:
- Erzeuge ausschließlich die übergebenen Abschnitte und behalte deren order-Werte und Reihenfolge exakt bei.
- Der gesamte sichtbare Text dieses Pakets muss zwischen ${minWords} und ${maxWords} Wörtern liegen.
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
        requiredWordRange: { min: minWords, max: maxWords },
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
    wordCount < minWords ||
    wordCount > maxWords ||
    missingInternalLinks.length
  ) {
    if (!input.retryReason) {
      const reason = !allSectionsPresent
        ? "Nicht alle vorgegebenen Abschnitte wurden in der richtigen Reihenfolge geliefert."
        : missingInternalLinks.length
          ? `Diese geplanten internen Links fehlen: ${missingInternalLinks
              .map((link) => link.targetPage)
              .join(", ")}.`
        : `Das erste Ergebnis hatte ${wordCount} statt ${minWords} bis ${maxWords} Wörter.`;
      return generateChunk({ ...input, retryReason: reason });
    }
    throw new Error(
      `KI-Textpaket ${input.chunkIndex + 1} konnte nicht mit ${minWords} bis ${maxWords} Wörtern erstellt werden.`,
    );
  }

  return parsed.sections;
}

function joinedBody(section: GeneratedSeoSection) {
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
  section: GeneratedSeoSection,
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

export async function generateSeoBlueprintSection(input: {
  section: SeoPageBlueprintSection;
  sectionIndex: number;
  sectionCount: number;
  pageLabel: string;
  cityName: string;
  blueprint: SeoPageBlueprint;
  report: SeoAiReport;
  verifiedClaims: string[];
  serviceKey?: CityServiceKey;
  deadlineAt?: number;
  correction?: string;
}): Promise<GeneratedSeoSection> {
  const targetWords = Math.max(90, Math.min(500, input.section.targetWordCount));
  const minWords = Math.max(70, Math.round(targetWords * 0.7));
  const maxWords = Math.max(minWords + 40, Math.round(targetWords * 1.4));
  const sections = await generateChunk({
    chunkIndex: input.sectionIndex,
    chunkCount: input.sectionCount,
    targetWords,
    minWords,
    maxWords,
    sections: [input.section],
    pageLabel: input.pageLabel,
    cityName: input.cityName,
    blueprint: input.blueprint,
    report: input.report,
    verifiedClaims: input.verifiedClaims,
    serviceKey: input.serviceKey,
    deadlineAt: input.deadlineAt,
    retryReason: input.correction,
    internalLinks: [],
  });
  return sections[0];
}

export function createFallbackSeoSection(
  section: SeoPageBlueprintSection,
): GeneratedSeoSection {
  const body = [
    section.contentBrief,
    ...section.keyPoints,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    order: section.order,
    blockType:
      section.sectionType === "hero"
        ? "hero"
        : section.sectionType === "faq"
          ? "faq"
          : section.sectionType === "contact"
            ? "contact"
            : "text",
    heading: section.heading,
    body,
    items: [],
    steps: [],
    faqItems: [],
    cta: section.cta
      ? {
          title: section.heading,
          text: section.cta,
          label: section.cta,
        }
      : undefined,
  };
}

export function buildPageFromSeoSections(
  input: GenerateBlueprintPageInput,
  generatedSections: GeneratedSeoSection[],
): GeneratedCityPageDraft {
  const orderedSections = [...generatedSections].sort(
    (left, right) => left.order - right.order,
  );
  const generatedDraft: GeneratedCityPageDraft = {
    blocks: mergePreservedBuilderBlocks(
      orderedSections.map((section, index) =>
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

export async function applySeoInternalLinkPass(input: {
  sections: GeneratedSeoSection[];
  blueprint: SeoPageBlueprint;
  pageLabel: string;
  deadlineAt?: number;
}): Promise<{
  sections: GeneratedSeoSection[];
  warning?: string;
}> {
  const allowedLinks = input.blueprint.internalLinkSuggestions;
  if (!allowedLinks.length) return { sections: input.sections };

  let placements: z.infer<typeof internalLinkPlanSchema>["placements"];
  let warning: string | undefined;
  try {
    const generated = await generateGeminiJson({
      temperature: 0.1,
      maxOutputTokens: 3_072,
      thinkingBudget: 0,
      timeoutMs: input.deadlineAt
        ? remainingApiTime(input.deadlineAt)
        : undefined,
      systemInstruction: `Du optimierst ausschließlich die interne Verlinkung einer fertigen deutschen Landingpage.
Wähle nur Links aus allowedLinks und nur tatsächlich vorhandene sectionOrder-Werte.
Erfinde keine URLs. Verwende jeden Ziel-Link höchstens einmal.
Formuliere pro Link genau einen kurzen, natürlichen Satz, der den angegebenen anchorText als Markdown-Link enthält.
Verändere oder bewerte den übrigen Seiteninhalt nicht.

Antworte ausschließlich als JSON:
{"placements":[{"sectionOrder":number,"anchorText":string,"targetPage":string,"sentence":string}]}`,
      prompt: JSON.stringify({
        page: input.pageLabel,
        sections: input.sections.map((section) => ({
          order: section.order,
          heading: section.heading,
          body: section.body,
        })),
        allowedLinks,
      }),
    });
    placements = internalLinkPlanSchema.parse(generated).placements;
  } catch (error) {
    console.warn("Internal link AI pass failed; using planned placements", error);
    warning =
      "Die interne Linkplatzierung wurde aus dem geprüften Seitenplan übernommen.";
    placements = allowedLinks.map((link, index) => ({
      sectionOrder:
        link.sectionOrder ??
        input.sections[Math.min(index, input.sections.length - 1)].order,
      anchorText: link.anchorText,
      targetPage: link.targetPage,
      sentence: `Weitere hilfreiche Informationen finden Sie unter [${link.anchorText}](${link.targetPage}).`,
    }));
  }

  const allowedTargets = new Set(allowedLinks.map((link) => link.targetPage));
  const sectionOrders = new Set(input.sections.map((section) => section.order));
  const validPlacements = placements.filter(
    (placement) =>
      allowedTargets.has(placement.targetPage) &&
      sectionOrders.has(placement.sectionOrder) &&
      placement.sentence.includes(`](${placement.targetPage})`),
  );
  const sections = input.sections.map((section) => {
    const additions = validPlacements
      .filter((placement) => placement.sectionOrder === section.order)
      .filter(
        (placement) =>
          !JSON.stringify(section).includes(`](${placement.targetPage})`),
      )
      .map((placement) => placement.sentence);
    return additions.length
      ? {
          ...section,
          body: [section.body, ...additions].filter(Boolean).join("\n\n"),
        }
      : section;
  });
  return { sections, warning };
}

export async function assessSeoPageQuality(input: {
  sections: GeneratedSeoSection[];
  blueprint: SeoPageBlueprint;
  report: SeoAiReport;
  pageLabel: string;
  deadlineAt?: number;
}): Promise<SeoQualityAssessment> {
  try {
    const generated = await generateGeminiJson({
      temperature: 0.1,
      maxOutputTokens: 4_096,
      thinkingBudget: 0,
      timeoutMs: input.deadlineAt
        ? remainingApiTime(input.deadlineAt)
        : undefined,
      systemInstruction: `Du bist der abschließende SEO-Qualitätsprüfer einer lokalen deutschen Landingpage.
Prüfe Suchintention, thematische Vollständigkeit, natürliche Keyword-Nutzung, lokale Relevanz, Redundanzen, Vertrauensaufbau, Conversion, interne Links und die Übereinstimmung mit dem Blueprint.
Erfinde keine Messwerte. Melde nur konkrete, im gelieferten Inhalt erkennbare Probleme.
Ordne jedes Problem exakt einer vorhandenen sectionOrder zu und formuliere eine direkt umsetzbare Reparaturanweisung.
Ein Score ab 85 bedeutet freigabefähig; darunter müssen die wichtigsten Sektionen gezielt repariert werden.

Antworte ausschließlich als JSON:
{"score":number,"summary":string,"issues":[{"sectionOrder":number,"severity":"hoch"|"mittel"|"niedrig","problem":string,"instruction":string}]}`,
      prompt: JSON.stringify({
        page: input.pageLabel,
        strategy: input.blueprint,
        recommendations: input.report.recommendations,
        sections: input.sections,
      }),
    });
    const assessment = seoQualitySchema.parse(generated);
    const orders = new Set(input.sections.map((section) => section.order));
    return {
      ...assessment,
      issues: assessment.issues.filter((issue) =>
        orders.has(issue.sectionOrder),
      ),
    };
  } catch (error) {
    console.warn("SEO quality AI pass failed; using structural assessment", error);
    const totalWords = countWords(input.sections);
    const missingLinks =
      input.blueprint.internalLinkSuggestions.length > 0 &&
      !input.sections.some((section) => section.body.includes("](/"));
    const issues: SeoQualityAssessment["issues"] = [];
    if (totalWords < Math.min(900, input.blueprint.recommendedWordCount * 0.75)) {
      issues.push({
        sectionOrder: input.sections[0].order,
        severity: "mittel",
        problem: "Der Gesamtumfang liegt unter dem geplanten Mindestumfang.",
        instruction: "Die wichtigsten konkreten Informationen substanziell ergänzen.",
      });
    }
    if (missingLinks) {
      issues.push({
        sectionOrder: input.sections[Math.min(1, input.sections.length - 1)].order,
        severity: "mittel",
        problem: "Die geplanten internen Links fehlen.",
        instruction: "Die freigegebenen internen Links kontextuell ergänzen.",
      });
    }
    return {
      score: issues.length ? 75 : 85,
      summary:
        "Strukturelle Qualitätsprüfung anhand von Umfang, Seitenplan und interner Verlinkung.",
      issues,
    };
  }
}
