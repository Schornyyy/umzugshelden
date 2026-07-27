import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import {
  CheckIcon,
  MailIcon,
  PhoneIcon,
  ArmchairIcon,
  UtensilsIcon,
  BedIcon,
  BookOpenIcon,
  MonitorIcon,
  GridIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Möbel Ab- und Aufbau Service — Umzugshelden",
    description:
      "Professioneller Möbel Ab- und Aufbauservice von Umzugshelden: IKEA, Küche, Schrankwände, Büromöbel – schnell, sicher und günstig montiert.",
    openGraph: {
      title: "Möbel Ab- und Aufbau Service | Umzugshelden",
      description:
        "Möbel abbauen, transportieren und wieder aufbauen – von IKEA bis zur Einbauküche. Erfahrenes Team, Festpreise.",
      url: "https://umzugshelden.de/moebel-service",
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Welche Möbel könnt ihr auf- und abbauen?",
    answer:
      "Wir montieren und demontieren alle gängigen Möbel: IKEA, XXXLutz, Höffner, Einbauküchen, Schrankwände, Betten, Kleiderschränke, Büromöbel und vieles mehr. Kontaktieren Sie uns für individuelle Anfragen.",
  },
  {
    question: "Brauche ich die Originalanleitung für den Aufbau?",
    answer:
      "Idealerweise, aber nicht zwingend notwendig. Unser Team ist erfahren im Aufbau aller gängigen Möbelmarken. Bei ungewöhnlichen oder sehr alten Möbeln ist eine Anleitung oder Fotos vom Originalzustand hilfreich.",
  },
  {
    question: "Was passiert, wenn beim Ab- oder Aufbau etwas kaputt geht?",
    answer:
      "Wir arbeiten mit größter Sorgfalt. Sollte dennoch etwas beschädigt werden, sind alle unsere Arbeiten versichert und wir kümmern uns um Ersatz oder Reparatur.",
  },
  {
    question: "Kann ich Möbelabbau und Aufbau zusammen mit einem Umzug buchen?",
    answer:
      "Ja, das ist sogar besonders empfehlenswert! Als Kombination mit unserem Umzugsservice erhalten Sie alles aus einer Hand zu einem attraktiven Gesamtpreis. Sprechen Sie uns einfach an.",
  },
];

const services = [
  {
    icon: <ArmchairIcon className='text-primary' size={32} />,
    title: "IKEA & Möbelhaus-Möbel",
    text: "Vom KALLAX bis zur PAX-Schrankwand – wir bauen alle IKEA-Möbel und andere Kaufhaus-Möbel fachgerecht auf und ab.",
  },
  {
    icon: <UtensilsIcon className='text-primary' size={32} />,
    title: "Einbauküchen",
    text: "Küchenabbau und -aufbau inklusive Anschlussarbeiten. Wir demontieren, transportieren und installieren Ihre Küche im neuen Zuhause.",
  },
  {
    icon: <GridIcon className='text-primary' size={32} />,
    title: "Schrankwände & Regale",
    text: "Große Schrankwände, Kleiderschränke und Regalsysteme werden sicher demontiert und präzise im neuen Raum aufgebaut.",
  },
  {
    icon: <BedIcon className='text-primary' size={32} />,
    title: "Betten & Matratzen",
    text: "Bettrahmen, Lattenroste und Matratzen – alles wird fachgerecht ab- und aufgebaut, für einen erholsamen Neustart.",
  },
  {
    icon: <MonitorIcon className='text-primary' size={32} />,
    title: "Büromöbel",
    text: "Schreibtische, Bürostühle, Aktenschränke – wir montieren Ihr komplettes Büro schnell und störungsarm.",
  },
  {
    icon: <BookOpenIcon className='text-primary' size={32} />,
    title: "Sonstige Möbel",
    text: "Kommoden, Sideboard, Bücherregale, TV-Möbel – wenn es zusammengebaut werden kann, bauen wir es auf oder ab.",
  },
];

const whys = [
  {
    title: "Kein Stress beim Umziehen",
    text: "Wir kümmern uns um den Auf- und Abbau, während Sie sich auf das Wichtige konzentrieren.",
  },
  {
    title: "Erfahrenes Montageteam",
    text: "Unsere Handwerker kennen alle gängigen Möbelmarken und Montagetechniken.",
  },
  {
    title: "Kein Werkzeug nötig",
    text: "Wir bringen alles mit – Sie müssen sich um nichts kümmern.",
  },
  {
    title: "Schonender Umgang mit Ihren Möbeln",
    text: "Wir arbeiten sorgfältig, damit keine Kratzer oder Beschädigungen entstehen.",
  },
  {
    title: "Kombination mit Umzugsservice möglich",
    text: "Buchen Sie Auf- und Abbau zusammen mit dem Umzug für ein stressfreies Rundum-Paket.",
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
        title='Häufige Fragen zum Möbel Ab- und Aufbauservice'
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
      backgroundImage: "url('/images/Hero_background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
    <div className='absolute inset-0 bg-navy/85' />
    <div className='relative z-10 container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6'>
      <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl'>
        <span className='text-primary'>Möbel Ab- & Aufbau</span> Service –
        schnell & sicher
      </h1>
      <p className='font-body text-gray-300 text-lg max-w-2xl'>
        Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel
        professionell, zuverlässig und ohne Kratzer.
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
        Möbel auf- und abbauen kostet Zeit, Nerven und oft auch Rücken. Warum
        das selbst machen, wenn die{" "}
        <strong className='text-navy'>Umzugshelden</strong> das für Sie
        erledigen? Unser erfahrenes Montageteam baut Ihre Möbel schnell, sicher
        und ohne Beschädigungen ab und im neuen Zuhause wieder auf – im Kreis
        Olpe und einem Umkreis von 25 km.
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
          Unsere Möbelmontage-Leistungen
        </h2>
        <p className='font-body text-gray-600 mt-3'>
          Wir montieren und demontieren alle gängigen Möbeltypen – schnell und
          sorgfältig.
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
            Warum Möbelmontage mit Umzugshelden?
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Schluss mit stundenlangem Schrauben und Flüchen über fehlende Teile.
            Unser Montageteam hat Erfahrung mit allen gängigen Möbelmarken und
            erledigt den Job schneller und sicherer, als Sie es selbst könnten.
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
            alt='Möbelmontage Umzugshelden'
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
            Möbelmontage anfragen
          </h2>
          <p className='font-body text-gray-300'>
            Beschreiben Sie uns kurz, welche Möbel auf- oder abgebaut werden
            sollen – wir erstellen Ihnen ein schnelles und unverbindliches
            Angebot.
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
