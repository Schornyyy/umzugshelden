import "server-only";

import { z } from "zod";
import { generateGeminiJson } from "@/lib/gemini";
import type { GenerationPage } from "@/lib/generationPagePolicy";
import type { CityServiceBlock } from "@/types/city/CityServicePage";

/**
 * Gemeinsame Bausteine der KI-Content-Pipelines (Blog & SEO-Landingpages):
 * Sektions-Schemas, Pagebuilder-Mapping und interne Verlinkung.
 */

export const IMAGE_PLACEHOLDER = "/images/gruender_vor_auto.jpeg";

export const GENERATED_SECTION_TYPES = [
  "text",
  "imageText",
  "cards",
  "checklist",
  "process",
  "faq",
  "cta",
] as const;

export const generatedSectionSchema = z.object({
  type: z.enum(GENERATED_SECTION_TYPES),
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
});

export type GeneratedSection = z.infer<typeof generatedSectionSchema>;

export const blueprintSectionSchema = z.object({
  type: z.enum(GENERATED_SECTION_TYPES),
  heading: z.string().trim().min(3).max(300),
  purpose: z.string().trim().min(10).max(1_000),
  contentBrief: z.string().trim().min(20).max(2_000),
  keyPoints: z.array(z.string().trim().min(3).max(500)).min(2).max(8),
  targetWords: z.number().int().min(80).max(500),
  keywords: z.array(z.string().trim().min(2).max(100)).max(15),
});

export type BlueprintSection = z.infer<typeof blueprintSectionSchema>;

export const GENERATED_SECTION_JSON_FORMAT =
  '{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"body":string,"imageAlt"?:string,"items":{"title":string,"text":string}[],"faqItems":{"question":string,"answer":string}[]}';

export const BLUEPRINT_SECTION_JSON_FORMAT =
  '{"type":"text"|"imageText"|"cards"|"checklist"|"process"|"faq"|"cta","heading":string,"purpose":string,"contentBrief":string,"keyPoints":string[],"targetWords":number,"keywords":string[]}';

export const linkAuditSchema = z.object({
  links: z
    .array(
      z.object({
        sectionIndex: z.number().int().nonnegative(),
        anchorText: z.string().trim().min(2).max(150),
        targetUrl: z.string().trim().min(2).max(2_048),
      }),
    )
    .min(1)
    .max(12),
});

export type AuditedLink = z.infer<typeof linkAuditSchema>["links"][number];

type WithSections = { sections: GeneratedSection[] };

/** Kürzt Text auf `maxLength` Zeichen an der letzten Wortgrenze. */
export function truncateAtWord(value: string, maxLength: number): string {
  const text = value.trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const boundary = cut.lastIndexOf(" ");
  return (boundary > maxLength * 0.6 ? cut.slice(0, boundary) : text.slice(0, maxLength))
    .replace(/[\s,;:–-]+$/u, "")
    .trim();
}

/**
 * SEO-Textfeld, das zu lange KI-Antworten kürzt statt sie zu verwerfen.
 * Nur deutlich überlange Werte (> 3× Limit) gelten als ungültig.
 */
export function seoLengthField(minLength: number, maxLength: number) {
  return z
    .string()
    .trim()
    .min(minLength)
    .max(maxLength * 3)
    .transform((value) => truncateAtWord(value, maxLength));
}

export function zodCorrection(error: z.ZodError) {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "Antwort"}: ${issue.message}`)
    .join("; ");
}

export function countWords(value: unknown): number {
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

/** Wendet `transform` rekursiv auf alle Strings eines JSON-Werts an. */
export function mapDeepStrings<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === "string") return transform(value) as T;
  if (Array.isArray(value)) {
    return value.map((entry) => mapDeepStrings(entry, transform)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        mapDeepStrings(entry, transform),
      ]),
    ) as T;
  }
  return value;
}

/** Prüft eine KI-Sektion strikt gegen den geplanten Pagebuilder-Typ. */
export function parseGeneratedSection(
  value: unknown,
  expectedType: GeneratedSection["type"],
): GeneratedSection {
  const section = generatedSectionSchema.parse(value);
  if (
    section.type !== expectedType ||
    (["cards", "checklist", "process"].includes(section.type) &&
      section.items.length < 2) ||
    (section.type === "faq" && section.faqItems.length < 3) ||
    (["text", "imageText"].includes(section.type) && !section.body)
  ) {
    throw new Error(
      "Die n8n-Sektion entspricht nicht dem geplanten Pagebuilder-Format.",
    );
  }
  return section;
}

export function createFallbackSection(section: BlueprintSection): GeneratedSection {
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

const MARKDOWN_LINK_PATTERN = /\[([^\]\n]+)\]\((?:https?:\/\/|\/)[^)\s]+\)/gu;

export function stripGeneratedLinks<T extends WithSections>(content: T): T {
  const strip = (value: string) => value.replace(MARKDOWN_LINK_PATTERN, "$1");
  return {
    ...content,
    sections: content.sections.map((section) => ({
      ...section,
      body: strip(section.body),
      items: section.items.map((item) => ({ ...item, text: strip(item.text) })),
      faqItems: section.faqItems.map((item) => ({
        ...item,
        answer: strip(item.answer),
      })),
    })),
  };
}

export function applyAuditedLinks<T extends WithSections>(
  content: T,
  links: readonly AuditedLink[],
  allowedUrls: ReadonlySet<string>,
): T {
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

export function countInternalLinks(
  content: WithSections,
  candidates: readonly GenerationPage[],
): number {
  const serialized = JSON.stringify(content.sections);
  return candidates.filter((candidate) =>
    serialized.includes(`](${candidate.url})`),
  ).length;
}

/** Ergänzt regelbasiert Links, falls die Link-KI zu wenige gesetzt hat. */
export function ensureInternalLinks<T extends WithSections>(
  content: T,
  candidates: readonly GenerationPage[],
  minimumLinks = 3,
): T {
  const sections = content.sections.map((section) => ({ ...section }));
  const serialized = JSON.stringify(sections);
  const missing = candidates.filter(
    (candidate) => !serialized.includes(`](${candidate.url})`),
  );
  const existingCount = countInternalLinks(content, candidates);
  const linkable = sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.type !== "faq" && section.type !== "cta");

  missing
    .slice(0, Math.max(0, minimumLinks - existingCount))
    .forEach((link, index) => {
      const target = linkable[Math.min(index, linkable.length - 1)] ?? {
        section: sections[0],
      };
      if (!target.section) return;
      target.section.body = `${target.section.body}\n\nPassende Informationen finden Sie auf unserer Seite **[${link.title}](${link.url})**.`;
    });

  return { ...content, sections };
}

/**
 * Lässt Gemini 3–8 natürliche interne Links mit exakt vorkommenden
 * Ankertexten auswählen. Liefert `null`, wenn die Antwort ungültig war.
 */
export async function auditInternalLinks(input: {
  documentLabel: string;
  title: string;
  keyword: string;
  sections: readonly GeneratedSection[];
  candidates: readonly GenerationPage[];
  timeoutMs: number;
  extraRules?: string;
  correction?: unknown;
}): Promise<AuditedLink[] | null> {
  if (!input.candidates.length) return null;
  const response = await generateGeminiJson({
    temperature: 0.1,
    timeoutMs: input.timeoutMs,
    maxOutputTokens: 1_024,
    thinkingBudget: 0,
    systemInstruction: `Du bist Redakteur für interne SEO-Verlinkung.
Prüfe ${input.documentLabel} und wähle 3 bis 8 wirklich hilfreiche interne Links aus allowedInternalLinks.
Jeder anchorText muss exakt und unverändert als zusammenhängender Text in body des angegebenen sectionIndex vorkommen.
Verwende jede Ziel-URL höchstens einmal. Nutze ausschließlich URLs aus allowedInternalLinks und keine externen URLs.
Bevorzuge thematisch passende Artikel und natürliche Ankertexte; vermeide generische Wörter wie "hier" oder "mehr".
${input.extraRules ?? ""}
Antworte ausschließlich als JSON:
{"links":[{"sectionIndex":number,"anchorText":string,"targetUrl":string}]}`,
    prompt: JSON.stringify({
      article: {
        title: input.title,
        keyword: input.keyword,
        sections: input.sections.map((section, sectionIndex) => ({
          sectionIndex,
          heading: section.heading,
          body: section.body,
        })),
      },
      allowedInternalLinks: input.candidates,
      correction: input.correction,
    }),
  });
  const result = linkAuditSchema.safeParse(response);
  return result.success ? result.data.links : null;
}

/** Wandelt generierte Sektionen in Pagebuilder-Blöcke um (ohne CTA). */
export function createGeneratedSectionBlocks(
  sections: readonly GeneratedSection[],
  idPrefix: string,
  toneOffset = 0,
): CityServiceBlock[] {
  return sections
    .filter((section) => section.type !== "cta")
    .map((section, index): CityServiceBlock => {
      const base = {
        id: `${idPrefix}-${index + 1}-${section.type}`,
        enabled: true,
        tone: (index + toneOffset) % 2 === 0 ? ("white" as const) : ("muted" as const),
        headingLevel: 2 as const,
      };
      if (section.type === "imageText") {
        return {
          ...base,
          type: "imageText",
          heading: section.heading,
          paragraphs: [section.body],
          image: IMAGE_PLACEHOLDER,
          imageAlt: section.imageAlt || section.heading,
          imagePosition: index % 2 === 0 ? "left" : "right",
        };
      }
      if (section.type === "cards" && section.items.length >= 2) {
        return {
          ...base,
          type: "cardGrid",
          heading: section.heading,
          intro: section.body,
          cards: section.items,
          columns: section.items.length >= 3 ? 3 : 2,
          numbered: false,
        };
      }
      if (section.type === "checklist" && section.items.length >= 2) {
        return {
          ...base,
          type: "checkList",
          heading: section.heading,
          intro: section.body,
          items: section.items.map((item) => `${item.title}: ${item.text}`),
          columns: 2,
        };
      }
      if (section.type === "process" && section.items.length >= 2) {
        return {
          ...base,
          type: "process",
          heading: section.heading,
          intro: section.body,
          steps: section.items.map((item) => `${item.title}: ${item.text}`),
        };
      }
      if (section.type === "faq" && section.faqItems.length >= 3) {
        return {
          ...base,
          type: "faq",
          heading: section.heading,
          items: section.faqItems,
          includeLocalQuestion: false,
        };
      }
      return {
        ...base,
        type: "intro",
        heading: section.heading,
        text: section.body,
      };
    });
}

export function createGeneratedContactBlock(
  id: string,
  heading = "Jetzt kostenlos und unverbindlich anfragen",
): CityServiceBlock {
  return {
    id,
    type: "contact",
    enabled: true,
    tone: "accent",
    headingLevel: 2,
    heading,
    text: "Beschreiben Sie kurz Ihr Vorhaben. Wir melden uns persönlich bei Ihnen und besprechen die nächsten Schritte.",
    showPhone: true,
    showEmail: true,
    showForm: true,
  };
}
