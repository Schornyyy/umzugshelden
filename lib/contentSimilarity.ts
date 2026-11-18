/**
 * Misst, wie viel Text einer Seite wörtlich auch auf einer anderen vorkommt
 * (Duplicate-/Thin-Content-Prüfung für Stadtseiten).
 */

const SHINGLE_SIZE = 5;

/** Felder ohne sichtbaren Fließtext (IDs, Layout, Bild- und Link-Ziele). */
const NON_TEXT_KEYS = new Set([
  "id",
  "type",
  "tone",
  "style",
  "enabled",
  "headingLevel",
  "image",
  "src",
  "href",
  "url",
  "ctaUrl",
  "primaryUrl",
  "secondaryUrl",
  "backgroundImage",
  "imagePosition",
  "columns",
  "aspectRatio",
  "serviceKeys",
  "icon",
  "avatar",
  "videoUrl",
  "embedUrl",
]);

/** Sammelt den sichtbaren Text aller Blöcke. */
export function extractVisibleText(value: unknown, key = ""): string[] {
  if (NON_TEXT_KEYS.has(key)) return [];
  if (typeof value === "string") {
    const text = value.trim();
    return text && !/^(\/|https?:|#|tel:|mailto:)/i.test(text) ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap((entry) => extractVisibleText(entry, key));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, child]) => extractVisibleText(child, childKey));
  }
  return [];
}

/** Kleinschreibung, Stadtnamen neutralisieren, Satzzeichen entfernen. */
export function normalizeForComparison(text: string, cityNames: readonly string[] = []): string {
  let normalized = text.toLocaleLowerCase("de-DE");
  for (const city of [...cityNames].sort((a, b) => b.length - a.length)) {
    if (city.trim()) normalized = normalized.split(city.toLocaleLowerCase("de-DE")).join(" ort ");
  }
  return normalized
    .replace(/\{[a-z]+\}/giu, " ort ")
    .replace(/\*\*|\[|\]\([^)]*\)/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function shingles(normalizedText: string, size = SHINGLE_SIZE): Set<string> {
  const words = normalizedText.split(" ").filter(Boolean);
  const result = new Set<string>();
  if (words.length < size) {
    if (words.length) result.add(words.join(" "));
    return result;
  }
  for (let index = 0; index + size <= words.length; index += 1) {
    result.add(words.slice(index, index + size).join(" "));
  }
  return result;
}

/** Anteil der Shingles von `page`, die auch in `reference` vorkommen (0–1). */
export function containment(page: ReadonlySet<string>, reference: ReadonlySet<string>): number {
  if (!page.size) return 0;
  let shared = 0;
  for (const shingle of page) if (reference.has(shingle)) shared += 1;
  return shared / page.size;
}

/** Fingerprint eines Seiteninhalts für wiederholte Vergleiche. */
export function contentFingerprint(blocks: unknown, cityNames: readonly string[] = []) {
  const text = normalizeForComparison(extractVisibleText(blocks).join(" "), cityNames);
  return { shingles: shingles(text), wordCount: text ? text.split(" ").length : 0 };
}
