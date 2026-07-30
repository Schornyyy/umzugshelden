import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Anstricharbeiten für Wohnungsübergabe — Umzugshelden",
    description:
      "Professionelle Anstricharbeiten und Schönheitsreparaturen für Ihre Wohnungsübergabe. Umzugshelden streicht Wände, Decken und renoviert Ihre Wohnung schnell und günstig.",
    openGraph: {
      title: "Anstricharbeiten für Wohnungsübergabe | Umzugshelden",
      description:
        "Schönheitsreparaturen, Streichen, Tapezieren – wir bereiten Ihre Wohnung optimal für die Übergabe vor.",
      url: "https://umzugshelden.de/anstricharbeiten",
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

const page = () => {
  return (
    <div className='flex flex-col'>
      <Hero />
      <IntroSection />
      <ServicesSection />
      <WhySection />
      <FAQBlock
        faqs={faqs}
        title='Häufige Fragen zu Anstricharbeiten & Wohnungsübergabe'
      />
      <ContactSection />
    </div>
  );
};

export default page;

/* ─── HERO ─── */
const Hero = () => (
  <section
    className='relative min-h-[500px] flex items-center'
    style={{
      backgroundImage: "url('/images/Umzugsunternehmen_Olpe.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
    <div className='absolute inset-0 bg-navy/85' />
    <div className='relative z-10 container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6'>
      <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl'>
        <span className='text-primary'>Anstricharbeiten</span> für Ihre
        Wohnungsübergabe
      </h1>
      <p className='font-body text-gray-300 text-lg max-w-2xl'>
        Schönheitsreparaturen, Streichen, Tapezieren – wir bereiten Ihre Wohnung
        professionell und termingerecht für die Übergabe vor.
      </p>
      <div className='flex flex-col sm:flex-row gap-4'>
        <Link href='#kontakt'>
          <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold text-base'>
            Kostenloses Angebot anfordern!
          </Button>
        </Link>
        <Link href='#leistungen'>
          <Button
            variant='outline'
            className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold text-base'>
            Leistungen ansehen
          </Button>
        </Link>
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
            src='/images/gebäude.png'
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
