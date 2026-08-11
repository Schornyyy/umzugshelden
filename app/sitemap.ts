import type { MetadataRoute } from 'next';

const BASE = 'https://umzugshelden.io';

type Freq = MetadataRoute.Sitemap[number]['changeFrequency'];

const staticPages = (
  [
    { url: `${BASE}/`,                   priority: 1.0, changeFrequency: 'weekly'  },
    { url: `${BASE}/umzugsservice`,      priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${BASE}/anstricharbeiten`,   priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${BASE}/moebel-service`,     priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${BASE}/senior-umzug`,       priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${BASE}/entr%C3%BCmpelung`,  priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${BASE}/kontakt`,            priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE}/faq`,                priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE}/jobs`,               priority: 0.7, changeFrequency: 'weekly'  },
    { url: `${BASE}/blog`,               priority: 0.7, changeFrequency: 'daily'   },
    { url: `${BASE}/stadt`,              priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/agb`,                priority: 0.4, changeFrequency: 'yearly'  },
    { url: `${BASE}/datenschutz`,        priority: 0.4, changeFrequency: 'yearly'  },
    { url: `${BASE}/impressum`,          priority: 0.3, changeFrequency: 'yearly'  },
  ] as { url: string; priority: number; changeFrequency: Freq }[]
).map((entry) => ({ ...entry, lastModified: new Date() }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const named = ['blog', 'companycity'];

  const namedList = named.map((n) => ({
    url: `${BASE}/sitemaps/${n}/sitemap.xml`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...namedList];
}