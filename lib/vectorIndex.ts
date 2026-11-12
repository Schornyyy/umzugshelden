import "server-only";

import {
  buildPineconeIndexConfiguration,
  GEMINI_EMBEDDING_DIMENSION,
} from "@/lib/vectorIndexConfig";
const EMBEDDING_BATCH_SIZE = 100;
const PINECONE_UPSERT_BATCH_SIZE = 100;

type PineconeIndexDescription = {
  dimension?: number;
  host?: string;
  status?: {
    ready?: boolean;
    state?: string;
  };
};

type GeminiEmbeddingResponse = {
  embeddings?: Array<{ values?: number[] }>;
};

export type VectorRecord = {
  id: string;
  text: string;
  metadata: Record<string, string | number | boolean>;
};

function getRequiredApiKey(name: "GEMINI_API_KEY" | "PINECONE_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} fehlt in der Umgebung`);
  return value;
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const apiKey = getRequiredApiKey("GEMINI_API_KEY");
  const model =
    process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
  const modelId = model.replace(/^models\//, "");
  const apiModel = `models/${modelId}`;
  const embeddings: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: apiModel,
            content: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: GEMINI_EMBEDDING_DIMENSION,
          })),
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Gemini embedding request failed", response.status, detail);
      throw new Error("Die Gemini-Embeddings konnten nicht erstellt werden.");
    }
    const payload = (await response.json()) as GeminiEmbeddingResponse;
    const values = payload.embeddings?.map((embedding) => embedding.values);
    if (
      !values ||
      values.length !== batch.length ||
      values.some(
        (embedding) =>
          !embedding || embedding.length !== GEMINI_EMBEDDING_DIMENSION,
      )
    ) {
      throw new Error("Gemini hat unvollständige Embeddings geliefert.");
    }
    embeddings.push(...(values as number[][]));
  }
  return embeddings;
}

async function getPineconeIndexHost(
  apiKey: string,
  indexName: string,
): Promise<string> {
  const controlPlaneHeaders = {
    "Api-Key": apiKey,
    "X-Pinecone-API-Version": "2025-10",
  };
  const indexUrl = `https://api.pinecone.io/indexes/${encodeURIComponent(indexName)}`;

  let response = await fetch(indexUrl, {
    headers: controlPlaneHeaders,
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) {
    const configuration = buildPineconeIndexConfiguration(
      indexName,
      process.env.PINECONE_CLOUD?.trim() || "aws",
      process.env.PINECONE_REGION?.trim() || "us-east-1",
    );
    const createResponse = await fetch("https://api.pinecone.io/indexes", {
      method: "POST",
      headers: {
        ...controlPlaneHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(configuration),
      signal: AbortSignal.timeout(30_000),
    });
    if (!createResponse.ok && createResponse.status !== 409) {
      const detail = await createResponse.text().catch(() => "");
      console.error("Pinecone index creation failed", createResponse.status, detail);
      throw new Error(
        `Der Pinecone-Index "${indexName}" konnte nicht erstellt werden.`,
      );
    }
  } else if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Pinecone index lookup failed", response.status, detail);
    throw new Error(`Der Pinecone-Index "${indexName}" konnte nicht geprüft werden.`);
  }

  let index: PineconeIndexDescription | undefined;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (attempt > 0 || response.status === 404) {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      response = await fetch(indexUrl, {
        headers: controlPlaneHeaders,
        signal: AbortSignal.timeout(10_000),
      });
    }
    if (response.ok) {
      index = (await response.json()) as PineconeIndexDescription;
      if (index.host && index.status?.ready !== false) break;
    } else if (response.status !== 404) {
      const detail = await response.text().catch(() => "");
      console.error("Pinecone index readiness check failed", response.status, detail);
      throw new Error(
        `Der Status des Pinecone-Index "${indexName}" konnte nicht geprüft werden.`,
      );
    }
  }
  if (!index || index.status?.ready === false) {
    throw new Error(
      `Der Pinecone-Index "${indexName}" wurde nicht rechtzeitig bereitgestellt.`,
    );
  }
  if (index.dimension !== GEMINI_EMBEDDING_DIMENSION) {
    throw new Error(
      `Der Pinecone-Index "${indexName}" benötigt Dimension ${GEMINI_EMBEDDING_DIMENSION}, hat aber ${index.dimension ?? "keine Angabe"}.`,
    );
  }
  const configuredHost = process.env.PINECONE_INDEX_HOST?.trim();
  const host =
    index.host || configuredHost?.replace(/^https?:\/\//i, "");
  if (!host) {
    throw new Error(`Pinecone hat für "${indexName}" keinen Index-Host geliefert.`);
  }
  return host;
}

export async function upsertVectorRecords(
  records: VectorRecord[],
  indexName: string,
  namespace: string,
): Promise<void> {
  if (!records.length) return;
  const apiKey = getRequiredApiKey("PINECONE_API_KEY");
  const host = await getPineconeIndexHost(apiKey, indexName);
  const embeddings = await embedDocuments(records.map((record) => record.text));

  for (
    let offset = 0;
    offset < records.length;
    offset += PINECONE_UPSERT_BATCH_SIZE
  ) {
    const batch = records.slice(offset, offset + PINECONE_UPSERT_BATCH_SIZE);
    const response = await fetch(`https://${host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "content-type": "application/json",
        "X-Pinecone-API-Version": "2025-10",
      },
      body: JSON.stringify({
        namespace,
        vectors: batch.map((record, index) => ({
          id: record.id,
          values: embeddings[offset + index],
          metadata: { ...record.metadata, text: record.text },
        })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Pinecone upsert failed", response.status, detail);
      throw new Error("Die Textabschnitte konnten nicht in Pinecone gespeichert werden.");
    }
  }
}

export async function deleteVectorRecordsByFilter(
  indexName: string,
  namespace: string,
  filter: Record<string, unknown>,
): Promise<void> {
  const apiKey = getRequiredApiKey("PINECONE_API_KEY");
  const host = await getPineconeIndexHost(apiKey, indexName);
  const response = await fetch(`https://${host}/vectors/delete`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "content-type": "application/json",
      "X-Pinecone-API-Version": "2025-10",
    },
    body: JSON.stringify({ namespace, filter }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Pinecone filtered delete failed", response.status, detail);
    throw new Error(
      "Die bisherigen Firmenwissens-Vektoren konnten nicht gelöscht werden.",
    );
  }
}
