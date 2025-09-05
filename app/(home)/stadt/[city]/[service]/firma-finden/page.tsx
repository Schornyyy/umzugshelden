import { ALLOWED_CITY_SLUGS, CITY_DISPLAY_NAME, normalizeCityParam } from '@/lib/allowedCities';
import { notFound } from 'next/navigation';
import { deslugify } from '@/utils/slugify';
import ContractMultiStepForm from '@/components/ContractMultiStepForm';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

interface PageParams { city: string; service: string }

const heroVariants = [
  'Schneller zum passenden Fachbetrieb',
  'Gezielt passende Betriebe identifizieren',
  'Passgenaue Anbieter statt Zufall',
  'Qualifizierte Anbieter schneller finden'
];

function hash(str:string){ let h=0; for(let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0;} return Math.abs(h); }

function buildFaq(serviceName:string, city:string){
  return [
    { q:`Wie finde ich den besten Anbieter für ${serviceName} in ${city}?`, a:`Definiere Ziel, Umfang, Materialien & Zeitfenster. Ergänze Fotos. Mit strukturierten Angaben filtern Betriebe schneller, wodurch du relevantere Rückmeldungen erhältst.` },
    { q:`Woran erkenne ich qualifizierte ${serviceName} Betriebe in ${city}?`, a:`Professionelle Kommunikation, klare Rückfragen, transparente Ausführungslogik, Referenzen & konkrete Zeitfenster. Seriöse Anbieter vermeiden unrealistische Pauschalen ohne Grundlagen.` },
    { q:`Soll ich mehrere ${serviceName} Betriebe in ${city} gleichzeitig anfragen?`, a:`Ja – Vergleich erhöht Preistransparenz & verbessert Terminsicherheit. 3–5 qualifizierte Rückmeldungen liefern Marktspanne & Qualitätsunterschiede.` },
    { q:`Wie lange dauern Rückmeldungen zu ${serviceName} in ${city}?`, a:`Erste Antworten häufig 24–72 Stunden. Präzise Anfragen (Flächen, Nutzung, Materialien) beschleunigen den Prozess deutlich.` },
    { q:`Wann lohnt ein Vor-Ort-Termin?`, a:`Sobald Eckdaten abgestimmt sind & eine belastbare Ausführungskalkulation benötigt wird (Unterbau, Drainage, Materialaufbau, Logistik).` }
  ];
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if(!ALLOWED_CITY_SLUGS.includes(norm)) return { title: 'Seite nicht verfügbar' };
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const title = `${serviceName} Firma in ${displayCity} finden | Qualifizierte Anbieter vergleichen`;
  return {
    title,
    description: `Finde jetzt qualifizierte ${serviceName} Betriebe in ${displayCity}. Strukturierte Vergleichskriterien, transparente Auswahl, schneller Kontakt zu passenden Fachfirmen.`,
    keywords:[`${serviceName} Firma ${displayCity}`,'Fachbetrieb finden',`${serviceName} Anbieter vergleichen`,`Garten & Landschaftsbau ${displayCity}`,'Dienstleister Auswahl'],
    alternates:{ canonical:`https://www.landschaftshelden.io/stadt/${norm}/${service}/firma-finden` },
    openGraph:{ title, description:`Qualifizierte ${serviceName} Anbieter in ${displayCity} vergleichen & schnell passenden Fachbetrieb auswählen.`, locale:'de_DE', type:'website' }
  };
}

export default async function CityServiceFirmaFindenPage({ params }: { params: Promise<PageParams> }) {
  const { city, service } = await params;
  const norm = normalizeCityParam(city);
  if(!ALLOWED_CITY_SLUGS.includes(norm)) notFound();
  const displayCity = CITY_DISPLAY_NAME[norm] || city;
  const serviceName = deslugify(service);
  const variant = heroVariants[ hash(norm+service) % heroVariants.length ];
  const faq = buildFaq(serviceName, displayCity);

  const criteria = [
    'Nachweisbare Erfahrung mit ähnlichen Projekten',
    'Klare Kommunikation & strukturierte Rückfragen',
    'Saubere Dokumentation (Aufmaß, Aufbau, Material)',
    'Transparente Kalkulation & Positionstrennung',
    'Realistische Zeitplanung & Pufferlogik'
  ];

  const evalMatrix = [
    { k:'Fachliche Qualität', d:'Detailtiefe der Ausführung, Materialkompetenz, Aufbauempfehlungen' },
    { k:'Verfügbarkeit', d:'Zeitfenster, Flexibilität, Zuverlässigkeit' },
    { k:'Wirtschaftlichkeit', d:'Preisstruktur, Positionstransparenz, Optionen' },
    { k:'Kommunikation', d:'Reaktionszeit, Klarheit, Lösungsorientierung' },
    { k:'Nachhaltigkeit', d:'Materialwahl, Pflegeaufwand, Lebenszyklus' }
  ];

  const breadcrumbJson = {
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      { '@type':'ListItem', position:1, name:'Start', item:'https://www.landschaftshelden.io/' },
      { '@type':'ListItem', position:2, name:displayCity, item:`https://www.landschaftshelden.io/stadt/${norm}` },
      { '@type':'ListItem', position:3, name:serviceName, item:`https://www.landschaftshelden.io/stadt/${norm}/${service}` },
      { '@type':'ListItem', position:4, name:'Firma finden', item:`https://www.landschaftshelden.io/stadt/${norm}/${service}/firma-finden` }
    ]
  };

  const faqJson = { '@context':'https://schema.org','@type':'FAQPage', mainEntity: faq.map(f => ({ '@type':'Question', name:f.q, acceptedAnswer:{ '@type':'Answer', text:f.a }})) };

  const itemListJson = {
    '@context':'https://schema.org','@type':'ItemList',
    name:`Auswahlkriterien ${serviceName} ${displayCity}`,
    itemListElement: criteria.map((c,i)=>({ '@type':'ListItem', position:i+1, name:c }))
  };

  return (
    <div className='bg-white'>
      {/* Hero */}
      <section className='bg-gradient-to-b from-green-50 to-white border-b'>
        <div className='max-w-7xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-start'>
          <div>
            <p className='text-xs font-semibold tracking-wide text-green-700 mb-2'>{variant}</p>
            <h1 className='text-3xl md:text-4xl font-bold leading-tight mb-4'>{serviceName} Firma in {displayCity} finden & richtig auswählen</h1>
            <p className='text-gray-700 mb-5'>Nutze strukturierte Qualitäts- & Vergleichskriterien um <strong>{serviceName}</strong> Anbieter in <strong>{displayCity}</strong> gezielt zu bewerten. So minimierst du Fehlentscheidungen & Projektverzögerungen.</p>
            <ul className='space-y-2 text-sm text-gray-700 mb-6'>
              <li>✅ Qualifizierte Fachbetriebe im direkten Umfeld</li>
              <li>✅ Vergleich nach Qualität, Verfügbarkeit & Preisstruktur</li>
              <li>✅ Mehr Sicherheit vor ungeeigneten Angeboten</li>
              <li>✅ Grundlage für belastbare Beauftragung</li>
            </ul>
            <div className='flex flex-wrap gap-3'>
              <Link href={`/stadt/${norm}/${service}/angebot`} className='bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition'>Angebote einholen</Link>
              <Link href={`/stadt/${norm}/${service}/beauftragen`} className='text-green-700 text-sm font-semibold px-6 py-3 rounded-md border border-green-600 hover:bg-green-50 transition'>Direkt beauftragen</Link>
            </div>
            <p className='text-[11px] text-gray-500 mt-4'>Kostenlos & unverbindlich · Bessere Vergleichbarkeit · Transparente Auswahl</p>
          </div>
          <div className='relative space-y-6' id='formular'>
            <div className='p-5 border rounded-lg bg-white shadow-sm'>
              <h2 className='font-semibold mb-3 text-green-700 text-sm tracking-wide uppercase'>Auswahl-Checkliste</h2>
              <ul className='space-y-2 text-sm text-gray-700'>
                {criteria.map(c => <li key={c}>🗹 {c}</li>)}
              </ul>
              <div className='mt-5 text-center'>
                <a href='#formular-form' className='inline-block bg-green-600 text-white text-xs font-semibold px-5 py-3 rounded-md hover:bg-green-700 transition' data-cta='checklist-to-form'>Direkt Anfrage starten</a>
              </div>
            </div>
            <div className='p-5 border rounded-lg bg-white shadow-sm' id='formular-form'>
              <h2 className='font-semibold mb-4 text-green-700 text-sm tracking-wide uppercase'>Direkte Anfrage stellen</h2>
              <ContractMultiStepForm variant='embedded' showHeader={false} prefilledCity={displayCity} prefilledService={serviceName} />
              <p className='mt-3 text-[11px] text-gray-500 text-center'>Kostenlos & unverbindlich – Daten nur zur Vermittlung genutzt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Matrix */}
      <section className='max-w-6xl mx-auto px-4 py-14'>
        <h2 className='text-2xl font-bold mb-8 text-center'>Bewertungs-Matrix für {serviceName} Anbieter</h2>
        <div className='grid md:grid-cols-3 gap-6'>
          {evalMatrix.map(m => (
            <div key={m.k} className='p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition'>
              <h3 className='font-semibold text-green-700 mb-2'>{m.k}</h3>
              <p className='text-sm text-gray-600'>{m.d}</p>
            </div>
          ))}
        </div>
        <div className='text-center mt-10'>
          <Link href={`/stadt/${norm}/${service}/angebot`} className='inline-block bg-green-600 text-white font-semibold px-8 py-4 rounded-md shadow hover:bg-green-700 transition'>Unverbindlich vergleichen</Link>
        </div>
      </section>

      {/* Deep Content (Expandable) */}
      <section className='max-w-5xl mx-auto px-4 py-10 prose'>
        <h2>Strategischer Auswahlprozess</h2>
        <p>Die Auswahl geeigneter <strong>{serviceName}</strong> Anbieter in <strong>{displayCity}</strong> folgt idealerweise einer klaren Bewertungslogik: Bedarf präzisieren → Vergleichskriterien definieren → Rückmeldungen strukturieren → Risiken identifizieren → Entscheidung dokumentieren.</p>
        <details open>
          <summary className='cursor-pointer font-semibold text-green-700'>1. Projektdefinition & Zielklarheit</summary>
          <p>Fasse Zweck, gewünschte Nutzungsintensität, Materialpräferenzen & Budgetrahmen zusammen. Ergänze vorhandene Pläne, Skizzen oder Fotos.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>2. Vergleichskriterien festlegen</summary>
          <p>Typische Kriterien: Preisstruktur (differenziert vs. Pauschale), Ausführungslogik (Untergrund, Entwässerung), Erfahrung mit ähnlichen Projekten, Antwortgeschwindigkeit, Materialberatung.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>3. Rückmeldungen normalisieren</summary>
          <p>Überführe Angebote in eine vergleichbare Matrix: Positionen, Mengen, Einheitspreise, Besonderheiten, Abweichungen. Lücken aktiv nachfordern.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>4. Risiko- & Plausibilitätsprüfung</summary>
          <p>Prüfe Unterbau, Schichtenaufbau, Wasserführung, Materialqualität, Zeitplanreserve. Frage nach Alternativen, falls etwas überdimensioniert oder unterdimensioniert wirkt.</p>
        </details>
        <details className='mt-4'>
          <summary className='cursor-pointer font-semibold text-green-700'>5. Entscheidung & Dokumentation</summary>
          <p>Dokumentiere Gründe (Preis-Leistung, Vertrauen, technische Qualität). Plane Vorlauf für Materiallieferungen & witterungsabhängige Arbeiten ein.</p>
        </details>
        <h3>Häufige Versäumnisse</h3>
        <ul>
          <li>Kein einheitliches Vergleichsformat</li>
          <li>Fehlende Rückfragen zu unklaren Positionen</li>
          <li>Übersehen von Untergrund-/Drainagethemen</li>
          <li>Unrealistisch enger Terminplan</li>
          <li>Fehlende Materialalternativen (Kosten-/Haltbarkeitsoptimierung)</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className='bg-gray-50 py-16 border-t'>
        <div className='max-w-5xl mx-auto px-4'>
          <h2 className='text-2xl md:text-3xl font-bold mb-8 text-center'>FAQ: {serviceName} Anbieter in {displayCity}</h2>
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
        <h2 className='text-xl font-semibold mb-6 text-center'>Nächste Schritte</h2>
        <div className='flex flex-wrap gap-3 justify-center text-sm'>
          <Link href={`/stadt/${norm}/${service}/angebot`} className='px-3 py-2 rounded border hover:bg-gray-50'>Angebote vergleichen</Link>
          <Link href={`/stadt/${norm}/${service}/beauftragen`} className='px-3 py-2 rounded border hover:bg-gray-50'>Direkt beauftragen</Link>
          <Link href={`/stadt/${norm}/${service}/preise`} className='px-3 py-2 rounded border hover:bg-gray-50'>Preise & Kosten</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className='bg-green-600 text-white py-14'>
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>Jetzt passende {serviceName} Anbieter in {displayCity} anfragen</h2>
          <p className='opacity-90 mb-6'>Strukturiert vergleichen – bessere Entscheidungen – schnellere Umsetzung</p>
          <Link href={`/stadt/${norm}/${service}/angebot`} className='inline-block bg-white text-green-700 font-semibold px-8 py-4 rounded-lg shadow hover:bg-gray-100 transition'>Jetzt starten</Link>
        </div>
      </section>

      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }} />
    </div>
  );
}
