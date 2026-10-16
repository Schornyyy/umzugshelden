import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedGenerationPage,
  buildGenerationPages,
  filterGenerationContent,
  filterGenerationLinks,
  generationPagePath,
  generationSiteUrl,
  restrictGenerationAnalysis,
  type GenerationPage,
} from "./generationPagePolicy";
import type { SeoAiReport } from "@/types/city/SeoAnalysis";

const pages: GenerationPage[] = [
  { title: "Olpe", url: "/stadt/olpe", targetType: "stadt" },
  { title: "Umzug Olpe", url: "/stadt/olpe/umzugsservice", targetType: "dienstleistung" },
  { title: "Packtipps", url: "/blog/umzug/planung/packtipps", targetType: "blog" },
];

test("only existing published public routes enter the catalog", () => {
  const catalog = buildGenerationPages({
    blogs: [
      { titel: "Sichtbar", path: "umzug/planung/packtipps", visible: true, description: "" },
      { titel: "Entwurf", path: "umzug/entwurf", visible: false, description: "" },
      { titel: "Leer", visible: true, description: "" },
    ],
    landings: [{ citySlug: "olpe", published: false }],
    services: [{ citySlug: "olpe", serviceKey: "umzugsservice", published: false }],
  });
  assert.equal(catalog.some((page) => page.url === "/stadt/olpe"), false);
  assert.equal(catalog.some((page) => page.url === "/stadt/olpe/umzugsservice"), false);
  assert.equal(catalog.some((page) => page.url === "/stadt/olpe/anstricharbeiten"), true);
  assert.equal(catalog.some((page) => page.url === "/stadt/erfundene-stadt"), false);
  assert.deepEqual(catalog.filter((page) => page.targetType === "blog").map((page) => page.title), ["Sichtbar"]);
  assert.equal(catalog.some((page) => page.url === "/umzugsservice"), false);
});

test("relative and same-domain absolute URLs resolve to catalog entries", () => {
  assert.equal(allowedGenerationPage("/stadt/olpe/", pages)?.url, "/stadt/olpe");
  assert.equal(allowedGenerationPage(new URL("/stadt/olpe", generationSiteUrl()).href, pages)?.url, "/stadt/olpe");
  const alias = new URL(generationSiteUrl());
  alias.hostname = alias.hostname.startsWith("www.") ? alias.hostname.slice(4) : `www.${alias.hostname}`;
  assert.equal(allowedGenerationPage(new URL("/stadt/olpe", alias).href, pages)?.url, "/stadt/olpe");
});

test("external, invented, unpublished and unsupported targets are rejected", () => {
  for (const url of [
    "https://example.org/stadt/olpe",
    "//example.org/blog/tipps",
    "https://www.umzugshelden.io.example.org/stadt/olpe",
    "/stadt/erfunden",
    "/stadt/olpe/erfundener-service",
    "/blog/unveroeffentlicht",
    "/kontakt", "/umzugsservice", "/stadt", "/blog",
    "/stadt/olpe?preview=true", "/stadt/olpe#vorschau",
    "javascript:alert(1)", "/admin/test",
  ]) assert.equal(allowedGenerationPage(url, pages), undefined, url);
  assert.equal(generationPagePath("/stadt/olpe/umzugsservice/extra"), null);
});

test("generated links are checked after generation while their text remains", () => {
  const text = "**[Umzug](/stadt/olpe/umzugsservice)** [Erfunden](/stadt/falsch) [Extern](https://example.org) <a href='/blog/umzug/planung/packtipps'>Tipps</a> <a href='/kontakt'>Kontakt</a>";
  assert.equal(
    filterGenerationLinks(text, pages),
    "**[Umzug](/stadt/olpe/umzugsservice)** Erfunden Extern <a href=\"/blog/umzug/planung/packtipps\">Tipps</a> Kontakt",
  );
});

test("nested sections are checked without changing images or non-link values", () => {
  const content = {
    blocks: [{ text: "[Extern](https://example.org)", items: ["[Olpe](/stadt/olpe)"], image: "/images/test.png" }],
    rating: 5,
    enabled: true,
    extra: null,
  };
  assert.deepEqual(filterGenerationContent(content, pages), {
    ...content,
    blocks: [{ ...content.blocks[0], text: "Extern" }],
  });
  assert.equal(content.blocks[0].text, "[Extern](https://example.org)");
});

test("saved analyses cannot reintroduce external sources or obsolete link targets", () => {
  const report: SeoAiReport = {
    summary: "Test", strengths: [], competitorAdvantages: ["Extern"],
    recommendations: [{ priority: "hoch", area: "Links", finding: "Test", action: "Test", competitorExample: "https://example.org" }],
    suggestedTitle: "Test", suggestedMetaDescription: "Test", suggestedH1: "Test",
    contentOutline: [], suggestedFaqs: [],
    pageBlueprint: {
      searchIntent: "Test", targetAudience: "Test", primaryKeyword: "Test",
      secondaryKeywords: [], recommendedWordCount: 1000, tone: "Test",
      sections: [], primaryCta: "Test", secondaryCta: "Test",
      trustElements: [], schemaRecommendations: [],
      internalLinkSuggestions: [
        { anchorText: "Olpe", targetPage: new URL("/stadt/olpe", generationSiteUrl()).href },
        { anchorText: "Extern", targetPage: "https://example.org/blog/tipps" },
        { anchorText: "Nicht vorhanden", targetPage: "/blog/entwurf" },
      ],
    },
  };
  const result = restrictGenerationAnalysis({
    pages: [
      { url: "/stadt/olpe", finalUrl: "/stadt/olpe" },
      { url: "/stadt/olpe/umzugsservice", finalUrl: "https://example.org/" },
      { url: "https://example.org/", finalUrl: "https://example.org/" },
      { url: "/blog/entwurf", finalUrl: "/blog/entwurf" },
    ],
    report,
  }, pages);
  assert.deepEqual(result.pages, [{ url: "/stadt/olpe", finalUrl: "/stadt/olpe" }]);
  assert.deepEqual(result.report.pageBlueprint?.internalLinkSuggestions, [{ anchorText: "Olpe", targetPage: "/stadt/olpe" }]);
  assert.deepEqual(result.report.competitorAdvantages, []);
  assert.equal("competitorExample" in result.report.recommendations[0], false);
});
