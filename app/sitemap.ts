import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Existing branch/service/city mega sitemap chunks


  const named = [ 'blog','companycity', ];

  

  const namedList = named.map(n => ({
    url: `https://umzugshelden.io/sitemaps/${n}/sitemap.xml`,
    lastModified: new Date(),
  }));

  return [ ...namedList];
}