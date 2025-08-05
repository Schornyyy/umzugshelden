import { findCompanyById } from "@/actions/companyActions";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import CompanyInfos from "./_components/CompanyInfos";
import CompanyContractForm from "./_components/CompanyContactForm";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ companyid: string }>;
}) {
  const { companyid } = await params;
  const companyData = await findCompanyById(companyid);

  if (!companyData) {
    return {
      title: "Unternehmen nicht gefunden",
      description: "Dieses Unternehmen konnte nicht gefunden werden.",
    };
  }

  const getCompanyServiceKeywords = () => {
    const list: string[] = [];

    if (companyData.services) {
      companyData.services.map((service) => {
        list.push(`${service} in ${companyData.city}`);
        list.push(`${service} in ${companyData.zip}`);
      });
    }
    return list;
  };

  return {
    title: `${companyData.companyName} | TOP Garten- und Landschaftsbau in ${companyData.city} - Landschaftshelden.io`,
    description: `${companyData.companyName} aus ${companyData.city} - Professioneller Garten- und Landschaftsbau. Jetzt kostenlosen Auftrag erstellen oder direkt kontaktieren. ⭐ Geprüfter Galabau-Betrieb`,
    keywords: [
      `${companyData.companyName}`,
      `${companyData.companyName} ${companyData.city}`,
      `Garten Landschaftsbau ${companyData.city}`,
      `GaLaBau ${companyData.city}`,
      `Galabau-Betrieb ${companyData.city}`,
      `Landschaftsgärtner ${companyData.city}`,
      "Auftrag erstellen",
      "Kostenlose Angebote",
      "Landschaftshelden",
      ...getCompanyServiceKeywords(),
    ],
    openGraph: {
      title: `${companyData.companyName} | Garten- und Landschaftsbau ${companyData.city}`,
      description: `Professioneller Galabau-Betrieb in ${companyData.city}. Jetzt Auftrag erstellen oder direkt kontaktieren.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://landschaftshelden.io/unternehmen/${companyid}`,
    },
  };
}

// Main page component
const Page = async ({ params }: { params: Promise<{ companyid: string }> }) => {
  const { companyid } = await params;

  try {
    const companyData = await findCompanyById(companyid);

    if (!companyData) {
      return (
        <div className='container mx-auto py-24 px-4'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold mb-6'>
              Unternehmen nicht gefunden
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
              Wir konnten dieses Unternehmen nicht finden. Entdecken Sie
              stattdessen andere qualifizierte Garten- und Landschaftsbauer in
              Ihrer Region.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/auftrag-erstellen'
                className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
                🚀 Kostenlosen Auftrag erstellen
              </Link>
              <Link
                href='/unternehmen-finden'
                className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors'>
                📋 Alle Anbieter durchsuchen
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='max-w-7xl mx-auto pt-12 pb-24 px-4'>
        {/* Local SEO Schema JSON-LD */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `https://landschaftshelden.io/unternehmen/${companyid}`,
              name: companyData.companyName,
              alternateName: `${companyData.companyName} - Garten- und Landschaftsbau`,
              description:
                companyData.description ||
                `${
                  companyData.companyName
                } ist ein professioneller Garten- und Landschaftsbau-Betrieb in ${
                  companyData.city
                }. Spezialisiert auf ${
                  companyData.services?.join(", ") ||
                  "Garten- und Landschaftsbau"
                }.`,
              url: `https://landschaftshelden.io/unternehmen/${companyid}`,
              telephone: null, // Wird später hinzugefügt
              email: companyData.companyEmail || companyData.email,
              address: {
                "@type": "PostalAddress",
                addressLocality: companyData.city,
                postalCode: companyData.zip,
                addressCountry: "DE",
              },
              geo:
                companyData.latitude && companyData.longitude
                  ? {
                      "@type": "GeoCoordinates",
                      latitude: companyData.latitude,
                      longitude: companyData.longitude,
                    }
                  : null,
              openingHours: ["Mo-Fr 08:00-17:00", "Sa 08:00-12:00"],
              priceRange: "€€",
              currenciesAccepted: "EUR",
              paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
              areaServed: [
                {
                  "@type": "City",
                  name: companyData.city,
                },
                {
                  "@type": "State",
                  name: "Deutschland",
                },
              ],
              serviceType: companyData.services || [
                "Garten- und Landschaftsbau",
                "Gartenplanung",
                "Rasenpflege",
                "Baumpflege",
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Garten- und Landschaftsbau Services",
                itemListElement:
                  companyData.services?.map((service) => ({
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: service,
                      description: `Professionelle ${service} in ${companyData.city}`,
                    },
                  })) || [],
              },
              foundingDate: "2020",
              numberOfEmployees: "1-10",
              slogan: `Ihr Partner für Garten- und Landschaftsbau in ${companyData.city}`,
              image: companyData.images?.[0] || "/images/default_company.png",
              logo: companyData.images?.[0] || "/images/default_company.png",
              sameAs: [companyData.companyWebsite].filter(Boolean),
              makesOffer: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Kostenlose Beratung",
                    description:
                      "Unverbindliche Beratung für Ihr Garten-Projekt",
                  },
                  price: "0",
                  priceCurrency: "EUR",
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Kostenloses Angebot",
                    description:
                      "Individuelle Kostenvoranschläge für Garten- und Landschaftsbau",
                  },
                  price: "0",
                  priceCurrency: "EUR",
                },
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: companyData.companyEmail || companyData.email,
                contactType: "customer service",
                availableLanguage: "German",
                areaServed: "DE",
              },
              memberOf: {
                "@type": "Organization",
                name: "Landschaftshelden.io",
                url: "https://landschaftshelden.io",
              },
              potentialAction: [
                {
                  "@type": "ReserveAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `https://landschaftshelden.io/auftrag-erstellen?city=${
                      companyData.city
                    }&company=${encodeURIComponent(
                      companyData.companyName || ""
                    )}`,
                    actionPlatform: [
                      "http://schema.org/DesktopWebPlatform",
                      "http://schema.org/MobileWebPlatform",
                    ],
                  },
                  result: {
                    "@type": "Reservation",
                    name: "Auftrag erstellen",
                  },
                },
              ],
              additionalType: "https://schema.org/ProfessionalService",
              knowsAbout: companyData.services || [
                "Gartengestaltung",
                "Landschaftsbau",
                "Rasenpflege",
              ],
              serviceArea: {
                "@type": "GeoCircle",
                geoMidpoint: {
                  "@type": "GeoCoordinates",
                  latitude: companyData.latitude || 52.52,
                  longitude: companyData.longitude || 13.405,
                },
                geoRadius: "25000",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />

        {/* SEO-optimized Hero Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>
            {companyData.companyName}
          </h1>
          <p className='text-xl text-gray-600 mb-6 max-w-4xl mx-auto'>
            Professioneller{" "}
            <strong>Garten- und Landschaftsbau in {companyData.city}</strong>.
            Erstellen Sie kostenlos einen Auftrag oder kontaktieren Sie{" "}
            {companyData.companyName}
            direkt für Ihr individuelles Projekt.
          </p>

          {/* Dual CTA Strategy */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
            <Link
              href={`/auftrag-erstellen?city=${
                companyData.city
              }&company=${encodeURIComponent(companyData.companyName || "")}`}
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors inline-flex items-center justify-center'>
              🚀 Kostenlosen Auftrag erstellen
            </Link>
            <a
              href={`#kontakt`}
              className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center'>
              📞 Direkt kontaktieren
            </a>
          </div>
        </div>

        {/* Company Information Section */}
        <div className='mb-16'>
          <CompanyInfos companyData={companyData} />
        </div>

        {/* Value Proposition Section */}
        <div className='bg-green-50 border border-green-200 rounded-xl p-8 mb-16'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl md:text-3xl font-bold mb-4'>
              Warum {companyData.companyName} wählen?
            </h2>
            <p className='text-gray-700 max-w-3xl mx-auto'>
              Als geprüfter Partner auf Landschaftshelden.io bietet{" "}
              {companyData.companyName}
              professionelle Garten- und Landschaftsbau-Services in{" "}
              {companyData.city} und Umgebung.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>✅</span>
              </div>
              <h3 className='font-semibold mb-2'>Geprüfter Betrieb</h3>
              <p className='text-sm text-gray-600'>
                Qualifiziert und zertifiziert
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🌱</span>
              </div>
              <h3 className='font-semibold mb-2'>Lokaler Experte</h3>
              <p className='text-sm text-gray-600'>
                Aus {companyData.city} für {companyData.city}
              </p>
            </div>
            <div className='text-center md:col-span-2 lg:col-span-1'>
              <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>💎</span>
              </div>
              <h3 className='font-semibold mb-2'>Individuelle Lösungen</h3>
              <p className='text-sm text-gray-600'>
                Maßgeschneidert für Ihr Projekt
              </p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        {companyData.services && companyData.services.length > 0 && (
          <div className='mb-16'>
            <h2 className='text-2xl font-semibold mb-6 text-center'>
              Services von {companyData.companyName}
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {companyData.services.map((service, index) => (
                <div
                  key={index}
                  className='bg-green-500 hover:bg-green-600 p-3 rounded-xl flex items-center justify-center transition-colors group cursor-default'>
                  <span className='text-white text-sm md:text-base font-semibold text-center'>
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form Section */}
        <div id='kontakt' className='mb-16'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl md:text-3xl font-bold mb-4'>
              Kontaktieren Sie {companyData.companyName}
            </h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Haben Sie Fragen zu Ihrem Projekt? Kontaktieren Sie{" "}
              {companyData.companyName}
              direkt oder erstellen Sie einen kostenlosen Auftrag für mehrere
              Angebote.
            </p>
          </div>
          <CompanyContractForm company={companyData} />
        </div>

        {/* Call-to-Action Sections */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center mb-16'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>
            Bereit für Ihr Garten-Projekt in {companyData.city}?
          </h2>
          <p className='text-xl mb-6 opacity-90'>
            Zwei Wege zu Ihrem Traumgarten
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={`/auftrag-erstellen?city=${
                companyData.city
              }&company=${encodeURIComponent(companyData.companyName || "")}`}
              className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
              Auftrag erstellen & Angebote vergleichen
            </Link>
            <a
              href={`#kontakt`}
              className='border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-lg text-lg font-bold transition-colors inline-block'>
              {companyData.companyName} direkt kontaktieren
            </a>
          </div>
        </div>

        {/* Platform Benefits Section */}
        <div className='mb-16'>
          <div className='text-center mb-12'>
            <h2 className='text-2xl md:text-3xl font-bold mb-4'>
              Der einfachste Weg zu Ihrem Garten-Projekt in {companyData.city}
            </h2>
            <p className='text-gray-600 max-w-3xl mx-auto'>
              Landschaftshelden.io macht es Ihnen einfach, den perfekten Garten-
              und Landschaftsbauer zu finden - ob durch direkten Kontakt oder
              Angebotsvergleich.
            </p>
          </div>

          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-8'>
              <div className='flex items-start gap-4'>
                <div className='w-3 h-16 bg-green-500 rounded-md flex-shrink-0'></div>
                <div>
                  <h3 className='font-bold text-xl mb-2'>
                    Option 1: Direkter Kontakt zu {companyData.companyName}
                  </h3>
                  <p className='text-gray-600'>
                    Sie wissen bereits, dass {companyData.companyName} der
                    richtige Partner für Ihr Projekt ist? Kontaktieren Sie sie
                    direkt über unser Kontaktformular.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4'>
                <div className='w-3 h-16 bg-green-500 rounded-md flex-shrink-0'></div>
                <div>
                  <h3 className='font-bold text-xl mb-2'>
                    Option 2: Angebote vergleichen und sparen
                  </h3>
                  <p className='text-gray-600'>
                    Erstellen Sie einen kostenlosen Auftrag und erhalten Sie
                    Angebote von
                    {companyData.companyName} und anderen qualifizierten
                    Betrieben in {companyData.city}.
                  </p>
                </div>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                <h4 className='font-semibold text-blue-800 mb-2'>
                  💡 Unser Tipp:
                </h4>
                <p className='text-blue-700 text-sm'>
                  Durch den Vergleich mehrerer Angebote sparen Sie im
                  Durchschnitt 15-30% und finden die beste Lösung für Ihr Budget
                  und Ihre Anforderungen.
                </p>
              </div>
            </div>

            <div className='flex justify-center'>
              <Image
                alt='Garten- und Landschaftsbau Projekte'
                src='/images/JobSmith_CTA_Card.png'
                width={400}
                height={400}
                className='object-cover rounded-lg shadow-lg'
              />
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className='text-center bg-gray-50 rounded-xl p-8'>
          <h2 className='text-2xl font-bold mb-4'>
            Starten Sie jetzt Ihr Garten-Projekt mit {companyData.companyName}
          </h2>
          <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
            Vertrauen Sie auf die Expertise von {companyData.companyName} aus{" "}
            {companyData.city}
            oder vergleichen Sie Angebote für das beste
            Preis-Leistungs-Verhältnis.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={`/auftrag-erstellen?city=${
                companyData.city
              }&company=${encodeURIComponent(companyData.companyName || "")}`}
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
              🚀 Kostenlosen Auftrag erstellen
            </Link>
            <a
              href={`#kontakt`}
              className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors'>
              📞 {companyData.companyName} kontaktieren
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Fehler beim Laden der Unternehmensdaten:", error);
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Fehler beim Laden der Daten</h1>
        <p className='text-gray-600 mt-4'>
          Es gab einen Fehler. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }
};

export default Page;
