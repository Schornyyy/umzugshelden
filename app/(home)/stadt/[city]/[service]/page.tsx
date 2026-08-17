import { redirect } from "next/navigation";
import { rawCities } from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import { CheckIcon, MailIcon, PhoneIcon } from "lucide-react";

function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase(),
  );
}

const serviceConfig = {
  umzugsservice: {
    name: "Umzugsservice",
    title: "Professioneller Umzugsservice",
    description:
      "Wohnungs-, Firmen- und Regionalumzug – zuverlässig, termingerecht und zu fairen Festpreisen.",
    intro:
      "Ein Umzug soll ein guter Start sein, nicht eine zusätzliche Belastung. Wir planen Ihren Umzug in {city} gemeinsam mit Ihnen und übernehmen auf Wunsch Verpackung, Transport, Möbelmontage und die Koordination am Umzugstag.",
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
        answer: "Der Preis richtet sich nach Umfang, Entfernung, Stockwerken und gewünschten Zusatzleistungen. Nach der Beratung erhalten Sie ein verbindliches Festpreisangebot.",
      },
      {
        question: "Übernehmen Sie auch das Verpacken?",
        answer: "Ja. Wir verpacken Ihren Hausrat auf Wunsch mit professionellem Material und schützen Möbel sowie empfindliche Gegenstände für den Transport.",
      },
      {
        question: "Wie kurzfristig ist ein Termin möglich?",
        answer: "Wir versuchen auch bei kurzfristigen Umzügen in {city} eine Lösung zu finden. Je früher Sie anfragen, desto besser können wir Ihren Wunschtermin berücksichtigen.",
      },
    ],
  },
  anstricharbeiten: {
    name: "Anstricharbeiten",
    title: "Anstricharbeiten für die Wohnungsübergabe",
    description:
      "Streichen, Tapezieren und Schönheitsreparaturen – wir bereiten Ihre Wohnung termingerecht für die Übergabe vor.",
    intro:
      "Eine Wohnungsübergabe in {city} steht bevor? Wir übernehmen die Renovierung sorgfältig und mit einem klaren Plan. Von kleinen Ausbesserungen bis zum kompletten Neuanstrich erhalten Sie alles aus einer Hand.",
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
        answer: "Ein Standardauftrag dauert je nach Wohnungsgröße und Zustand häufig ein bis drei Tage. Bei engen Übergabeterminen stimmen wir den Ablauf frühzeitig mit Ihnen ab.",
      },
      {
        question: "Sind Farben und Material im Angebot enthalten?",
        answer: "Das passende Material wird im Festpreisangebot transparent aufgeführt. So wissen Sie vorab, welche Leistungen und Materialien enthalten sind.",
      },
      {
        question: "Können Sie auch Löcher und Risse ausbessern?",
        answer: "Ja. Kleine Beschädigungen, Dübellöcher und Risse werden vor dem Anstrich verspachtelt und geschliffen.",
      },
    ],
  },
  "moebel-service": {
    name: "Möbel Ab- & Aufbau",
    title: "Möbel Ab- und Aufbauservice",
    description:
      "Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel schnell, sicher und ohne Kratzer.",
    intro:
      "Ob einzelnes Möbelstück oder komplette Einrichtung: Unser Montageteam kommt zu Ihnen nach {city} und bringt das passende Werkzeug direkt mit. Fotos helfen uns, den Aufwand bereits vorab realistisch einzuschätzen.",
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
        answer: "Wir übernehmen die Montage und Demontage von gängigen Möbeln wie Schränken, Betten, Regalen, Büromöbeln und vielen IKEA-Systemen.",
      },
      {
        question: "Brauche ich die Originalanleitung?",
        answer: "Eine Anleitung ist hilfreich, aber nicht immer nötig. Fotos vom aufgebauten Zustand oder Informationen zu Marke und Modell erleichtern die Planung.",
      },
      {
        question: "Lässt sich Möbelmontage mit einem Umzug kombinieren?",
        answer: "Ja. Wir können Transport, Abbau und Aufbau in einem abgestimmten Termin bündeln.",
      },
    ],
  },
  "senior-umzug": {
    name: "Seniorenumzug",
    title: "Einfühlsamer Seniorenumzug",
    description:
      "Wir begleiten Senioren und Angehörige mit Geduld und Sorgfalt beim Umzug in eine neue Wohnung, ins betreute Wohnen oder ins Pflegeheim.",
    intro:
      "Ein Umzug im Alter braucht Zeit, Vertrauen und eine gute Planung. In {city} begleiten wir Sie oder Ihre Angehörigen persönlich – vom ersten Gespräch bis zur Einrichtung des neuen Zuhauses.",
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
        answer: "Ja. Wir organisieren den Umzug in betreutes Wohnen, Seniorenresidenzen oder Pflegeeinrichtungen und stimmen Details gern mit Angehörigen ab.",
      },
      {
        question: "Helfen Sie beim Ein- und Auspacken?",
        answer: "Auf Wunsch übernehmen wir das sorgfältige Verpacken, Auspacken und Einräumen, damit das neue Zuhause schneller vertraut wird.",
      },
      {
        question: "Wie viel Vorlauf ist sinnvoll?",
        answer: "Für eine entspannte Planung empfehlen wir mehrere Wochen Vorlauf. Bei dringenden Situationen prüfen wir selbstverständlich kurzfristige Möglichkeiten.",
      },
    ],
  },
  entruempelung: {
    name: "Entrümpelung",
    title: "Entrümpelung und Haushaltsauflösung",
    description:
      "Wohnungen, Häuser, Keller und Gewerberäume räumen wir diskret, fachgerecht und besenrein – inklusive umweltgerechter Entsorgung.",
    intro:
      "Bei einer Entrümpelung in {city} zählen klare Absprachen und ein respektvoller Umgang mit dem Hausrat. Nach einer kostenlosen Besichtigung erhalten Sie ein transparentes Festpreisangebot inklusive Entsorgung.",
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
        answer: "Kosten und Dauer hängen von Menge, Zugänglichkeit und Art der Gegenstände ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis.",
      },
      {
        question: "Werden verwertbare Gegenstände angerechnet?",
        answer: "Gut erhaltene Möbel, Metalle oder andere verwertbare Gegenstände können nach Prüfung den Entrümpelungspreis reduzieren.",
      },
      {
        question: "Ist eine besenreine Übergabe möglich?",
        answer: "Ja. Nach der Räumung hinterlassen wir die vereinbarten Räume besenrein und bereit für die weitere Übergabe oder Nutzung.",
      },
    ],
  },
};

type ServiceKey = keyof typeof serviceConfig;

function withCity(text: string, cityName: string) {
  return text.replaceAll("{city}", cityName);
}

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
  const cityName = deslugify(decoded);

  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);
  if (!(serviceKey in serviceConfig))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);

  const config = serviceConfig[serviceKey];

  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section
        className='relative min-h-[600px] flex items-center'
        style={{
          backgroundImage: "url('/images/Umzugsunternehmen_Olpe.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className='absolute inset-0 bg-navy/85' />
        <div className='relative z-10 container mx-auto px-4 py-16'>
          <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2'>
            <div className='border border-white/10 bg-[#0b1f3a] p-6 shadow-2xl rounded lg:p-8'>
              <h2 className='mb-3 font-sans text-xl font-semibold text-white'>
                Angebot für {config.name} anfordern
              </h2>
              <p className='mb-5 font-body text-sm text-gray-300'>
                In wenigen Schritten zu Ihrem unverbindlichen Angebot für {cityName}.
              </p>
              <ContactForm dark />
            </div>
            <div className='flex flex-col gap-6 text-center lg:text-left'>
              <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight'>
                <span className='text-primary'>{config.title}</span> in {cityName}
              </h1>
              <p className='font-body text-gray-300 text-lg'>
                {config.description}
              </p>
              <div>
                <Link href={`/stadt/${encodeURIComponent(slugify(cityName))}`}>
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
            {config.name} in {cityName}: persönlich geplant, professionell umgesetzt
          </h2>
          <p className='mt-5 font-body text-lg leading-relaxed text-gray-600'>
            {withCity(config.intro, cityName)}
          </p>
        </div>
      </section>

      <section className='bg-white py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
              Passende Leistungen für {config.name.toLowerCase()} in {cityName}
            </h2>
            <p className='mt-3 font-body text-gray-600'>
              Wir stimmen den Umfang mit Ihnen ab und erstellen daraus ein klares Angebot.
            </p>
          </div>
          <div className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3'>
            {config.details.map((detail) => (
              <article key={detail.title} className='border border-gray-100 bg-gray-50 p-6 shadow-sm rounded'>
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
            Unsere Leistungen: {config.name} in {cityName}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {config.features.map((feature) => (
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

      <section className='bg-gray-50 py-16'>
        <div className='container mx-auto max-w-4xl px-4'>
          <h2 className='font-sans text-3xl font-bold text-navy'>
            Gut vorbereitet für Ihren Termin in {cityName}
          </h2>
          <p className='mt-3 font-body text-gray-600'>
            Diese Informationen helfen uns, Ihren Auftrag präzise zu planen.
          </p>
          <ul className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
            {config.tips.map((tip) => (
              <li key={tip} className='flex gap-3 bg-white p-5 shadow-sm rounded'>
                <CheckIcon className='mt-0.5 shrink-0 text-primary' size={20} />
                <span className='font-body text-sm leading-relaxed text-gray-700'>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className='bg-white py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
              So läuft Ihr {config.name.toLowerCase()} in {cityName} ab
            </h2>
            <p className='mt-3 font-body text-gray-600'>
              Transparent geplant und auf Ihren Termin abgestimmt.
            </p>
          </div>
          <ol className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {config.process.map((processStep, index) => (
              <li key={processStep} className='border border-gray-100 bg-gray-50 p-6 shadow-sm rounded'>
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

      {/* Benefits */}
      <section className='py-20 bg-navy'>
        <div className='container mx-auto px-4'>
          <h2 className='font-sans font-bold text-3xl text-white mb-8'>
            Warum Umzugshelden für {config.name} in {cityName}?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {config.benefits.map((benefit) => (
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
        faqs={config.faqs.map((faq) => ({
          question: withCity(faq.question, cityName),
          answer: withCity(faq.answer, cityName),
        })) as FAQType[]}
        title={`Häufige Fragen zu ${config.name} in ${cityName}`}
      />

      {/* Contact */}
      <section className='py-16 bg-white' id='kontakt'>
        <div className='container mx-auto px-4 max-w-5xl'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
            <div className='flex flex-col gap-6'>
              <h2 className='font-sans font-bold text-3xl text-navy'>
                Kostenloses Angebot für {config.name} in {cityName}
              </h2>
              <p className='font-body text-gray-600'>
                Wir melden uns innerhalb von 24 Stunden mit einem
                unverbindlichen Angebot bei Ihnen.
              </p>
              <div className='flex flex-col gap-4'>
                <div className='flex gap-3 items-center'>
                  <PhoneIcon className='text-primary flex-shrink-0' size={20} />
                  <Link
                    href='tel:+4915168567708'
                    className='font-body text-gray-600 hover:text-primary'>
                    +49 151 68567708
                  </Link>
                </div>
                <div className='flex gap-3 items-center'>
                  <MailIcon className='text-primary flex-shrink-0' size={20} />
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
    </div>
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
  const cityName = deslugify(decoded);
  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName) || !(serviceKey in serviceConfig)) {
    return { title: "Umzugshelden" };
  }

  const config = serviceConfig[serviceKey];
  return {
    title: `${config.name} ${cityName} ▷ Professionell & günstig | Umzugshelden`,
    description: `${config.name} in ${cityName}: ${config.description} Jetzt kostenlos anfragen!`,
    openGraph: {
      title: `${config.name} ${cityName} | Umzugshelden`,
      description: config.description,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://umzugshelden.de/stadt/${encodeURIComponent(slugify(cityName))}/${service}`,
    },
  };
}
