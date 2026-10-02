import { cities, cityCoordinates } from "@/statics/Lists";

type SchemaBreadcrumb = {
  name: string;
  path: string;
};

type ServiceSchemaProps = {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  city?: string;
  region?: string;
  areaServed?: readonly string[];
  image?: string;
  imageAlt?: string;
  alternateNames?: readonly string[];
  offers?: readonly string[];
  breadcrumbs?: readonly SchemaBreadcrumb[];
  dateModified?: string;
};

const SITE_URL = "https://umzugshelden.io";
const BUSINESS_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const PHONE = "+4915168567708";
const EMAIL = "info@umzugshelden.io";

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function uniqueText(values: readonly (string | undefined)[]) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function createCityArea(name: string, region?: string) {
  const coordinates = cityCoordinates[name];

  return {
    "@type": "City",
    name,
    ...(region
      ? {
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: region,
          },
        }
      : {}),
    ...(coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
        }
      : {}),
  };
}

export function buildServiceSchema({
  name,
  description,
  path,
  serviceType,
  city,
  region,
  areaServed,
  image,
  imageAlt,
  alternateNames,
  offers,
  breadcrumbs,
  dateModified,
}: ServiceSchemaProps) {
  const url = absoluteUrl(path);
  const webpageId = `${url}#webpage`;
  const serviceId = `${url}#service`;
  const imageId = `${url}#primaryimage`;
  const offerCatalogId = `${url}#offer-catalog`;
  const breadcrumbId = `${url}#breadcrumb`;
  const imageUrl = image ? absoluteUrl(image) : undefined;
  const localAreaNames = uniqueText([city, ...(areaServed ?? [])]);
  const effectiveAreaNames = localAreaNames.length ? localAreaNames : cities;
  const localAreas = effectiveAreaNames.map((area) =>
    createCityArea(area, area === city ? region : undefined),
  );
  const serviceAreas = [
    ...localAreas,
    ...(region
      ? [{ "@type": "AdministrativeArea", name: region }]
      : []),
  ];
  const cleanAlternateNames = uniqueText(alternateNames ?? []);
  const cleanOffers = uniqueText(offers ?? []);
  const openingHours = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "15:00",
    },
  ];
  const contactPoint = {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: PHONE,
    email: EMAIL,
    availableLanguage: ["de"],
  };
  const graph = [
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: "Umzugshelden",
      inLanguage: "de-DE",
      publisher: { "@id": BUSINESS_ID },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url,
      name,
      description,
      inLanguage: "de-DE",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": serviceId },
      mainEntity: { "@id": serviceId },
      ...(dateModified ? { dateModified } : {}),
      ...(imageUrl ? { primaryImageOfPage: { "@id": imageId } } : {}),
      ...(breadcrumbs?.length
        ? { breadcrumb: { "@id": breadcrumbId } }
        : {}),
    },
    {
      "@type": ["MovingCompany", "ProfessionalService"],
      "@id": BUSINESS_ID,
      name: "Umzugshelden",
      legalName: "Umzugshelden, Inhaber Muhammed Ali Güngör",
      description:
        "Umzugs- und Renovierungsunternehmen für Umzüge, Möbelmontage, Anstricharbeiten, Seniorenumzüge und Entrümpelungen.",
      url: SITE_URL,
      telephone: PHONE,
      email: EMAIL,
      founder: {
        "@type": "Person",
        name: "Muhammed Ali Güngör",
        jobTitle: "Inhaber",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "In der Trift 1",
        postalCode: "57489",
        addressLocality: "Drolshagen",
        addressRegion: "Nordrhein-Westfalen",
        addressCountry: "DE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: cityCoordinates.Drolshagen.lat,
        longitude: cityCoordinates.Drolshagen.lng,
      },
      areaServed: cities.map((area) => ({ "@type": "City", name: area })),
      contactPoint,
      openingHoursSpecification: openingHours,
      currenciesAccepted: "EUR",
      knowsLanguage: ["de"],
    },
    {
      "@type": "Service",
      "@id": serviceId,
      name,
      ...(cleanAlternateNames.length
        ? { alternateName: cleanAlternateNames }
        : {}),
      serviceType,
      category: serviceType,
      description,
      url,
      mainEntityOfPage: { "@id": webpageId },
      ...(imageUrl ? { image: { "@id": imageId } } : {}),
      provider: { "@id": BUSINESS_ID },
      areaServed: serviceAreas,
      termsOfService: `${SITE_URL}/agb`,
      hoursAvailable: openingHours,
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: url,
        servicePhone: contactPoint,
      },
      ...(cleanOffers.length
        ? { hasOfferCatalog: { "@id": offerCatalogId } }
        : {}),
    },
    ...(imageUrl
      ? [
          {
            "@type": "ImageObject",
            "@id": imageId,
            url: imageUrl,
            contentUrl: imageUrl,
            ...(imageAlt ? { name: imageAlt, caption: imageAlt } : {}),
            inLanguage: "de-DE",
          },
        ]
      : []),
    ...(cleanOffers.length
      ? [
          {
            "@type": "OfferCatalog",
            "@id": offerCatalogId,
            name: `${serviceType} Leistungen`,
            url,
            itemListElement: cleanOffers.map((offer, index) => ({
              "@type": "Offer",
              "@id": `${url}#offer-${index + 1}`,
              name: offer,
              url,
              seller: { "@id": BUSINESS_ID },
              itemOffered: {
                "@type": "Service",
                "@id": `${url}#offered-service-${index + 1}`,
                name: offer,
                serviceType: offer,
                provider: { "@id": BUSINESS_ID },
                areaServed: serviceAreas,
              },
            })),
          },
        ]
      : []),
    ...(breadcrumbs?.length
      ? [
          {
            "@type": "BreadcrumbList",
            "@id": breadcrumbId,
            itemListElement: breadcrumbs.map((breadcrumb, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: breadcrumb.name,
              item: absoluteUrl(breadcrumb.path),
            })),
          },
        ]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export default function ServiceSchema(props: ServiceSchemaProps) {
  const schema = buildServiceSchema(props);
  const serializedSchema = JSON.stringify(schema).replaceAll("<", "\\u003c");

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: serializedSchema }}
    />
  );
}
