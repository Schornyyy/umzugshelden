import assert from "node:assert/strict";
import test from "node:test";
import { createFallbackSeoSection } from "./seoBlueprintSectionFallback";
import type { SeoPageBlueprintSection } from "@/types/city/SeoAnalysis";

function createSection(
  patch: Partial<SeoPageBlueprintSection> = {},
): SeoPageBlueprintSection {
  return {
    order: 4,
    sectionType: "text",
    headingLevel: "H2",
    heading: "Sicher umziehen",
    purpose: "Leistung erklären",
    contentBrief: "Wir planen den Ablauf persönlich.",
    keyPoints: ["Vorbereitung", "Durchführung"],
    targetWordCount: 200,
    keywords: ["Umzugsservice"],
    ...patch,
  };
}

test("fallback sections omit optional Firestore fields when absent", () => {
  const section = createFallbackSeoSection(createSection());

  assert.equal(Object.hasOwn(section, "cta"), false);
  assert.equal(
    Object.values(section).some((value) => value === undefined),
    false,
  );
});

test("fallback sections include complete CTA data when configured", () => {
  const section = createFallbackSeoSection(
    createSection({ cta: "Kostenlos anfragen" }),
  );

  assert.deepEqual(section.cta, {
    title: "Sicher umziehen",
    text: "Kostenlos anfragen",
    label: "Kostenlos anfragen",
  });
});
