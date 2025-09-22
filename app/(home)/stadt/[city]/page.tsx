import Link from "next/link";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAllCompanysFromDatabaseByCity } from "@/actions/companyActions";
import { getGalbauServices } from "@/statics/Lists";
import { getCityContent, buildFAQSchema } from "@/lib/cityContent";
import {
  getCityPage,
  getCityPageByCity,
} from "@/actions/cityActions/customerCityAction";
import { deslugify } from "@/utils/slugify";
import SearchBarResults from "../../unternehmen-finden/_components/SearchbarResults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  // Sicherstellen, dass ggf. doppelt/roh encodete Städte (m%C3%BCnchen) sauber angezeigt werden
  const trimmedCityRaw = city.trim();
  let decoded = trimmedCityRaw;
  try {
    decoded = decodeURIComponent(trimmedCityRaw);
  } catch {
    // ignore malformed URI sequences
  }
  const trimmedCity = decoded;
  const companys = await getAllCompanysFromDatabaseByCity(trimmedCity);
  const count = companys.length;
  const topN = Math.min(count, 5);

  if (count === 0) {
    return {
      title: `Gartenbauer ${trimmedCity} ► Jetzt 5 kostenlose Angebote erhalten`,
      description: `Garten- & Landschaftsbauer in ${trimmedCity} finden: Jetzt kostenlosen Auftrag einstellen und bis zu 5 Angebote vergleichen – unverbindlich & schnell.`,
      keywords: [
        `Gartenbauer ${trimmedCity}`,
        `Garten Landschaftsbau ${trimmedCity}`,
        `GaLaBau ${trimmedCity}`,
        `Landschaftsgärtner ${trimmedCity}`,
        `Gartengestaltung ${trimmedCity}`,
        `Angebote Gartenbau ${trimmedCity}`,
        "Kostenlose Angebote",
        "Landschaftshelden",
      ],
      openGraph: {
        title: `Gartenbauer ${trimmedCity} – 5 kostenlose Angebote sichern`,
        description: `Jetzt Auftrag für Garten- und Landschaftsbau in ${trimmedCity} erstellen und bis zu 5 Angebote qualifizierter Betriebe erhalten.`,
        type: "website",
        locale: "de_DE",
      },
      alternates: {
        canonical: `https://landschaftshelden.io/stadt/${encodeURIComponent(
          trimmedCity
        )}`,
      },
    };
  }

  return {
    title: `${trimmedCity}: ${topN} Gartenbauer im Vergleich (0 € Aufwand, 5 Angebote)`,
    description: `${topN} empfohlene Garten- & Landschaftsbauer in ${trimmedCity} ✔ Jetzt Projekt gratis einstellen & bis zu 5 Angebote vergleichen.`,
    keywords: [
      `Gartenbauer ${trimmedCity}`,
      `Garten Landschaftsbau ${trimmedCity}`,
      `GaLaBau ${trimmedCity}`,
      `Landschaftsgärtner ${trimmedCity}`,
      `Gartenbau Angebote ${trimmedCity}`,
      `Kosten Gartenbau ${trimmedCity}`,
    ],
    openGraph: {
      title: `${trimmedCity}: Gartenbauer Vergleich & Angebote`,
      description: `Vergleichen Sie Garten- und Landschaftsbauer in ${trimmedCity}. Kostenlos Auftrag einstellen & mehrere Angebote erhalten.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://landschaftshelden.io/stadt/${encodeURIComponent(
        trimmedCity
      )}`,
    },
  };
}

const Page = async ({ params }: { params: Promise<{ city: string }> }) => {
  const { city } = await params;
  // Route param entspricht jetzt einem Slug (deterministischer Doc-ID). Deslugify für Display/DB city Name.
  const slug = city.trim();
  let cityDisplay = deslugify(slug);
  // Falls Sonderfälle (doppelt encodet) auftreten, versuchen decodeURIComponent – wirkt nur wenn keine Umlaute durch deslugify ersetzt wurden
  try {
    cityDisplay = decodeURIComponent(cityDisplay);
  } catch {
    /* ignore */
  }
  const trimmedCity = cityDisplay.trim();

  try {
    const allCompanys = await getAllCompanysFromDatabaseByCity(trimmedCity);
    // Begrenze auf maximal 5 Unternehmen für bessere Conversion
    const companys = allCompanys.slice(0, 5);

    // CityPage via slug (Doc-ID = slug) laden; Fallback: legacy per city Feld
    let cityPage = await getCityPage(slug);
    if (!cityPage) {
      // Versuch über city Feld (alte Struktur, vor slug Migration)
      cityPage = await getCityPageByCity(cityDisplay);
    }
    const {
      headline,
      faq: staticFaq,
      costLow,
      costHigh,
    } = getCityContent(cityDisplay);
    // FAQ Zusammenführung: erst DB FAQ (falls vorhanden), dann statische Ergänzungen ohne doppelte Fragen
    let faq = staticFaq;
    if (cityPage?.faq && cityPage.faq.length > 0) {
      const existingQuestions = new Set(
        cityPage.faq.map((f) => f.question.trim().toLowerCase())
      );
      const additional = staticFaq.filter(
        (f) => !existingQuestions.has(f.question.trim().toLowerCase())
      );
      faq = [...cityPage.faq, ...additional];
    }

    if (allCompanys.length === 0) {
      return (
        <div className='container mx-auto py-24 px-4'>
          {/* SEO Hero Section */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold mb-6'>{headline}</h1>
            <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
              Suchen Sie professionelle Garten- und Landschaftsbauer in{" "}
              {cityDisplay}? Holen Sie jetzt mehrere Angebote ein – viele
              Projekte liegen typischerweise zwischen{" "}
              {costLow.toLocaleString("de-DE")} € und{" "}
              {costHigh.toLocaleString("de-DE")} € abhängig von Umfang &
              Material.
            </p>

            {/* Call-to-Action Button */}
            <div className='flex justify-center'>
              <Link
                href='/auftrag-erstellen'
                className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
                🚀 Jetzt kostenlosen Auftrag erstellen
              </Link>
            </div>
          </div>

          {/* Service Grid */}
          <div className='mb-12'>
            <h2 className='text-2xl font-semibold mb-6 text-center'>
              Garten- und Landschaftsbau Services in {cityDisplay}
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {getGalbauServices().map((service) => (
                <Link
                  href={`/auftrag-erstellen?service=${encodeURIComponent(
                    service
                  )}&city=${cityDisplay}`}
                  key={service}
                  className='bg-green-500 hover:bg-green-600 p-4 rounded-xl flex items-center justify-center transition-colors'>
                  <span className='text-white md:text-base font-semibold text-center text-sm'>
                    {service}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Local SEO Content */}
          <div className='prose max-w-none'>
            <h2>Professioneller Garten- und Landschaftsbau in {cityDisplay}</h2>
            <p>
              Sie suchen einen zuverlässigen{" "}
              <strong>Garten- und Landschaftsbauer in {cityDisplay}</strong>?
              Landschaftshelden.io verbindet Sie kostenlos mit den besten
              Galabau-Betrieben in Ihrer Region. Egal ob Gartengestaltung,
              Pflasterarbeiten oder Baumpflege – unsere Partner bieten
              professionelle Lösungen für Ihren Garten.
            </p>
            <p>
              <strong>
                Warum Landschaftshelden.io für Ihr Garten-Projekt in{" "}
                {cityDisplay}?
              </strong>
            </p>
            <ul>
              <li>✅ Kostenlose Auftragserstellung</li>
              <li>✅ Bis zu 5 Angebote von geprüften Betrieben</li>
              <li>✅ Nur qualifizierte Garten- und Landschaftsbauer</li>
              <li>✅ Direkter Kontakt zu lokalen Experten</li>
              <li>✅ Transparente Preisvergleiche</li>
            </ul>
          </div>

          {/* Rotierendes FAQ auch bei 0 Unternehmen */}
          <div className='mt-16'>
            <h2 className='text-2xl font-semibold mb-6 text-center'>
              Häufige Fragen zu Garten- & Landschaftsbau in {cityDisplay}
            </h2>
            {faq.length > 0 && (
              <Accordion
                type='single'
                collapsible
                className='max-w-4xl mx-auto'>
                {faq.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            <script
              type='application/ld+json'
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(buildFAQSchema(faq)),
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className='max-w-7xl mx-auto py-12 px-4'>
        {/* SEO-optimized Hero Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>{headline}</h1>
          <p className='text-sm text-gray-500 mb-2'>
            {companys.length} aktive Betriebe gefunden – jetzt vergleichen
          </p>
          <p className='text-xl text-gray-600 mb-6 max-w-4xl mx-auto'>
            Vergleichen Sie jetzt qualifizierte{" "}
            <strong>Garten- & Landschaftsbauer in {cityDisplay}</strong>.
            Typische Projektbereiche starten bei ca.{" "}
            {costLow.toLocaleString("de-DE")} € – umfangreichere Umgestaltungen
            erreichen {costHigh.toLocaleString("de-DE")} € oder mehr. Mehrere
            Angebote schaffen Preisklarheit.
          </p>
          {/* Micro CTA early in content for higher conversion */}
          <div className='mb-6'>
            <Link
              href='/auftrag-erstellen'
              className='inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-semibold shadow'>
              Jetzt kostenloses Angebot sichern
            </Link>
          </div>
        </div>

        {/* Featured Companies (max 5) */}
        <div className='mb-12'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-semibold'>
              Empfohlene Garten- und Landschaftsbauer in {cityDisplay}
            </h2>
            {allCompanys.length > 5 && (
              <Link
                href='/unternehmen-finden'
                className='text-green-600 hover:text-green-700 font-medium'>
                Alle {allCompanys.length} Anbieter ansehen →
              </Link>
            )}
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <p className='text-blue-800 text-center'>
              <strong>💡 Tipp:</strong> Erstellen Sie einen kostenlosen Auftrag
              und lassen Sie sich von mehreren Betrieben unverbindlich beraten.
              So finden Sie das beste Angebot für Ihr Projekt!
            </p>
          </div>

          <SearchBarResults loading={false} results={companys} />

          {allCompanys.length > 5 && (
            <div className='text-center mt-8'>
              <div className='bg-gray-50 border rounded-lg p-6'>
                <h3 className='text-lg font-semibold mb-2'>
                  Weitere {allCompanys.length - 5} Gartenbauer in {cityDisplay}
                </h3>
                <p className='text-gray-600 mb-4'>
                  Verpassen Sie nicht die Chance auf das beste Angebot!
                  Erstellen Sie einen kostenlosen Auftrag und erhalten Sie
                  Angebote von allen verfügbaren Betrieben.
                </p>
                <Link
                  href='/auftrag-erstellen'
                  className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block'>
                  Alle Anbieter anfragen
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Local SEO Content */}
        <div className='prose max-w-none mb-12'>
          <h2>
            Professioneller Garten- und Landschaftsbau in {cityDisplay} – Ihr
            Weg zum Traumgarten
          </h2>
          <p>
            Sie planen ein{" "}
            <strong>Garten- und Landschaftsbau-Projekt in {cityDisplay}</strong>{" "}
            und suchen den richtigen Partner? Landschaftshelden.io macht es
            Ihnen einfach: Mit nur einem Auftrag erreichen Sie mehrere
            qualifizierte
            <strong> Galabau-Betriebe in {cityDisplay}</strong> und können die
            besten Angebote vergleichen.
          </p>

          <h3>Warum sollten Sie mehrere Angebote einholen?</h3>
          <p>
            Bei{" "}
            <strong>
              Garten- und Landschaftsbau-Projekten in {cityDisplay}
            </strong>{" "}
            können die Preise stark variieren. Durch den Vergleich mehrerer
            Angebote sparen Sie nicht nur Geld, sondern finden auch den Betrieb,
            der am besten zu Ihren Vorstellungen passt.
          </p>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-6'>
            <h4 className='text-green-800 font-semibold mb-3'>
              🌱 Vorteile von Landschaftshelden.io:
            </h4>
            <ul className='text-green-700 space-y-2'>
              <li>
                ✅ <strong>100% kostenlos</strong> – Keine versteckten Gebühren
              </li>
              <li>
                ✅ <strong>Schnell & einfach</strong> – Auftrag in 2 Minuten
                erstellt
              </li>
              <li>
                ✅ <strong>Geprüfte Betriebe</strong> – Nur seriöse Garten- und
                Landschaftsbauer
              </li>
              <li>
                ✅ <strong>Direkte Vergleiche</strong> – Beste Preise für Ihr
                Projekt
              </li>
              <li>
                ✅ <strong>Lokale Experten</strong> – Betriebe aus {cityDisplay}{" "}
                und Umgebung
              </li>
            </ul>
          </div>

          <h3>Beliebte Garten- und Landschaftsbau-Services in {cityDisplay}</h3>
          <p>
            Unsere Partner-Betriebe in {cityDisplay} bieten das komplette
            Spektrum des Garten- und Landschaftsbaus: von der Gartenplanung über
            Pflasterarbeiten bis hin zur Baumpflege. Egal ob Privatgarten oder
            Gewerbeimmobilie – hier finden Sie den passenden Experten.
          </p>
        </div>

        {/* Call-to-Action Section */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center mb-12'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>
            Bereit für Ihr Garten-Projekt in {cityDisplay}?
          </h2>
          <p className='text-xl mb-6 opacity-90'>
            Kostenlos · Unverbindlich · In 2 Minuten erledigt
          </p>
          <Link
            href='/auftrag-erstellen'
            className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
            Jetzt kostenlosen Auftrag erstellen
          </Link>
        </div>

        {/* FAQ Section (rotierend) */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6 text-center'>
            Häufige Fragen zu Garten- & Landschaftsbau in {cityDisplay}
          </h2>
          {faq.length > 0 && (
            <Accordion type='single' collapsible className='max-w-4xl mx-auto'>
              {faq.map((item, i) => (
                <AccordionItem key={i} value={`it-${i}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {faq.length > 0 && (
            <script
              type='application/ld+json'
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(buildFAQSchema(faq)),
              }}
            />
          )}
        </div>

        {/* Final CTA */}
        <div className='text-center bg-gray-50 rounded-xl p-8'>
          <h2 className='text-2xl font-bold mb-4'>
            Starten Sie jetzt Ihr Garten-Projekt in {cityDisplay}
          </h2>
          <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
            Über 1.000 Kunden haben bereits erfolgreich ihren Traumgarten
            realisiert. Werden auch Sie zum zufriedenen
            Landschaftshelden-Kunden!
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/auftrag-erstellen'
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
              🚀 Kostenlosen Auftrag erstellen
            </Link>
            <Link
              href={`/unternehmen-finden?city=${cityDisplay}`}
              className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors'>
              📋 Alle {allCompanys.length} Anbieter ansehen
            </Link>
          </div>
        </div>

        {/* Service-spezifische Stadtseiten Links */}
        <div className='mt-16 border-t pt-12'>
          <h2 className='text-2xl font-semibold mb-6 text-center'>
            Spezialisierte Services in {cityDisplay}
          </h2>
          <p className='text-gray-600 text-center mb-8 max-w-3xl mx-auto'>
            Entdecken Sie unsere spezialisierten Seiten für einzelne Garten- und
            Landschaftsbau-Services in {cityDisplay}. Hier finden Sie gezielt
            Experten für Ihren spezifischen Bedarf.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {getGalbauServices().map((service) => (
              <Link
                href={`/stadt/${cityDisplay}/${service
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[äöüß]/g, (match) => {
                    const replacements: { [key: string]: string } = {
                      ä: "ae",
                      ö: "oe",
                      ü: "ue",
                      ß: "ss",
                    };
                    return replacements[match] || match;
                  })}`}
                key={service}
                className='bg-white border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md group'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-900 group-hover:text-green-600 transition-colors'>
                      {service} in {cityDisplay}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      Spezialisierte Anbieter für {service}
                    </p>
                  </div>
                  <div className='text-green-500 group-hover:text-green-600 transition-colors'>
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className='text-center mt-8'>
            <p className='text-gray-600 text-sm'>
              Diese Seiten bieten Ihnen gezielt Experten für spezifische Garten-
              und Landschaftsbau-Services in {cityDisplay}
            </p>
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
