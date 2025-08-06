

import { getAllCompanies } from "@/actions/companyActions";
import { cities } from "@/statics/Lists";
import type { MetadataRoute } from "next";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


  // Dynamische Produkte abrufen
  const companys = await getAllCompanies() // Holt alle Produkte aus der DB

  if(!companys) return [];


  const companyCities = cities.map((city) => ({
    url: `https://www.landschaftshelden.io/stadt/${city}`,
    lastModified: new Date(),
    priority: 0.8,
    alternates: {
      languages: {
        de: `https://www.landschaftshelden.io/stadt/${city}`,
      },
    },
  }))


  return [...companyCities]
}
