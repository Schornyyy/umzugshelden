import {
  ALLOWED_CITY_SLUGS,
  CITY_DISPLAY_NAME,
  normalizeCityParam,
} from "@/lib/allowedCities";
import { getCityContent, buildFAQSchema } from "@/lib/cityContent";
import { notFound } from "next/navigation";
import ContractMultiStepForm from "@/components/ContractMultiStepForm";
import Link from "next/link";
import { deslugify } from "@/utils/slugify";
import React from "react";

export const revalidate = 86400; // daily

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const normCity = normalizeCityParam(city);
  if (!ALLOWED_CITY_SLUGS.includes(normCity)) {
    return { title: `Gartenbau Angebot nicht verfügbar` };
  }
  const displayCity = CITY_DISPLAY_NAME[normCity] || city;
  const serviceName = deslugify(service);
  const { headline, costLow, costHigh } = getCityContent(displayCity);
  return {
    title: `${serviceName} Angebot ${displayCity} | ${headline}`,
    description: `In ${displayCity} jetzt kostenlos Anfrage für ${serviceName} stellen & mehrere Angebote vergleichen. Projekte oft zwischen ${costLow.toLocaleString(
      "de-DE"
    )} € und ${costHigh.toLocaleString("de-DE")} €. Schnell • unverbindlich.`,
    keywords: [
      `${serviceName} Angebot ${displayCity}`,
      `${serviceName} Anfrage ${displayCity}`,
      `Gartenbau ${serviceName} ${displayCity}`,
      `Landschaftsbau Kosten ${displayCity}`,
      `Gartenbau Preise ${displayCity}`,
      "Angebot einholen",
      "Garten & Landschaftsbau vergleichen",
    ],
    alternates: {
      canonical: `https://landschaftshelden.io/stadt/${normCity}/${service}/angebot`,
    },
    openGraph: {
      title: `${serviceName} Angebot in ${displayCity} – bis zu 5 Betriebe vergleichen`,
      description: `Kostenloses Anfrageformular für ${serviceName} in ${displayCity}. Angebote vergleichen & sparen.`,
      type: "website",
      locale: "de_DE",
    },
  };
}

export default async function CityServiceAngebotPage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if (!ALLOWED_CITY_SLUGS.includes(norm)) notFound();
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const { faq, costLow, costHigh } = getCityContent(displayCity);

  return (
    <div className='bg-white'>
      {/* Hero + Form */}
      <section className='bg-gradient-to-b from-green-50 to-white border-b'>
        <div className='mx-auto max-w-7xl px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-start'>
          <div>
            <p className='text-xs font-semibold tracking-wide text-green-700 mb-2 uppercase'>
              Kostenlos & unverbindlich
            </p>
            <h1 className='text-3xl md:text-4xl font-bold leading-tight mb-4'>
              {serviceName} Angebote –
              <span className='text-green-600'>
                {" "}
                Jetzt in {displayCity} vergleichen
              </span>
            </h1>
            <p className='text-gray-700 text-base md:text-lg mb-6'>
              Hol dir in <strong>{displayCity}</strong> transparente Angebote
              für <strong>{serviceName}</strong>. Richtwerte: häufig{" "}
              <strong>
                {costLow.toLocaleString("de-DE")} € –{" "}
                {costHigh.toLocaleString("de-DE")} €
              </strong>{" "}
              je nach Umfang & Material. Mit einer Anfrage erreichst du mehrere
              geprüfte Betriebe und beschleunigst die Planung.
            </p>
            <ul className='space-y-2 text-sm text-gray-700 mb-8'>
              <li>✅ 1 Anfrage – mehrere Rückmeldungen</li>
              <li>✅ Preise & Leistungen direkt vergleichen</li>
              <li>✅ Schnellere Terminvergabe in der Hochsaison</li>
              <li>✅ DSGVO-konform & keine versteckten Kosten</li>
            </ul>
            <div className='text-xs text-gray-500'>
              Bereit? Formular rechts ausfüllen und Projekt starten.
            </div>
          </div>
          <div className='relative' id='formular'>
            <div className='sticky top-4'>
              <ContractMultiStepForm
                variant='embedded'
                showHeader={true}
                prefilledCity={displayCity}
                prefilledService={serviceName}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='bg-gray-50 py-16 border-t'>
        <div className='max-w-5xl mx-auto px-4'>
          <h2 className='text-2xl md:text-3xl font-bold mb-8 text-center'>
            Häufige Fragen zu {serviceName} Angeboten in {displayCity}
          </h2>
          <div className='divide-y border rounded-lg bg-white'>
            {faq.map((item, i) => (
              <details key={i} className='group p-4'>
                <summary className='cursor-pointer font-medium text-gray-900 flex justify-between items-center list-none'>
                  <span>{item.question}</span>
                  <span className='text-green-600 group-open:rotate-180 transition-transform'>
                    ⌄
                  </span>
                </summary>
                <div className='mt-2 text-sm text-gray-700 leading-relaxed'>
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
          <script
            type='application/ld+json'
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildFAQSchema(faq)),
            }}
          />
        </div>
      </section>

      {/* Internal Linking (Silo) */}
      <section className='max-w-6xl mx-auto px-4 py-14'>
        <h2 className='text-xl font-semibold mb-6 text-center'>
          Weitere Seiten in {displayCity}
        </h2>
        <div className='flex flex-wrap gap-3 justify-center text-sm'>
          <Link
            href={`/stadt/${norm}/${service}`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Übersicht {serviceName}
          </Link>
          <Link
            href={`/stadt/${norm}/${service}/preise`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Preise {serviceName}
          </Link>
          <Link
            href={`/stadt/${norm}/${service}/firma-finden`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Firma finden
          </Link>
          <Link
            href={`/stadt/${norm}/${service}/beauftragen`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Direkt beauftragen
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className='bg-green-600 text-white py-14'>
        <div className='max-w-5xl mx-auto px-4 text-center'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>
            Starte jetzt deine {serviceName} Anfrage in {displayCity}
          </h2>
          <p className='opacity-90 mb-6'>
            Kostenlos • Unverbindlich • Mehr Preissicherheit
          </p>
          <a
            href='#formular'
            className='inline-block bg-white text-green-700 font-semibold px-8 py-4 rounded-lg shadow hover:bg-gray-100 transition'>
            Formular ausfüllen
          </a>
        </div>
      </section>
    </div>
  );
}
