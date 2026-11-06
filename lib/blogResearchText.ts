function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name] ?? match);
}

export function cleanArticleHtml(html: string): string {
  const article =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;
  return decodeHtml(
    article
      .replace(
        /<(script|style|noscript|nav|footer|header|aside|menu|form|dialog|button|svg|canvas|iframe)\b[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|hr)\b[^>]*>/gi, "\n")
      .replace(/<\/(p|div|section|article|main|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function createOverlappingTextChunks(
  value: string,
  length = 700,
  overlap = 100,
): string[] {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Die Chunk-Länge muss eine positive Ganzzahl sein.");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= length) {
    throw new Error("Der Chunk-Overlap muss kleiner als die Chunk-Länge sein.");
  }

  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + length, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(length * 0.6)) end = boundary;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;

    const overlapStart = Math.max(0, end - overlap);
    const nextBoundary = text.indexOf(" ", overlapStart);
    start =
      nextBoundary >= overlapStart && nextBoundary < end
        ? nextBoundary + 1
        : overlapStart;
  }
  return chunks;
}
