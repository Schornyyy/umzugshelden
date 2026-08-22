import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import ServiceSchema from "@/components/ServiceSchema";
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
  ClipboardListIcon,
  SearchIcon,
  ThumbsUpIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Umzugsservice Kreis Olpe — Professionell & günstig | Umzugshelden",
    description:
      "Umzugshelden bietet professionellen Umzugsservice im Kreis Olpe und 30 km Umkreis: Wohnungsumzug, Firmenumzug – mit persönlicher Beratung, Festpreis und erfahrenem Team. Jetzt kostenloses Angebot anfordern!",
    openGraph: {
      title: "Umzugsservice Kreis Olpe | Umzugshelden",
      description:
        "Professioneller Umzugsservice – vom ersten Karton bis zum letzten Möbelstück. Faire Preise, zuverlässiges Team.",
      url: "https://umzugshelden.de/umzugsservice",
    },
    alternates: {
      canonical: "https://umzugshelden.de/umzugsservice",
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Was kostet ein Umzug mit Umzugshelden?",
    answer:
      "Die Kosten hängen von Umfang, Entfernung und Leistungspaket ab. Wir erstellen Ihnen nach einer kostenlosen Beratung ein verbindliches Festpreisangebot – ohne versteckte Zusatzkosten. Typische Faktoren: Wohnungsgröße, Stockwerk, Entfernung, ob Möbelmontage und Verpackungsservice gewünscht sind.",
  },
  {
    question: "Wie weit im Voraus soll ich meinen Umzug buchen?",
    answer:
      "Wir empfehlen 4–6 Wochen Vorlauf, besonders für Wochenenden und Monatsenden. Für kurzfristige Umzüge versuchen wir immer eine Lösung zu finden – sprechen Sie uns an.",
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
  {
    question: "Was muss ich selbst vor dem Umzug vorbereiten?",
    answer:
      "Im Idealfall sind Kleinigkeiten wie persönliche Dokumente, Wertgegenstände und zerbrechliche Einzelstücke vorab gesichert. Den Rest übernehmen wir: Verpacken, Demontage, Transport, Montage. Wir besprechen die Details gemeinsam in der Vorab-Beratung.",
  },
  {
    question: "Macht ihr auch Firmenumzüge außerhalb der Geschäftszeiten?",
    answer:
      "Ja, wir bieten auch Umzüge abends und am Wochenende an, um den Geschäftsbetrieb minimal zu unterbrechen. Sprechen Sie uns auf Ihre Anforderungen an – wir finden eine Lösung.",
  },
  {
    question: "Was passiert, wenn beim Transport etwas beschädigt wird?",
    answer:
      "Wir arbeiten mit größter Sorgfalt, doch im unwahrscheinlichen Fall eines Schadens greift unsere Transportversicherung. Wir dokumentieren den Zustand Ihrer Möbel vor dem Transport und kümmern uns bei Bedarf schnell um Ersatz oder Reparatur.",
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
    text: "Wir sind im Kreis Olpe und einem 30 km Umkreis für Sie da – pünktlich, zuverlässig und zu fairen Festpreisen.",
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
  {
    icon: <ShieldCheckIcon className='text-primary' size={32} />,
    title: "Versicherter Transport",
    text: "Alle Transporte sind durch unsere Transportversicherung abgedeckt. Ihr Eigentum ist bei uns in sicheren Händen.",
  },
];

const steps = [
  {
    number: "01",
    icon: <SearchIcon className='text-primary' size={28} />,
    title: "Kostenlose Beratung & Besichtigung",
    text: "Wir kommen zu Ihnen nach Hause oder besprechen alles telefonisch. Gemeinsam erfassen wir den genauen Umfang – wie viele Zimmer, welche Möbel, besondere Gegenstände wie Klaviere oder Tresore.",
    detail: "In der Regel dauert das 20–30 Minuten.",
  },
  {
    number: "02",
    icon: <ClipboardListIcon className='text-primary' size={28} />,
    title: "Verbindliches Festpreisangebot",
    text: "Sie erhalten innerhalb von 24 Stunden ein schriftliches Festpreisangebot. Keine bösen Überraschungen – der vereinbarte Preis gilt. Darin enthalten sind alle Leistungen, die wir gemeinsam besprochen haben.",
    detail: "Transparent, fair und ohne versteckte Kosten.",
  },
  {
    number: "03",
    icon: <PackageIcon className='text-primary' size={28} />,
    title: "Vorbereitung & Verpackung",
    text: "Unser Team kommt – wenn gewünscht – bereits am Vortag zum Verpacken. Wir bringen professionelles Packmaterial mit: Kartons, Luftpolsterfolie, Möbeldecken und Spezialverpackungen für Gläser und Bilder.",
    detail: "Optional buchbarer Komplettservice.",
  },
  {
    number: "04",
    icon: <TruckIcon className='text-primary' size={28} />,
    title: "Umzugstag: Transport & Einzug",
    text: "Pünktlich zum vereinbarten Termin erscheint unser Team. Möbel werden demontiert, gesichert und im modernen Fahrzeug transportiert. Am Zielort werden alles wieder aufgebaut und auf Wunsch eingeräumt.",
    detail: "Sie müssen keinen Finger rühren.",
  },
  {
    number: "05",
    icon: <ThumbsUpIcon className='text-primary' size={28} />,
    title: "Abnahme & Abschluss",
    text: "Gemeinsam gehen wir nach dem Einzug alle Räume durch. Erst wenn Sie vollständig zufrieden sind, ist der Auftrag abgeschlossen. Rückmeldungen nehmen wir direkt entgegen und reagieren sofort.",
    detail: "Ihre Zufriedenheit ist unser Maßstab.",
  },
];

const whys = [
  {
    title: "Festpreisangebot ohne versteckte Kosten",
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
  {
    title: "Persönliche Beratung vor Ort",
    text: "Kein anonymes Callcenter – Sie haben immer einen festen Ansprechpartner bei uns.",
  },
];

const included = [
  "Be- und Entladen des Umzugswagens",
  "Professionelle Umzugsdecken & Sicherungsmaterial",
  "Möbeldemontage und -montage",
  "Transport zum Zielort im Kreis Olpe & 30 km",
  "Einräumen nach Ihren Wünschen",
  "Entsorgung von Verpackungsmaterial",
];

const page = () => {
  return (
    <>
      <ServiceSchema
        name='Umzugsservice im Kreis Olpe'
        serviceType='Umzugsservice'
        description='Professioneller Umzugsservice im Kreis Olpe und 30 km Umkreis: Wohnungsumzug, Firmenumzug, Verpackung, Transport und Möbelmontage zum Festpreis.'
        path='/umzugsservice'
      />
      <div className='flex flex-col'>
        <Hero />
        <IntroSection />
        <ServicesSection />
        <ProcessSection />
        <IncludedSection />
        <WhySection />
        <FAQBlock faqs={faqs} title='Häufige Fragen zum Umzugsservice' />
        <ContactSection />
      </div>
    </>
  );
};

export default page;

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
            Kostenlosen Umzug anfragen
          </h2>
          <p className='mb-5 font-body text-sm text-gray-300'>
            In wenigen Schritten zu Ihrem unverbindlichen Angebot.
          </p>
          <ContactForm dark />
        </div>
        <div className='flex flex-col gap-6 text-center lg:text-left'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight'>
            Professioneller <span className='text-primary'>Umzugsservice</span> im
            Kreis Olpe
          </h1>
          <p className='font-body text-gray-300 text-lg'>
            Wohnungsumzug, Firmenumzug oder Umzug innerhalb der Region – die
            Umzugshelden packen an. Mit erfahrenem Team, modernem Fuhrpark und
            fairem Festpreis im Kreis Olpe und 30 km Umkreis.
          </p>
          <div>
            <Link href='#ablauf'>
              <Button
                variant='outline'
                className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold text-base'>
                Ablauf ansehen
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
        Ein Umzug ist mehr als nur Möbel von A nach B transportieren – er ist
        ein neuer Lebensabschnitt. Genau deshalb nehmen wir ihn ernst. Als Ihr
        zuverlässiger{" "}
        <strong className='text-navy'>Umzugsservice im Kreis Olpe</strong>{" "}
        sorgen wir dafür, dass alles reibungslos läuft: von der ersten Beratung
        über den sicheren Transport bis zum Aufbau in Ihrem neuen Zuhause – im
        gesamten Kreis Olpe und einem Umkreis von 30 km.
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

/* ─── PROCESS ─── */
const ProcessSection = () => (
  <section className='py-20 bg-navy' id='ablauf'>
    <div className='container mx-auto px-4'>
      <div className='mb-12 text-center'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-white'>
          So läuft Ihr Umzug mit uns ab
        </h2>
        <p className='font-body text-gray-300 mt-3 max-w-xl mx-auto'>
          Von der ersten Anfrage bis zum letzten Karton – transparent, planbar
          und ohne Überraschungen.
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

/* ─── INCLUDED ─── */
const IncludedSection = () => (
  <section className='py-16 bg-white'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
        <div className='rounded-xl overflow-hidden shadow-xl'>
          <Image
            src='/images/Umzugsunternhemen_olpe.png'
            alt='Umzugshelden im Einsatz'
            width={700}
            height={480}
            className='w-full object-cover'
          />
        </div>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Was ist im Standardumzug enthalten?
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Unser Standardpaket deckt alles ab, was Sie für einen reibungslosen
            Umzugstag brauchen. Zusatzleistungen wie Verpackungsservice oder
            Haushaltsauflösung können flexibel dazugebucht werden.
          </p>
          <div className='flex flex-col gap-3'>
            {included.map((item) => (
              <div key={item} className='flex gap-3 items-center'>
                <CheckIcon className='text-primary flex-shrink-0' size={20} />
                <p className='font-body text-gray-700'>{item}</p>
              </div>
            ))}
          </div>
          <div className='bg-gray-50 rounded-xl p-5 border border-gray-100 mt-2'>
            <p className='font-sans font-semibold text-navy text-sm mb-1'>
              Hinweis zum Festpreis
            </p>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              Alle Leistungen werden vorab besprochen und schriftlich im Angebot
              festgehalten. Nachträgliche Mehrkosten entstehen nur, wenn Sie
              zusätzliche Leistungen während des Umzugs beauftragen.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─── WHY ─── */
const WhySection = () => (
  <section className='py-20 bg-gray-50'>
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
        <div className='grid grid-cols-2 gap-4'>
          {[
            { value: "30 km", label: "Einsatzgebiet rund um Olpe" },
            { value: "24 h", label: "Antwortzeit auf Anfragen" },
            { value: "100%", label: "Festpreisgarantie" },
            { value: "5 ★", label: "Kundenbewertungen" },
          ].map((stat) => (
            <div
              key={stat.value}
              className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col gap-1 text-center'>
              <span className='font-sans font-bold text-3xl text-primary'>
                {stat.value}
              </span>
              <span className='font-body text-gray-600 text-xs leading-snug'>
                {stat.label}
              </span>
            </div>
          ))}
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
