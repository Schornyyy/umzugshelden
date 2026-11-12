import assert from "node:assert/strict";
import test from "node:test";
import {
  createLandingPageFromTemplate,
  LANDING_PAGE_SERVICE_KEYS,
  LANDING_PAGE_TEMPLATES,
  landingPageSchema,
} from "./landingPageSettings";

test("every supported service has a valid landing page template", () => {
  for (const serviceKey of LANDING_PAGE_SERVICE_KEYS) {
    const page = createLandingPageFromTemplate(serviceKey, "owner", 123);
    assert.equal(page.serviceKey, serviceKey);
    assert.equal(page.ownerId, "owner");
    assert.equal(page.createdAt, 123);
    assert.ok(page.questions.length > 0);
    assert.ok(page.benefits.length > 0);
  }
});

test("template slugs and question IDs are unique", () => {
  const templates = Object.values(LANDING_PAGE_TEMPLATES);
  assert.equal(
    new Set(templates.map((template) => template.slug)).size,
    templates.length,
  );
  for (const template of templates) {
    assert.equal(
      new Set(template.questions.map((question) => question.id)).size,
      template.questions.length,
    );
  }
});

test("invalid generated landing pages are rejected", () => {
  const valid = createLandingPageFromTemplate("umzugsservice", "owner");
  assert.equal(
    landingPageSchema.safeParse({ ...valid, ownerId: "" }).success,
    false,
  );
  assert.equal(
    landingPageSchema.safeParse({ ...valid, questions: [] }).success,
    false,
  );
  assert.equal(
    landingPageSchema.safeParse({ ...valid, serviceKey: "unknown" }).success,
    false,
  );
});
