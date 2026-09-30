
import { cities, getServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import { CITY_SERVICE_CONTENT_LAST_MODIFIED } from "@/lib/cityServiceSeo";
import {
  getCityLandingSitemapRecords,
  getCityServiceSitemapRecords,
} from "@/actions/cityServicePageActions";
import type { MetadataRoute } from "next";

const BASE_URL = "https://umzugshelden.io";

function createEntry(
  path: string,
  priority: number,
  lastModified: string | Date = CITY_SERVICE_CONTENT_LAST_MODIFIED,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = getServices();
  const [storedPages, storedLandingPages] = await Promise.all([
    getCityServiceSitemapRecords(),
    getCityLandingSitemapRecords(),
  ]);
  const storedPageByKey = new Map(
    storedPages.map((page) => [
      `${page.citySlug}__${page.serviceKey}`,
      page,
    ]),
  );
  const storedLandingPageBySlug = new Map(
    storedLandingPages.map((page) => [page.citySlug, page]),
  );
  const companyCities = cities.flatMap((city) => {
    const cityPath = `/stadt/${slugify(city)}`;
    const storedPage = storedLandingPageBySlug.get(slugify(city));
    if (storedPage && !storedPage.published) return [];
    return [
      createEntry(
        cityPath,
        0.8,
        storedPage?.updatedAt
          ? new Date(storedPage.updatedAt)
          : CITY_SERVICE_CONTENT_LAST_MODIFIED,
      ),
    ];
  });
  const companyCityServices = cities.flatMap((city) => {
    const cityPath = `/stadt/${slugify(city)}`;

    return services.flatMap((service) => {
      const storedPage = storedPageByKey.get(`${slugify(city)}__${service}`);
      if (storedPage && !storedPage.published) return [];
      return [
        createEntry(
          `${cityPath}/${service}`,
          0.7,
          storedPage?.updatedAt
            ? new Date(storedPage.updatedAt)
            : CITY_SERVICE_CONTENT_LAST_MODIFIED,
        ),
      ];
    });
  });

  return [...companyCities, ...companyCityServices];
}
