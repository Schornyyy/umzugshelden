import "server-only";

import { createHash } from "node:crypto";
import { discoverSeoCompetitorUrls } from "@/lib/googleSeoSearch";
import { scrapeSeoPageText } from "@/lib/seoPageAnalyzer";
import { createOverlappingTextChunks } from "@/lib/blogResearchText";
import { slugify } from "@/utils/slugify";

const EMBEDDING_DIMENSION = 768;
const EMBEDDING_BATCH_SIZE = 100;
const PINECONE_UPSERT_BATCH_SIZE = 100;
const DEFAULT_INDEX_NAME = "blog-knowledge";
const DEFAULT_NAMESPACE = "blog-research";

type PineconeIndexDescription = {
  dimension?: number;
  host?: string;
};

type GeminiEmbeddingResponse = {
  embeddings?: Array<{ values?: number[] }>;
};

type ResearchChunk = {
  id: string;
  keyword: string;
  sourceUrl: string;
  sourceRank: number;
  text: string;
};

export type BlogResearchIndexResult = {
  indexName: string;
  namespace: string;
  sourceCount: number;
  chunkCount: number;
  sources: Array<{
    url: string;
    rank: number;
    characterCount: number;
    chunkCount: number;
  }>;
  failures: Array<{ url: string; error: string }>;
};

function getRequiredApiKey(name: "GEMINI_API_KEY" | "PINECONE_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} fehlt in der Umgebung`);
  return value;
}

async function embedChunks(chunks: ResearchChunk[]): Promise<number[][]> {
  const apiKey = getRequiredApiKey("GEMINI_API_KEY");
  const model =
    process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
  const modelId = model.replace(/^models\//, "");
  const apiModel = `models/${modelId}`;
  const embeddings: number[][] = [];

  for (let offset = 0; offset < chunks.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          requests: batch.map((chunk) => ({
            model: apiModel,
            content: { parts: [{ text: chunk.text }] },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: EMBEDDING_DIMENSION,
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
          !embedding || embedding.length !== EMBEDDING_DIMENSION,
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
  const configuredHost = process.env.PINECONE_INDEX_HOST?.trim();
  if (configuredHost) return configuredHost.replace(/^https?:\/\//i, "");

  const response = await fetch(
    `https://api.pinecone.io/indexes/${encodeURIComponent(indexName)}`,
    {
      headers: {
        "Api-Key": apiKey,
        "X-Pinecone-API-Version": "2025-10",
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Pinecone index lookup failed", response.status, detail);
    throw new Error(`Der Pinecone-Index "${indexName}" wurde nicht gefunden.`);
  }
  const index = (await response.json()) as PineconeIndexDescription;
  if (index.dimension !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Der Pinecone-Index "${indexName}" benötigt Dimension ${EMBEDDING_DIMENSION}, hat aber ${index.dimension ?? "keine Angabe"}.`,
    );
  }
  if (!index.host) {
    throw new Error(`Pinecone hat für "${indexName}" keinen Index-Host geliefert.`);
  }
  return index.host;
}

async function upsertChunks(
  chunks: ResearchChunk[],
  embeddings: number[][],
  indexName: string,
  namespace: string,
) {
  const apiKey = getRequiredApiKey("PINECONE_API_KEY");
  const host = await getPineconeIndexHost(apiKey, indexName);
  for (
    let offset = 0;
    offset < chunks.length;
    offset += PINECONE_UPSERT_BATCH_SIZE
  ) {
    const batch = chunks.slice(offset, offset + PINECONE_UPSERT_BATCH_SIZE);
    const response = await fetch(`https://${host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "content-type": "application/json",
        "X-Pinecone-API-Version": "2025-10",
      },
      body: JSON.stringify({
        namespace,
        vectors: batch.map((chunk, index) => ({
          id: chunk.id,
          values: embeddings[offset + index],
          metadata: {
            keyword: chunk.keyword,
            source_url: chunk.sourceUrl,
            source_rank: chunk.sourceRank,
            text: chunk.text,
          },
        })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Pinecone upsert failed", response.status, detail);
      throw new Error("Die Research-Chunks konnten nicht in Pinecone gespeichert werden.");
    }
  }
}

export async function indexBlogKeywordResearch(
  keyword: string,
  targetUrl: string,
): Promise<BlogResearchIndexResult> {
  const indexName =
    process.env.PINECONE_INDEX_NAME?.trim() || DEFAULT_INDEX_NAME;
  const namespace =
    process.env.PINECONE_NAMESPACE?.trim() || DEFAULT_NAMESPACE;
  const urls = await discoverSeoCompetitorUrls(keyword, targetUrl, 5);
  if (!urls.length) {
    throw new Error(`Für "${keyword}" wurden keine Wettbewerber gefunden.`);
  }

  const results = await Promise.allSettled(urls.map(scrapeSeoPageText));
  const failures: Array<{ url: string; error: string }> = [];
  const chunks: ResearchChunk[] = [];
  const sources: BlogResearchIndexResult["sources"] = [];
  results.forEach((result, index) => {
    const requestedUrl = urls[index];
    if (result.status === "rejected") {
      failures.push({
        url: requestedUrl,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Die Seite konnte nicht verarbeitet werden.",
      });
      return;
    }
    const sourceChunks = createOverlappingTextChunks(result.value.text);
    const sourceId = createHash("sha256")
      .update(result.value.finalUrl)
      .digest("hex")
      .slice(0, 10);
    const keywordId = slugify(keyword).slice(0, 80) || "keyword";
    sourceChunks.forEach((text, chunkIndex) => {
      chunks.push({
        id: `kw_${keywordId}_${sourceId}_chunk_${String(chunkIndex + 1).padStart(2, "0")}`,
        keyword,
        sourceUrl: result.value.finalUrl,
        sourceRank: index + 1,
        text,
      });
    });
    sources.push({
      url: result.value.finalUrl,
      rank: index + 1,
      characterCount: result.value.text.length,
      chunkCount: sourceChunks.length,
    });
  });

  if (!chunks.length) {
    throw new Error("Keine der Top-Seiten enthielt indexierbaren Artikeltext.");
  }

  const embeddings = await embedChunks(chunks);
  await upsertChunks(chunks, embeddings, indexName, namespace);
  return {
    indexName,
    namespace,
    sourceCount: sources.length,
    chunkCount: chunks.length,
    sources,
    failures,
  };
}
