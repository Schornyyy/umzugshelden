import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapCount = 24 // Anzahl der dynamisch generierten Sitemaps
  const urls = [
    "blog",
    "companycity",
    "companycityservice",
    "page"
  ]

  const dynamicSitemaps = Array.from({ length: sitemapCount }, (_, i) => ({
    url: `https://www.landschaftshelden.io/sitemaps/sitemap/${i}.xml`,
    lastModified: new Date(),
  }))

  const namedSitemaps = urls.map((name) => ({
    url: `https://www.landschaftshelden.io/sitemaps/${name}/sitemap.xml`,
    lastModified: new Date(),
  }))

  return [...dynamicSitemaps, ...namedSitemaps]
}
