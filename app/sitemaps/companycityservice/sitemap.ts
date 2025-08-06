
import { getAllCompanies } from "@/actions/companyActions";
import { cities, getGalbauServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import type { MetadataRoute } from "next";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


  // Dynamische Produkte abrufen
  const companys = await getAllCompanies() // Holt alle Produkte aus der DB

  if(!companys) return [];


  const companyCityService = cities.flatMap((city) =>
  getGalbauServices().map((service) => ({
    url: `https://www.landschaftshelden.io/stadt/${city}/${slugify(service)}`,
    lastModified: new Date(),
    priority: 0.8,
    alternates: {
      languages: {
        de: `https://www.landschaftshelden.io/stadt/${city}/${slugify(service)}`,
      },
    },
  }))
);


  return [ ...companyCityService]
}
