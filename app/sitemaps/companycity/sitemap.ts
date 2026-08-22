

import { cities, getServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import type { MetadataRoute } from "next";

const BASE_URL = "https://umzugshelden.io";

function createEntry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  const url = `${BASE_URL}${path}`;

  return {
    url,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
    alternates: {
      languages: {
        de: url,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = getServices();
  const companyCities = cities.map((city) => {
    const cityPath = `/stadt/${slugify(city)}`;
    return createEntry(cityPath, 0.8);
  });
  const companyCityServices = cities.flatMap((city) => {
    const cityPath = `/stadt/${slugify(city)}`;

    return services.map((service) =>
      createEntry(`${cityPath}/${service}`, 0.7),
    );
  });

  return [...companyCities, ...companyCityServices];
}
