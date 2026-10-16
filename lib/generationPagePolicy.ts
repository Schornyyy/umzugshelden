import { cities, getServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import type { SeoAiReport, SeoPageMetrics } from "@/types/city/SeoAnalysis";

export type GenerationPage = {
  title: string;
  url: string;
  targetType: "blog" | "stadt" | "dienstleistung";
  keywords?: string[];
  description?: string;
};

export function buildGenerationPages(input: {
  blogs: { titel: string; path?: string; visible: boolean; keywords?: string[]; description: string }[];
  landings: { citySlug: string; published: boolean }[];
  services: { citySlug: string; serviceKey: string; published: boolean }[];
}): GenerationPage[] {
  const landingBySlug = new Map(input.landings.map((page) => [page.citySlug, page]));
  const serviceByKey = new Map(input.services.map((page) => [`${page.citySlug}/${page.serviceKey}`, page]));
  const pages: GenerationPage[] = input.blogs.flatMap((page) => {
    const url = `/blog/${page.path || ""}`;
    return page.visible && generationPagePath(url)
      ? [{ title: page.titel, url, targetType: "blog" as const, keywords: page.keywords, description: page.description }]
      : [];
  });
  for (const city of cities) {
    const slug = slugify(city);
    if (landingBySlug.get(slug)?.published !== false) {
      pages.push({ title: `Unsere Leistungen in ${city}`, url: `/stadt/${slug}`, targetType: "stadt" });
    }
    for (const service of getServices()) {
      if (serviceByKey.get(`${slug}/${service}`)?.published === false) continue;
      pages.push({
        title: `${service.replaceAll("-", " ")} in ${city}`,
        url: `/stadt/${slug}/${service}`,
        targetType: "dienstleistung",
      });
    }
  }
  return pages;
}

export function generationSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
    "https://www.umzugshelden.io";
}

export function generationPagePath(value: string): string | null {
  try {
    const site = new URL(generationSiteUrl());
    const url = new URL(value, site);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username || url.password ||
      url.hostname.replace(/^www\./u, "") !== site.hostname.replace(/^www\./u, "") ||
      url.port !== site.port ||
      url.search || url.hash
    ) return null;
    const path = decodeURI(url.pathname).replace(/\/+$/u, "");
    return /^\/stadt\/[^/]+(?:\/[^/]+)?$/u.test(path) ||
      /^\/blog\/[^/]+(?:\/[^/]+)*$/u.test(path)
      ? path
      : null;
  } catch {
    return null;
  }
}

export function allowedGenerationPage(
  value: string,
  pages: readonly GenerationPage[],
): GenerationPage | undefined {
  const path = generationPagePath(value);
  return path ? pages.find((page) => generationPagePath(page.url) === path) : undefined;
}

export function filterGenerationLinks(text: string, pages: readonly GenerationPage[]): string {
  return text
    .replace(/(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/gu, (_match, label: string, target: string) => {
      const page = allowedGenerationPage(target, pages);
      return page ? `[${label}](${page.url})` : label;
    })
    .replace(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu,
      (_match, target: string, label: string) => {
        const page = allowedGenerationPage(target, pages);
        return page ? `<a href="${page.url}">${label}</a>` : label;
      });
}

export function filterGenerationContent<T>(value: T, pages: readonly GenerationPage[]): T {
  if (typeof value === "string") return filterGenerationLinks(value, pages) as T;
  if (Array.isArray(value)) return value.map((item) => filterGenerationContent(item, pages)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, filterGenerationContent(item, pages)]),
    ) as T;
  }
  return value;
}

export function restrictGenerationAnalysis<T extends {
  pages: Pick<SeoPageMetrics, "url" | "finalUrl">[];
  report: SeoAiReport;
}>(analysis: T, pages: GenerationPage[]): T {
  const report = filterGenerationContent(analysis.report, pages);
  return {
    ...analysis,
    pages: analysis.pages.filter((page) =>
      allowedGenerationPage(page.url, pages) &&
      allowedGenerationPage(page.finalUrl, pages),
    ),
    report: {
      ...report,
      competitorAdvantages: [],
      recommendations: report.recommendations.map(({ priority, area, finding, action }) => ({
        priority, area, finding, action,
      })),
      ...(report.pageBlueprint ? {
        pageBlueprint: {
          ...report.pageBlueprint,
          internalLinkSuggestions: report.pageBlueprint.internalLinkSuggestions.flatMap((link) => {
            const target = allowedGenerationPage(link.targetPage, pages);
            return target ? [{ ...link, targetPage: target.url }] : [];
          }),
        },
      } : {}),
    },
  };
}
