

import { cities } from "@/statics/Lists";
import type { MetadataRoute } from "next";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {



  const companyCities = cities.map((city) => ({
    url: `https://www.gs-creatives.de/stadt/${city}`,
    lastModified: new Date(),
    priority: 0.8,
    alternates: {
      languages: {
        de: `https://www.gs-creatives.de/stadt/${city}`,
      },
    },
  }))


  return [...companyCities]
}
