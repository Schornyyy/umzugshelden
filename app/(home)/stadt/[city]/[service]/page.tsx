import { redirect } from "next/navigation";
import {
  rawCities,
  cities,
  getServices,
  getNearbyCities,
} from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import ServiceSchema from "@/components/ServiceSchema";
import { FAQType } from "@/types/utils/FAQType";
import { CheckIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase(),
  );
}

function getCanonicalCityName(cityName: string): string {
  return (
    rawCities.find(
      (city) => slugify(city).toLowerCase() === slugify(cityName).toLowerCase(),
    ) ?? cityName
  );
}

const serviceConfig = {
  umzugsservice: {
    name: "Umzugsservice",
    title: "Professioneller Umzugsservice",
    description:
      "Wohnungs-, Firmen- und Regionalumzug – zuverlässig, termingerecht und zu fairen Festpreisen.",
    intros: [
      "Ein Umzug soll ein guter Start sein, nicht eine zusätzliche Belastung. Wir planen Ihren Umzug in {city} gemeinsam mit Ihnen und übernehmen auf Wunsch Verpackung, Transport, Möbelmontage und die Koordination am Umzugstag.",
      "Von der ersten Besichtigung bis zum letzten Karton: Unser Team organisiert Ihren Umzug in {city} strukturiert und zuverlässig. Ob Wohnung, Haus oder Büro – Sie erhalten ein Festpreisangebot und einen klaren Ablaufplan für den Umzugstag.",
      "Wer in {city} umzieht, hat genug zu organisieren. Überlassen Sie Transport, Verpackung und Möbelmontage unseren erfahrenen Umzugshelfern – Sie konzentrieren sich auf Ihren Neustart, wir kümmern uns um den Rest.",
    ],
    features: [
      "Privatumzug",
      "Firmenumzug",
      "Verpackungsservice",
      "Möbelmontage",
      "Schwertransporte",
      "Kurzfristige Umzüge",
    ],
    benefits: [
      "Festes Preisangebot – keine versteckten Kosten",
      "Erfahrenes und freundliches Team",
      "Moderne Fahrzeuge & professionelles Equipment",
      "Flexibel bei Terminen, auch am Wochenende",
      "Komplett-Service aus einer Hand",
    ],
    process: [
      "Kostenlose Beratung und Besichtigung",
      "Verbindliches Festpreisangebot",
      "Vorbereitung, Verpackung und Möbelmontage",
      "Sicherer Transport und Aufbau am Zielort",
    ],
    details: [
      {
        title: "Privat- und Firmenumzüge",
        text: "Wir planen Wohnungs-, Haus- und Büroumzüge in {city} passend zu Ihrem Umfang, Ihrem Zeitplan und den örtlichen Gegebenheiten.",
      },
      {
        title: "Verpackung und Schutz",
        text: "Auf Wunsch bringen wir Kartons, Packmaterial und Möbeldecken mit und verpacken empfindliche Gegenstände fachgerecht.",
      },
      {
        title: "Möbelmontage und Einrichtung",
        text: "Wir bauen Möbel ab, sichern sie für den Transport und montieren sie am Zielort wieder, damit Sie schneller ankommen.",
      },
    ],
    tips: [
      "Den gewünschten Umzugstermin möglichst früh mitteilen, besonders zum Monatsende.",
      "Stockwerke, Aufzüge, Parksituation und enge Zugänge vorab nennen.",
      "Wertgegenstände, Dokumente und Medikamente separat und griffbereit halten.",
    ],
    faqs: [
      {
        question: "Was kostet ein Umzug in {city}?",
        answer:
          "Der Preis richtet sich nach Umfang, Entfernung, Stockwerken und gewünschten Zusatzleistungen. Nach der Beratung erhalten Sie ein verbindliches Festpreisangebot.",
      },
      {
        question: "Übernehmen Sie auch das Verpacken?",
        answer:
          "Ja. Wir verpacken Ihren Hausrat auf Wunsch mit professionellem Material und schützen Möbel sowie empfindliche Gegenstände für den Transport.",
      },
      {
        question: "Wie kurzfristig ist ein Termin möglich?",
        answer:
          "Wir versuchen auch bei kurzfristigen Umzügen in {city} eine Lösung zu finden. Je früher Sie anfragen, desto besser können wir Ihren Wunschtermin berücksichtigen.",
      },
    ],
  },
  anstricharbeiten: {
    name: "Anstricharbeiten",
    title: "Anstricharbeiten für die Wohnungsübergabe",
    description:
      "Streichen, Tapezieren und Schönheitsreparaturen – wir bereiten Ihre Wohnung termingerecht für die Übergabe vor.",
    intros: [
      "Eine Wohnungsübergabe in {city} steht bevor? Wir übernehmen die Renovierung sorgfältig und mit einem klaren Plan. Von kleinen Ausbesserungen bis zum kompletten Neuanstrich erhalten Sie alles aus einer Hand.",
      "Frische Wände zur Wohnungsübergabe in {city}: Unsere Handwerker streichen, tapezieren und bessern Gebrauchsspuren fachgerecht aus – termingerecht und zum vereinbarten Festpreis.",
      "Ob einzelnes Zimmer oder komplette Wohnung – wir bringen Ihre Räume in {city} in einen übergabefertigen Zustand. Nach einer kurzen Besichtigung erhalten Sie ein klares Angebot inklusive Material.",
    ],
    features: [
      "Wände streichen",
      "Decken renovieren",
      "Tapezieren",
      "Lackierarbeiten",
      "Schönheitsreparaturen",
      "Spachteln & Schleifen",
    ],
    benefits: [
      "Termingerecht zur Wohnungsübergabe",
      "Hochwertige Materialien inklusive",
      "Saubere und ordentliche Arbeitsweise",
      "Faire Festpreise ohne Überraschungen",
      "Erfahrene Handwerker",
    ],
    process: [
      "Kostenlose Besichtigung vor Ort",
      "Festpreisangebot und Terminabstimmung",
      "Abkleben, Spachteln und fachgerechter Anstrich",
      "Gemeinsame Abnahme zur übergabefertigen Wohnung",
    ],
    details: [
      {
        title: "Wände und Decken",
        text: "Wir streichen Wände und Decken deckend und sauber in der gewünschten Farbe. Für Übergaben sind neutrale Farbtöne besonders sinnvoll.",
      },
      {
        title: "Ausbesserungen vor dem Anstrich",
        text: "Dübellöcher, kleine Risse und Gebrauchsspuren bereiten wir sorgfältig vor, damit ein gleichmäßiges Ergebnis entsteht.",
      },
      {
        title: "Tapeten und Lackierarbeiten",
        text: "Auch Tapeten entfernen, Türen, Leisten oder Heizkörper lackieren wir nach vorheriger Abstimmung in {city}.",
      },
    ],
    tips: [
      "Übergabetermin und gewünschtes Fertigstellungsdatum direkt bei der Anfrage nennen.",
      "Fotos von Räumen, Schäden oder auffälligen Flächen helfen bei der ersten Einschätzung.",
      "Mietvertrag oder Abnahmeprotokoll bereithalten, falls konkrete Renovierungsanforderungen bestehen.",
    ],
    faqs: [
      {
        question: "Wie schnell sind Anstricharbeiten in {city} erledigt?",
        answer:
          "Ein Standardauftrag dauert je nach Wohnungsgröße und Zustand häufig ein bis drei Tage. Bei engen Übergabeterminen stimmen wir den Ablauf frühzeitig mit Ihnen ab.",
      },
      {
        question: "Sind Farben und Material im Angebot enthalten?",
        answer:
          "Das passende Material wird im Festpreisangebot transparent aufgeführt. So wissen Sie vorab, welche Leistungen und Materialien enthalten sind.",
      },
      {
        question: "Können Sie auch Löcher und Risse ausbessern?",
        answer:
          "Ja. Kleine Beschädigungen, Dübellöcher und Risse werden vor dem Anstrich verspachtelt und geschliffen.",
      },
    ],
  },
  "moebel-service": {
    name: "Möbel Ab- & Aufbau",
    title: "Möbel Ab- und Aufbauservice",
    description:
      "Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel schnell, sicher und ohne Kratzer.",
    intros: [
      "Ob einzelnes Möbelstück oder komplette Einrichtung: Unser Montageteam kommt zu Ihnen nach {city} und bringt das passende Werkzeug direkt mit. Fotos helfen uns, den Aufwand bereits vorab realistisch einzuschätzen.",
      "Schrank, Bett oder komplette Küche: Unser Montageteam in {city} baut Ihre Möbel fachgerecht ab und am neuen Ort wieder auf – inklusive Werkzeug und mit Blick fürs Detail.",
      "Möbelmontage kostet Zeit und Nerven. In {city} übernehmen wir Ab- und Aufbau für Sie – schnell, sorgfältig und auf Wunsch direkt in Kombination mit Ihrem Umzug.",
    ],
    features: [
      "IKEA & Möbelhaus-Möbel",
      "Einbauküchen",
      "Schrankwände & Regale",
      "Betten & Matratzen",
      "Büromöbel",
      "Sonstige Möbel",
    ],
    benefits: [
      "Kein Stress beim Umziehen",
      "Erfahrenes Montageteam",
      "Kein Werkzeug nötig – wir bringen alles mit",
      "Schonender Umgang mit Ihren Möbeln",
      "Kombination mit Umzugsservice möglich",
    ],
    process: [
      "Möbel und Zugangswege kurz abstimmen",
      "Verbindliches Angebot zum Festpreis",
      "Sorgfältiger Ab- oder Aufbau mit eigenem Werkzeug",
      "Kontrolle auf Stabilität und Vollständigkeit",
    ],
    details: [
      {
        title: "Schränke, Regale und Betten",
        text: "Von der PAX-Kombination bis zum Bettgestell demontieren und montieren wir gängige Möbel sorgfältig und passend zum neuen Raum.",
      },
      {
        title: "Küchen und komplexe Möbel",
        text: "Einbauküchen, große Schrankwände und besondere Möbel stimmen wir vorab detailliert ab. Fotos oder Anleitungen sind dabei hilfreich.",
      },
      {
        title: "Montage mit eigenem Werkzeug",
        text: "Unser Team kommt in {city} mit professionellem Werkzeug und achtet auf einen schonenden Umgang mit allen Möbelteilen.",
      },
    ],
    tips: [
      "Fotos oder vorhandene Montageanleitungen vorab teilen, besonders bei Küchen und großen Schränken.",
      "Zugangswege, Stockwerke und Parksituation am Einsatzort nennen.",
      "Entscheiden, ob Möbel abgebaut, aufgebaut oder beides erledigt werden soll.",
    ],
    faqs: [
      {
        question: "Welche Möbel montieren Sie in {city}?",
        answer:
          "Wir übernehmen die Montage und Demontage von gängigen Möbeln wie Schränken, Betten, Regalen, Büromöbeln und vielen IKEA-Systemen.",
      },
      {
        question: "Brauche ich die Originalanleitung?",
        answer:
          "Eine Anleitung ist hilfreich, aber nicht immer nötig. Fotos vom aufgebauten Zustand oder Informationen zu Marke und Modell erleichtern die Planung.",
      },
      {
        question: "Lässt sich Möbelmontage mit einem Umzug kombinieren?",
        answer:
          "Ja. Wir können Transport, Abbau und Aufbau in einem abgestimmten Termin bündeln.",
      },
    ],
  },
  "senior-umzug": {
    name: "Seniorenumzug",
    title: "Einfühlsamer Seniorenumzug",
    description:
      "Wir begleiten Senioren und Angehörige mit Geduld und Sorgfalt beim Umzug in eine neue Wohnung, ins betreute Wohnen oder ins Pflegeheim.",
    intros: [
      "Ein Umzug im Alter braucht Zeit, Vertrauen und eine gute Planung. In {city} begleiten wir Sie oder Ihre Angehörigen persönlich – vom ersten Gespräch bis zur Einrichtung des neuen Zuhauses.",
      "Wenn sich das Zuhause im Alter verändert, zählen Ruhe und Verlässlichkeit. Unser Team begleitet Seniorinnen und Senioren in {city} Schritt für Schritt – mit festen Ansprechpartnern und viel Zeit für persönliche Wünsche.",
      "Ob neue Wohnung, betreutes Wohnen oder Pflegeheim: Wir gestalten den Umzug in {city} so behutsam wie möglich und stimmen jeden Schritt eng mit Angehörigen und Einrichtungen ab.",
    ],
    features: [
      "Umzug in Wohnung, betreutes Wohnen oder Pflegeheim",
      "Sorgfältiges Ein- und Auspacken",
      "Möbelabbau und Aufbau im neuen Zuhause",
      "Koordination mit Angehörigen und Einrichtungen",
      "Haushaltsauflösung und Entrümpelung auf Wunsch",
      "Persönliche Begleitung am Umzugstag",
    ],
    benefits: [
      "Einfühlsames Team mit Zeit für Ihre Situation",
      "Ein fester Ansprechpartner für Angehörige",
      "Sorgfältiger Umgang mit Erinnerungsstücken",
      "Planbarer Festpreis ohne Überraschungen",
      "Komplettservice aus einer Hand",
    ],
    process: [
      "Kostenlose Beratung mit Ihnen und Ihren Angehörigen",
      "Ruhige Planung aller Schritte und Termine",
      "Sicheres Verpacken, Transportieren und Aufbauen",
      "Einrichten des neuen Zuhauses nach Ihren Wünschen",
    ],
    details: [
      {
        title: "Umzug mit persönlicher Begleitung",
        text: "Wir nehmen uns Zeit für eine ruhige Planung und richten den Ablauf in {city} nach den Bedürfnissen der umziehenden Person und ihrer Angehörigen aus.",
      },
      {
        title: "Pflegeheim und betreutes Wohnen",
        text: "Beim Umzug in eine Einrichtung stimmen wir uns auf Wunsch mit Angehörigen und Ansprechpartnern vor Ort ab.",
      },
      {
        title: "Haushaltsauflösung als Ergänzung",
        text: "Nicht benötigter Hausrat kann geordnet entrümpelt, verwertet oder fachgerecht entsorgt werden.",
      },
    ],
    tips: [
      "Wichtige Medikamente, Dokumente und persönliche Erinnerungsstücke separat vorbereiten.",
      "Grundriss oder Fotos des neuen Zuhauses helfen bei der Einrichtungsplanung.",
      "Angehörige und Einrichtung frühzeitig in die Terminabstimmung einbeziehen.",
    ],
    faqs: [
      {
        question: "Führen Sie auch Umzüge ins Pflegeheim in {city} durch?",
        answer:
          "Ja. Wir organisieren den Umzug in betreutes Wohnen, Seniorenresidenzen oder Pflegeeinrichtungen und stimmen Details gern mit Angehörigen ab.",
      },
      {
        question: "Helfen Sie beim Ein- und Auspacken?",
        answer:
          "Auf Wunsch übernehmen wir das sorgfältige Verpacken, Auspacken und Einräumen, damit das neue Zuhause schneller vertraut wird.",
      },
      {
        question: "Wie viel Vorlauf ist sinnvoll?",
        answer:
          "Für eine entspannte Planung empfehlen wir mehrere Wochen Vorlauf. Bei dringenden Situationen prüfen wir selbstverständlich kurzfristige Möglichkeiten.",
      },
    ],
  },
  entruempelung: {
    name: "Entrümpelung",
    title: "Entrümpelung und Haushaltsauflösung",
    description:
      "Wohnungen, Häuser, Keller und Gewerberäume räumen wir diskret, fachgerecht und besenrein – inklusive umweltgerechter Entsorgung.",
    intros: [
      "Bei einer Entrümpelung in {city} zählen klare Absprachen und ein respektvoller Umgang mit dem Hausrat. Nach einer kostenlosen Besichtigung erhalten Sie ein transparentes Festpreisangebot inklusive Entsorgung.",
      "Vom vollen Keller bis zur kompletten Haushaltsauflösung: Unser Team räumt Ihre Räume in {city} zuverlässig und diskret – inklusive Wertanrechnung und besenreiner Übergabe.",
      "Sie möchten Räume in {city} schnell und unkompliziert leer bekommen? Nach einer kostenlosen Besichtigung erhalten Sie ein Festpreisangebot – Entsorgung und Verwertung übernehmen wir komplett.",
    ],
    features: [
      "Wohnungs- und Hausentrümpelung",
      "Haushaltsauflösungen mit Diskretion",
      "Keller-, Dachboden- und Garagenräumung",
      "Gewerbe- und Büroentrümpelung",
      "Wertanrechnung für verwertbare Gegenstände",
      "Besenreine Übergabe und fachgerechte Entsorgung",
    ],
    benefits: [
      "Kostenlose Besichtigung und verbindlicher Festpreis",
      "Schnelle Termine, auch bei Zeitdruck",
      "Respektvoller Umgang bei sensiblen Situationen",
      "Wertanrechnung und nachhaltige Verwertung",
      "Besenreine Übergabe auf Wunsch",
    ],
    process: [
      "Kostenlose Besichtigung und Aufwandseinschätzung",
      "Verbindliches Angebot inklusive Entsorgungskosten",
      "Strukturierte Räumung durch unser Team",
      "Verwertung, Entsorgung und besenreine Übergabe",
    ],
    details: [
      {
        title: "Wohnungen, Häuser und Nebenräume",
        text: "Wir räumen einzelne Zimmer, komplette Wohnungen, Häuser, Keller, Dachböden und Garagen in {city} zuverlässig leer.",
      },
      {
        title: "Haushaltsauflösungen mit Respekt",
        text: "Bei Nachlässen und sensiblen Situationen gehen wir diskret vor und besprechen den Umgang mit wichtigen Gegenständen vor Beginn der Arbeiten.",
      },
      {
        title: "Verwertung und Entsorgung",
        text: "Verwertbare Gegenstände berücksichtigen wir bei der Wertanrechnung. Der übrige Hausrat wird sortiert und fachgerecht entsorgt.",
      },
    ],
    tips: [
      "Fotos der Räume oder Gegenstände geben uns vorab einen guten ersten Überblick.",
      "Besondere Gegenstände wie Wertstücke, Elektrogeräte oder Sondermüll direkt ansprechen.",
      "Bei einer Wohnungsübergabe den gewünschten Räumungs- und Abnahmetermin nennen.",
    ],
    faqs: [
      {
        question: "Was kostet eine Entrümpelung in {city}?",
        answer:
          "Kosten und Dauer hängen von Menge, Zugänglichkeit und Art der Gegenstände ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis.",
      },
      {
        question: "Werden verwertbare Gegenstände angerechnet?",
        answer:
          "Gut erhaltene Möbel, Metalle oder andere verwertbare Gegenstände können nach Prüfung den Entrümpelungspreis reduzieren.",
      },
      {
        question: "Ist eine besenreine Übergabe möglich?",
        answer:
          "Ja. Nach der Räumung hinterlassen wir die vereinbarten Räume besenrein und bereit für die weitere Übergabe oder Nutzung.",
      },
    ],
  },
};

type ServiceKey = keyof typeof serviceConfig;

type SeoContent = {
  primaryKeyword: string;
  keywordVariants: readonly string[];
  image: string;
  imageAlt: string;
  overviewHeading: string;
  overviewText: readonly [string, string];
  useCasesHeading: string;
  useCases: readonly { title: string; text: string }[];
  priceHeading: string;
  priceText: string;
  priceFactors: readonly string[];
  additionalFaqs: readonly { question: string; answer: string }[];
};

const seoContent: Record<ServiceKey, SeoContent> = {
  umzugsservice: {
    primaryKeyword: "Umzugsunternehmen",
    keywordVariants: [
      "Umzug",
      "Umzugsfirma",
      "Umzugsservice",
      "Privatumzug",
      "Firmenumzug",
      "Umzugskosten",
    ],
    image: "/images/Umzugsunternhemen_olpe.png",
    imageAlt: "Umzugsunternehmen für einen professionellen Umzug in {city}",
    overviewHeading: "Umzugsunternehmen in {city} für Privat- und Firmenumzüge",
    overviewText: [
      "Sie suchen ein zuverlässiges Umzugsunternehmen in {city}? Wir organisieren private Umzüge, Firmenumzüge und Wohnungswechsel mit einem festen Ansprechpartner. Nach der Besichtigung planen wir Personal, Fahrzeug, Verpackungsmaterial und Montage passend zu Ihrem Umzug.",
      "Unser Umzugsservice in {city} kann einzelne Arbeiten oder den kompletten Ablauf übernehmen: Kartons liefern, Hausrat verpacken, Möbel abbauen, sicher transportieren und am Ziel wieder aufbauen. Dadurch bleiben Termine, Zuständigkeiten und Umzugskosten für Sie nachvollziehbar.",
    ],
    useCasesHeading: "Umzüge in {city} passend zu Ihrer Situation",
    useCases: [
      {
        title: "Privatumzug und Wohnungswechsel",
        text: "Für Wohnungen und Häuser planen wir Tragewege, Etagen, Halteflächen, Möbelvolumen und den gewünschten Umzugstermin im Voraus.",
      },
      {
        title: "Firmen- und Büroumzug",
        text: "Arbeitsplätze, Akten und Büromöbel ziehen strukturiert um, damit Ausfallzeiten und Unterbrechungen möglichst kurz bleiben.",
      },
      {
        title: "Nahumzug und Fernumzug",
        text: "Ob innerhalb von {city} oder überregional: Wir koordinieren Beladung, Transport, Entladung und Zusatzleistungen aus einer Hand.",
      },
    ],
    priceHeading: "Was kostet ein Umzug in {city}?",
    priceText:
      "Seriöse Umzugskosten richten sich nach dem tatsächlichen Aufwand. Deshalb klären wir die wichtigsten Eckdaten vorab und erstellen ein nachvollziehbares Festpreisangebot statt einer unklaren Pauschalschätzung.",
    priceFactors: [
      "Wohnungsgröße und Menge des Umzugsguts",
      "Entfernung, Etagen, Aufzug und Tragewege",
      "Möbelabbau, Möbelaufbau und Verpackungsservice",
      "Halteverbotszone, Sondertransporte und Wunschtermin",
    ],
    additionalFaqs: [
      {
        question: "Bieten Sie auch komplette Umzüge in {city} an?",
        answer:
          "Ja. Sie können Transport, Verpackung, Möbelmontage und weitere abgestimmte Leistungen als Komplettumzug beauftragen oder nur einzelne Arbeiten auswählen.",
      },
      {
        question: "Wie erhalte ich ein Festpreisangebot für meinen Umzug?",
        answer:
          "Senden Sie uns die wichtigsten Angaben zu Adressen, Wohnungsgröße, Etagen, Termin und gewünschten Zusatzleistungen. Bei Bedarf vereinbaren wir eine kostenlose Besichtigung in {city}.",
      },
    ],
  },
  anstricharbeiten: {
    primaryKeyword: "Anstricharbeiten",
    keywordVariants: [
      "Anstricharbeiten",
      "Wohnung streichen",
      "Renovierung",
      "Tapezierarbeiten",
      "Schönheitsreparaturen",
      "Wohnungsübergabe",
    ],
    image: "/images/anstricharbeiten.webp",
    imageAlt: "Professionelle Anstricharbeiten in {city}",
    overviewHeading: "Anstricharbeiten in {city}",
    overviewText: [
      "Für Anstricharbeiten in {city} übernehmen wir die Vorbereitung und Ausführung von Wänden und Decken. Dazu gehören je nach Zustand Abkleben, Spachteln, Schleifen, Grundieren und ein gleichmäßiger Anstrich mit abgestimmten Materialien.",
      "Besonders bei Auszug, Einzug oder Wohnungsübergabe ist ein verlässlicher Fertigstellungstermin wichtig. Wir stimmen die Anstricharbeiten in {city} mit Ihrem Zeitplan ab und führen Material sowie vereinbarte Nebenarbeiten transparent im Angebot auf.",
    ],
    useCasesHeading: "Renovierung in {city} für Wohnung, Haus und Gewerbe",
    useCases: [
      {
        title: "Wohnung streichen bei Auszug",
        text: "Wir beseitigen übliche Gebrauchsspuren und bereiten Wände und Decken für eine ordentliche Wohnungsübergabe vor.",
      },
      {
        title: "Renovierung vor dem Einzug",
        text: "Leere Räume lassen sich effizient streichen, tapezieren und in der gewünschten Farbgestaltung fertigstellen.",
      },
      {
        title: "Büro- und Gewerberäume",
        text: "Anstriche für kleinere Gewerbeflächen planen wir so, dass Termine und betriebliche Abläufe berücksichtigt werden.",
      },
    ],
    priceHeading: "Kosten für Anstricharbeiten in {city}",
    priceText:
      "Die Kosten für Anstricharbeiten hängen nicht nur von der Quadratmeterzahl ab. Untergrund, gewünschte Farbe, Abdeckaufwand und notwendige Vorarbeiten entscheiden darüber, wie viel Material und Arbeitszeit benötigt werden.",
    priceFactors: [
      "Größe und Anzahl der zu streichenden Flächen",
      "Zustand von Wänden, Decken und Untergrund",
      "Spachtel-, Schleif-, Grundier- und Tapezierarbeiten",
      "Materialqualität, Farbauswahl und Fertigstellungstermin",
    ],
    additionalFaqs: [
      {
        question: "Streichen Sie komplette Wohnungen in {city}?",
        answer:
          "Ja. Wir übernehmen einzelne Räume ebenso wie komplette Wohnungen oder Häuser und stimmen den Leistungsumfang vor Beginn eindeutig mit Ihnen ab.",
      },
      {
        question: "Sind Anstricharbeiten vor einer Wohnungsübergabe möglich?",
        answer:
          "Ja. Teilen Sie uns den Übergabetermin möglichst früh mit. Wir prüfen den Zustand, planen notwendige Vorarbeiten und richten die Fertigstellung danach aus.",
      },
    ],
  },
  "moebel-service": {
    primaryKeyword: "Möbelmontage",
    keywordVariants: [
      "Möbelaufbau",
      "Möbelabbau",
      "Montageservice",
      "IKEA Montageservice",
      "Schrank aufbauen",
      "Küchenmontage",
    ],
    image: "/images/möbel aufbau service.webp",
    imageAlt: "Möbelmontage und Möbelaufbau in {city}",
    overviewHeading: "Möbelmontage und Möbelaufbau in {city}",
    overviewText: [
      "Unser Montageservice in {city} unterstützt Sie beim fachgerechten Aufbau und Abbau von Schränken, Betten, Regalen, Büromöbeln und vielen gängigen Möbelsystemen. Werkzeug und benötigtes Montagematerial stimmen wir vor dem Termin mit Ihnen ab.",
      "Wenn die Möbelmontage Teil eines Umzugs ist, koordinieren wir Demontage, sicheren Transport und Wiederaufbau in einem Ablauf. Auch einzelne Montageaufträge in {city} sind möglich, etwa nach einer Möbellieferung oder bei einer neuen Raumaufteilung.",
    ],
    useCasesHeading: "Montageservice in {city} für unterschiedliche Möbel",
    useCases: [
      {
        title: "Schränke, Betten und Regale",
        text: "Wir montieren gängige Möbel sorgfältig, richten Bauteile aus und kontrollieren Stabilität und Funktion.",
      },
      {
        title: "IKEA- und Systemmöbel",
        text: "Modulare Möbel und größere Kombinationen werden nach Anleitung oder anhand der vorhandenen Bauteile aufgebaut.",
      },
      {
        title: "Büromöbel und Umzugsmontage",
        text: "Schreibtische, Regale und Schränke demontieren wir für den Transport und bauen sie am neuen Standort wieder auf.",
      },
    ],
    priceHeading: "Kosten für Möbelmontage in {city}",
    priceText:
      "Für ein passendes Angebot benötigen wir Informationen zu Art, Anzahl und Zustand der Möbel. Fotos, Produktlinks oder Montageanleitungen helfen dabei, Arbeitszeit und benötigte Werkzeuge realistisch zu kalkulieren.",
    priceFactors: [
      "Anzahl, Größe und Bauart der Möbel",
      "Vorhandene Anleitung und Vollständigkeit der Beschläge",
      "Abbau, Transport und Wiederaufbau",
      "Wandbefestigung, Anpassungen und Zugänglichkeit",
    ],
    additionalFaqs: [
      {
        question: "Bieten Sie Möbelaufbau als einzelnen Auftrag in {city} an?",
        answer:
          "Ja. Unser Montageservice kann unabhängig von einem Umzug gebucht werden. Senden Sie uns dafür am besten Fotos oder Produktinformationen der Möbel.",
      },
      {
        question: "Können große Schränke für einen Umzug abgebaut werden?",
        answer:
          "Ja. Wir demontieren geeignete Schränke transportsicher und bauen sie am Zielort nach Absprache wieder auf.",
      },
    ],
  },
  "senior-umzug": {
    primaryKeyword: "Seniorenumzug",
    keywordVariants: [
      "Umzug im Alter",
      "Seniorenumzugsservice",
      "Umzug ins Pflegeheim",
      "Umzug ins betreute Wohnen",
      "Umzugshilfe für Senioren",
      "Haushaltsverkleinerung",
    ],
    image: "/images/senioren_umzüge.webp",
    imageAlt: "Persönlich begleiteter Seniorenumzug in {city}",
    overviewHeading: "Seniorenumzug in {city} mit persönlicher Begleitung",
    overviewText: [
      "Ein Seniorenumzug in {city} erfordert neben guter Logistik vor allem Ruhe, klare Absprachen und Rücksicht auf persönliche Bedürfnisse. Wir planen den Wohnungswechsel gemeinsam mit der umziehenden Person, Angehörigen oder einer betreuenden Einrichtung.",
      "Unser Seniorenumzugsservice kann Verpackung, Möbelabbau, Transport, Aufbau und das Einräumen im neuen Zuhause verbinden. Bei einem Umzug ins Pflegeheim oder betreute Wohnen in {city} berücksichtigen wir Zeitfenster, Raumplanung und wichtige Erinnerungsstücke besonders sorgfältig.",
    ],
    useCasesHeading: "Umzugshilfe für Senioren in {city}",
    useCases: [
      {
        title: "Umzug ins betreute Wohnen",
        text: "Wir stimmen Möbel, Platzbedarf und Termin mit Bewohnern, Angehörigen und der neuen Einrichtung ab.",
      },
      {
        title: "Umzug ins Pflegeheim",
        text: "Persönliche Gegenstände werden sorgfältig ausgewählt, verpackt und im neuen Zimmer nach Wunsch eingerichtet.",
      },
      {
        title: "Wohnung verkleinern",
        text: "Beim Wechsel in ein kleineres Zuhause verbinden wir Umzug, Möbelmontage und auf Wunsch die geordnete Haushaltsauflösung.",
      },
    ],
    priceHeading: "Kosten für einen Seniorenumzug in {city}",
    priceText:
      "Der Preis richtet sich nach Haushaltsumfang und gewünschter Unterstützung. Ein persönliches Gespräch oder eine Besichtigung schafft Klarheit darüber, welche Möbel mitziehen und welche zusätzlichen Arbeiten sinnvoll sind.",
    priceFactors: [
      "Umfang des Hausrats und Größe des neuen Zuhauses",
      "Einpacken, Auspacken und Einräumen",
      "Möbelmontage und Koordination mit der Einrichtung",
      "Entrümpelung oder Haushaltsauflösung als Ergänzung",
    ],
    additionalFaqs: [
      {
        question: "Können Angehörige den Seniorenumzug aus der Ferne organisieren?",
        answer:
          "Ja. Wir vereinbaren einen festen Ansprechpartner und stimmen Besichtigung, Leistungsumfang und Termine telefonisch oder digital mit den Angehörigen ab.",
      },
      {
        question: "Richten Sie das neue Zuhause in {city} auch ein?",
        answer:
          "Nach Absprache bauen wir Möbel auf, stellen sie nach Plan und helfen beim Auspacken, damit wichtige Dinge direkt erreichbar sind.",
      },
    ],
  },
  entruempelung: {
    primaryKeyword: "Entrümpelung",
    keywordVariants: [
      "Entrümpelungsfirma",
      "Haushaltsauflösung",
      "Wohnungsauflösung",
      "Kellerentrümpelung",
      "Hausentrümpelung",
      "besenreine Räumung",
    ],
    image: "/images/entrümpelung.webp",
    imageAlt: "Entrümpelung und Haushaltsauflösung in {city}",
    overviewHeading: "Entrümpelung und Haushaltsauflösung in {city}",
    overviewText: [
      "Als Entrümpelungsfirma für {city} räumen wir Wohnungen, Häuser, Keller, Dachböden, Garagen und kleinere Gewerbeflächen. Vor Beginn klären wir, was erhalten, verwertet, gespendet oder fachgerecht entsorgt werden soll.",
      "Bei einer Haushaltsauflösung in {city} erhalten Sie nach der Besichtigung ein transparentes Angebot inklusive der vereinbarten Räumungs- und Entsorgungsleistungen. Verwertbare Gegenstände können nach Prüfung angerechnet werden; auf Wunsch übergeben wir die Räume besenrein.",
    ],
    useCasesHeading: "Räumungen in {city} für jeden Umfang",
    useCases: [
      {
        title: "Wohnungs- und Hausentrümpelung",
        text: "Von einzelnen Räumen bis zum vollständigen Objekt planen wir Personal, Fahrzeuge und Entsorgungswege passend zum Umfang.",
      },
      {
        title: "Haushalts- und Nachlassauflösung",
        text: "In sensiblen Situationen arbeiten wir diskret und halten wichtige Dokumente oder Erinnerungsstücke gesondert zurück.",
      },
      {
        title: "Keller, Garage und Gewerbe",
        text: "Auch Nebenräume, Lager und kleinere Gewerbeflächen werden strukturiert geräumt und vereinbarungsgemäß übergeben.",
      },
    ],
    priceHeading: "Was kostet eine Entrümpelung in {city}?",
    priceText:
      "Eine belastbare Kalkulation berücksichtigt Menge, Materialarten, Zugänglichkeit und Entsorgungskosten. Nach einer Besichtigung können wir den Aufwand einschätzen und ein verbindliches Angebot für die Räumung erstellen.",
    priceFactors: [
      "Menge und Art des zu räumenden Hausrats",
      "Etagen, Laufwege, Aufzug und Parksituation",
      "Entsorgungsgebühren und besondere Materialien",
      "Wertanrechnung und gewünschter Übergabezustand",
    ],
    additionalFaqs: [
      {
        question: "Übernehmen Sie komplette Haushaltsauflösungen in {city}?",
        answer:
          "Ja. Wir räumen den vereinbarten Hausrat, berücksichtigen verwertbare Gegenstände und übergeben Wohnung oder Haus auf Wunsch besenrein.",
      },
      {
        question: "Kann eine Entrümpelung kurzfristig durchgeführt werden?",
        answer:
          "Bei dringenden Übergabe- oder Verkaufsterminen prüfen wir kurzfristige Kapazitäten. Fotos und vollständige Angaben helfen uns bei einer schnellen Einschätzung.",
      },
    ],
  },
};

function withCity(text: string, cityName: string) {
  return text.replaceAll("{city}", cityName);
}

// Deterministic per city+service, so each page gets a stable but unique variant mix.
function hashSeed(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length];
}

function rotateArr<T>(arr: readonly T[], seed: number, salt: number): T[] {
  const offset = (seed + salt) % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

function fillTemplate(text: string, serviceName: string, cityName: string) {
  return text
    .replaceAll("{service}", serviceName)
    .replaceAll("{city}", cityName);
}

const headingVariants = {
  intro: [
    "{service} in {city}: persönlich geplant, professionell umgesetzt",
    "{service} in {city} – zuverlässig von der Planung bis zur Umsetzung",
    "Ihr erfahrenes Team für {service} in {city}",
  ],
  details: [
    "Passende Leistungen für {service} in {city}",
    "{service} in {city}: Diese Leistungen erwarten Sie",
    "Was wir in {city} für Sie übernehmen",
  ],
  features: [
    "Unsere Leistungen: {service} in {city}",
    "{service} in {city} – unser Leistungsumfang",
    "Alle Leistungen rund um {service} in {city}",
  ],
  tips: [
    "Gut vorbereitet für Ihren Termin in {city}",
    "So bereiten Sie Ihren Auftrag in {city} optimal vor",
    "Tipps für eine reibungslose Planung in {city}",
  ],
  process: [
    "So läuft {service} in {city} ab",
    "Unser Ablauf: {service} in {city}",
    "Schritt für Schritt: {service} in {city}",
  ],
  benefits: [
    "Warum Umzugshelden für {service} in {city}?",
    "Ihre Vorteile mit Umzugshelden in {city}",
    "Darum entscheiden sich Kunden in {city} für uns",
  ],
  contact: [
    "Kostenloses Angebot für {service} in {city}",
    "Jetzt unverbindliches Angebot in {city} anfordern",
    "{service} in {city} anfragen – kostenlos & unverbindlich",
  ],
  faq: [
    "Häufige Fragen zu {service} in {city}",
    "{service} in {city}: Antworten auf häufige Fragen",
    "FAQ: {service} in {city}",
  ],
  nearby: [
    "{service} auch im Umkreis von {city}",
    "Städte in der Nähe von {city}",
    "{service} in weiteren Städten rund um {city}",
  ],
  otherServices: [
    "Weitere Leistungen in {city}",
    "Unsere anderen Services in {city}",
    "Mehr Leistungen der Umzugshelden in {city}",
  ],
} as const;

const formLeadVariants = [
  "In wenigen Schritten zu Ihrem unverbindlichen Angebot für {city}.",
  "Kurz anfragen – wir melden uns mit Ihrem Angebot für {city}.",
  "Schnell ausgefüllt: Ihr kostenloses Angebot für {city}.",
] as const;

// Alle Stadt/Service-Kombinationen statisch vorrendern (SSG)
export function generateStaticParams() {
  return cities.flatMap((c) =>
    getServices().map((service) => ({
      city: slugify(c),
      service,
    })),
  );
}

export const dynamicParams = true;

export default async function ServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;

  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = getCanonicalCityName(deslugify(decoded));

  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);
  if (!(serviceKey in serviceConfig))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);

  const config = serviceConfig[serviceKey];
  const seo = seoContent[serviceKey];
  const path = `/stadt/${encodeURIComponent(slugify(cityName))}/${serviceKey}`;

  const seed = hashSeed(`${slugify(cityName).toLowerCase()}-${serviceKey}`);
  const heading = (key: keyof typeof headingVariants, salt: number) =>
    fillTemplate(pick(headingVariants[key], seed, salt), config.name, cityName);
  const intro = withCity(pick(config.intros, seed, 0), cityName);
  const details = rotateArr(config.details, seed, 2);
  const features = rotateArr(config.features, seed, 3);
  const tips = rotateArr(config.tips, seed, 4);
  const benefits = rotateArr(config.benefits, seed, 5);
  const faqs = rotateArr(
    [...config.faqs, ...seo.additionalFaqs],
    seed,
    6,
  );

  const citySlug = slugify(cityName);
  const nearbyCities = getNearbyCities(cityName);
  const otherServices = (Object.keys(serviceConfig) as ServiceKey[]).filter(
    (key) => key !== serviceKey,
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: "https://umzugshelden.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cityName,
        item: `https://umzugshelden.io/stadt/${encodeURIComponent(citySlug)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${config.name} in ${cityName}`,
        item: `https://umzugshelden.io${path}`,
      },
    ],
  };

  return (
    <>
      <ServiceSchema
        name={`${config.name} in ${cityName}`}
        serviceType={config.name}
        description={withCity(config.description, cityName)}
        path={path}
        city={cityName}
        image={seo.image}
        alternateNames={seo.keywordVariants.map(
          (keyword) => `${keyword} ${cityName}`,
        )}
        offers={config.features}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className='flex flex-col'>
        {/* Hero */}
        <section
          className='relative min-h-[600px] flex items-center overflow-hidden'>
          <Image
            src={seo.image}
            alt={withCity(seo.imageAlt, cityName)}
            fill
            priority
            sizes='100vw'
            className='object-cover'
          />
          <div className='absolute inset-0 bg-navy/85' />
          <div className='relative z-10 container mx-auto px-4 py-16'>
            <nav
              aria-label='Breadcrumb'
              className='mb-8 font-body text-sm text-gray-300'>
              <ol className='flex flex-wrap items-center gap-2'>
                <li>
                  <Link href='/' className='hover:text-white'>
                    Startseite
                  </Link>
                </li>
                <li aria-hidden='true'>/</li>
                <li>
                  <Link
                    href={`/stadt/${encodeURIComponent(citySlug)}`}
                    className='hover:text-white'>
                    {cityName}
                  </Link>
                </li>
                <li aria-hidden='true'>/</li>
                <li aria-current='page' className='text-white'>
                  {config.name}
                </li>
              </ol>
            </nav>
            <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2'>
              <div className='order-2 rounded border border-white/10 bg-[#0b1f3a] p-6 shadow-2xl lg:order-1 lg:p-8'>
                <h2 className='mb-3 font-sans text-xl font-semibold text-white'>
                  Angebot für {config.name} anfordern
                </h2>
                <p className='mb-5 font-body text-sm text-gray-300'>
                  {withCity(pick(formLeadVariants, seed, 7), cityName)}
                </p>
                <ContactForm dark />
              </div>
              <div className='order-1 flex flex-col gap-6 text-center lg:order-2 lg:text-left'>
                <h1 className='break-words font-sans text-4xl font-bold leading-tight text-white md:text-5xl'>
                  <span className='text-primary'>{seo.primaryKeyword}</span> in{" "}
                  {cityName}
                </h1>
                <p className='font-body text-gray-300 text-lg'>
                  {config.title}: {config.description}
                </p>
                <div>
                  <Link
                    href={`/stadt/${encodeURIComponent(slugify(cityName))}`}>
                    <Button
                      variant='outline'
                      className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold'>
                      Zurück zur Übersicht
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='bg-white py-16'>
          <div className='container mx-auto max-w-3xl px-4 text-center'>
            <h2 className='font-sans text-3xl font-bold text-navy'>
              {heading("intro", 1)}
            </h2>
            <p className='mt-5 font-body text-lg leading-relaxed text-gray-600'>
              {intro}
            </p>
          </div>
        </section>

        <section className='bg-gray-50 py-20'>
          <div className='container mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16'>
            <div className='relative aspect-[4/3] overflow-hidden rounded-md shadow-lg'>
              <Image
                src='/images/Umzugsunternehmen_Olpe.png'
                alt={`${seo.primaryKeyword} in ${cityName} mit den Umzugshelden`}
                fill
                sizes='(max-width: 1024px) 100vw, 45vw'
                className='object-cover'
              />
            </div>
            <div>
              <p className='font-sans text-sm font-semibold uppercase text-primary'>
                Persönlich vor Ort in {cityName}
              </p>
              <h2 className='mt-3 font-sans text-3xl font-bold leading-tight text-navy md:text-4xl'>
                {withCity(seo.overviewHeading, cityName)}
              </h2>
              <div className='mt-6 space-y-4 font-body leading-relaxed text-gray-600'>
                {seo.overviewText.map((paragraph) => (
                  <p key={paragraph}>{withCity(paragraph, cityName)}</p>
                ))}
              </div>
              <Link
                href='#kontakt'
                className='mt-7 inline-flex font-sans font-semibold text-primary hover:underline'>
                Leistung kostenlos anfragen
              </Link>
            </div>
          </div>
        </section>

        <section className='bg-white py-20'>
          <div className='container mx-auto px-4'>
            <div className='mx-auto max-w-3xl text-center'>
              <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
                {heading("details", 2)}
              </h2>
              <p className='mt-3 font-body text-gray-600'>
                Wir stimmen den Umfang mit Ihnen ab und erstellen daraus ein
                klares Angebot.
              </p>
            </div>
            <div className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3'>
              {details.map((detail) => (
                <article
                  key={detail.title}
                  className='border border-gray-100 bg-gray-50 p-6 shadow-sm rounded'>
                  <h3 className='font-sans text-xl font-semibold text-navy'>
                    {detail.title}
                  </h3>
                  <p className='mt-3 font-body text-sm leading-relaxed text-gray-600'>
                    {withCity(detail.text, cityName)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className='py-20 bg-gray-50'>
          <div className='container mx-auto px-4'>
            <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy mb-12'>
              {heading("features", 3)}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {features.map((feature) => (
                <div
                  key={feature}
                  className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4 items-start'>
                  <CheckIcon
                    className='text-primary flex-shrink-0 mt-1'
                    size={20}
                  />
                  <p className='font-sans font-semibold text-navy'>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-white py-20'>
          <div className='container mx-auto max-w-6xl px-4'>
            <div className='max-w-3xl'>
              <p className='font-sans text-sm font-semibold uppercase text-primary'>
                Für private und gewerbliche Aufträge
              </p>
              <h2 className='mt-3 font-sans text-3xl font-bold text-navy md:text-4xl'>
                {withCity(seo.useCasesHeading, cityName)}
              </h2>
            </div>
            <div className='mt-10 grid grid-cols-1 gap-8 md:grid-cols-3'>
              {seo.useCases.map((useCase, index) => (
                <article
                  key={useCase.title}
                  className='border-t-4 border-primary bg-gray-50 p-6'>
                  <span className='font-sans text-sm font-bold text-primary'>
                    0{index + 1}
                  </span>
                  <h3 className='mt-3 font-sans text-xl font-semibold text-navy'>
                    {useCase.title}
                  </h3>
                  <p className='mt-3 font-body text-sm leading-relaxed text-gray-600'>
                    {withCity(useCase.text, cityName)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-gray-50 py-16'>
          <div className='container mx-auto max-w-4xl px-4'>
            <h2 className='font-sans text-3xl font-bold text-navy'>
              {heading("tips", 4)}
            </h2>
            <p className='mt-3 font-body text-gray-600'>
              Diese Informationen helfen uns, Ihren Auftrag präzise zu planen.
            </p>
            <ul className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
              {tips.map((tip) => (
                <li
                  key={tip}
                  className='flex gap-3 bg-white p-5 shadow-sm rounded'>
                  <CheckIcon
                    className='mt-0.5 shrink-0 text-primary'
                    size={20}
                  />
                  <span className='font-body text-sm leading-relaxed text-gray-700'>
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className='bg-white py-20'>
          <div className='container mx-auto px-4'>
            <div className='mx-auto max-w-3xl text-center'>
              <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
                {heading("process", 5)}
              </h2>
              <p className='mt-3 font-body text-gray-600'>
                Transparent geplant und auf Ihren Termin abgestimmt.
              </p>
            </div>
            <ol className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
              {config.process.map((processStep, index) => (
                <li
                  key={processStep}
                  className='border border-gray-100 bg-gray-50 p-6 shadow-sm rounded'>
                  <span className='font-sans text-3xl font-bold text-primary'>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className='mt-3 font-sans font-semibold text-navy'>
                    {processStep}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className='bg-[#eef3f7] py-20'>
          <div className='container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-2 lg:items-center'>
            <div>
              <p className='font-sans text-sm font-semibold uppercase text-primary'>
                Transparent kalkuliert
              </p>
              <h2 className='mt-3 font-sans text-3xl font-bold text-navy md:text-4xl'>
                {withCity(seo.priceHeading, cityName)}
              </h2>
              <p className='mt-5 font-body leading-relaxed text-gray-600'>
                {withCity(seo.priceText, cityName)}
              </p>
              <ul className='mt-7 space-y-4'>
                {seo.priceFactors.map((factor) => (
                  <li key={factor} className='flex items-start gap-3'>
                    <CheckIcon
                      className='mt-0.5 shrink-0 text-primary'
                      size={20}
                    />
                    <span className='font-body text-gray-700'>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='bg-white p-7 shadow-sm'>
              <h3 className='font-sans text-2xl font-semibold text-navy'>
                Kostenlos und unverbindlich kalkulieren lassen
              </h3>
              <p className='mt-3 font-body leading-relaxed text-gray-600'>
                Beschreiben Sie Ihren Auftrag in {cityName}. Wir prüfen die
                Angaben und melden uns mit den nächsten Schritten für ein
                passendes Angebot.
              </p>
              <Link href='#kontakt'>
                <Button className='mt-6 rounded bg-primary px-6 py-3 font-sans font-semibold text-white hover:bg-primary/90'>
                  Angebot anfordern
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className='py-20 bg-navy'>
          <div className='container mx-auto px-4'>
            <h2 className='font-sans font-bold text-3xl text-white mb-8'>
              {heading("benefits", 6)}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {benefits.map((benefit) => (
                <div key={benefit} className='flex gap-3 items-start'>
                  <CheckIcon
                    className='text-primary flex-shrink-0 mt-1'
                    size={20}
                  />
                  <p className='font-body text-gray-300'>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQBlock
          faqs={
            faqs.map((faq) => ({
              question: withCity(faq.question, cityName),
              answer: withCity(faq.answer, cityName),
            })) as FAQType[]
          }
          title={heading("faq", 8)}
        />

        {/* Contact */}
        <section className='py-16 bg-white' id='kontakt'>
          <div className='container mx-auto px-4 max-w-5xl'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
              <div className='flex flex-col gap-6'>
                <h2 className='font-sans font-bold text-3xl text-navy'>
                  {heading("contact", 7)}
                </h2>
                <p className='font-body text-gray-600'>
                  Wir melden uns innerhalb von 24 Stunden mit einem
                  unverbindlichen Angebot bei Ihnen.
                </p>
                <div className='flex flex-col gap-4'>
                  <div className='flex gap-3 items-center'>
                    <PhoneIcon
                      className='text-primary flex-shrink-0'
                      size={20}
                    />
                    <Link
                      href='tel:+4915168567708'
                      className='font-body text-gray-600 hover:text-primary'>
                      +49 151 68567708
                    </Link>
                  </div>
                  <div className='flex gap-3 items-center'>
                    <MailIcon
                      className='text-primary flex-shrink-0'
                      size={20}
                    />
                    <Link
                      href='mailto:info@umzugshelden.io'
                      className='font-body text-gray-600 hover:text-primary'>
                      info@umzugshelden.io
                    </Link>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-100'>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Nearby cities & internal links */}
        <section className='bg-gray-50 py-16'>
          <div className='container mx-auto px-4'>
            <h2 className='font-sans text-3xl font-bold text-navy'>
              {heading("nearby", 9)}
            </h2>
            <p className='mt-3 font-body text-gray-600'>
              Wir sind auch in diesen Städten rund um {cityName} für Sie im
              Einsatz – sortiert nach Entfernung.
            </p>
            <ul className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {nearbyCities.map((nearby) => (
                <li key={nearby.name}>
                  <Link
                    href={`/stadt/${encodeURIComponent(slugify(nearby.name))}/${serviceKey}`}
                    className='flex items-center justify-between gap-3 bg-white p-4 shadow-sm rounded border border-gray-100 hover:shadow-md hover:border-primary/40 transition-all'>
                    <span className='flex items-center gap-2'>
                      <MapPinIcon className='shrink-0 text-primary' size={18} />
                      <span className='font-sans font-semibold text-navy'>
                        {config.name} {nearby.name}
                      </span>
                    </span>
                    {nearby.distanceKm > 0 && (
                      <span className='font-body text-sm text-gray-500'>
                        ca. {nearby.distanceKm} km
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className='mt-14 font-sans text-2xl font-bold text-navy'>
              {heading("otherServices", 10)}
            </h2>
            <ul className='mt-6 flex flex-wrap gap-3'>
              {otherServices.map((key) => (
                <li key={key}>
                  <Link
                    href={`/stadt/${encodeURIComponent(citySlug)}/${key}`}
                    className='inline-flex items-center gap-2 bg-white px-4 py-2 shadow-sm rounded border border-gray-100 font-sans text-sm font-semibold text-navy hover:border-primary/40 hover:shadow-md transition-all'>
                    <CheckIcon className='text-primary' size={16} />
                    {serviceConfig[key].name} in {cityName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = getCanonicalCityName(deslugify(decoded));
  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName) || !(serviceKey in serviceConfig)) {
    return { title: "Umzugshelden" };
  }

  const config = serviceConfig[serviceKey];
  const seo = seoContent[serviceKey];
  const seed = hashSeed(`${slugify(cityName).toLowerCase()}-${serviceKey}`);
  const titleVariants = [
    `${seo.primaryKeyword} ${cityName} | Professionell zum Festpreis`,
    `${seo.primaryKeyword} in ${cityName} | Umzugshelden`,
    `${config.name} ${cityName} | Kostenloses Angebot anfordern`,
  ];
  const descriptionVariants = [
    `${seo.primaryKeyword} in ${cityName}: ${config.description} Persönlich beraten lassen und kostenloses Festpreisangebot anfordern.`,
    `${seo.primaryKeyword} ${cityName} gesucht? ${config.description} Jetzt unverbindlich bei den Umzugshelden anfragen.`,
    `Ihr regionaler Partner für ${seo.primaryKeyword} in ${cityName}. Klare Planung, feste Ansprechpartner und transparentes Angebot.`,
  ];
  const socialImage = new URL(
    seo.image,
    "https://umzugshelden.io",
  ).toString();
  return {
    title: pick(titleVariants, seed, 9),
    description: pick(descriptionVariants, seed, 10),
    keywords: [
      `${seo.primaryKeyword} ${cityName}`,
      ...seo.keywordVariants.flatMap((keyword) => [
        `${keyword} ${cityName}`,
        `${keyword} in ${cityName}`,
      ]),
      `Umzugshelden ${cityName}`,
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large" as const,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: `${seo.primaryKeyword} ${cityName} | Umzugshelden`,
      description: pick(descriptionVariants, seed, 10),
      type: "website",
      locale: "de_DE",
      siteName: "Umzugshelden",
      url: `https://umzugshelden.io/stadt/${encodeURIComponent(slugify(cityName))}/${serviceKey}`,
      images: [
        {
          url: socialImage,
          alt: withCity(seo.imageAlt, cityName),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.primaryKeyword} ${cityName} | Umzugshelden`,
      description: pick(descriptionVariants, seed, 10),
      images: [socialImage],
    },
    alternates: {
      canonical: `https://umzugshelden.io/stadt/${encodeURIComponent(slugify(cityName))}/${serviceKey}`,
    },
  };
}
