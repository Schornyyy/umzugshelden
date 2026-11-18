import assert from "node:assert/strict";
import test from "node:test";
import {
  containment,
  contentFingerprint,
  extractVisibleText,
  normalizeForComparison,
} from "./contentSimilarity";

const template = [
  {
    id: "intro",
    type: "intro",
    image: "/images/a.png",
    heading: "Umzugsunternehmen in {city}",
    text: "Wir planen Ihren Umzug in {city} gemeinsam mit Ihnen und übernehmen Verpackung, Transport und Montage.",
  },
];

test("only visible text is extracted", () => {
  assert.deepEqual(extractVisibleText(template), [
    "Umzugsunternehmen in {city}",
    "Wir planen Ihren Umzug in {city} gemeinsam mit Ihnen und übernehmen Verpackung, Transport und Montage.",
  ]);
});

test("swapping only the city name still counts as duplicate", () => {
  const olpe = JSON.parse(JSON.stringify(template).replaceAll("{city}", "Olpe"));
  const siegen = JSON.parse(JSON.stringify(template).replaceAll("{city}", "Siegen"));
  const a = contentFingerprint(olpe, ["Olpe", "Siegen"]);
  const b = contentFingerprint(siegen, ["Olpe", "Siegen"]);
  assert.equal(containment(a.shingles, b.shingles), 1);
});

test("rewritten text has low overlap", () => {
  const rewritten = [
    {
      ...template[0],
      text: "In Siegen begleitet Sie ein festes Team vom ersten Gespräch bis zum letzten Karton am neuen Zuhause.",
    },
  ];
  const original = contentFingerprint(template, ["Siegen"]);
  const fresh = contentFingerprint(rewritten, ["Siegen"]);
  assert.ok(containment(fresh.shingles, original.shingles) < 0.3);
});

test("normalization removes punctuation and markdown links", () => {
  assert.equal(
    normalizeForComparison("**Mehr** zu [Umzug](/stadt/olpe) in Olpe!", ["Olpe"]),
    "mehr zu umzug in ort",
  );
});
