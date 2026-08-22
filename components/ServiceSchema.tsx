type ServiceSchemaProps = {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  city?: string;
};

const serviceAreas = [
  "Olpe",
  "Attendorn",
  "Lennestadt",
  "Finnentrop",
  "Kirchhundem",
  "Drolshagen",
  "Wenden",
  "Plettenberg",
  "Schmallenberg",
  "Siegen",
];

export default function ServiceSchema({
  name,
  description,
  path,
  serviceType,
  city,
}: ServiceSchemaProps) {
  const url = `https://umzugshelden.de${path}`;
  const areas = city ? [city] : serviceAreas;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["ProfessionalService", "LocalBusiness"],
        "@id": "https://umzugshelden.de/#business",
        name: "Umzugshelden",
        url: "https://umzugshelden.de",
        telephone: "+4915168567708",
        email: "info@umzugshelden.io",
        address: {
          "@type": "PostalAddress",
          streetAddress: "In der Trift 1",
          postalCode: "57489",
          addressLocality: "Drolshagen",
          addressRegion: "Nordrhein-Westfalen",
          addressCountry: "DE",
        },
        areaServed: areas.map((area) => ({
          "@type": "City",
          name: area,
        })),
        openingHoursSpecification: [
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
        ],
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name,
        serviceType,
        description,
        url,
        provider: {
          "@id": "https://umzugshelden.de/#business",
        },
        areaServed: areas.map((area) => ({
          "@type": "City",
          name: area,
        })),
      },
    ],
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
