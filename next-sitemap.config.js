const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobsmith.de';

module.exports = {
  siteUrl,
  generateRobotsTxt: true, // Automatisch eine robots.txt generieren
  exclude: [], // Falls es Seiten gibt, die ausgeschlossen werden sollen
  changefreq: 'daily',
  priority: 0.7,
  additionalPaths: async (config) => {
    // Dynamische Routen hinzufügen
    const res = await fetch(`http://localhost:3000/api/companies`); // API-Route oder Datenquelle
    const companies = await res.json();

    return companies.map((company) => ({
      loc: `/unternehmen/${company.id}`, // Dynamische URL
      lastmod: new Date().toISOString(), // Letzte Änderung (optional)
      changefreq: 'weekly', // Optional, falls von der Standard-Konfiguration abweichend
      priority: 0.8, // Optional, falls von der Standard-Konfiguration abweichend
    }));
  },
};
