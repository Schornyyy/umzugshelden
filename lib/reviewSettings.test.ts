import assert from "node:assert/strict";
import test from "node:test";
import { defaultReviewSettings, reviewSettingsSchema } from "./reviewSettings";

test("existing reviews remain available before central settings are saved", () => {
  const settings = reviewSettingsSchema.parse(defaultReviewSettings);
  assert.equal(settings.reviews.length, 3);
  assert.equal(settings.reviews[0].name, "Oliver W.");
});

test("reviews preserve order and trim editable content", () => {
  const settings = reviewSettingsSchema.parse({
    reviews: [
      { id: "second", name: " Anke ", review: " Gut! ", rating: 1 },
      { id: "first", name: "Oliver", review: "Sehr gut!", rating: 5 },
    ],
    ownerId: "not-public",
  });
  assert.deepEqual(settings.reviews.map((review) => review.id), ["second", "first"]);
  assert.equal(settings.reviews[0].name, "Anke");
  assert.equal(settings.reviews[0].review, "Gut!");
  assert.equal("ownerId" in settings, false);
});

test("empty and single-card collections are valid", () => {
  assert.deepEqual(reviewSettingsSchema.parse({ reviews: [] }), { reviews: [] });
  assert.equal(reviewSettingsSchema.parse({ reviews: [defaultReviewSettings.reviews[0]] }).reviews.length, 1);
});

test("invalid stars, blank content and duplicate IDs are rejected", () => {
  const review = defaultReviewSettings.reviews[0];
  for (const rating of [0, 6, 1.5, "5", null]) {
    assert.equal(reviewSettingsSchema.safeParse({ reviews: [{ ...review, rating }] }).success, false);
  }
  for (const patch of [{ name: " " }, { review: " " }, { id: "" }, { name: "a".repeat(151) }, { review: "a".repeat(5001) }]) {
    assert.equal(reviewSettingsSchema.safeParse({ reviews: [{ ...review, ...patch }] }).success, false);
  }
  assert.equal(reviewSettingsSchema.safeParse({ reviews: [review, review] }).success, false);
});

test("at most 100 review cards can be saved", () => {
  const reviews = Array.from({ length: 100 }, (_, index) => ({
    ...defaultReviewSettings.reviews[0], id: String(index),
  }));
  assert.equal(reviewSettingsSchema.safeParse({ reviews }).success, true);
  assert.equal(reviewSettingsSchema.safeParse({ reviews: [...reviews, { ...reviews[0], id: "extra" }] }).success, false);
});
