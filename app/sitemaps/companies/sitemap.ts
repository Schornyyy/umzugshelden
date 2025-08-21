import { getAllCompanies } from "@/actions/companyActions";
import type { MetadataRoute } from "next";

// /sitemaps/companies/sitemap.xml
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const companies = await getAllCompanies(true);

  if (!companies || companies.length === 0) return [];

  const companyPages: MetadataRoute.Sitemap = companies
    .filter(c => c.id && c.public) // only public profiles
    .map(c => ({
      url: `https://www.landschaftshelden.io/unternehmen/${c.id}`,
      lastModified: new Date(),
      priority: 0.7,
      alternates: {
        languages: {
          de: `https://www.landschaftshelden.io/unternehmen/${c.id}`,
        },
      },
    }));

  return [...companyPages];
}
