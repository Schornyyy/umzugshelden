const BASE_URL = "https://umzugshelden.io";

const SITEMAPS = ["static", "blog", "companycity"] as const;

export const dynamic = "force-static";

export async function GET() {
  const lastmod = new Date().toISOString();

  const entries = SITEMAPS.map(
    (name) =>
      `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${name}/sitemap.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
