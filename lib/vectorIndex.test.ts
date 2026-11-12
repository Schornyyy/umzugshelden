import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPineconeIndexConfiguration,
  GEMINI_EMBEDDING_DIMENSION,
} from "./vectorIndexConfig";

test("Gemini embeddings always use 3072 dimensions", () => {
  assert.equal(GEMINI_EMBEDDING_DIMENSION, 3072);
});

test("missing Pinecone indexes are configured for 3072-dimensional cosine vectors", () => {
  assert.deepEqual(
    buildPineconeIndexConfiguration("knowledge", "gcp", "europe-west4"),
    {
      name: "knowledge",
      dimension: 3072,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "gcp",
          region: "europe-west4",
        },
      },
      deletion_protection: "disabled",
    },
  );
});
