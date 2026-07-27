import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "FAQ — Häufige Fragen | Umzugshelden",
    description:
      "Antworten auf die häufigsten Fragen zu Umzugsservice, Anstricharbeiten und Möbelmontage von Umzugshelden im Kreis Olpe.",
  };
}

const faqUmzug: FAQType[] = [
  {
    question: "In welchem Gebiet seid ihr tätig?",
    answer:
      "Wir sind im Kreis Olpe (Olpe, Attendorn, Lennestadt, Finnentrop, Kirchhundem, Drolshagen, Wenden) und einem Umkreis von ca. 25 km tätig – z. B. Plettenberg, Siegen, Kreuztal, Schmallenberg und weitere.",
  },
  {
    question: "Was kostet ein Umzug mit Umzugshelden?",
    answer:
      "Die Kosten hängen von Umfang, Entfernung und Leistungspaket ab. Wir erstellen Ihnen gern ein kostenloses und unverbindliches Festpreisangebot nach einer kurzen Beratung.",
  },
  {
    question: "Wie weit im Voraus soll ich buchen?",
    answer:
      "Wir empfehlen 4–6 Wochen im Voraus, besonders für Wochenenden und Monatsenden. Für kurzfristige Aufträge versuchen wir immer eine Lösung zu finden – sprechen Sie uns einfach an.",
  },
  {
    question: "Übernehmt ihr auch das Verpacken der Kartons?",
    answer:
      "Ja! Unser optionaler Verpackungsservice kann jederzeit dazugebucht werden. Wir bringen Kartons, Packpapier und Polstermaterial mit.",
  },
  {
    question: "Ist mein Umzugsgut versichert?",
    answer:
      "Ja, alle Transporte sind durch unsere Transportversicherung abgedeckt. Auf Wunsch können wir für besonders wertvolle Gegenstände eine erweiterte Versicherung abschließen.",
  },
  {
    question: "Können wir auch kurzfristig einen Termin bekommen?",
    answer:
      "Ja, soweit es unsere Kapazitäten erlauben. Rufen Sie uns einfach an oder schreiben Sie uns eine E-Mail – wir versuchen immer schnellstmöglich zu helfen.",
  },
];

const faqAnstrich: FAQType[] = [
  {
    question: "Was zählt als Schönheitsreparatur bei der Wohnungsübergabe?",
    answer:
      "Schönheitsreparaturen umfassen das Streichen und Tapezieren von Wänden, Decken und Fußböden sowie das Lackieren von Türen, Fenstern und Heizkörpern. Ob Sie diese Arbeiten durchführen müssen, hängt von Ihrem Mietvertrag ab.",
  },
  {
    question: "Wie schnell können die Anstricharbeiten fertig sein?",
    answer:
      "Je nach Wohnungsgröße dauert ein Standardauftrag 1–3 Tage. Wir sind flexibel und können uns auf enge Übergabetermine einstellen.",
  },
  {
    question: "Sind Farben und Materialien im Preis inbegriffen?",
    answer:
      "Ja, alle Farben, Spachtelmassen und Materialien sind im Angebot enthalten. Wir verwenden hochwertige, umweltfreundliche Farben.",
  },
  {
    question: "Macht ihr auch kleinere Ausbesserungen (Löcher, Risse)?",
    answer:
      "Ja! Vor dem Streichen spachteln und schleifen wir alle Löcher, Dübellöcher und kleinen Risse, damit ein perfekter Untergrund entsteht.",
  },
];

const faqMoebel: FAQType[] = [
  {
    question: "Welche Möbel könnt ihr auf- und abbauen?",
    answer:
      "Wir montieren und demontieren alle gängigen Möbel: IKEA, XXXLutz, Einbauküchen, Schrankwände, Betten, Kleiderschränke, Büromöbel und mehr.",
  },
  {
    question: "Brauche ich die Originalanleitung für den Aufbau?",
    answer:
      "Idealerweise ja, aber nicht zwingend. Unser Team kennt die gängigen Möbelmarken gut. Bei ungewöhnlichen Möbeln helfen Fotos vom Originalzustand.",
  },
  {
    question: "Was passiert, wenn beim Ab- oder Aufbau etwas kaputt geht?",
    answer:
      "Wir arbeiten mit größter Sorgfalt. Sollte dennoch etwas beschädigt werden, sind alle unsere Arbeiten versichert – wir kümmern uns um Ersatz oder Reparatur.",
  },
  {
    question: "Kann ich Möbelmontage mit einem Umzug kombinieren?",
    answer:
      "Ja, das empfehlen wir sogar! Als Kombi-Paket erhalten Sie alles aus einer Hand zu einem attraktiven Gesamtpreis.",
  },
];

const Page = () => {
  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section className='bg-navy py-20'>
        <div className='container mx-auto px-4 text-center flex flex-col gap-4 items-center'>
          <h1 className='font-sans font-bold text-4xl md:text-5xl text-white max-w-3xl leading-tight'>
            Häufige Fragen <span className='text-primary'>(FAQ)</span>
          </h1>
          <p className='font-body text-gray-300 text-lg max-w-xl'>
            Hier finden Sie Antworten auf die wichtigsten Fragen rund um unsere
            Dienstleistungen.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className='py-16 bg-gray-50'>
        <div className='container mx-auto px-4 max-w-4xl space-y-8'>
          <FAQBlock faqs={faqUmzug} title='Fragen zum Umzugsservice' />
          <FAQBlock
            faqs={faqAnstrich}
            title='Fragen zu Anstricharbeiten & Wohnungsübergabe'
          />
          <FAQBlock
            faqs={faqMoebel}
            title='Fragen zum Möbel Ab- & Aufbauservice'
          />
        </div>
      </section>

      {/* CTA */}
      <section className='py-16 bg-navy'>
        <div className='container mx-auto px-4 flex flex-col items-center gap-4 text-center'>
          <h2 className='font-sans font-bold text-2xl md:text-3xl text-white max-w-xl'>
            Noch Fragen? Wir helfen Ihnen gern!
          </h2>
          <p className='font-body text-gray-300 max-w-md'>
            Schreiben Sie uns oder rufen Sie direkt an – wir melden uns
            innerhalb von 24 Stunden.
          </p>
          <Link href='/kontakt'>
            <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold text-base'>
              Jetzt Kontakt aufnehmen
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Page;
