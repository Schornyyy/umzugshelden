import type { MetadataRoute } from 'next';
import { cities, getGalbauServices } from '@/statics/Lists';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Existing branch/service/city mega sitemap chunks
  const branchServiceCityChunkCount = 24; // keep existing assumption

  // New service subpage (angebot, preise, beauftragen, firma-finden) chunks
  const SUBPAGES = ['angebot','preise','beauftragen','firma-finden'];
  const totalServiceSubUrls = cities.length * getGalbauServices().length * SUBPAGES.length;
  const SERVICE_SUB_CHUNK_SIZE = 45000;
  const serviceSubChunkCount = Math.ceil(totalServiceSubUrls / SERVICE_SUB_CHUNK_SIZE);

  const named = [ 'blog','companycity','companycityservice','companies','page' ];

  const branchServiceCityDynamic = Array.from({ length: branchServiceCityChunkCount }, (_, i) => ({
    url: `https://www.landschaftshelden.io/sitemaps/sitemap/${i}.xml`,
    lastModified: new Date(),
  }));

  const serviceSubDynamic = Array.from({ length: serviceSubChunkCount }, (_, i) => ({
    url: `https://www.landschaftshelden.io/sitemaps/cityservicesubpages/${i}.xml`,
    lastModified: new Date(),
  }));

  const namedList = named.map(n => ({
    url: `https://www.landschaftshelden.io/sitemaps/${n}/sitemap.xml`,
    lastModified: new Date(),
  }));

  return [...branchServiceCityDynamic, ...serviceSubDynamic, ...namedList];
}

