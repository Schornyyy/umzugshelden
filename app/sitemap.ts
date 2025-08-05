import { getAllCompanies } from "@/actions/companyActions";
import { cities, getGalbauServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


    const staticPages = [
        {
            url: "https://landschaftshelden.io",
            lastModified: new Date(),
            priority: 1.0,
            changeFrequency: "weekly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/fuer-unternehmen",
            lastModified: new Date(),
            priority: 0.9,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/fuer-unternehmen",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/unternehmen-finden",
            lastModified: new Date(),
            priority: 0.9,
            changeFrequency: "daily" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/unternehmen-finden",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/auftrag-erstellen",
            lastModified: new Date(),
            priority: 0.9,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/auftrag-erstellen",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/auftrag-bestaetigung",
            lastModified: new Date(),
            priority: 0.6,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/auftrag-bestaetigung",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/stadt",
            lastModified: new Date(),
            priority: 0.8,
            changeFrequency: "weekly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/stadt",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/login",
            lastModified: new Date(),
            priority: 0.7,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/login",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/register/company",
            lastModified: new Date(),
            priority: 0.8,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/register/company",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/forgot-password",
            lastModified: new Date(),
            priority: 0.3,
            changeFrequency: "yearly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/forgot-password",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/contract/verify",
            lastModified: new Date(),
            priority: 0.5,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/contract/verify",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/kontakt",
            lastModified: new Date(),
            priority: 0.6,
            changeFrequency: "monthly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/kontakt",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/impressum",
            lastModified: new Date(),
            priority: 0.4,
            changeFrequency: "yearly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/impressum",
              },
            },
        },
        {
            url: "https://landschaftshelden.io/datenschutz",
            lastModified: new Date(),
            priority: 0.4,
            changeFrequency: "yearly" as const,
            alternates: {
              languages: {
                de: "https://landschaftshelden.io/datenschutz",
              },
            },
        },
    ]

    const companys = await getAllCompanies();

    if(!companys) return [];

      const companyCityService = cities.flatMap((city) =>
  getGalbauServices().map((service) => ({
    url: `https://landschaftshelden.io/stadt/${city}/${slugify(service)}`,
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "weekly" as const,
    alternates: {
      languages: {
        de: `https://landschaftshelden.io/stadt/${city}/${slugify(service)}`,
      },
    },
  }))
);


  const companyCities = cities.map((city) => ({
    url: `https://landschaftshelden.io/stadt/${city}`,
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "weekly" as const,
    alternates: {
      languages: {
        de: `https://landschaftshelden.io/stadt/${city}`,
      },
    },
  }))

    const companyPages = companys.map((company) => ({
        url: `https://landschaftshelden.io/unternehmen/${company.id}`,
        lastModified: new Date(), // Falls vorhanden
        priority: 0.8,
        changeFrequency: "weekly" as const,
        alternates: {
        languages: {
            de: `https://landschaftshelden.io/unternehmen/${company.id}`,
        },
        },
    }))

    return [...staticPages, ...companyPages, ...companyCityService, ...companyCities]
}