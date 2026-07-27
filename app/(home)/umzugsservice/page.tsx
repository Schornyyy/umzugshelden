import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import {
  CheckIcon,
  MailIcon,
  PhoneIcon,
  TruckIcon,
  BoxIcon,
  CalendarIcon,
  PackageIcon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Umzugsservice — Professioneller Umzug mit Umzugshelden",
    description:
      "Umzugshelden bietet professionellen Umzugsservice im Kreis Olpe und 25 km Umkreis: Wohnungsumzug, Firmenumzug – schnell, sorgfältig und günstig. Jetzt kostenloses Angebot anfordern!",
    openGraph: {
      title: "Umzugsservice | Umzugshelden",
      description:
        "Professioneller Umzugsservice – vom ersten Karton bis zum letzten Möbelstück. Faire Preise, zuverlässiges Team.",
      url: "https://umzugshelden.de/umzugsservice",
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Was kostet ein Umzug mit Umzugshelden?",
    answer:
      "Die Kosten hängen von Umfang, Entfernung und Leistungspaket ab. Wir erstellen Ihnen gern ein kostenloses und unverbindliches Angebot nach einer kurzen Beratung. Kontaktieren Sie uns einfach!",
  },
  {
    question: "Wie weit im Voraus soll ich meinen Umzug buchen?",
    answer:
      "Wir empfehlen, Ihren Umzug 4–6 Wochen im Voraus zu buchen, besonders für Wochenenden und Monatsenden. Für kurzfristige Umzüge versuchen wir immer eine Lösung zu finden – sprechen Sie uns an.",
  },
  {
    question: "Übernehmt ihr auch das Verpacken der Kartons?",
    answer:
      "Ja! Unser Verpackungsservice ist optional und kann jederzeit dazugebucht werden. Wir bringen Kartons, Packpapier und Polstermaterial mit und verpacken Ihr Inventar professionell und sicher.",
  },
  {
    question: "Ist mein Umzugsgut versichert?",
    answer:
      "Ja, alle Transporte sind durch unsere Transportversicherung abgedeckt. Auf Wunsch können wir auch eine erweiterte Versicherung für besonders wertvolle Gegenstände abschließen.",
  },
];

const services = [
  {
    icon: <TruckIcon className='text-primary' size={32} />,
    title: "Privatumzug",
    text: "Stressfrei umziehen – wir kümmern uns um alles, von der sorgfältigen Planung bis zum letzten Karton im neuen Zuhause.",
  },
  {
    icon: <BoxIcon className='text-primary' size={32} />,
    title: "Umzug in der Region",
    text: "Wir sind im Kreis Olpe und einem 25 km Umkreis für Sie da – pünktlich, zuverlässig und zu fairen Festpreisen.",
  },
  {
    icon: <CalendarIcon className='text-primary' size={32} />,
    title: "Firmenumzug",
    text: "Büro- und Betriebsumzüge mit minimaler Unterbrechung des Geschäftsbetriebs. Wir planen den Ablauf präzise nach Ihren Vorgaben.",
  },
  {
    icon: <PackageIcon className='text-primary' size={32} />,
    title: "Verpackungsservice",
    text: "Wir verpacken Ihr gesamtes Inventar fachgerecht und sicher – mit hochwertigem Packmaterial für maximalen Schutz.",
  },
  {
    icon: <WrenchIcon className='text-primary' size={32} />,
    title: "Möbelmontage",
    text: "Wir bauen Ihre Möbel fachgerecht ab und im neuen Zuhause wieder auf – schnell, präzise und ohne Kratzer.",
  },
];

const whys = [
  {
    title: "Festes Preirangebot ohne versteckte Kosten",
    text: "Sie wissen von Anfang an, was Ihr Umzug kostet. Keine bösen Überraschungen.",
  },
  {
    title: "Erfahrenes und freundliches Team",
    text: "Unsere Umzugshelfer sind geschult, engagiert und behandeln Ihr Eigentum mit höchster Sorgfalt.",
  },
  {
    title: "Moderne Fahrzeuge & professionelles Equipment",
    text: "Von der richtigen Umzugsdecke bis zum Hubwagen – wir sind bestens ausgerüstet.",
  },
  {
    title: "Flexibel bei Terminen und Umzugsplänen",
    text: "Wir richten uns nach Ihrem Zeitplan – auch kurzfristig und am Wochenende.",
  },
  {
    title: "Komplett-Service aus einer Hand",
    text: "Planen, packen, transportieren, aufbauen – alles aus einer Hand für maximalen Komfort.",
  },
];

const page = () => {
  return (
    <div className='flex flex-col'>
      <Hero />
      <IntroSection />
      <ServicesSection />
      <WhySection />
      <FAQBlock faqs={faqs} title='Häufige Fragen zum Umzugsservice' />
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
      backgroundImage: "url('/images/Hero_background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
    <div className='absolute inset-0 bg-navy/85' />
    <div className='relative z-10 container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6'>
      <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl'>
        Professioneller <span className='text-primary'>Umzugsservice</span> im
        Kreis Olpe
      </h1>
      <p className='font-body text-gray-300 text-lg max-w-2xl'>
        Wohnungsumzug, Firmenumzug oder Umzug innerhalb der Region – die
        Umzugshelden packen an. Mit erfahrenem Team, modernem Fuhrpark und
        fairen Festpreisen im Kreis Olpe und 25 km Umkreis.
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
        Ein Umzug ist mehr als nur Möbel von A nach B transportieren – er ist
        ein neuer Lebensabschnitt. Genau deshalb nehmen wir ihn ernst. Als Ihr
        zuverlässiger{" "}
        <strong className='text-navy'>Umzugsservice im Kreis Olpe</strong>{" "}
        sorgen wir dafür, dass alles reibungslos läuft: von der ersten Beratung
        über den sicheren Transport bis zum Aufbau in Ihrem neuen Zuhause – im
        gesamten Kreis Olpe und einem Umkreis von 25 km.
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
          Unsere Umzugsleistungen
        </h2>
        <p className='font-body text-gray-600 mt-3'>
          Alles aus einer Hand – für einen Umzug ohne Stress.
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
            Warum Umzugshelden Ihr bester Umzugspartner ist
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Wir stehen für Qualität, Verlässlichkeit und persönlichen Service.
            Unser erfahrenes Team sorgt dafür, dass Ihr Umzug pünktlich, sicher
            und zu einem fairen Preis abläuft.
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
            src='/images/fahrzeug.png'
            alt='Umzugshelden Fahrzeug'
            width={700}
            height={500}
            className='w-full object-cover'
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
            Kostenloses Angebot anfordern
          </h2>
          <p className='font-body text-gray-300'>
            Füllen Sie das Formular aus und wir melden uns innerhalb von 24
            Stunden mit einem unverbindlichen Angebot bei Ihnen.
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
