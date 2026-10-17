import type {
  SeoPageBlueprintSection,
} from "@/types/city/SeoAnalysis";
import type {
  GeneratedSeoSection,
} from "@/lib/seoBlueprintPageGenerator";

export function createFallbackSeoSection(
  section: SeoPageBlueprintSection,
): GeneratedSeoSection {
  const body = [section.contentBrief, ...section.keyPoints]
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
    ...(section.cta
      ? {
          cta: {
            title: section.heading,
            text: section.cta,
            label: section.cta,
          },
        }
      : {}),
  };
}
