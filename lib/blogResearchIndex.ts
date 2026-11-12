import "server-only";

import { createHash } from "node:crypto";
import { discoverSeoCompetitorUrls } from "@/lib/googleSeoSearch";
import { scrapeSeoPageText } from "@/lib/seoPageAnalyzer";
import { createOverlappingTextChunks } from "@/lib/blogResearchText";
import { upsertVectorRecords } from "@/lib/vectorIndex";
import { slugify } from "@/utils/slugify";

const DEFAULT_INDEX_NAME = "blog-knowledge";
const DEFAULT_NAMESPACE = "blog-research";

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

  await upsertVectorRecords(
    chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      metadata: {
        keyword: chunk.keyword,
        source_url: chunk.sourceUrl,
        source_rank: chunk.sourceRank,
      },
    })),
    indexName,
    namespace,
  );
  return {
    indexName,
    namespace,
    sourceCount: sources.length,
    chunkCount: chunks.length,
    sources,
    failures,
  };
}
