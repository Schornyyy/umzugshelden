// Helper für dynamische, eindeutige City-Content-Varianten (Headline & FAQ)
// Ziel: Für jede Stadt deterministisch unterschiedliche Überschriften + FAQ (inkl. schema.org FAQPage)
import { cities } from '@/statics/Lists';

export interface CityFAQItem {
  question: string;
  answer: string;
}

interface CityContentData {
  headline: string;
  faq: CityFAQItem[];
  costLow: number;
  costHigh: number;
  variantId: number;
}

// Schneller Hash (deterministisch, ausreichend für Verteilung)
function hashCity(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Headline Templates – {city}, {count?} wird später ersetzt
const HEADLINE_TEMPLATES: string[] = [
  'Gartenbauer in {city}: Jetzt Angebote vergleichen',
  '{city}: Garten- & Landschaftsbau – In 2 Minuten Anfrage starten',
  'Top Garten- und Landschaftsbauer {city} (Kostenlos bis zu 5 Angebote)',
  'Gartengestaltung {city}: Betriebe & Preise im Schnellvergleich',
  '{city}: Ihr Projekt mit qualifizierten GaLaBau Betrieben starten',
  '{city}: Landschaftsgärtner finden & transparente Preise erhalten',
  'GaLaBau {city}: Experten für Planung, Pflege & Pflasterarbeiten',
];

// Mehrere FAQ-Variantensets – jede Funktion erzeugt dynamische Q/A basierend auf Stadt & Kostenspanne
type FAQGenerator = (city: string, low: number, high: number) => CityFAQItem[];

const FAQ_VARIANTS: FAQGenerator[] = [
  (city, low, high) => [
    {
      question: `Was kostet Garten- & Landschaftsbau in ${city}?`,
      answer: `Die Kosten hängen stark von Projektgröße und Materialwahl ab. Kleine Arbeiten starten oft ab ca. ${low.toLocaleString('de-DE')} € – umfangreichere Projekte (Terrasse, Pflaster, Komplettgestaltung) können ${high.toLocaleString('de-DE')} € oder mehr erreichen. Mehrere Angebote über unsere Plattform machen Preisstrukturen transparent.`,
    },
    {
      question: `Wie finde ich den passenden Gartenbauer in ${city}?`,
      answer: `Statt auf ein einzelnes Angebot zu setzen, stellen Sie eine kostenlose Anfrage und vergleichen mehrere qualifizierte Betriebe aus ${city} und Umgebung – so erhalten Sie bessere Preise und passendere Lösungen.`,
    },
    {
      question: `Wie schnell bekomme ich Angebote in ${city}?`,
      answer: `In der Regel melden sich erste Betriebe innerhalb von 24 Stunden. Saisonabhängig (Frühjahr/Sommer) kann es etwas länger dauern – frühes Anfragen sichert Kapazitäten.`,
    },
    {
      question: `Welche Leistungen decken Betriebe in ${city} ab?`,
      answer: `Von Planung, Erd- & Pflasterarbeiten über Rollrasen, Bewässerung, Sichtschutz, Baumpflege bis hin zu Pflegeverträgen. Geben Sie Ihre Bedürfnisse einfach im Anfrageformular an.`,
    },
  ],
  (city, low, high) => [
    {
      question: `Warum mehrere Angebote für ${city} einholen?`,
      answer: `Preisunterschiede von 20–35% sind im GaLaBau üblich. Durch den strukturierten Vergleich sparen Sie Zeit & Budget und minimieren Fehlentscheidungen.`,
    },
    {
      question: `Welche Preisfaktoren gelten in ${city}?`,
      answer: `Flächengröße, Geländezustand, Material (Naturstein vs. Beton), Entsorgung und Maschinenaufwand. Beispiel: Standardarbeiten starten bei ca. ${low.toLocaleString('de-DE')} €, Premium-Ausführungen erreichen leicht ${high.toLocaleString('de-DE')} €.`,
    },
    {
      question: `Sind Betriebe aus ${city} geprüft?`,
      answer: `Wir prüfen Basisdaten (Gewerbe, Erreichbarkeit) und priorisieren aktive, bewertete Betriebe. So erhalten Sie nur relevante Rückmeldungen.`,
    },
    {
      question: `Welche Saison ist ideal für Projekte in ${city}?`,
      answer: `Planung & Angebotsphase ab Winter/Frühjahr sichern frühere Umsetzung. Pflanzarbeiten gelingen oft am besten im Frühjahr oder frühen Herbst.`,
    },
  ],
  (city, low, high) => [
    {
      question: `Kann ich auch kleine Arbeiten in ${city} vergeben?`,
      answer: `Ja. Auch Teilaufträge wie Beet-Neuanlage, Zaunbau oder Rasenpflege werden angenommen – besonders wenn Umfang & Bilder sauber beschrieben sind.`,
    },
    {
      question: `Wie bereite ich meine Anfrage für ${city} optimal vor?`,
      answer: `Fotos, grobe Maße, gewünschte Materialien und Nutzungsideen hinzufügen. Das reduziert Rückfragen und beschleunigt belastbare Angebote.`,
    },
    {
      question: `Welche typischen Preisbereiche gelten in ${city}?`,
      answer: `Einfache Anpassungen liegen häufig im Bereich ${low.toLocaleString('de-DE')}–${Math.round(low*1.4).toLocaleString('de-DE')} €. Größere Umgestaltungen, Pflasterflächen oder Komplettpakete erreichen ${high.toLocaleString('de-DE')} € oder darüber.`,
    },
    {
      question: `Bekomme ich feste Pauschalpreise in ${city}?`,
      answer: `Viele Betriebe kalkulieren kombiniert aus Material + Arbeitsaufwand. Vergleich mehrerer detaillierter Angebote schafft Kostensicherheit.`,
    },
  ],
  (city, low, high) => [
    {
      question: `Wie realistisch kalkuliere ich mein Budget in ${city}?`,
      answer: `Legen Sie zuerst ein Zielniveau fest (Basis, Komfort, Premium). Prüfen Sie danach Positionen wie Erdarbeiten, Entwässerung & Material. Für mittlere Projekte ist ein Rahmen von ${low.toLocaleString('de-DE')}–${high.toLocaleString('de-DE')} € häufig praxisnah.`,
    },
    {
      question: `Übernimmt ein Betrieb auch Pflege nach Fertigstellung in ${city}?`,
      answer: `Ja, viele bieten Saisonpflege oder Jahresverträge (Rasen, Gehölz, Bewässerung) an – direkt in die Anfrage schreiben erhöht die Erfolgsquote.`,
    },
    {
      question: `Wie erkenne ich seriöse Anbieter in ${city}?`,
      answer: `Vollständige Angebotspositionen, klare Materialdefinition, transparente Stundensätze & nachvollziehbare Referenzen. Mehrere Angebote machen Unterschiede sichtbar.`,
    },
    {
      question: `Warum jetzt Projekt in ${city} starten?`,
      answer: `Frühzeitige Planung sichert Kapazitäten – viele Kalender füllen sich schnell. Eine Anfrage kostet nichts und verschafft Vergleichsdaten.`,
    },
  ],
];

export function getCityContent(city: string): CityContentData {
  const base = city.trim();
  const h = hashCity(base.toLowerCase());
  const indexInList = cities.findIndex(c => c.toLowerCase() === base.toLowerCase());
  // Falls Stadt nicht in Liste: fallback auf Hash
  const pos = indexInList >= 0 ? indexInList : h % 500;

  // Dynamische Kostenspannen (rein informativ, nicht verbindlich)
  const costLow = 300 + (pos % 40) * 25; // 300 – 1300
  const costHigh = costLow + 1500 + (h % 900); // Spread 1500–2400 plus low

  const headlineTemplate = HEADLINE_TEMPLATES[h % HEADLINE_TEMPLATES.length];
  const headline = headlineTemplate.replace('{city}', base);

  const faqGen = FAQ_VARIANTS[h % FAQ_VARIANTS.length];
  const faq = faqGen(base, costLow, costHigh);

  return { headline, faq, costLow, costHigh, variantId: h % 10000 };
}

export function buildFAQSchema(faq: CityFAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
