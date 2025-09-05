import { ALLOWED_CITY_SLUGS, CITY_DISPLAY_NAME, normalizeCityParam } from '@/lib/allowedCities';
import { notFound } from 'next/navigation';
import { deslugify } from '@/utils/slugify';
import type { Metadata } from 'next';
import Link from 'next/link';
import PriceCalculator from '@/components/PriceCalculator';
import ContractMultiStepForm from '@/components/ContractMultiStepForm';

export const revalidate = 86400; // daily – pricing guidance doesn't need hourly regeneration

interface PageParams { city: string; service: string }

const faqEntries = (serviceName:string, city:string) => [
  { q:`Was kostet ${serviceName} in ${city} durchschnittlich?`, a:`Projektabhängig. Materialqualität, Untergrundvorbereitung, Zugänglichkeit & Umfang bestimmen den Preis. Unsere Kalkulation zeigt typische Spannen – verbindliche Angebote erhältst du nach strukturierter Anfrage.`},
  { q:`Warum unterscheiden sich Angebote für ${serviceName} teils stark?`, a:`Oft fehlen Positionstrennungen (Unterbau, Entsorgung, Logistik). Manche Betriebe kalkulieren pauschal ohne Belastbarkeitsprüfung. Transparente Struktur reduziert Streuung & Vergleichsunklarheit.`},
  { q:`Wie erhalte ich realistische ${serviceName} Preise in ${city}?`, a:`Fläche, Nutzung, Materialpräferenzen, Fotos + besondere Rahmenbedingungen (Zugang, Gefälle, Entsorgung) angeben. Das erhöht Präzision & Geschwindigkeit der Rückmeldungen.`},
  { q:`Wann lohnt Premium-Material?`, a:`Bei höherer Nutzung, längerer Lebensdauer-Erwartung oder geringerer Pflege. Premium steigert Investition – kann Gesamtlebenskosten aber senken (Haltbarkeit, weniger Austausch).`},
  { q:`Welche Faktoren treiben die Kosten?`, a:`Untergrundaufbereitung, Entwässerung, Materialpreis, Logistik (Zufahrt), Sonderformen (Stufen, Kanten), Fundament-/Tragschichten & Witterungsfenster.`}
];

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if(!ALLOWED_CITY_SLUGS.includes(norm)) return { title:'Seite nicht verfügbar' };
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const title = `${serviceName} Preise in ${displayCity} | Kosten & Kalkulator`;
  return {
    title,
    description:`Aktuelle Orientierung für ${serviceName} Preise in ${displayCity}. Kostenfaktoren, Preis-Spannen, Kalkulator & direkte Angebotsanfrage für verlässliche Vergleichsangebote.`,
    keywords:[`${serviceName} Preise ${displayCity}`,`${serviceName} Kosten`, 'Preis Rechner', 'Kosten kalkulieren', 'Gartenbau Preise'],
    alternates:{ canonical:`https://www.landschaftshelden.io/stadt/${norm}/${service}/preise` },
    openGraph:{ title, description:`Kosten & Preisorientierungen für ${serviceName} in ${displayCity} – jetzt individuell kalkulieren & verbindliche Angebote erhalten.`, type:'website', locale:'de_DE' }
  };
}

export default async function CityServicePreisePage({ params }: { params: Promise<PageParams> }) {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if(!ALLOWED_CITY_SLUGS.includes(norm)) notFound();
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const faq = faqEntries(serviceName, displayCity);

  const priceBands = [
    { label:'Kleine Basisprojekte', span:'500€ – 2.500€', desc:'Einfacher Umfang, minimale Vorarbeiten, Standardmaterial' },
    { label:'Standard Projekte (mittel)', span:'2.500€ – 12.000€', desc:'Kombination aus Fläche + Aufbau + Materialmix + teilweiser Untergrundoptimierung' },
    { label:'Komplexe Ausführungen', span:'12.000€ – 40.000€', desc:'Höherer Materialstandard, konstruktive Details, Fundament-/Entwässerungskomponenten' },
    { label:'Große / Premium Anlagen', span:'40.000€ – 120.000€+', desc:'Umfangreiche Flächen, Premiumoberflächen, mehrgliedriger Aufbau, Sonderlogistik' }
  ];

  const costFactors = [
    'Untergrund / Bodenaustausch & Drainage',
    'Materialqualität & Veredelungsgrad',
    'Zugänglichkeit / Logistik (Geräte, Transportwege)',
    'Formkomplexität, Schnitte, Anpassungen',
    'Entsorgung (Aushub, Altmaterial)',
    'Nebenleistungen (Fundamente, Randbefestigungen, Entwässerung)',
    'Witterungs- & Terminfenster / Saison'
  ];

  const breadcrumbJson = {
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      { '@type':'ListItem', position:1, name:'Start', item:'https://www.landschaftshelden.io/' },
      { '@type':'ListItem', position:2, name:displayCity, item:`https://www.landschaftshelden.io/stadt/${norm}` },
      { '@type':'ListItem', position:3, name:serviceName, item:`https://www.landschaftshelden.io/stadt/${norm}/${service}` },
      { '@type':'ListItem', position:4, name:'Preise', item:`https://www.landschaftshelden.io/stadt/${norm}/${service}/preise` }
    ]
  };

  const faqJson = { '@context':'https://schema.org','@type':'FAQPage', mainEntity: faq.map(f => ({ '@type':'Question', name:f.q, acceptedAnswer:{ '@type':'Answer', text:f.a }})) };

  const offerJson = {
    '@context':'https://schema.org', '@type':'Service',
    name: `${serviceName} in ${displayCity}`,
    areaServed: displayCity,
    provider: { '@type':'Organization', name:'Landschaftshelden Netzwerk' },
    offers: [
      { '@type':'Offer', priceSpecification:{ '@type':'PriceSpecification', priceCurrency:'EUR', name:'Kleine Basisprojekte', minPrice:500, maxPrice:2500 } },
      { '@type':'Offer', priceSpecification:{ '@type':'PriceSpecification', priceCurrency:'EUR', name:'Standard Projekte', minPrice:2500, maxPrice:12000 } },
      { '@type':'Offer', priceSpecification:{ '@type':'PriceSpecification', priceCurrency:'EUR', name:'Komplexe Ausführungen', minPrice:12000, maxPrice:40000 } }
    ]
  };

  return (
    <div className='bg-white'>
      {/* Hero + Calculator */}
      <section className='bg-gradient-to-b from-green-50 to-white border-b'>
        <div className='max-w-7xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-start'>
          <div>
            <p className='text-xs font-semibold tracking-wide text-green-700 mb-2'>Preis-Orientierung & Kalkulation</p>
            <h1 className='text-3xl md:text-4xl font-bold leading-tight mb-4'>{serviceName} Preise in {displayCity}: Kosten verstehen & realistisch kalkulieren</h1>
            <p className='text-gray-700 mb-5'>Nutze unseren Kalkulator als erste Orientierung, verstehe die wichtigsten Kostenfaktoren & fordere anschließend strukturierte Angebote für belastbare Entscheidungen an.</p>
            <ul className='space-y-2 text-sm text-gray-700 mb-6'>
              <li>✅ Interaktive Spannen statt generischer Pauschalen</li>
              <li>✅ Relevante Kostenfaktoren klar erläutert</li>
              <li>✅ Direkter Übergang zur Angebotsanfrage</li>
              <li>✅ Mehr Transparenz bei Material- & Aufbauvarianten</li>
            </ul>
            <div className='flex flex-wrap gap-3'>
              <Link href={`#/preis-anfrage-form`} className='bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition' data-cta='preise-hero-to-form'>Verbindliche Angebote anfordern</Link>
              <Link href={`/stadt/${norm}/${service}/angebot`} className='text-green-700 text-sm font-semibold px-6 py-3 rounded-md border border-green-600 hover:bg-green-50 transition' data-cta='preise-hero-to-angebot'>Weitere Vorteile</Link>
            </div>
            <p className='text-[11px] text-gray-500 mt-4'>Kostenlos & unverbindlich · Strukturierte Vergleichsbasis · Schnellere valide Rückmeldungen</p>
          </div>
          <div className='relative space-y-6' id='preis-kalkulator'>
            <div className='p-5 border rounded-lg bg-white shadow-sm'>
              <h2 className='font-semibold mb-3 text-green-700 text-sm tracking-wide uppercase'>Preis-Kalkulator</h2>
              <PriceCalculator serviceName={serviceName} cityName={displayCity} />
            </div>
            <div className='p-5 border rounded-lg bg-white shadow-sm' id='preis-anfrage-form'>
              <h2 className='font-semibold mb-4 text-green-700 text-sm tracking-wide uppercase'>Jetzt konkrete Angebote erhalten</h2>
              <ContractMultiStepForm variant='embedded' showHeader={false} prefilledCity={displayCity} prefilledService={serviceName} />
              <p className='mt-3 text-[11px] text-gray-500 text-center'>Kostenlos & unverbindlich – Daten nur zur Angebotsvermittlung genutzt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Bands */}
      <section className='max-w-6xl mx-auto px-4 py-14'>
        <h2 className='text-2xl font-bold mb-8 text-center'>Typische Projekt-Bandbreiten</h2>
        <div className='grid md:grid-cols-4 gap-6'>
          {priceBands.map(b => (
            <div key={b.label} className='p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition'>
              <h3 className='font-semibold text-green-700 mb-1'>{b.label}</h3>
              <p className='text-sm font-medium text-gray-900 mb-1'>{b.span}</p>
              <p className='text-xs text-gray-600 leading-relaxed'>{b.desc}</p>
            </div>
          ))}
        </div>
        <div className='text-center mt-10'>
          <a href='#preis-anfrage-form' className='inline-block bg-green-600 text-white font-semibold px-8 py-4 rounded-md shadow hover:bg-green-700 transition' data-cta='bands-to-form'>Verbindliche Angebote sichern</a>
        </div>
      </section>

      {/* Cost Factors */}
      <section className='max-w-5xl mx-auto px-4 py-10 prose'>
        <h2>Wichtige Kostenfaktoren</h2>
        <p>Die endgültigen Kosten für <strong>{serviceName}</strong> in <strong>{displayCity}</strong> ergeben sich aus einer Kombination struktureller, logistischer & materialbezogener Parameter. Wer die Treiber versteht, kann Angebote fundierter bewerten & Einsparpotential erkennen.</p>
        <ul>
          {costFactors.map(f => <li key={f}>{f}</li>)}
        </ul>
        <h3>Optimierungsansätze</h3>
        <p>Frühzeitige Klärung von Zugang, Entsorgung & Materialalternativen reduziert Unsicherheitspuffer. Mengengenauigkeit & Foto-/Skizzenmaterial beschleunigen Rückfragen & verbessern Vergleichbarkeit.</p>
        <details open>
          <summary className='cursor-pointer font-semibold text-green-700'>Untergrund & Aufbau</summary>
          <p>Ein Großteil der Kosten entsteht im unsichtbaren Bereich (Tragschicht, Wasserführung, Verdichtung). Hier entscheidet sich Haltbarkeit & spätere Instandhaltungsquote.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>Materialqualität</summary>
          <p>Premium-Oberflächen & veredeltes Material erhöhen Investition – reduzieren aber häufig Pflege, Ausbleichung & Austauschzyklen.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>Logistik & Zugang</summary>
          <p>Beengte Zufahrten oder Hand- statt Maschinenbewegung erzeugen Mehrstunden. Früh identifizieren & Alternativen prüfen.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>Komplexität & Sonderdetails</summary>
          <p>Formenschnitte, Höhenversprünge, Randanschlüsse, Entwässerung & Beleuchtung erhöhen Koordinations- & Ausführungsaufwand.</p>
        </details>
      </section>

      {/* FAQ */}
      <section className='bg-gray-50 py-16 border-t'>
        <div className='max-w-5xl mx-auto px-4'>
          <h2 className='text-2xl md:text-3xl font-bold mb-8 text-center'>FAQ: {serviceName} Preise in {displayCity}</h2>
          <div className='divide-y border rounded-lg bg-white'>
            {faq.map(item => (
              <details key={item.q} className='group p-4'>
                <summary className='cursor-pointer font-medium text-gray-900 flex justify-between items-center list-none'>
                  <span>{item.q}</span>
                  <span className='text-green-600 group-open:rotate-180 transition-transform'>⌄</span>
                </summary>
                <div className='mt-2 text-sm text-gray-700 leading-relaxed'>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className='max-w-6xl mx-auto px-4 py-12'>
        <h2 className='text-xl font-semibold mb-6 text-center'>Weitere Schritte</h2>
        <div className='flex flex-wrap gap-3 justify-center text-sm'>
          <Link href={`/stadt/${norm}/${service}/angebot`} className='px-3 py-2 rounded border hover:bg-gray-50'>Angebote vergleichen</Link>
          <Link href={`/stadt/${norm}/${service}/beauftragen`} className='px-3 py-2 rounded border hover:bg-gray-50'>Direkt beauftragen</Link>
          <Link href={`/stadt/${norm}/${service}/firma-finden`} className='px-3 py-2 rounded border hover:bg-gray-50'>Firma finden</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className='bg-green-600 text-white py-14'>
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>Jetzt konkrete {serviceName} Angebote in {displayCity} anfordern</h2>
          <p className='opacity-90 mb-6'>Spannen verstehen – Vergleich schaffen – bessere Entscheidung treffen</p>
          <a href='#preis-anfrage-form' className='inline-block bg-white text-green-700 font-semibold px-8 py-4 rounded-lg shadow hover:bg-gray-100 transition' data-cta='final-cta-to-form'>Kostenlos starten</a>
        </div>
      </section>

      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJson) }} />
    </div>
  );
}
