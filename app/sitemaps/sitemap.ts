import { cities, getGalbauBranches, getGalbauServices } from '@/statics/Lists';
import { slugify } from '@/utils/slugify';
import type { MetadataRoute } from 'next';
const BASE_URL = 'https://landschaftshelden.io';
const CHUNK_SIZE = 20000;

function generateAllUrls(): MetadataRoute.Sitemap {
  return cities.flatMap((city) =>
    getGalbauServices().flatMap((service) =>
      getGalbauBranches().map((branch) => ({
        url: `${BASE_URL}/stadt/${city}/${slugify(service)}/${slugify(branch)}`,
        lastModified: new Date(),
        priority: 0.8,
        changeFrequency: 'monthly',
        alternates: {
          languages: {
            de: `${BASE_URL}/stadt/${city}/${slugify(service)}/${slugify(branch)}`,
          },
        },
      }))
    )
  );
}

export async function generateSitemaps() {
  const allUrls = generateAllUrls();
  const chunks = Math.ceil(allUrls.length / CHUNK_SIZE);
  return Array.from({ length: chunks }, (_, index) => ({ id: index.toString() }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const allUrls = generateAllUrls();
  const start = id * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  return allUrls.slice(start, end);
}