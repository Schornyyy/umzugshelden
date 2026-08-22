import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import ServiceSchema from "@/components/ServiceSchema";
import { FAQType } from "@/types/utils/FAQType";
import {
  CheckIcon,
  MailIcon,
  PhoneIcon,
  PaintbrushIcon,
  HomeIcon,
  SparklesIcon,
  LayersIcon,
  PencilRulerIcon,
  ShieldCheckIcon,
  SearchIcon,
  ClipboardListIcon,
  KeyIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Anstricharbeiten Olpe & Umgebung — Wohnungsübergabe | Umzugshelden",
    description:
      "Professionelle Anstricharbeiten und Schönheitsreparaturen für Ihre Wohnungsübergabe im Kreis Olpe. Umzugshelden streicht Wände, Decken und renoviert Ihre Wohnung termingerecht und günstig.",
    openGraph: {
      title: "Anstricharbeiten für Wohnungsübergabe | Umzugshelden",
      description:
        "Schönheitsreparaturen, Streichen, Tapezieren – wir bereiten Ihre Wohnung optimal für die Übergabe vor.",
      url: "https://umzugshelden.de/anstricharbeiten",
    },
    alternates: {
      canonical: "https://umzugshelden.de/anstricharbeiten",
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Was zählt als Schönheitsreparatur bei der Wohnungsübergabe?",
    answer:
      "Schönheitsreparaturen umfassen das Streichen und Tapezieren von Wänden, Decken und Fußböden sowie das Lackieren von Türen, Fenstern und Heizkörpern. Ob Sie diese Arbeiten durchführen müssen, hängt von Ihrem Mietvertrag ab – wir beraten Sie gern.",
  },
  {
    question: "Wie schnell können die Anstricharbeiten fertig sein?",
    answer:
      "Je nach Wohnungsgröße und Umfang der Arbeiten dauert ein Standardauftrag 1–3 Tage. Wir sind flexibel und können uns auf enge Übergabetermine einstellen – sprechen Sie uns rechtzeitig an.",
  },
  {
    question: "Welche Farben und Materialien werden verwendet?",
    answer:
      "Wir verwenden hochwertige, umweltfreundliche Farben in den von Ihnen gewünschten Tönen. Für Übergaben empfehlen wir in der Regel weiße oder helle, neutrale Farbtöne. Alles Material ist im Preis inbegriffen.",
  },
  {
    question: "Macht ihr auch kleinere Ausbesserungen (Löcher, Risse)?",
    answer:
      "Ja! Vor dem Streichen spachteln und schleifen wir alle Löcher, Dübellöcher und kleinen Risse. So ergibt sich ein perfekter, glatter Untergrund für den Neuanstrich.",
  },
  {
    question: "Könnt ihr auch Tapeten entfernen?",
    answer:
      "Ja, Tapetenentfernung ist ein fester Bestandteil unserer Leistungen. Wir entfernen alte Tapeten, glätten den Untergrund und streichen die Wände anschließend frisch – alles aus einer Hand.",
  },
  {
    question: "Wie lange dauert das Streichen einer 3-Zimmer-Wohnung?",
    answer:
      "Eine durchschnittliche 3-Zimmer-Wohnung (ca. 70 m²) streichen wir in 1–2 Tagen – abhängig vom Zustand und Umfang. Wir planen realistisch und halten unsere Versprechen.",
  },
  {
    question: "Kann ich die Anstricharbeiten mit dem Umzug kombinieren?",
    answer:
      "Ja – und das empfehlen wir sogar. Als Kombi-Paket aus Umzug und Anstricharbeiten erhalten Sie alles aus einer Hand und sparen Zeit und Koordinationsaufwand. Sprechen Sie uns an!",
  },
];

const services = [
  {
    icon: <PaintbrushIcon className='text-primary' size={32} />,
    title: "Wände streichen",
    text: "Frischer Neuanstrich für alle Wände – deckend, sauber und in Ihrer Wunschfarbe. Ideal für die Wohnungsübergabe.",
  },
  {
    icon: <HomeIcon className='text-primary' size={32} />,
    title: "Decken renovieren",
    text: "Deckenfarbe auftragen, Flecken überstreichen oder Raufasertapete erneuern – wir bringen auch die Decke wieder in Topzustand.",
  },
  {
    icon: <SparklesIcon className='text-primary' size={32} />,
    title: "Schönheitsreparaturen",
    text: "Alle Schönheitsreparaturen laut Mietvertrag aus einer Hand: streichen, tapezieren, spachteln, schleifen.",
  },
  {
    icon: <LayersIcon className='text-primary' size={32} />,
    title: "Tapezieren",
    text: "Alte Tapeten entfernen und neue anbringen oder direkt auf den Putz streichen – wir erledigen beides professionell.",
  },
  {
    icon: <PencilRulerIcon className='text-primary' size={32} />,
    title: "Lackierarbeiten",
    text: "Türen, Fensterrahmen, Heizkörper und Leisten frisch lackiert – für ein einheitliches Gesamtbild der Wohnung.",
  },
  {
    icon: <ShieldCheckIcon className='text-primary' size={32} />,
    title: "Ausbesserungen & Spachteln",
    text: "Dübellöcher, Risse und Beschädigungen werden vor dem Anstrich professionell verspachtelt und geschliffen.",
  },
];

const whys = [
  {
    title: "Termingerecht zur Wohnungsübergabe",
    text: "Wir arbeiten zügig und präzise – pünktlich zu Ihrem Übergabetermin.",
  },
  {
    title: "Hochwertige Materialien inklusive",
    text: "Alle Farben, Spachtelmassen und Materialien sind im Angebot enthalten.",
  },
  {
    title: "Saubere und ordentliche Arbeitsweise",
    text: "Wir schützen Böden und Einrichtung und hinterlassen die Wohnung besenrein.",
  },
  {
    title: "Faire Festpreise ohne Überraschungen",
    text: "Sie erhalten ein transparentes Angebot – ohne versteckte Zusatzkosten.",
  },
  {
    title: "Erfahrene Handwerker",
    text: "Unser Team hat jahrelange Erfahrung in Renovierungs- und Anstricharbeiten.",
  },
];

const steps = [
  {
    number: "01",
    icon: <SearchIcon className="text-primary" size={28} />,
    title: "Kostenlose Besichtigung",
    text: "Wir kommen zu Ihnen und schauen uns die Wohnung an. So können wir genau einschätzen, welche Arbeiten nötig sind und ein verbindliches Festpreisangebot erstellen.",
    detail: "In der Regel 15–20 Minuten – kostenlos und unverbindlich.",
  },
  {
    number: "02",
    icon: <ClipboardListIcon className="text-primary" size={28} />,
    title: "Festpreisangebot & Terminvereinbarung",
    text: "Sie erhalten innerhalb von 24 Stunden ein schriftliches Angebot mit allen Leistungen und dem Endpreis. Nach Ihrer Bestätigung legen wir gemeinsam den Termin fest.",
    detail: "Transparent, fair und ohne versteckte Kosten.",
  },
  {
    number: "03",
    icon: <PaintbrushIcon className="text-primary" size={28} />,
    title: "Vorbereitung & Durchführung",
    text: "Unser Team schützt Böden, Türen und Einbauten, spachtelt alle Löcher und Risse und streicht dann zügig und sauber. Wir arbeiten mit hochwertigen Farben, die im Preis enthalten sind.",
    detail: "1–3 Tage je nach Wohnungsgröße.",
  },
  {
    number: "04",
    icon: <KeyIcon className="text-primary" size={28} />,
    title: "Abnahme & Übergabe",
    text: "Nach Fertigstellung gehen wir gemeinsam alle Räume durch. Erst wenn Sie vollständig zufrieden sind, gilt der Auftrag als abgeschlossen – besenrein und übergabefertig.",
    detail: "Direkt bereit für Ihre Wohnungsübergabe.",
  },
];

const page = () => {
  return (
    <>
      <ServiceSchema
        name='Anstricharbeiten im Kreis Olpe'
        serviceType='Anstricharbeiten und Schönheitsreparaturen'
        description='Professionelle Anstricharbeiten, Tapezieren und Schönheitsreparaturen für die Wohnungsübergabe im Kreis Olpe.'
        path='/anstricharbeiten'
      />
      <div className='flex flex-col'>
        <Hero />
        <IntroSection />
        <SchoenheitsInfoSection />
        <ServicesSection />
        <IncludedSection />
        <ProcessSection />
        <WhySection />
        <FAQBlock
          faqs={faqs}
          title='Häufige Fragen zu Anstricharbeiten & Wohnungsübergabe'
        />
        <ContactSection />
      </div>
    </>
  );
};

export default page;

/* ─── SCHÖNHEITS INFO ─── */
const schoenheitsInfoCards = [
  {
    title: "Wann ist Streichen Pflicht?",
    text: "Nur wenn der Mietvertrag eine wirksame Schönheitsreparaturklausel enthält. Viele starre Klauseln hat der BGH bereits für unwirksam erklärt.",
  },
  {
    title: "Was gehört typischerweise dazu?",
    text: "Wände & Decken streichen, Tapeten erneuern, Türen & Fensterrahmen lackieren – alles im Innenbereich der Wohnung.",
  },
  {
    title: "Welche Farben sind erlaubt?",
    text: "Zur Übergabe werden weiße oder helle, neutrale Töne erwartet. Grelle oder dunkle Farben können zu Abzügen von der Kaution führen.",
  },
  {
    title: "Was gilt bei normaler Abnutzung?",
    text: "Normale Gebrauchsspuren müssen nicht zwingend beseitigt werden. Übermäßige Beschädigungen hingegen schon – im Zweifel schafft ein professioneller Anstrich Klarheit.",
  },
];

const SchoenheitsInfoSection = () => (
  <section className='py-16 bg-gray-50'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Schönheitsreparaturen: Was Mieter wirklich wissen müssen
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Als Mieter sind Sie laut Gesetz grundsätzlich{" "}
            <strong className='text-navy'>nicht automatisch</strong> verpflichtet,
            beim Auszug zu streichen. Eine Pflicht entsteht nur durch eine wirksame
            Klausel im Mietvertrag. Viele solcher Klauseln wurden vom BGH inzwischen
            für unwirksam erklärt – zum Beispiel starre Fristen wie &bdquo;spätestens alle
            3 Jahre&ldquo;.
          </p>
          <p className='font-body text-gray-600 leading-relaxed'>
            Falls Sie zur Renovierung verpflichtet sind, umfassen
            Schönheitsreparaturen typischerweise das Streichen von Wänden und Decken,
            das Erneuern von Tapeten sowie das Lackieren von Türen, Fensterrahmen und
            Heizkörpern. Der Zustand muss dem normalen Gebrauch entsprechen – nicht
            neuwertig sein.
          </p>
          <p className='font-body text-gray-600 leading-relaxed'>
            Wir beraten Sie kurz dazu, was in Ihrem Fall sinnvoll ist, und erledigen
            dann alles termingerecht zum Festpreis. So gehen Sie auf Nummer sicher und
            vermeiden Abzüge von der Kaution.
          </p>
          <div className='bg-primary/10 border border-primary/20 rounded-xl p-5'>
            <p className='font-sans font-semibold text-navy text-sm mb-1'>
              Tipp von Umzugshelden
            </p>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              Auch wenn Sie rechtlich nicht streichen müssten – ein frischer Anstrich
              beschleunigt die Übergabe erheblich und verhindert langwierige
              Diskussionen mit dem Vermieter. In der Regel rechnet sich das.
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          {schoenheitsInfoCards.map((item) => (
            <div
              key={item.title}
              className='bg-white rounded-xl p-5 border border-gray-100 shadow-sm'>
              <p className='font-sans font-semibold text-navy mb-1'>{item.title}</p>
              <p className='font-body text-gray-600 text-sm leading-relaxed'>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─── INCLUDED ─── */
const includedItems = [
  "Wände und Decken – 2 volldeckende Anstriche",
  "Alle Farben, Rollen und Abklebebänder inklusive",
  "Schutz von Böden, Türen und Einbauten",
  "Spachteln und Schleifen aller Löcher und Risse",
  "Besenreine Übergabe nach Fertigstellung",
  "Kostenlose Nachbesserung bei berechtigten Mängeln",
];

const optionalAnstrichItems = [
  "Tapeten entfernen und Wände glätten",
  "Türen, Fensterrahmen & Heizkörper lackieren",
  "Grundreinigung der Wohnung",
  "Kombination mit Umzugsservice",
];

const IncludedSection = () => (
  <section className='py-16 bg-white'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Was ist im Standardangebot enthalten?
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Unser Standardpaket deckt alles ab, was für eine erfolgreiche
            Wohnungsübergabe nötig ist. Der Preis wird vorab schriftlich
            festgehalten – keine überraschenden Mehrkosten.
          </p>
          <div className='flex flex-col gap-3'>
            {includedItems.map((item) => (
              <div key={item} className='flex gap-3 items-center'>
                <CheckIcon className='text-primary flex-shrink-0' size={20} />
                <p className='font-body text-gray-700'>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className='flex flex-col gap-5'>
          <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
            <h3 className='font-sans font-semibold text-navy mb-4'>
              Optionale Zusatzleistungen
            </h3>
            <div className='flex flex-col gap-3'>
              {optionalAnstrichItems.map((item) => (
                <div key={item} className='flex gap-3 items-center'>
                  <div className='w-2 h-2 rounded-full bg-primary flex-shrink-0' />
                  <p className='font-body text-gray-600 text-sm'>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className='bg-navy rounded-xl p-6'>
            <p className='font-sans font-semibold text-white mb-2'>
              Transparenter Festpreis
            </p>
            <p className='font-body text-gray-300 text-sm leading-relaxed'>
              Alle Leistungen stehen im Angebot. Keine Stundensätze, keine
              überraschenden Mehrkosten – ein klar definierter Preis für ein klar
              definiertes Ergebnis.
            </p>
            <Link href='#kontakt' className='inline-block mt-4'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-semibold text-sm'>
                Jetzt anfragen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─── HERO ─── */
const Hero = () => (
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
            Angebot für Anstricharbeiten anfordern
          </h2>
          <p className='mb-5 font-body text-sm text-gray-300'>
            In wenigen Schritten zu Ihrem unverbindlichen Festpreisangebot.
          </p>
          <ContactForm dark />
        </div>
        <div className='flex flex-col gap-6 text-center lg:text-left'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight'>
            <span className='text-primary'>Anstricharbeiten</span> für Ihre
            Wohnungsübergabe
          </h1>
          <p className='font-body text-gray-300 text-lg'>
            Schönheitsreparaturen, Streichen, Tapezieren – wir bereiten Ihre Wohnung
            professionell und termingerecht für die Übergabe vor.
          </p>
          <div>
            <Link href='#leistungen'>
              <Button
                variant='outline'
                className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold text-base'>
                Leistungen ansehen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─── INTRO ─── */
const IntroSection = () => (
  <section className='py-16 bg-white'>
    <div className='container mx-auto px-4 max-w-3xl text-center'>
      <p className='font-body text-gray-600 text-lg leading-relaxed'>
        Der Umzug steht bevor – und die Wohnungsübergabe auch. Wir wissen, dass
        Streichen und Renovieren neben dem ganzen Umzugsstress eine große
        Zusatzbelastung sein kann. Deshalb übernehmen die{" "}
        <strong className='text-navy'>Umzugshelden</strong> das für Sie:
        schnell, sauber und zu einem fairen Preis – im Kreis Olpe und einem 25
        km Umkreis.
      </p>
    </div>
  </section>
);

/* ─── SERVICES ─── */
const ServicesSection = () => (
  <section className='py-20 bg-gray-50' id='leistungen'>
    <div className='container mx-auto px-4'>
      <div className='mb-12'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy'>
          Unsere Anstrich- & Renovierungsleistungen
        </h2>
        <p className='font-body text-gray-600 mt-3'>
          Alles für eine makellose Wohnungsübergabe – aus einer Hand.
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {services.map((s) => (
          <div
            key={s.title}
            className='bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-4'>
            {s.icon}
            <h3 className='font-sans font-semibold text-xl text-navy'>
              {s.title}
            </h3>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              {s.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── WHY ─── */
const ProcessSection = () => (
  <section className='py-20 bg-navy' id='ablauf'>
    <div className='container mx-auto px-4'>
      <div className='mb-12 text-center'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-white'>
          So laufen Ihre Anstricharbeiten ab
        </h2>
        <p className='font-body text-gray-300 mt-3 max-w-xl mx-auto'>
          Von der Besichtigung bis zur übergabefertigen Wohnung – strukturiert
          und ohne Stress.
        </p>
      </div>
      <div className='flex flex-col gap-0'>
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className='grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-6 items-start'>
            <div className='flex flex-col items-center gap-2'>
              <div className='w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0'>
                {step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className='w-0.5 h-12 bg-primary/30 hidden lg:block' />
              )}
            </div>
            <div className='pb-10'>
              <div className='flex items-center gap-3 mb-2'>
                <span className='font-sans font-black text-3xl text-primary/30 leading-none'>
                  {step.number}
                </span>
                <h3 className='font-sans font-semibold text-xl text-white'>
                  {step.title}
                </h3>
              </div>
              <p className='font-body text-gray-300 leading-relaxed'>
                {step.text}
              </p>
              <p className='font-body text-primary text-sm mt-2 font-medium'>
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className='mt-4 text-center'>
        <Link href='#kontakt'>
          <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold text-base'>
            Jetzt Beratungsgespräch vereinbaren
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ─── WHY (original) ─── */
const WhySection = () => (
  <section className='py-20 bg-white'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Warum Umzugshelden für Ihre Anstricharbeiten?
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Wohnungsübergaben sind stressig genug. Wir nehmen Ihnen die
            Renovierung komplett ab – professionell, pünktlich und zu einem
            fairen Festpreis.
          </p>
          <div className='flex flex-col gap-4'>
            {whys.map((w) => (
              <div key={w.title} className='flex gap-3 items-start'>
                <CheckIcon
                  className='text-primary flex-shrink-0 mt-1'
                  size={20}
                />
                <div>
                  <p className='font-sans font-semibold text-navy'>{w.title}</p>
                  <p className='font-body text-gray-600 text-sm'>{w.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href='#kontakt' className='w-fit'>
            <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold'>
              Jetzt anfragen
            </Button>
          </Link>
        </div>
        <div className='rounded-xl overflow-hidden shadow-xl'>
          <Image
            src='/images/Umzugsunternhemen_olpe.png'
            alt='Anstricharbeiten Umzugshelden'
            width={700}
            height={500}
            className='w-full object-cover h-[400px]'
          />
        </div>
      </div>
    </div>
  </section>
);

/* ─── CONTACT ─── */
const ContactSection = () => (
  <section className='py-16 bg-navy' id='kontakt'>
    <div className='container mx-auto px-4 max-w-5xl'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl text-white'>
            Kostenloses Angebot für Ihre Anstricharbeiten
          </h2>
          <p className='font-body text-gray-300'>
            Sagen Sie uns kurz, was gestrichen werden soll – wir melden uns
            innerhalb von 24 Stunden mit einem unverbindlichen Angebot.
          </p>
          <div className='flex flex-col gap-4'>
            <div className='flex gap-3 items-center'>
              <PhoneIcon className='text-primary flex-shrink-0' size={20} />
              <Link
                href='tel:+4915168567708'
                className='font-body text-gray-300 hover:text-primary transition-colors'>
                +49 151 68567708
              </Link>
            </div>
            <div className='flex gap-3 items-center'>
              <MailIcon className='text-primary flex-shrink-0' size={20} />
              <Link
                href='mailto:info@umzugshelden.io'
                className='font-body text-gray-300 hover:text-primary transition-colors'>
                info@umzugshelden.io
              </Link>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-8 shadow-2xl'>
          <ContactForm />
        </div>
      </div>
    </div>
  </section>
);
