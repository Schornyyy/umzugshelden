import "server-only";

const GOOGLE_SEARCH_TIMEOUT_MS = 8_000;
const EXCLUDED_HOSTNAMES = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
];
const GOOGLE_HOSTNAME_PATTERN =
  /(^|\.)google\.[a-z.]+$|(^|\.)googleusercontent\.com$|(^|\.)gstatic\.com$/iu;
const BING_HOSTNAME_PATTERN = /(^|\.)bing\.com$|(^|\.)microsoft\.com$/iu;

export type SeoSearchDiscovery = {
  competitorUrls: string[];
  targetRank?: number;
};

function normalizedHostname(url: URL): string {
  return url.hostname.toLocaleLowerCase("de").replace(/^www\./, "");
}

function isExcludedHostname(hostname: string): boolean {
  return (
    GOOGLE_HOSTNAME_PATTERN.test(hostname) ||
    BING_HOSTNAME_PATTERN.test(hostname) ||
    EXCLUDED_HOSTNAMES.some(
      (excluded) => hostname === excluded || hostname.endsWith(`.${excluded}`),
    )
  );
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&#x2F;/giu, "/")
    .replace(/&#(\d+);/gu, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    );
}

function extractGoogleResultUrls(html: string): URL[] {
  const urls: URL[] = [];
  const seen = new Set<string>();
  const anchorPattern =
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/giu;

  for (const match of html.matchAll(anchorPattern)) {
    const rawHref = decodeHtmlAttribute(match[1] ?? match[2] ?? "").trim();
    if (!rawHref || rawHref.startsWith("#")) continue;

    try {
      const googleUrl = new URL(rawHref, "https://www.google.com");
      const redirectedUrl =
        googleUrl.pathname === "/url"
          ? googleUrl.searchParams.get("q") ??
            googleUrl.searchParams.get("url")
          : null;
      const resultUrl = redirectedUrl
        ? new URL(redirectedUrl)
        : googleUrl;
      const hostname = normalizedHostname(resultUrl);
      if (
        !["http:", "https:"].includes(resultUrl.protocol) ||
        isExcludedHostname(hostname)
      ) {
        continue;
      }
      resultUrl.hash = "";
      const normalizedUrl = resultUrl.toString();
      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);
      urls.push(resultUrl);
    } catch {
      // Malformed links in Google's HTML are not search results.
    }
  }
  return urls;
}

function extractBingResultUrls(html: string): URL[] {
  const urls: URL[] = [];
  const resultPattern =
    /<li\b[^>]*class\s*=\s*(?:"[^"]*\bb_algo\b[^"]*"|'[^']*\bb_algo\b[^']*')[^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')/giu;

  for (const match of html.matchAll(resultPattern)) {
    const rawHref = decodeHtmlAttribute(match[1] ?? match[2] ?? "");
    try {
      const bingUrl = new URL(rawHref);
      const encodedTarget =
        normalizedHostname(bingUrl).endsWith("bing.com") &&
        bingUrl.pathname === "/ck/a"
          ? bingUrl.searchParams.get("u")
          : null;
      const decodedTarget =
        encodedTarget?.startsWith("a1")
          ? Buffer.from(encodedTarget.slice(2), "base64url").toString("utf8")
          : null;
      const resultUrl = decodedTarget ? new URL(decodedTarget) : bingUrl;
      if (
        !["http:", "https:"].includes(resultUrl.protocol) ||
        isExcludedHostname(normalizedHostname(resultUrl))
      ) {
        continue;
      }
      resultUrl.hash = "";
      urls.push(resultUrl);
    } catch {
      // Malformed links in the HTTP response are not search results.
    }
  }
  return urls;
}

const SEARCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "de-DE,de;q=0.9,en;q=0.7",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

export async function discoverSeoCompetitorUrls(
  keyword: string,
  targetUrl: string,
  limit = 5,
): Promise<string[]> {
  const result = await discoverSeoSearchResults(keyword, targetUrl, limit);
  return result.competitorUrls;
}

export async function discoverSeoSearchResults(
  keyword: string,
  targetUrl: string,
  limit = 5,
): Promise<SeoSearchDiscovery> {
  const searchUrl = new URL("https://www.google.com/search");
  searchUrl.search = new URLSearchParams({
    q: keyword,
    num: "10",
    hl: "de",
    gl: "de",
    filter: "0",
    pws: "0",
  }).toString();
  const response = await fetch(searchUrl, {
    headers: {
      ...SEARCH_HEADERS,
      cookie: "CONSENT=YES+cb.20220419-08-p0.de+FX+111",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(GOOGLE_SEARCH_TIMEOUT_MS),
  });
  const html = await response.text();
  const googleBlocked =
    !response.ok ||
    /unusual traffic|ungewöhnlichen Datenverkehr|g-recaptcha|captcha-form/iu.test(
      html,
    ) ||
    html.includes("/httpservice/retry/enablejs");
  let resultUrls = googleBlocked ? [] : extractGoogleResultUrls(html);

  if (resultUrls.length === 0) {
    console.warn(
      "Google HTTP search returned no readable results; using HTTP fallback",
      response.status,
    );
    const fallbackUrl = new URL("https://www.bing.com/search");
    fallbackUrl.search = new URLSearchParams({
      q: keyword,
      count: "10",
      setlang: "de-DE",
      cc: "DE",
    }).toString();
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: SEARCH_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(GOOGLE_SEARCH_TIMEOUT_MS),
    });
    const fallbackHtml = await fallbackResponse.text();
    if (!fallbackResponse.ok) {
      throw new Error(
        `Die direkten HTTP-Suchabfragen sind fehlgeschlagen (Google: ${response.status}, Fallback: ${fallbackResponse.status}).`,
      );
    }
    resultUrls = extractBingResultUrls(fallbackHtml);
  }

  const targetHostname = normalizedHostname(new URL(targetUrl));
  const competitorHostnames = new Set<string>();
  const urls: string[] = [];
  let targetRank: number | undefined;
  let organicRank = 0;
  for (const url of resultUrls) {
    const hostname = normalizedHostname(url);
    organicRank += 1;
    if (hostname === targetHostname) {
      targetRank ??= organicRank;
      continue;
    }
    if (competitorHostnames.has(hostname)) continue;
    competitorHostnames.add(hostname);
    if (urls.length < limit) urls.push(url.toString());
    if (urls.length === limit && targetRank !== undefined) break;
  }

  return { competitorUrls: urls, targetRank };
}
