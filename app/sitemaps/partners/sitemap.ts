import type { MetadataRoute } from 'next';
import { listPartners } from '@/actions/partnerActions';

const BASE_URL = 'https://www.landschaftshelden.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const partners = await listPartners();

  // Only include active partners
  const active = partners.filter((p) => p.active !== false && !!p.category);

  // Build category lastModified from partners within
  const categoryLatest: Record<string, number> = {};
  for (const p of active) {
    const ts = (p.updatedAt || p.createdAt || Date.now());
    const key = p.category as string;
    categoryLatest[key] = Math.max(categoryLatest[key] || 0, ts);
  }

  const categoryEntries: MetadataRoute.Sitemap = Object.entries(categoryLatest).map(([cat, ts]) => ({
    url: `${BASE_URL}/partners/${cat}`,
    lastModified: new Date(ts),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const partnerEntries: MetadataRoute.Sitemap = active.map((p) => ({
    url: `${BASE_URL}/partners/${p.category}/${p.id}`,
    lastModified: new Date(p.updatedAt || p.createdAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...categoryEntries, ...partnerEntries];
}
