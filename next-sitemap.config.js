const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gs-creatives.de';

module.exports = {
  siteUrl,
  generateRobotsTxt: true, // Automatisch eine robots.txt generieren
  exclude: [], // Falls es Seiten gibt, die ausgeschlossen werden sollen
  changefreq: 'daily',
  priority: 0.7,
  additionalPaths: async () => {
    // Dynamische Routen hinzufügen, aber build-resilient (kein localhost zur Build-Zeit)
    const apiBase = process.env.SITEMAP_API_URL || siteUrl;
    if (!apiBase || !/^https?:\/\//i.test(apiBase)) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/companies`, {
        signal: controller.signal,
        // Avoid caching stale data if a CDN sits in front
        headers: { 'cache-control': 'no-cache' },
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const companies = await res.json();
      if (!Array.isArray(companies)) return [];

      return companies.map((company) => ({
        loc: `/unternehmen/${company.id}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      }));
    } catch {
      // Keine harten Fehler bei Post-Build Sitemap
      return [];
    }
  },
};
