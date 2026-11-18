import assert from "node:assert/strict";
import test from "node:test";
import { composeCityPageLayout } from "./cityPageLayout";
import type { CityServiceBlock } from "@/types/city/CityServicePage";

const longText = Array.from({ length: 60 }, (_, index) => `Wort${index}`).join(" ");
const base = { enabled: true, tone: "white" as const, headingLevel: 2 as const };
const blocks: CityServiceBlock[] = [
  { ...base, id: "faq", type: "faq", heading: "FAQ", items: [], includeLocalQuestion: false },
  { ...base, id: "hero", type: "hero", title: "T", description: "D", image: "/images/hero.webp", imageAlt: "", formTitle: "F", formText: "F" },
  { ...base, id: "a", type: "intro", heading: "A", text: longText },
  { ...base, id: "b", type: "intro", heading: "B", text: "kurz" },
  { ...base, id: "c", type: "intro", heading: "C", text: longText },
  { ...base, id: "p", type: "process", heading: "Ablauf", steps: ["1", "2"] },
  { ...base, id: "x", type: "imageText", heading: "X", paragraphs: ["t"], image: "/images/image.png", imageAlt: "", imagePosition: "left" },
];
const images = ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg"].map((src) => ({ src, alt: `Bild ${src}` }));

const result = composeCityPageLayout(blocks, {
  images,
  cityName: "Olpe",
  serviceLabel: "Umzugsservice",
  aboutImage: { src: "/team.jpg", alt: "Team" },
});

test("hero first, process and reviews before content, faq after content", () => {
  const ids = result.map((block) => block.id);
  assert.equal(ids[0], "hero");
  assert.ok(ids.indexOf("p") < ids.indexOf("a"));
  assert.ok(ids.indexOf("city-reviews") < ids.indexOf("a"));
  assert.ok(ids.indexOf("faq") > ids.indexOf("city-about"));
});

test("long text blocks get images, short ones stay text, placeholders are replaced", () => {
  const byId = new Map(result.map((block) => [block.id, block]));
  assert.equal(byId.get("a")?.type, "imageText");
  assert.equal(byId.get("b")?.type, "intro");
  const placeholder = byId.get("x");
  assert.ok(placeholder?.type === "imageText" && placeholder.image !== "/images/image.png");
  const imageSources = result.flatMap((block) => (block.type === "imageText" ? [block.image] : []));
  const contentImages = imageSources.filter((src) => src !== "/team.jpg");
  assert.equal(new Set(contentImages).size, contentImages.length, "kein Bild doppelt im Inhalt");
});

test("gallery and about section are added, nothing is removed", () => {
  assert.ok(result.some((block) => block.type === "gallery"));
  assert.ok(result.some((block) => block.id === "city-about"));
  for (const block of blocks) assert.ok(result.some((entry) => entry.id === block.id));
});

test("template blocks with a topic already covered by localized content are dropped", () => {
  const withDuplicates: CityServiceBlock[] = [
    { ...base, id: "ai-price", type: "intro", heading: "Was kostet ein Umzug in Olpe?", text: longText },
    { ...base, id: "tpl-price", type: "pricing", heading: "Was kostet {service} in {city}?", text: "t", factors: [], ctaTitle: "", ctaText: "", ctaLabel: "" },
    { ...base, id: "tpl-unique", type: "checkList", heading: "Auftrag in {city} gut vorbereiten", items: ["a"], columns: 2 },
    { ...base, id: "tpl-faq", type: "faq", heading: "Häufige Fragen zu {service}", items: [], includeLocalQuestion: true },
  ];
  const ids = composeCityPageLayout(withDuplicates, {
    images,
    cityName: "Olpe",
    serviceLabel: "Umzugsservice",
    aboutImage: { src: "/team.jpg", alt: "Team" },
  }).map((block) => block.id);
  assert.ok(ids.includes("ai-price"));
  assert.ok(!ids.includes("tpl-price"), "Vorlagen-Kostenblock entfällt");
  assert.ok(ids.includes("tpl-unique"), "Vorlagen-Block ohne Doppelung bleibt");
  assert.ok(ids.includes("tpl-faq"), "FAQ wird nie entfernt");
});
