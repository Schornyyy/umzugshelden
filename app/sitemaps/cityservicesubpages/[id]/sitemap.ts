import type { MetadataRoute } from 'next';
import { getGalbauServices } from '@/statics/Lists';
import { ALLOWED_CITY_SLUGS } from '@/lib/allowedCities';
import { slugify } from '@/utils/slugify';

const BASE_URL = 'https://www.landschaftshelden.io';
// Only expose the offer landing pages per service per allowed city
const SUBPAGE = 'angebot';
const CHUNK_SIZE = 45000; // stay below 50k per sitemap

function generateAllUrls(): MetadataRoute.Sitemap {
  const now = new Date();
  return ALLOWED_CITY_SLUGS.flatMap(city =>
    getGalbauServices().flatMap(service => {
      const s = slugify(service);
      return [{
        url: `${BASE_URL}/stadt/${city}/${s}/${SUBPAGE}`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: 'weekly',
        alternates: { languages: { de: `${BASE_URL}/stadt/${city}/${s}/${SUBPAGE}` } }
      }];
    })
  );
}

export async function generateSitemaps() {
  const total = generateAllUrls().length;
  const count = Math.ceil(total / CHUNK_SIZE);
  return Array.from({ length: count }, (_, i) => ({ id: i.toString() }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const all = generateAllUrls();
  const start = id * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  return all.slice(start, end);
}
