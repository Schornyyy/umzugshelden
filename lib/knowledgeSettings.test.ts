import assert from "node:assert/strict";
import test from "node:test";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  knowledgeCreatorSchema,
  knowledgeSourceSchema,
} from "./knowledgeSettings";

test("all knowledge categories have an admin label", () => {
  assert.deepEqual(KNOWLEDGE_CATEGORIES, [
    "marketing",
    "sales",
    "offering",
    "positioning",
  ]);
  for (const category of KNOWLEDGE_CATEGORIES) {
    assert.ok(KNOWLEDGE_CATEGORY_LABELS[category]);
  }
});

test("creator and completed PDF source metadata are valid", () => {
  const creator = knowledgeCreatorSchema.parse({
    id: "creator-1",
    ownerId: "owner-1",
    name: " Alex Hormozi ",
    createdAt: 1,
  });
  assert.equal(creator.name, "Alex Hormozi");

  const source = knowledgeSourceSchema.parse({
    id: "source-1",
    ownerId: creator.ownerId,
    creatorId: creator.id,
    creatorName: creator.name,
    category: "offering",
    type: "pdf",
    title: "100M Offers",
    contentUrl: "https://example.com/offers.pdf",
    fileName: "offers.pdf",
    status: "ready",
    chunkCount: 120,
    pageCount: 42,
    createdAt: 1,
    completedAt: 2,
  });
  assert.equal(source.pageCount, 42);
  assert.equal(source.chunkCount, 120);
});

test("invalid categories, URLs and negative chunk counts are rejected", () => {
  const source = {
    id: "source-1",
    ownerId: "owner-1",
    creatorId: "creator-1",
    creatorName: "Creator",
    category: "marketing",
    type: "website",
    title: "Source",
    sourceUrl: "https://example.com",
    status: "ready",
    chunkCount: 2,
    createdAt: 1,
  };
  assert.equal(
    knowledgeSourceSchema.safeParse({ ...source, category: "finance" }).success,
    false,
  );
  assert.equal(
    knowledgeSourceSchema.safeParse({ ...source, sourceUrl: "not-a-url" })
      .success,
    false,
  );
  assert.equal(
    knowledgeSourceSchema.safeParse({ ...source, chunkCount: -1 }).success,
    false,
  );
});
