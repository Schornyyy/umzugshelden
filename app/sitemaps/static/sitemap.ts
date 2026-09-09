import type { MetadataRoute } from "next";

const BASE_URL = "https://umzugshelden.io";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const staticPages: { path: string; priority: number; changeFrequency: Freq }[] =
  [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/umzugsservice", priority: 0.9, changeFrequency: "weekly" },
    { path: "/anstricharbeiten", priority: 0.9, changeFrequency: "weekly" },
    { path: "/moebel-service", priority: 0.9, changeFrequency: "weekly" },
    { path: "/senior-umzug", priority: 0.9, changeFrequency: "weekly" },
    { path: "/entr%C3%BCmpelung", priority: 0.9, changeFrequency: "weekly" },
    { path: "/kontakt", priority: 0.8, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    { path: "/jobs", priority: 0.7, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.7, changeFrequency: "daily" },
    { path: "/stadt", priority: 0.7, changeFrequency: "monthly" },
    { path: "/agb", priority: 0.4, changeFrequency: "yearly" },
    { path: "/datenschutz", priority: 0.4, changeFrequency: "yearly" },
    { path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPages.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    priority,
    changeFrequency,
  }));
}
