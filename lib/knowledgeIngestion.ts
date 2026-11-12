import "server-only";

import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { parseBuffer } from "music-metadata";
import { createOverlappingTextChunks } from "@/lib/blogResearchText";
import {
  KNOWLEDGE_LIMITS,
  type KnowledgeCategory,
  type KnowledgeSourceType,
} from "@/lib/knowledgeSettings";
import {
  scrapeSeoPageText,
  validatePublicUrl,
} from "@/lib/seoPageAnalyzer";
import { upsertVectorRecords, type VectorRecord } from "@/lib/vectorIndex";

const MAX_REDIRECTS = 4;
const MAX_RSS_BYTES = 5 * 1024 * 1024;
const REMOTE_TIMEOUT_MS = 30_000;

type IngestionInput = {
  sourceId: string;
  type: KnowledgeSourceType;
  creatorId: string;
  creatorName: string;
  category: KnowledgeCategory;
  title: string;
  sourceUrl?: string;
  contentUrl?: string;
  fileName?: string;
};

export type KnowledgeIngestionResult = {
  chunkCount: number;
  pageCount?: number;
  resolvedTitle: string;
};

type GeminiFile = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: string;
};

function knowledgeTarget() {
  return {
    indexName:
      process.env.PINECONE_INDEX_NAME?.trim() || "blog-knowledge",
    namespace:
      process.env.PINECONE_KNOWLEDGE_NAMESPACE?.trim() || "knowledge-base",
  };
}

function vectorId(sourceId: string, index: number) {
  return `kb_${sourceId}_${String(index + 1).padStart(4, "0")}`;
}

function buildRecords(
  input: IngestionInput,
  chunks: Array<{ text: string; page?: number }>,
  sourceUrl?: string,
): VectorRecord[] {
  return chunks.map((chunk, index) => ({
    id: vectorId(input.sourceId, index),
    text: chunk.text,
    metadata: {
      source_id: input.sourceId,
      source_type: input.type,
      source_title: input.title,
      source_url: sourceUrl ?? "",
      creator_id: input.creatorId,
      creator_name: input.creatorName,
      category: input.category,
      chunk_index: index,
      ...(chunk.page ? { page: chunk.page } : {}),
    },
  }));
}

async function fetchRemoteBytes(
  rawUrl: string,
  maxBytes: number,
  acceptedContentTypes: string[],
): Promise<{ bytes: Uint8Array; contentType: string; finalUrl: string }> {
  let url = await validatePublicUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "UmzugsheldenKnowledgeImporter/1.0" },
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error("Die Quelle enthält zu viele Weiterleitungen.");
      }
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      throw new Error(`Die Quelle antwortet mit HTTP ${response.status}.`);
    }
    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (
      acceptedContentTypes.length &&
      !acceptedContentTypes.some((accepted) => contentType.includes(accepted))
    ) {
      throw new Error(`Nicht unterstützter Inhaltstyp: ${contentType || "unbekannt"}.`);
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > maxBytes) {
      throw new Error(`Die Quelle überschreitet das Limit von ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    }
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error(`Die Quelle überschreitet das Limit von ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    }
    return { bytes: buffer, contentType, finalUrl: url.toString() };
  }
  throw new Error("Die Quelle konnte nicht geladen werden.");
}

async function extractPdfPages(pdfUrl: string) {
  const { bytes } = await fetchRemoteBytes(
    pdfUrl,
    KNOWLEDGE_LIMITS.pdfBytes,
    ["application/pdf"],
  );
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  try {
    if (pageCount > KNOWLEDGE_LIMITS.pdfPages) {
      throw new Error(
        `Die PDF hat ${pageCount} Seiten. Erlaubt sind maximal ${KNOWLEDGE_LIMITS.pdfPages}.`,
      );
    }

    const pages: Array<{ page: number; text: string }> = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .flatMap((item) =>
          "str" in item && typeof item.str === "string" ? [item.str] : [],
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pages.push({ page: pageNumber, text });
      page.cleanup();
    }
    if (!pages.length) {
      throw new Error(
        "Die PDF enthält keinen extrahierbaren Text. Gescannte PDFs benötigen OCR.",
      );
    }
    return { pages, pageCount };
  } finally {
    await loadingTask.destroy();
  }
}

function normalizeTitle(value: string) {
  return value
    .toLocaleLowerCase("de")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function audioMimeType(url: string, contentType: string) {
  if (contentType.startsWith("audio/")) return contentType;
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  if (extension === "m4a" || extension === "mp4") return "audio/mp4";
  if (extension === "wav") return "audio/wav";
  if (extension === "ogg" || extension === "oga") return "audio/ogg";
  if (extension === "flac") return "audio/flac";
  return "audio/mpeg";
}

async function getSpotifyTitle(spotifyUrl: string): Promise<string> {
  const url = new URL(spotifyUrl);
  if (
    url.hostname !== "open.spotify.com" ||
    !url.pathname.startsWith("/episode/")
  ) {
    throw new Error("Bitte einen gültigen Spotify-Episodenlink angeben.");
  }
  const response = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) {
    throw new Error("Die Spotify-Episode konnte nicht gelesen werden.");
  }
  const payload = (await response.json()) as { title?: string };
  if (!payload.title?.trim()) {
    throw new Error("Spotify hat keinen Episodentitel geliefert.");
  }
  return payload.title.trim();
}

function titleSimilarity(first: string, second: string) {
  const firstTokens = new Set(normalizeTitle(first).split(" ").filter(Boolean));
  const secondTokens = new Set(normalizeTitle(second).split(" ").filter(Boolean));
  if (!firstTokens.size || !secondTokens.size) return 0;
  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return overlap / Math.max(firstTokens.size, secondTokens.size);
}

async function findOriginalPodcastAudio(
  episodeTitle: string,
): Promise<string> {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(episodeTitle)}&media=podcast&entity=podcastEpisode&limit=50&country=DE`,
    {
      headers: { "user-agent": "UmzugsheldenKnowledgeImporter/1.0" },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    throw new Error("Die originale Podcastquelle konnte nicht gesucht werden.");
  }
  const payload = (await response.json()) as {
    results?: Array<{
      trackName?: string;
      episodeUrl?: string;
    }>;
  };
  const candidates = (payload.results ?? [])
    .filter(
      (candidate): candidate is { trackName: string; episodeUrl: string } =>
        Boolean(candidate.trackName?.trim() && candidate.episodeUrl?.trim()),
    )
    .map((candidate) => ({
      ...candidate,
      similarity: titleSimilarity(episodeTitle, candidate.trackName),
    }))
    .sort((first, second) => second.similarity - first.similarity);
  const match = candidates[0];
  if (!match || match.similarity < 0.65) {
    throw new Error(
      "Zur Spotify-Episode wurde keine eindeutig passende öffentliche Original-Audioquelle gefunden.",
    );
  }
  return match.episodeUrl;
}

function rssItems(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") return [];
  const root = value as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };
  const items = root.rss?.channel?.item ?? root.feed?.entry;
  if (!items) return [];
  return (Array.isArray(items) ? items : [items]).filter(
    (item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
  );
}

function valueText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as { "#text"?: unknown })["#text"];
    return typeof text === "string" ? text : "";
  }
  return "";
}

function enclosureUrl(item: Record<string, unknown>): string {
  for (const candidate of [item.enclosure, item["media:content"], item.link]) {
    const values = Array.isArray(candidate) ? candidate : [candidate];
    for (const value of values) {
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const url = record["@_url"] ?? record["@_href"];
        const type = String(record["@_type"] ?? "");
        if (
          typeof url === "string" &&
          (!type || type.startsWith("audio/"))
        ) {
          return url;
        }
      }
    }
  }
  return "";
}

async function resolveAudio(
  spotifyUrl: string,
  contentUrl?: string,
): Promise<{ bytes: Uint8Array; contentType: string; title: string }> {
  const spotifyTitle = await getSpotifyTitle(spotifyUrl);
  const resolvedContentUrl =
    contentUrl || (await findOriginalPodcastAudio(spotifyTitle));
  const source = await fetchRemoteBytes(resolvedContentUrl, KNOWLEDGE_LIMITS.audioBytes, [
    "audio/",
    "xml",
    "rss",
    "application/octet-stream",
  ]);
  const prefix = new TextDecoder()
    .decode(source.bytes.slice(0, 100))
    .trimStart();
  if (source.contentType.includes("audio/") || !prefix.startsWith("<")) {
    return {
      bytes: source.bytes,
      contentType: audioMimeType(source.finalUrl, source.contentType),
      title: spotifyTitle,
    };
  }

  if (source.bytes.byteLength > MAX_RSS_BYTES) {
    throw new Error("Der RSS-Feed ist ungewöhnlich groß.");
  }
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  }).parse(new TextDecoder().decode(source.bytes)) as unknown;
  const targetTitle = normalizeTitle(spotifyTitle);
  const item = rssItems(parsed).find((candidate) => {
    const title = normalizeTitle(valueText(candidate.title));
    return (
      Boolean(title) &&
      (title === targetTitle ||
        title.includes(targetTitle) ||
        targetTitle.includes(title))
    );
  });
  if (!item) {
    throw new Error(
      "Die Spotify-Episode wurde im angegebenen RSS-Feed nicht gefunden.",
    );
  }
  const audioUrl = enclosureUrl(item);
  if (!audioUrl) {
    throw new Error("Der RSS-Eintrag enthält keine originale Audioquelle.");
  }
  const audio = await fetchRemoteBytes(audioUrl, KNOWLEDGE_LIMITS.audioBytes, [
    "audio/",
    "application/octet-stream",
  ]);
  return {
    bytes: audio.bytes,
    contentType: audioMimeType(audio.finalUrl, audio.contentType),
    title: spotifyTitle,
  };
}

async function uploadGeminiFile(
  bytes: Uint8Array,
  mimeType: string,
  displayName: string,
): Promise<GeminiFile> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY fehlt in der Umgebung");
  const start = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!start.ok) {
    const detail = await start.text().catch(() => "");
    console.error("Gemini file upload start failed", start.status, detail);
    throw new Error("Die Audio-Datei konnte nicht an Gemini übertragen werden.");
  }
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Gemini hat keine Upload-URL geliefert.");

  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: Buffer.from(bytes),
    signal: AbortSignal.timeout(10 * 60_000),
  });
  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    console.error("Gemini file upload failed", upload.status, detail);
    throw new Error("Die Audio-Datei konnte nicht an Gemini übertragen werden.");
  }
  const payload = (await upload.json()) as { file?: GeminiFile };
  if (!payload.file?.name) {
    throw new Error("Gemini hat keine gültige Audio-Datei zurückgegeben.");
  }
  return payload.file;
}

async function waitForGeminiFile(file: GeminiFile): Promise<GeminiFile> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || !file.name) throw new Error("Gemini-Datei ist ungültig.");
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    if (!response.ok) {
      throw new Error("Der Gemini-Verarbeitungsstatus konnte nicht gelesen werden.");
    }
    const current = (await response.json()) as GeminiFile;
    if (current.state === "ACTIVE") return current;
    if (current.state === "FAILED") {
      throw new Error("Gemini konnte die Audio-Datei nicht verarbeiten.");
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("Die Audio-Verarbeitung bei Gemini hat zu lange gedauert.");
}

async function deleteGeminiFile(fileName: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${encodeURIComponent(apiKey)}`,
    { method: "DELETE", signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) {
    console.error("Temporäre Gemini-Datei konnte nicht gelöscht werden", response.status);
  }
}

async function transcribeAudio(
  bytes: Uint8Array,
  mimeType: string,
  title: string,
): Promise<string> {
  const metadata = await parseBuffer(Buffer.from(bytes), { mimeType });
  const duration = metadata.format.duration;
  if (
    duration &&
    duration > KNOWLEDGE_LIMITS.audioHours * 60 * 60
  ) {
    throw new Error(
      `Das Audio ist länger als ${KNOWLEDGE_LIMITS.audioHours} Stunden.`,
    );
  }

  const uploaded = await uploadGeminiFile(bytes, mimeType, title);
  try {
    const active = await waitForGeminiFile(uploaded);
    if (!active.uri || !active.mimeType) {
      throw new Error("Gemini hat keine nutzbare Audio-Referenz geliefert.");
    }
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey ?? "",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Transkribiere diese Podcast-Episode vollständig und wortgetreu. Gib ausschließlich den bereinigten Transkripttext ohne Zusammenfassung oder Markdown aus.",
                },
                {
                  file_data: {
                    mime_type: active.mimeType,
                    file_uri: active.uri,
                  },
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 65536, temperature: 0 },
        }),
        signal: AbortSignal.timeout(10 * 60_000),
      },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Gemini transcription failed", response.status, detail);
      throw new Error("Gemini konnte das Audio nicht transkribieren.");
    }
    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const transcript = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();
    if (!transcript) throw new Error("Gemini hat kein Transkript geliefert.");
    return transcript;
  } finally {
    if (uploaded.name) await deleteGeminiFile(uploaded.name);
  }
}

export async function ingestKnowledgeSource(
  input: IngestionInput,
): Promise<KnowledgeIngestionResult> {
  const target = knowledgeTarget();
  let chunks: Array<{ text: string; page?: number }> = [];
  let resolvedTitle = input.title;
  let pageCount: number | undefined;
  let resolvedUrl = input.sourceUrl;

  if (input.type === "website") {
    if (!input.sourceUrl) throw new Error("Website-URL fehlt.");
    const page = await scrapeSeoPageText(input.sourceUrl);
    resolvedUrl = page.finalUrl;
    chunks = createOverlappingTextChunks(page.text).map((text) => ({ text }));
  } else if (input.type === "pdf") {
    if (!input.contentUrl) throw new Error("PDF-Datei fehlt.");
    resolvedUrl = input.contentUrl;
    const pdf = await extractPdfPages(input.contentUrl);
    pageCount = pdf.pageCount;
    chunks = pdf.pages.flatMap(({ page, text }) =>
      createOverlappingTextChunks(text).map((chunk) => ({
        text: chunk,
        page,
      })),
    );
  } else {
    if (!input.sourceUrl) {
      throw new Error("Spotify-Episodenlink fehlt.");
    }
    const audio = await resolveAudio(input.sourceUrl, input.contentUrl);
    resolvedTitle = audio.title;
    const transcript = await transcribeAudio(
      audio.bytes,
      audio.contentType || "audio/mpeg",
      audio.title,
    );
    chunks = createOverlappingTextChunks(transcript).map((text) => ({ text }));
  }

  if (!chunks.length) {
    throw new Error("Die Quelle enthält keinen vektorisierbaren Text.");
  }
  await upsertVectorRecords(
    buildRecords({ ...input, title: resolvedTitle }, chunks, resolvedUrl),
    target.indexName,
    target.namespace,
  );
  return { chunkCount: chunks.length, pageCount, resolvedTitle };
}

export function knowledgeSourceId() {
  return createHash("sha256")
    .update(`${crypto.randomUUID()}-${Date.now()}`)
    .digest("hex")
    .slice(0, 24);
}
