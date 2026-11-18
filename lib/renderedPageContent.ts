import "server-only";

import { normalizeForComparison, shingles } from "@/lib/contentSimilarity";

const FETCH_TIMEOUT_MS = 30_000;
const CONTENT_MARKER = 'data-page-content="true"';

/** Sichtbarer Seiteninhalt (ohne Navigation/Footer) als normalisierter Text. */
function contentSection(html: string): string | null {
  const start = html.indexOf(CONTENT_MARKER);
  if (start < 0) return null;
  const end = html.indexOf("<footer", start);
  return html.slice(start, end > start ? end : undefined);
}

export function extractRenderedContent(html: string, cityName: string): string | null {
  const section = contentSection(html);
  if (section === null) return null;
  const text = section
    // Bedienoberfläche wie Navigation behandeln: Formulare und Anfrage-Blöcke zählen nicht als Inhalt
    .replace(/<form[\s\S]*?<\/form>/giu, " ")
    .replace(/<section[^>]*data-lead-ui="true"[\s\S]*?<\/section>/giu, " ")
    // Seitenweite Bausteine (z. B. Bewertungs-Karussell) sind auf jeder Seite gleich – wie Navigation/Footer
    .replace(/<div[^>]*data-sitewide="true"[^>]*>[\s\S]*?<\/section>/giu, " ")
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&#x27;|&#39;/gu, "'")
    .replace(/&amp;/gu, "&")
    .replace(/&[a-z#0-9]+;/giu, " ");
  return normalizeForComparison(text, [cityName]);
}

/**
 * Lädt die ausgelieferte Seite und liefert ihren Fingerprint – so wird gemessen,
 * was Google tatsächlich sieht (inkl. vom Renderer ergänzter Texte).
 */
export async function fetchRenderedFingerprint(origin: string, path: string, cityName: string) {
  const response = await fetch(new URL(encodeURI(path), origin), {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "Umzugshelden-Duplicate-Check/1.0" },
  });
  if (!response.ok) return null;
  const html = await response.text();
  const text = extractRenderedContent(html, cityName);
  if (text === null) return null;
  const images = new Set(
    [...(contentSection(html) ?? "").matchAll(/<img[^>]*?src="([^"]+)"/gu)].map((match) => match[1]),
  );
  return { shingles: shingles(text), wordCount: text ? text.split(" ").length : 0, imageCount: images.size };
}

export type RenderedFingerprint = NonNullable<Awaited<ReturnType<typeof fetchRenderedFingerprint>>>;
