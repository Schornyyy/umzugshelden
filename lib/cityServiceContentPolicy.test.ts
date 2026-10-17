import assert from "node:assert/strict";
import test from "node:test";
import { createCityServiceBlock } from "./cityServiceBlockFactory";
import {
  ensureGeneratedPageReviews,
  ensureGeneratedPageReviewsAfterHero,
  mergePreservedBuilderBlocks,
} from "./cityServiceContentPolicy";

test("generated pages receive the central reviews element before the closing contact", () => {
  const intro = createCityServiceBlock("intro");
  const contact = createCityServiceBlock("contact");
  const input = [intro, contact];
  const result = ensureGeneratedPageReviews(input);
  assert.deepEqual(result.map((block) => block.type), ["intro", "testimonials", "contact"]);
  const reviews = result[1];
  assert.equal(reviews.enabled, true);
  assert.ok(reviews.type === "testimonials");
  assert.deepEqual(reviews.items, []);
  assert.deepEqual(input, [intro, contact]);
});

test("reviews are inserted before the final CTA rather than an earlier CTA", () => {
  const result = ensureGeneratedPageReviews([
    createCityServiceBlock("cta"),
    createCityServiceBlock("intro"),
    createCityServiceBlock("cta"),
  ]);
  assert.deepEqual(result.map((block) => block.type), ["cta", "intro", "testimonials", "cta"]);
});

test("pages without a closing CTA receive reviews at the end, including empty pages", () => {
  assert.deepEqual(ensureGeneratedPageReviews([]).map((block) => block.type), ["testimonials"]);
  assert.deepEqual(
    ensureGeneratedPageReviews([createCityServiceBlock("intro")]).map((block) => block.type),
    ["intro", "testimonials"],
  );
});

test("existing reviews retain position and ID, are enabled and are not duplicated", () => {
  const reviews = { ...createCityServiceBlock("testimonials"), enabled: false };
  const intro = createCityServiceBlock("intro");
  const result = ensureGeneratedPageReviews([reviews, intro, createCityServiceBlock("testimonials")]);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, reviews.id);
  assert.equal(result[0].enabled, true);
  assert.equal(result[1], intro);
  assert.equal(reviews.enabled, false);
  assert.deepEqual(ensureGeneratedPageReviews(result), result);
});

test("city and service pages place reviews directly after the hero", () => {
  const hero = createCityServiceBlock("hero");
  const intro = createCityServiceBlock("intro");
  const reviews = { ...createCityServiceBlock("testimonials"), enabled: false };
  const result = ensureGeneratedPageReviewsAfterHero([
    intro,
    hero,
    reviews,
    createCityServiceBlock("testimonials"),
  ]);
  assert.deepEqual(result.map((block) => block.type), [
    "intro",
    "hero",
    "testimonials",
  ]);
  assert.equal(result[2].id, reviews.id);
  assert.equal(result[2].enabled, true);
  assert.equal(reviews.enabled, false);
  assert.deepEqual(ensureGeneratedPageReviewsAfterHero(result), result);
});

test("city and service pages without a hero place reviews first", () => {
  const intro = createCityServiceBlock("intro");
  assert.deepEqual(
    ensureGeneratedPageReviewsAfterHero([intro]).map((block) => block.type),
    ["testimonials", "intro"],
  );
});

test("blueprint and fallback block merging places reviews after the hero and preserves unrelated blocks", () => {
  const hero = createCityServiceBlock("hero");
  const intro = createCityServiceBlock("intro");
  const gallery = createCityServiceBlock("gallery");
  const reviews = { ...createCityServiceBlock("testimonials"), enabled: false };
  const result = mergePreservedBuilderBlocks([hero, intro], [gallery, reviews]);
  assert.deepEqual(result.map((block) => block.type), [
    "hero",
    "testimonials",
    "intro",
    "gallery",
  ]);
  assert.equal(result[1].enabled, true);
  assert.equal(result[1].id, reviews.id);
  assert.equal(reviews.enabled, false);
  assert.equal(mergePreservedBuilderBlocks([hero, intro], []).filter((block) => block.type === "testimonials").length, 1);
});
