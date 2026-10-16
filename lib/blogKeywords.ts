export type BlogKeywordType = "primary" | "long-tail";

export function normalizeBlogKeyword(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function blogKeywordRegistryId(value: string): string {
  return encodeURIComponent(normalizeBlogKeyword(value));
}

export function mergeBlogKeywords(
  primaryKeyword: string,
  keywords: readonly string[],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const keyword of [primaryKeyword, ...keywords]) {
    const trimmed = keyword.trim();
    const normalized = normalizeBlogKeyword(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }

  return result;
}
