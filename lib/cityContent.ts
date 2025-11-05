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


// Mehrere FAQ-Variantensets – jede Funktion erzeugt dynamische Q/A basierend auf Stadt & Kostenspanne
type FAQGenerator = (city: string, low: number, high: number) => CityFAQItem[];

const FAQ_VARIANTS: FAQGenerator[] = [
  (city, low, high) => { void city; void low; void high; return [
    {
      question: `Wie viel kostet eine Website in ${city} und wovon hängt der Preis ab?`,
    answer: `Bei GS-Creatives erklären wir zuerst den Scope und erstellen auf Basis Ihres Briefings ein transparentes Angebot. Die Preise variieren nach Umfang, Funktionalität und Content-Aufwand: einfache Webseiten beginnen oft bei ca. ${low.toLocaleString('de-DE')} €, komplexe Projekte oder Shops können bis ${high.toLocaleString('de-DE')} € oder mehr kosten. Wir liefern eine klare Leistungsbeschreibung, damit Sie genau wissen, was enthalten ist.`,
    },
    {
      question: `Wie lange dauert die Fertigstellung einer Website für ${city}?`,
    answer: `Wir bei GS-Creatives arbeiten in klaren Phasen (Konzept → Design → Umsetzung → Launch). Kleine Seiten realisieren wir oft in 2–6 Wochen; komplexe Projekte mit Integrationen oder Shops planen wir mit 6–16 Wochen. Verzögerungen vermeiden wir durch feste Meilensteine und klare Deadlines für Feedback und Content.`,
    },
    {
      question: `Wer ist für Inhalte (Texte, Bilder) verantwortlich?`,
    answer: `Bei GS-Creatives bieten wir flexible Content-Optionen: Sie liefern vorhandene Texte/Bilder oder wir erstellen Content (Texte, Bildsprache) gegen Aufpreis. Im Angebot legen wir genau fest, welche Content-Leistungen enthalten sind und welche zusätzlich berechnet werden.`,
    },
    {
      question: `Welche Ergebnisse muss ich vor dem Start bereitstellen?`,
    answer: `Damit wir zügig starten können, benötigen wir in der Regel Logo, CI-Farben, grobe Seitenstruktur, vorhandene Texte und Beispielseiten. Wenn Inhalte fehlen, bieten wir Unterstützung bei der Content-Erstellung an — das sprechen wir vor Projektstart ab.`,
    },
  ]; },
  (city, low, high) => { void city; void low; void high; return [
    {
      question: `Wie viele Korrekturrunden sind im Preis enthalten?`,
    answer: `In unseren Angeboten sind typischerweise 2–3 Korrekturrunden für Design enthalten; weitere Anpassungen definieren wir als Nachtragsleistung. Wir dokumentieren Änderungswünsche und schlagen ggf. ein Zusatzangebot vor, damit der Zeit- und Kostenrahmen klar bleibt.`,
    },
    {
      question: `Wer übernimmt Hosting, Wartung und Sicherheit nach dem Launch?`,
    answer: `Wir bieten sowohl Managed-Hosting- und Wartungspakete als auch Beratung zur eigenen Hosting-Auswahl an. Unsere Pakete beinhalten Backups, Security-Updates und definierte Reaktionszeiten — diese Leistungen werden im Vertrag klar beschrieben.`,
    },
    {
      question: `Wer erhält die Zugänge und Rechte (CMS, Domains)?`,
    answer: `Bei GS-Creatives stellen wir sicher, dass Sie nach Abschluss die notwendigen Zugänge (Domain, Hosting, CMS) erhalten. Wenn Sie wünschen, übernehmen wir die Verwaltung im Rahmen eines Wartungsvertrags — alle Zugriffsrechte und Übergaben regeln wir transparent im Vertrag.`,
    },
    {
      question: `Wie ist das Zahlungsmodell (Stunden, Pauschale, Meilensteine)?`,
    answer: `Wir arbeiten je nach Projekt mit Festpreis, Meilensteinen oder Zeit & Material. In Angeboten definieren wir Zahlungspläne (z. B. Abschlag bei Projektstart, Meilensteinzahlungen) und regeln, wie Änderungsanforderungen abgerechnet werden.`,
    },
  ]; },
  (city, low, high) => { void city; void low; void high; return [
    {
      question: `Wie wird die Suchmaschinen-Optimierung (SEO) berücksichtigt?`,
    answer: `Wir integrieren On-Page-SEO (Meta-Tags, strukturierte Inhalte, Performance-Optimierung) in unsere Basis-Leistungen. Für nachhaltige Sichtbarkeit bieten wir ergänzende SEO-Pakete (Keyword-Recherche, Content-Optimierung, Monitoring) mit klar definierten Deliverables an.`,
    },
    {
      question: `Welche Garantien oder Supportzeiten gibt es nach dem Launch?`,
    answer: `Nach dem Launch gewähren wir eine Fehlerbehebungsphase und bieten optionale Support- und Wartungsverträge mit definierten Reaktionszeiten und Stundenkontingenten an. Details stehen im Angebot und Service-Level-Agreement.`,
    },
    {
      question: `Kann ich Referenzprojekte sehen und sprechen?`,
    answer: `Wir präsentieren Ihnen gerne passende Referenzprojekte und Case Studies mit Ergebnissen. Auf Wunsch stellen wir Kontakte zu früheren Kunden her oder zeigen vergleichbare Live-Projekte, damit Sie die Arbeitsweise und Resultate beurteilen können.`,
    },
    {
      question: `Wie wird der Datenschutz (DSGVO) umgesetzt?`,
    answer: `Datenschutz ist Teil unseres Projekts: Wir unterstützen bei DSGVO-konformer Umsetzung (Cookie-Banner, AV-Verträge, Einbindung von Tracking/Forms) und klären gemeinsam notwendige Maßnahmen im Briefing.`,
    },
  ]; },
  (city, low, high) => { void city; void low; void high; return [
    {
      question: `Was passiert, wenn ich nach dem Angebot Änderungen will?`,
    answer: `Wenn sich Anforderungen ändern, dokumentieren wir die Wünsche und erstellen ein Änderungsangebot mit transparenter Zeit- und Kostenabschätzung. So bleibt das Projekt für beide Seiten planbar.`,
    },
    {
      question: `Gehören mir die Designs und der Code nach Abschluss?`,
    answer: `Standardmäßig übertragen wir Ihnen nach Zahlung die Nutzungsrechte und übergeben alle notwendigen Zugänge. Wenn besondere Lizenz- oder Wiederverwendungsfragen bestehen, regeln wir das vertraglich im Vorfeld.`,
    },
    {
      question: `Wie werden Inhalte und Wartung später aktualisiert?`,
    answer: `Bei Verwendung eines CMS erhalten Sie auf Wunsch eine kurze Schulung, damit Sie Inhalte selbst pflegen können. Für fortlaufende Aktualisierungen bieten wir Wartungs- und Pflegepakete an, die in Stundenkontingenten oder monatlichen Retainern abgerechnet werden.`,
    },
    {
      question: `Worauf sollte ich bei der Angebotseinholung besonders achten?`,
    answer: `Beim Vergleich von Angeboten empfehlen wir, neben dem Preis besonders auf Scope, Lieferumfang, Zeitplan, Referenzen und Support-Optionen zu achten. Ein detailliertes Briefing ermöglicht comparable Angebote und verhindert spätere Nachträge.`,
    },
  ]; },
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

  // Dynamische Headline basierend auf Stadt
  const headline = `Garten- & Landschaftsbau in ${base}`;

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
