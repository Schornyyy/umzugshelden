import type {
  CityServiceBlock,
  CityServiceKey,
  CityServiceSeoSettings,
} from "@/types/city/CityServicePage";
import type { GeneratedCityPageDraft } from "@/types/city/CityPageGeneration";
import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";

export const CITY_SERVICE_IMAGE_PLACEHOLDER =
  "/images/Umzugsunternhemen_olpe.png";

const PAINTING_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bMalermeisterbetrieb(?:es|en|e)?\b/giu, "Anbieter für Schönheitsreparaturen"],
  [/\bMalerfachbetrieb(?:es|en|e)?\b/giu, "Anbieter für Schönheitsreparaturen"],
  [/\bMalerbetrieb(?:es|en|e)?\b/giu, "Anbieter für Schönheitsreparaturen"],
  [/\bMeisterbetrieb(?:es|en|e)?\b/giu, "Dienstleister"],
  [/\bMalermeister(?:in|innen)?\b/giu, "Fachkraft"],
];

function replacePaintingClaims(value: unknown): unknown {
  if (typeof value === "string") {
    return PAINTING_REPLACEMENTS.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      value,
    );
  }
  if (Array.isArray(value)) return value.map(replacePaintingClaims);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        replacePaintingClaims(nested),
      ]),
    );
  }
  return value;
}

export function serviceGenerationRules(serviceKey: CityServiceKey): string[] {
  if (serviceKey !== "anstricharbeiten") return [];
  return [
    "Bezeichne das Unternehmen niemals als Malerbetrieb, Malerfachbetrieb, Malermeister oder Meisterbetrieb.",
    "Beschreibe ausschließlich zulassungsfreie Schönheitsreparaturen und Anstricharbeiten ohne meisterpflichtige Tätigkeiten.",
    "Behaupte keine handwerksrechtliche Zulassung oder Eintragung in die Handwerksrolle.",
  ];
}

export function enforceCityServiceContentPolicy(
  serviceKey: CityServiceKey,
  draft: GeneratedCityPageDraft,
): GeneratedCityPageDraft {
  if (serviceKey !== "anstricharbeiten") return draft;
  return replacePaintingClaims(draft) as GeneratedCityPageDraft;
}

export function mergePreservedBuilderBlocks(
  generatedBlocks: CityServiceBlock[],
  previousBlocks: CityServiceBlock[],
): CityServiceBlock[] {
  const generatedTypes = new Set(generatedBlocks.map((block) => block.type));
  const preserved = previousBlocks.filter(
    (block) => !generatedTypes.has(block.type),
  );
  return ensureGeneratedPageReviewsAfterHero([
    ...generatedBlocks,
    ...structuredClone(preserved),
  ]);
}

export function ensureGeneratedPageReviews(
  blocks: CityServiceBlock[],
): CityServiceBlock[] {
  const existing = blocks.find((block) => block.type === "testimonials");
  if (existing) {
    return blocks.flatMap<CityServiceBlock>((block) =>
      block.type !== "testimonials"
        ? [block]
        : block === existing
          ? [{ ...block, enabled: true }]
          : [],
    );
  }

  const reviews = createCityServiceBlock("testimonials");
  const closingIndex = blocks.findLastIndex(
    (block) => block.type === "contact" || block.type === "cta",
  );
  const index = closingIndex < 0 ? blocks.length : closingIndex;
  return [...blocks.slice(0, index), reviews, ...blocks.slice(index)];
}

export function ensureGeneratedPageReviewsAfterHero(
  blocks: CityServiceBlock[],
): CityServiceBlock[] {
  const existing = blocks.find((block) => block.type === "testimonials");
  const reviews = existing
    ? { ...existing, enabled: true }
    : createCityServiceBlock("testimonials");
  const remainingBlocks = blocks.filter(
    (block) => block.type !== "testimonials",
  );
  const heroIndex = remainingBlocks.findIndex((block) => block.type === "hero");
  const index = heroIndex < 0 ? 0 : heroIndex + 1;
  return [
    ...remainingBlocks.slice(0, index),
    reviews,
    ...remainingBlocks.slice(index),
  ];
}

export function ensureSeoImagePlaceholders(
  seo: CityServiceSeoSettings,
  fallbackAlt: string,
): CityServiceSeoSettings {
  return {
    ...seo,
    image: seo.image.trim() || CITY_SERVICE_IMAGE_PLACEHOLDER,
    imageAlt: seo.imageAlt.trim() || fallbackAlt,
  };
}
