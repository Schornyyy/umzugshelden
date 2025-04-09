import { getAllCompanies } from "@/actions/companyActions";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


    const staticPages = [
        {
            url: "https://landschaftshelden.io",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io",
              },
            },
        },
        {
            url: "https://www.landschaftshelden.io/fuer-unternehmen",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://www.landschaftshelden.io/fuer-unternehmen",
              },
            },
        },
        {
            url: "https://www.landschaftshelden.io/unternehmen-finden",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://www.landschaftshelden.io/unternehmen-finden",
              },
            },
        },
        {
            url: "https://www.landschaftshelden.io/kontakt",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://www.landschaftshelden.io/kontakt",
              },
            },
        },
        {
            url: "https://www.landschaftshelden.io/impressum",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://www.landschaftshelden.io/impressum",
              },
            },
        },
        {
            url: "https://www.landschaftshelden.io/datenschutz",
            lastModified: new Date(),
            priority: 1.0,
            alternates: {
              languages: {
                de: "https://www.landschaftshelden.io/datenschutz",
              },
            },
        },
    ]

    const companys = await getAllCompanies();

    if(!companys) return [];

    const companyPages = companys.map((company) => ({
        url: `https://www.landschaftshelden.io/unternehmen/${company.id}`,
        lastModified: new Date(), // Falls vorhanden
        priority: 0.8,
        mobileFriendly: true,
        changeFrequency: "weekly",
        alternates: {
        languages: {
            de: `https://www.landschaftshelden.io/kontakt`,
        },
        },
    }))

    return [...staticPages, ...companyPages]
}