import {
  ALLOWED_CITY_SLUGS,
  CITY_DISPLAY_NAME,
  normalizeCityParam,
} from "@/lib/allowedCities";
import { notFound } from "next/navigation";
import { deslugify } from "@/utils/slugify";
import ContractMultiStepForm from "@/components/ContractMultiStepForm";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400; // daily – content seldom changes

interface PageParams {
  city: string;
  service: string;
}

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const heroIntros = [
  "Strukturiert beauftragen statt willkürlich anfragen",
  "Gezielt anfragen & bessere Rückmeldungen erhalten",
  "Professionell planen – statt endlos nachfragen",
  "Qualifizierte Betriebe schneller erreichen",
];

const benefitBullets = [
  "1 Anfrage – mehrere qualifizierte Rückmeldungen",
  "Bessere Vergleichbarkeit durch strukturierte Angaben",
  "Zeitersparnis: weniger Rückfragen, klarer Projektfokus",
  "Lokale Fachbetriebe aus dem direkten Umfeld",
  "DSGVO-konformes Handling & keine versteckten Kosten",
];

function buildFaq(serviceName: string, city: string) {
  return [
    {
      q: `Welche Informationen sollte ich für ${serviceName} in ${city} vorab bereitstellen?`,
      a: `Beschreibe Zweck, Flächen, besondere Zugänge, gewünschte Materialien und gewünschten Startzeitpunkt. Je konkreter, desto schneller und präziser reagieren Betriebe auf deine ${serviceName}-Anfrage in ${city}.`,
    },
    {
      q: `Wie schnell melden sich Betriebe nach meiner ${serviceName}-Anfrage in ${city}?`,
      a: `Oft innerhalb von 24–72 Stunden – in Stoßzeiten (Frühjahr) kann es etwas länger dauern. Durch klare Angaben erhöhst du die Antwortgeschwindigkeit.`,
    },
    {
      q: `Kann ich mehrere Varianten für ${serviceName} in ${city} erfragen?`,
      a: `Ja. Gib alternative Material- oder Ausführungsvarianten an (z. B. Naturstein vs. Beton). So erhältst du direkt vergleichbare Angebote.`,
    },
    {
      q: `Worin liegt der Unterschied zwischen Angebot einholen und direkt beauftragen?`,
      a: `Beim Angebotseinholen vergleichst du mögliche Ausführungen & Preise. Beim direkten Beauftragen fokussierst du dich auf belastbare Umsetzungsbestätigung. Diese Seite unterstützt beides – aber mit Fokus auf klare Projektumsetzung.`,
    },
    {
      q: `Brauche ich zwingend einen Vor-Ort-Termin für ${serviceName} in ${city}?`,
      a: `Für grobe Einschätzungen genügen oft Fotos & Maße. Vor verbindlicher Beauftragung folgt fast immer ein Termin zur finalen Abstimmung.`,
    },
  ];
}

function buildHowToSteps(serviceName: string, city: string) {
  return [
    {
      name: "Projekt definieren",
      text: `Ziel, Umfang & besondere Rahmenbedingungen für ${serviceName} in ${city} skizzieren.`,
    },
    {
      name: "Formular ausfüllen",
      text: "Strukturierte Eingabe statt freier Mail – reduziert Rückfragen.",
    },
    {
      name: "Rückmeldungen auswerten",
      text: "Antwortzeiten, Detaillierungsgrad & Passung vergleichen.",
    },
    {
      name: "Vor-Ort Termin / Feinplanung",
      text: "Details klären, Machbarkeit & Ablauf bestätigen.",
    },
    {
      name: "Beauftragen & Start",
      text: "Vertragliche Eckpunkte + Zeitfenster fixieren.",
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if (!ALLOWED_CITY_SLUGS.includes(norm))
    return { title: "Service nicht verfügbar" };
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const base = `${serviceName} in ${displayCity} beauftragen`;
  return {
    title: `${base} | Qualifizierte Betriebe strukturiert anfragen`,
    description: `Jetzt ${serviceName} in ${displayCity} professionell beauftragen: strukturierte Anfrage, mehrere qualifizierte Rückmeldungen, weniger Rückfragen, schnellere Umsetzung.`,
    keywords: [
      `${serviceName} ${displayCity} beauftragen`,
      `${serviceName} Firma ${displayCity}`,
      `${serviceName} Auftrag ${displayCity}`,
      `${serviceName} Dienstleister ${displayCity}`,
      "Garten & Landschaftsbau Auftrag",
      "Anfrage strukturieren",
    ],
    alternates: {
      canonical: `https://www.landschaftshelden.io/stadt/${norm}/${service}/beauftragen`,
    },
    openGraph: {
      title: `${serviceName} in ${displayCity} jetzt beauftragen`,
      description: `Strukturiert anfragen & qualifizierte Betriebe für ${serviceName} in ${displayCity} schneller erreichen.`,
      type: "website",
      locale: "de_DE",
    },
  };
}

export default async function CityServiceBeauftragenPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if (!ALLOWED_CITY_SLUGS.includes(norm)) notFound();
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const variantIndex = hashString(norm + ":" + service) % heroIntros.length;
  const intro = heroIntros[variantIndex];
  const faq = buildFaq(serviceName, displayCity);
  const howTo = buildHowToSteps(serviceName, displayCity);

  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Start",
        item: "https://www.landschaftshelden.io/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: displayCity,
        item: `https://www.landschaftshelden.io/stadt/${norm}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: serviceName,
        item: `https://www.landschaftshelden.io/stadt/${norm}/${service}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Beauftragen",
        item: `https://www.landschaftshelden.io/stadt/${norm}/${service}/beauftragen`,
      },
    ],
  };

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const howToJson = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Ablauf ${serviceName} beauftragen in ${displayCity}`,
    step: howTo.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  const serviceJson = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${serviceName} ${displayCity}`,
    areaServed: { "@type": "City", name: displayCity },
    provider: {
      "@type": "Organization",
      name: "Landschaftshelden.io",
      url: "https://www.landschaftshelden.io",
    },
  };

  const seasonalHint = (() => {
    const highDemandCities = [
      "berlin",
      "frankfurt-am-main",
      "hamburg",
      "koeln",
      "duesseldorf",
      "muenster",
    ];
    if (highDemandCities.includes(norm)) {
      return `Im Ballungsraum ${displayCity} sind Kapazitäten in Spitzenzeiten früh vergriffen – frühzeitige Anfrage für ${serviceName} sichert schnellere Slots.`;
    }
    return `In ${displayCity} reagieren Betriebe für ${serviceName} oft flexibel – präzise Angaben erhöhen dennoch die Planbarkeit & Qualität.`;
  })();

  return (
    <div className='bg-white'>
      <section className='border-b bg-gradient-to-b from-green-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 py-10 md:py-16 grid gap-10 md:grid-cols-2 items-start'>
          <div>
            <p className='text-xs uppercase tracking-wide font-semibold text-green-700 mb-2'>
              {intro}
            </p>
            <h1 className='text-3xl md:text-4xl font-bold leading-tight mb-4'>
              {serviceName} in {displayCity} direkt beauftragen
            </h1>
            <p className='text-gray-700 mb-4'>
              Strukturiert anfragen statt Chaos: Erhalte schneller belastbare
              Rückmeldungen & sichere dir Umsetzungskapazitäten für{" "}
              <strong>{serviceName}</strong> in <strong>{displayCity}</strong>.
            </p>
            <ul className='space-y-2 text-sm text-gray-700 mb-5'>
              {benefitBullets.slice(0, 3).map((b) => (
                <li key={b}>✅ {b}</li>
              ))}
            </ul>
            <div className='flex flex-wrap gap-3 mb-6'>
              <a
                href='#formular'
                className='bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition'
                data-cta='hero-primary'>
                Jetzt Anfrage starten
              </a>
              <a
                href='#vorteile'
                className='text-green-700 text-sm font-semibold px-6 py-3 rounded-md border border-green-600 hover:bg-green-50 transition'
                data-cta='hero-secondary'>
                Mehr Vorteile
              </a>
            </div>
            <div className='text-[11px] text-gray-500'>
              Kostenlos & unverbindlich · Bessere Vergleichbarkeit · Schnellere
              Umsetzung
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

      {/* Trust Bar */}
      <section className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 md:items-center justify-between text-sm'>
          <div className='flex items-center gap-2 text-gray-700'>
            <span className='text-green-600'>★</span> Qualifizierte regionale
            Fachbetriebe
          </div>
          <div className='flex items-center gap-2 text-gray-700'>
            <span className='text-green-600'>🔒</span> DSGVO-konform & keine
            versteckten Kosten
          </div>
          <div className='flex items-center gap-2 text-gray-700'>
            <span className='text-green-600'>⚡</span> Schnellere Rückmeldungen
            durch strukturierte Angaben
          </div>
          <div className='flex items-center gap-2 text-gray-700'>
            <span className='text-green-600'>📄</span> Vergleich mehrere
            Rückmeldungen
          </div>
        </div>
      </section>

      {/* High-level 3 Step Conversion Path */}
      <section className='max-w-6xl mx-auto px-4 py-14' id='vorteile'>
        <h2 className='text-2xl font-bold text-center mb-10'>
          In 3 Schritten zur Beauftragung
        </h2>
        <div className='grid md:grid-cols-3 gap-6'>
          {[
            {
              t: "1. Anfrage strukturieren",
              d: `Projektziele, Umfang & Rahmen für ${serviceName} in ${displayCity}`,
            },
            {
              t: "2. Rückmeldungen erhalten",
              d: "Mehrere qualifizierte Betriebe vergleichen – schneller Klarheit",
            },
            {
              t: "3. Umsetzung sichern",
              d: "Vor-Ort Abstimmung & Startzeit fixieren",
            },
          ].map((card) => (
            <div
              key={card.t}
              className='p-5 rounded-lg border bg-white shadow-sm hover:shadow-md transition'>
              <h3 className='font-semibold mb-2 text-green-700'>{card.t}</h3>
              <p className='text-sm text-gray-600'>{card.d}</p>
            </div>
          ))}
        </div>
        <div className='text-center mt-10'>
          <a
            href='#formular'
            className='inline-block bg-green-600 text-white font-semibold px-8 py-4 rounded-md shadow hover:bg-green-700 transition'
            data-cta='steps'>
            Jetzt starten
          </a>
        </div>
      </section>

      <section className='max-w-5xl mx-auto px-4 py-14 prose'>
        <h2>Warum strukturierte Beauftragung für {serviceName} sinnvoll ist</h2>
        <p>
          Unspezifische Anfragen führen oft zu pauschalen Rückmeldungen. Durch
          klar gegliederte Angaben (Ziele, Flächen, Materialien, Zeitfenster)
          reduzierst du Nachfragen & erhöhst die Qualität der Angebote für{" "}
          {serviceName} in {displayCity}.
        </p>
        <details open>
          <summary className='cursor-pointer font-semibold text-green-700'>
            Detaillierter Ablauf (5 Schritte)
          </summary>
          <ol className='list-decimal pl-6 mt-3'>
            {howTo.map((step) => (
              <li key={step.name}>
                <strong>{step.name}:</strong> {step.text}
              </li>
            ))}
          </ol>
        </details>
        <details className='mt-6'>
          <summary className='cursor-pointer font-semibold text-green-700'>
            Preis- & Einflussfaktoren
          </summary>
          <ul className='mt-3'>
            <li>Materialwahl & Beschaffungsaufwand</li>
            <li>Gelände / Zugang (Maschinen, Entsorgung, Logistik)</li>
            <li>
              Detailtiefe der Ausführung (Schnittkanten, Entwässerung, Unterbau)
            </li>
            <li>Saison & Auslastung lokaler Fachbetriebe</li>
            <li>Kombination mehrerer Teilleistungen in einem Auftrag</li>
          </ul>
        </details>
        <p className='p-4 border rounded bg-green-50 text-green-800 text-sm mt-6'>
          Tipp: Fotos + Maße + bevorzugte Materialien beschleunigen verbindliche
          Kalkulationen deutlich.
        </p>
        <details className='mt-6'>
          <summary className='cursor-pointer font-semibold text-green-700'>
            Typische Einsatzszenarien
          </summary>
          <p className='mt-3'>
            {serviceName} in {displayCity} wird häufig im Rahmen von
            Umgestaltung, Erweiterung bestehender Außenbereiche, Neubauprojekten
            oder saisonaler Pflegezyklen eingesetzt.
          </p>
        </details>
        <details className='mt-6'>
          <summary className='cursor-pointer font-semibold text-green-700'>
            Regionale Besonderheiten
          </summary>
          <p className='mt-3'>{seasonalHint}</p>
        </details>
        <details className='mt-6'>
          <summary className='cursor-pointer font-semibold text-green-700'>
            Häufige Fehler vermeiden
          </summary>
          <ul className='mt-3'>
            <li>Nur grobe Flächenangaben ohne beschreibende Nutzung</li>
            <li>Fehlende Priorisierung einzelner Teilabschnitte</li>
            <li>Keine Referenzfotos / Stilpräferenzen</li>
            <li>Unklare Zeitfenster & Entscheidungslogik</li>
            <li>Zu spätes Einplanen von Lieferzeiten für Spezialmaterialien</li>
          </ul>
        </details>
      </section>

      <section className='bg-gray-50 py-16 border-t'>
        <div className='max-w-4xl mx-auto px-4'>
          <h2 className='text-2xl md:text-3xl font-bold mb-8 text-center'>
            FAQ: {serviceName} beauftragen in {displayCity}
          </h2>
          <div className='divide-y border rounded-lg bg-white'>
            {faq.map((item) => (
              <details key={item.q} className='group p-4'>
                <summary className='cursor-pointer font-medium text-gray-900 flex justify-between items-center list-none'>
                  <span>{item.q}</span>
                  <span className='text-green-600 group-open:rotate-180 transition-transform'>
                    ⌄
                  </span>
                </summary>
                <div className='mt-2 text-sm text-gray-700 leading-relaxed'>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 py-12'>
        <h2 className='text-xl font-semibold mb-6 text-center'>
          Weitere relevante Seiten
        </h2>
        <div className='flex flex-wrap gap-3 justify-center text-sm'>
          <Link
            href={`/stadt/${norm}/${service}/angebot`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Angebote vergleichen
          </Link>
          <Link
            href={`/stadt/${norm}/${service}/preise`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Preise & Kosten
          </Link>
          <Link
            href={`/stadt/${norm}/${service}`}
            className='px-3 py-2 rounded border hover:bg-gray-50'>
            Übersicht {serviceName}
          </Link>
        </div>
      </section>

      <section className='bg-green-600 text-white py-14'>
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>
            Jetzt {serviceName} in {displayCity} starten
          </h2>
          <p className='opacity-90 mb-6'>
            Strukturierte Anfrage – bessere Umsetzungssicherheit – mehrere
            qualifizierte Rückmeldungen
          </p>
          <a
            href='#formular'
            className='inline-block bg-white text-green-700 font-semibold px-8 py-4 rounded-lg shadow hover:bg-gray-100 transition'>
            Formular ausfüllen
          </a>
        </div>
      </section>

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJson) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJson) }}
      />
    </div>
  );
}
