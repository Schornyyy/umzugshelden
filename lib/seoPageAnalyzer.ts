import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { SeoPageMetrics } from "@/types/city/SeoAnalysis";

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 4;
const REQUEST_TIMEOUT_MS = 5_000;
const stopWords = new Set(
  "aber als am an auch auf aus bei bis das dass dem den der des die ein eine einer eines für hat im in ist mit nach nicht oder sich sie sind so und vom von vor was wie wir zu zum zur ihre ihr ihren mehr über".split(
    " "
  )
);

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
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " "));
}

function tagContents(html: string, tag: string): string[] {
  const expression = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return Array.from(html.matchAll(expression), (match) => stripTags(match[1]))
    .filter(Boolean)
    .slice(0, 50);
}

function attribute(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = attribute(tag, "name") || attribute(tag, "property");
    if (name.toLowerCase() === key.toLowerCase()) return attribute(tag, "content");
  }
  return "";
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:")) {
    return true;
  }
  if (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("2001:db8:")
  ) {
    return true;
  }
  if (isIP(normalized) !== 4) return false;
  const [a, b] = normalized.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

async function validatePublicUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Nicht unterstütztes URL-Protokoll: ${rawUrl}`);
  }
  if (url.username || url.password || !url.hostname) {
    throw new Error(`Ungültige URL: ${rawUrl}`);
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error(`Nicht erlaubter Port in URL: ${rawUrl}`);
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Die URL verweist nicht auf eine öffentliche Adresse: ${rawUrl}`);
  }
  return url;
}

async function fetchHtml(rawUrl: string, isAllowedUrl?: (url: string) => boolean): Promise<{
  html: string;
  finalUrl: string;
  statusCode: number;
}> {
  let url = await validatePublicUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (isAllowedUrl && !isAllowedUrl(url.toString())) {
      throw new Error(`Nicht erlaubte Quellseite oder Weiterleitung: ${url}`);
    }
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "UmzugsheldenSEOAnalyzer/1.0",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error(`Zu viele oder ungültige Weiterleitungen: ${rawUrl}`);
      }
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      throw new Error(`${rawUrl} antwortet mit HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`${rawUrl} liefert keine HTML-Seite`);
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_HTML_BYTES) {
      throw new Error(`${rawUrl} ist größer als 1,5 MB`);
    }
    if (!response.body) throw new Error(`${rawUrl} liefert keinen Inhalt`);

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error(`${rawUrl} ist größer als 1,5 MB`);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      html: new TextDecoder().decode(bytes),
      finalUrl: url.toString(),
      statusCode: response.status,
    };
  }
  throw new Error(`Abruf fehlgeschlagen: ${rawUrl}`);
}

function collectSchemaTypes(html: string): string[] {
  const scripts = Array.from(
    html.matchAll(
      /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi
    ),
    (match) => match[1]
  );
  const types = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (key === "@type") {
        const values = Array.isArray(nested) ? nested : [nested];
        values.forEach((type) => {
          if (typeof type === "string") types.add(type);
        });
      }
      visit(nested);
    }
  };
  scripts.forEach((script) => {
    try {
      visit(JSON.parse(script));
    } catch {
      // Invalid JSON-LD is ignored as a schema signal.
    }
  });
  return [...types].sort();
}

export async function analyzeSeoPage(
  rawUrl: string,
  trackedKeywords: string[],
  isAllowedUrl?: (url: string) => boolean,
): Promise<SeoPageMetrics> {
  const { html, finalUrl, statusCode } = await fetchHtml(rawUrl, isAllowedUrl);
  const title = tagContents(html, "title")[0] ?? "";
  const metaDescription = metaContent(html, "description");
  const canonicalTag = (html.match(/<link\b[^>]*rel\s*=\s*(?:"canonical"|'canonical')[^>]*>/i) ??
    html.match(/<link\b[^>]*href[^>]*rel\s*=\s*(?:"canonical"|'canonical')[^>]*>/i))?.[0];
  const canonical = canonicalTag ? attribute(canonicalTag, "href") : "";
  const headings = {
    h1: tagContents(html, "h1"),
    h2: tagContents(html, "h2"),
    h3: tagContents(html, "h3"),
  };
  const content = stripTags(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
  );
  const words = content.toLocaleLowerCase("de").match(/[\p{L}\p{N}-]{3,}/gu) ?? [];
  const frequencies = new Map<string, number>();
  words.forEach((word) => {
    if (!stopWords.has(word)) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  });
  const normalizedContent = ` ${content.toLocaleLowerCase("de")} `;
  const keywordMetrics = trackedKeywords.map((keyword) => ({
    keyword,
    count:
      normalizedContent.split(keyword.toLocaleLowerCase("de")).length - 1,
  }));
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const linkTags = html.match(/<a\b[^>]*href\s*=[^>]*>/gi) ?? [];
  let internalLinks = 0;
  let externalLinks = 0;
  const origin = new URL(finalUrl).origin;
  linkTags.forEach((tag) => {
    const href = attribute(tag, "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
    try {
      if (new URL(href, finalUrl).origin === origin) internalLinks += 1;
      else externalLinks += 1;
    } catch {
      // Malformed links are not counted.
    }
  });
  const schemaTypes = collectSchemaTypes(html);
  const checks = [
    title.length >= 30 && title.length <= 65,
    metaDescription.length >= 120 && metaDescription.length <= 165,
    headings.h1.length === 1,
    headings.h2.length >= 2,
    words.length >= 500,
    Boolean(canonical),
    schemaTypes.length > 0,
    imageTags.length === 0 || imageTags.every((tag) => Boolean(attribute(tag, "alt"))),
    internalLinks >= 3,
    keywordMetrics.length === 0 || keywordMetrics.some(({ count }) => count > 0),
  ];

  return {
    url: rawUrl,
    finalUrl,
    statusCode,
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    canonical,
    robots: metaContent(html, "robots"),
    headings,
    wordCount: words.length,
    topKeywords: [...frequencies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([keyword, count]) => ({ keyword, count })),
    trackedKeywords: keywordMetrics,
    schemaTypes,
    images: imageTags.length,
    imagesWithoutAlt: imageTags.filter((tag) => !attribute(tag, "alt")).length,
    internalLinks,
    externalLinks,
    score: checks.filter(Boolean).length * 10,
  };
}
