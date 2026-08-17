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
  SearchIcon,
  ClipboardListIcon,
  WrenchIcon,
  ThumbsUpIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Möbel Ab- & Aufbau Service Olpe & Umgebung | Umzugshelden",
    description:
      "Professioneller Möbel Ab- und Aufbauservice von Umzugshelden im Kreis Olpe: IKEA, Küche, Schrankwände, Büromöbel – schnell, sicher und günstig montiert.",
    openGraph: {
      title: "Möbel Ab- und Aufbau Service | Umzugshelden",
      description:
        "Möbel abbauen, transportieren und wieder aufbauen – von IKEA bis zur Einbauküche. Erfahrenes Team, Festpreise.",
      url: "https://umzugshelden.de/moebel-service",
    },
    alternates: {
      canonical: "https://umzugshelden.de/moebel-service",
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
  {
    question: "Wie lange dauert der Auf- oder Abbau einer großen Schrankwand?",
    answer:
      "Eine große Schrankwand oder PAX-Kombination bauen wir in der Regel in 1–2 Stunden ab oder auf – abhängig von Größe und Komplexität. Bei einer Einbauküche planen wir einen halben bis ganzen Tag ein.",
  },
  {
    question: "Bringt ihr eigenes Werkzeug mit?",
    answer:
      "Ja, wir bringen vollständig ausgrüstetes Montagewerkzeug mit – Akkuschrauber, Wasserwaage, Dübell, Schrauben und alles andere. Sie müssen gar nichts vorbereiten.",
  },
  {
    question: "Könnt ihr auch Einbauküchen anschließen?",
    answer:
      "Wir montieren Einbauküchen und koordinieren auf Wunsch auch die Anschlußarbeiten für Spülmaschine und Herd. Komplexe Gas- oder Wasseranschlüsse werden mit einem Fachpartner abgestimmt.",
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

const steps = [
  {
    number: "01",
    icon: <SearchIcon className="text-primary" size={28} />,
    title: "Anfrage & kostenloses Angebot",
    text: "Beschreiben Sie uns kurz, welche Möbel ab- oder aufgebaut werden sollen. Wir erstellen Ihnen schnell und unkompliziert ein verbindliches Festpreisangebot.",
    detail: "Telefonisch, per E-Mail oder über das Formular.",
  },
  {
    number: "02",
    icon: <ClipboardListIcon className="text-primary" size={28} />,
    title: "Vorab-Abstimmung",
    text: "Wir besprechen mit Ihnen Details: welche Möbel, in welchem Stockwerk, ob Transportwege berücksichtigt werden müssen und ob Anleitungen vorhanden sind.",
    detail: "Damit am Termin alles reibungslos läuft.",
  },
  {
    number: "03",
    icon: <WrenchIcon className="text-primary" size={28} />,
    title: "Professioneller Ab- oder Aufbau",
    text: "Unser Montageteam erscheint pünktlich mit allem nötigen Werkzeug. Möbel werden systematisch und sorgfältig montiert oder demontiert – ohne Kratzer und ohne Beschichtigungen.",
    detail: "Erfahrung mit allen gängigen Möbelmarken.",
  },
  {
    number: "04",
    icon: <ThumbsUpIcon className="text-primary" size={28} />,
    title: "Kontrolle & Abschluss",
    text: "Nach dem Aufbau überprüfen wir gemeinsam mit Ihnen alle Möbelstücke auf Standfestigkeit, Ausrichtung und Vollständigkeit. Erst bei Ihrer Zufriedenheit ist der Auftrag abgeschlossen.",
    detail: "Kein Auftrag ohne Abnahme.",
  },
];

const page = () => {
  return (
    <div className='flex flex-col'>
      <Hero />
      <IntroSection />
      <ServicesSection />
      <IncludedSection />
      <ProcessSection />
      <TipsSection />
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

/* ─── INCLUDED ─── */
const moebelIncludedItems = [
  "Sorgfältiger Abbau aller Möbelstücke",
  "Beschriftung von Teilen und Schrauben zur sicheren Wiedermontage",
  "Polsterung und Schutz von Flächen und Kanten",
  "Fachgerechter Aufbau am Zielort nach Ihren Wünschen",
  "Kontrolle auf Vollständigkeit und Standfestigkeit",
  "Eigenes professionelles Werkzeug – Sie müssen nichts vorbereiten",
];

const moebelOptionalItems = [
  "Wandmontage von Regalen und TV-Halterungen",
  "Einbauküchen inklusive Koordination der Anschlüsse",
  "Entsorgung von Verpackungsmaterial",
  "Kombination mit Umzugsservice zum Vorzugspreis",
];

const IncludedSection = () => (
  <section className='py-16 bg-white'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Was ist im Montageservice enthalten?
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Unser Montageservice umfasst alles, was Sie für einen stressfreien
            Auf- oder Abbau brauchen. Der Festpreis gilt – ohne versteckte
            Stundensätze oder Nachberechnungen.
          </p>
          <div className='flex flex-col gap-3'>
            {moebelIncludedItems.map((item) => (
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
              Optional dazubuchbar
            </h3>
            <div className='flex flex-col gap-3'>
              {moebelOptionalItems.map((item) => (
                <div key={item} className='flex gap-3 items-center'>
                  <div className='w-2 h-2 rounded-full bg-primary flex-shrink-0' />
                  <p className='font-body text-gray-600 text-sm'>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className='bg-navy rounded-xl p-6'>
            <p className='font-sans font-semibold text-white mb-2'>
              Kombination mit Umzug
            </p>
            <p className='font-body text-gray-300 text-sm leading-relaxed'>
              Wenn Sie gleichzeitig umziehen, kombinieren wir Möbelmontage und
              Transport zu einem Paketpreis. Alles aus einer Hand – ein Termin,
              ein Team, ein Preis.
            </p>
            <Link href='#kontakt' className='inline-block mt-4'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-semibold text-sm'>
                Kombipaket anfragen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─── TIPS ─── */
const preparationTips = [
  {
    number: "1",
    title: "Zugangswege freihalten",
    text: "Sorgen Sie dafür, dass Flure, Treppen und Aufzüge genügend Platz bieten. Informieren Sie uns vorab über enge Durchgänge oder fehlende Aufzüge.",
  },
  {
    number: "2",
    title: "Anleitung oder Fotos bereithalten",
    text: "Wenn möglich, legen Sie die Originalmontageanleitungen bereit. Alternativ helfen Fotos vom aufgebauten Zustand.",
  },
  {
    number: "3",
    title: "Schrauben nicht selbst trennen",
    text: "Bitte bauen Sie Möbel nicht vorab teilweise ab. Unvollständig demontierte Möbel erschweren unsere Arbeit und erhöhen das Beschädigungsrisiko.",
  },
  {
    number: "4",
    title: "Aufstellungsplan überlegen",
    text: "Wenn Sie wissen, wo Ihre Möbel im neuen Zuhause stehen sollen, teilen Sie uns das mit. Wir richten sie direkt passend aus.",
  },
  {
    number: "5",
    title: "Stockwerk & Parksituation nennen",
    text: "Informieren Sie uns über Stockwerk, Aufzug und Parksituation am Zielort. Das hilft uns, den Aufwand korrekt einzuschätzen.",
  },
];

const TipsSection = () => (
  <section className='py-16 bg-gray-50'>
    <div className='container mx-auto px-4'>
      <div className='mb-10'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy'>
          So bereiten Sie sich optimal vor
        </h2>
        <p className='font-body text-gray-600 mt-3 max-w-2xl'>
          Mit diesen einfachen Vorbereitungen läuft der Montagetermin reibungslos
          – für Sie und unser Team.
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {preparationTips.map((tip) => (
          <div
            key={tip.number}
            className='bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3'>
            <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <span className='font-sans font-bold text-primary text-sm'>
                {tip.number}
              </span>
            </div>
            <h3 className='font-sans font-semibold text-navy'>{tip.title}</h3>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              {tip.text}
            </p>
          </div>
        ))}
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
            Möbelmontage anfragen
          </h2>
          <p className='mb-5 font-body text-sm text-gray-300'>
            Fotos Ihrer Möbel helfen uns, Aufwand und Termin schneller einzuschätzen.
          </p>
          <ContactForm dark />
        </div>
        <div className='flex flex-col gap-6 text-center lg:text-left'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight'>
            <span className='text-primary'>Möbel Ab- & Aufbau</span> Service –
            schnell & sicher
          </h1>
          <p className='font-body text-gray-300 text-lg'>
            Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel
            professionell, zuverlässig und ohne Kratzer.
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
const ProcessSection = () => (
  <section className='py-20 bg-navy' id='ablauf'>
    <div className='container mx-auto px-4'>
      <div className='mb-12 text-center'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-white'>
          So läuft Ihre Möbelmontage ab
        </h2>
        <p className='font-body text-gray-300 mt-3 max-w-xl mx-auto'>
          Von der Anfrage bis zum perfekt aufgebauten Möbelstück – schnell,
          sauber und stressfrei.
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
            Jetzt Angebot anfordern
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
            src='/images/Umzugsunternhemen_olpe.png'
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
