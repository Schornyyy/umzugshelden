import assert from "node:assert/strict";
import test from "node:test";
import { companyKnowledgeJobSchema } from "./companyKnowledge";

test("company knowledge jobs preserve processing progress", () => {
  const job = companyKnowledgeJobSchema.parse({
    id: "job-1",
    ownerId: "owner-1",
    status: "processing",
    stage: "Embeddings werden erstellt",
    sourceCount: 42,
    chunkCount: 180,
    createdAt: 1,
    startedAt: 2,
  });
  assert.equal(job.status, "processing");
  assert.equal(job.sourceCount, 42);
  assert.equal(job.chunkCount, 180);
});

test("invalid company knowledge counts and statuses are rejected", () => {
  const job = {
    id: "job-1",
    ownerId: "owner-1",
    status: "ready",
    stage: "Fertig",
    sourceCount: 1,
    chunkCount: 2,
    createdAt: 1,
  };
  assert.equal(
    companyKnowledgeJobSchema.safeParse({ ...job, sourceCount: -1 }).success,
    false,
  );
  assert.equal(
    companyKnowledgeJobSchema.safeParse({ ...job, status: "unknown" }).success,
    false,
  );
});
