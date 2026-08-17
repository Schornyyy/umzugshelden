import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import {
  CheckIcon,
  MailIcon,
  PhoneIcon,
  HeartHandshakeIcon,
  PackageIcon,
  TruckIcon,
  WrenchIcon,
  ShieldCheckIcon,
  HandshakeIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title:
      "Seniorenumzug Olpe & 30 km Umkreis — Einfühlsam & zuverlässig | Umzugshelden",
    description:
      "Professioneller Seniorenumzug in Olpe und 30 km Umkreis: Umzugshelden begleiten Senioren mit Geduld und Sorgfalt – vom Einpacken bis zur Einrichtung im neuen Zuhause. Jetzt kostenloses Angebot anfordern!",
    keywords: [
      "Seniorenumzug Olpe",
      "Umzug Senioren Olpe",
      "Seniorenumzug Attendorn",
      "Umzug Pflegeheim Olpe",
      "Seniorenumzug Sauerland",
      "Haushaltsauflösung Olpe",
      "Umzugsservice für Senioren",
      "Umzug ältere Menschen Kreis Olpe",
    ],
    openGraph: {
      title: "Seniorenumzug Olpe & Umgebung | Umzugshelden",
      description:
        "Einfühlsamer Seniorenumzug im Kreis Olpe und 30 km Umkreis – mit Geduld, Erfahrung und Rundum-Service.",
      url: "https://umzugshelden.de/senior-umzug",
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: "https://umzugshelden.de/senior-umzug",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Was kostet ein Seniorenumzug mit Umzugshelden?",
    answer:
      "Die Kosten hängen vom Umfang, der Entfernung und den gewünschten Leistungen ab. Wir erstellen Ihnen gern ein kostenloses und unverbindliches Festpreisangebot nach einer kurzen Beratung – ohne versteckte Zusatzkosten.",
  },
  {
    question: "Helft ihr auch beim Ein- und Auspacken?",
    answer:
      "Ja! Unser Komplettservice für Senioren beinhaltet auf Wunsch das fachgerechte Verpacken aller Gegenstände im alten Zuhause sowie das Auspacken und Einräumen im neuen Zuhause. So müssen Sie sich um nichts kümmern.",
  },
  {
    question:
      "Führt ihr auch Umzüge ins Pflegeheim oder betreutes Wohnen durch?",
    answer:
      "Ja, wir sind auf Umzüge in Pflegeheime, Seniorenresidenzen und Einrichtungen für betreutes Wohnen spezialisiert. Wir koordinieren den Ablauf gerne auch direkt mit der Einrichtung.",
  },
  {
    question: "Wie geht ihr mit wertvollen Erinnerungsstücken um?",
    answer:
      "Mit größter Sorgfalt und Respekt. Jeder Gegenstand – egal wie klein – wird von uns mit der gleichen Sorgfalt behandelt. Wir nehmen uns die Zeit, die nötig ist, damit nichts verloren geht oder beschädigt wird.",
  },
  {
    question: "Könnt ihr auch bei der Haushaltsauflösung helfen?",
    answer:
      "Ja! Wir helfen bei der Entrümpelung und Haushaltsauflösung – von der Wertermittlung über die geordnete Entnahme bis zur Entsorgung oder Weitergabe von Möbeln und Gegenständen an soziale Einrichtungen.",
  },
  {
    question: "Wie weit im Voraus sollte ich einen Seniorenumzug buchen?",
    answer:
      "Wir empfehlen mindestens 4–6 Wochen Vorlauf, damit wir genügend Zeit für eine sorgfältige Planung haben. Bei kurzfristigen Situationen – z. B. nach einem Krankenhausaufenthalt – versuchen wir immer schnellstmöglich zu helfen.",
  },
];

const services = [
  {
    icon: <TruckIcon className='text-primary' size={32} />,
    title: "Komplettumzug für Senioren",
    text: "Von der ersten Beratung bis zum letzten Karton im neuen Zuhause – wir übernehmen den gesamten Umzugsprozess und begleiten Sie Schritt für Schritt.",
  },
  {
    icon: <PackageIcon className='text-primary' size={32} />,
    title: "Sanftes Ein- & Auspacken",
    text: "Wir verpacken Ihre Habseligkeiten mit größter Sorgfalt und packen alles im neuen Zuhause wieder aus – damit Sie sofort heimisch werden können.",
  },
  {
    icon: <WrenchIcon className='text-primary' size={32} />,
    title: "Möbelauf- & abbau",
    text: "Wir bauen Ihre Möbel fachgerecht ab und im neuen Zimmer wieder auf – schnell, präzise und ohne Kratzer.",
  },
  {
    icon: <HeartHandshakeIcon className='text-primary' size={32} />,
    title: "Umzug ins Pflegeheim",
    text: "Behutsamer Umzug in Pflegeheime oder betreutes Wohnen – wir koordinieren alles und sorgen dafür, dass der Übergang so angenehm wie möglich ist.",
  },
  {
    icon: <ShieldCheckIcon className='text-primary' size={32} />,
    title: "Haushaltsauflösung",
    text: "Wir helfen beim Auflösen eines Haushalts – geordnet, respektvoll und transparent. Möbel werden entsorgt oder an soziale Einrichtungen weitergegeben.",
  },
  {
    icon: <HandshakeIcon className='text-primary' size={32} />,
    title: "Persönliche Begleitung",
    text: "Auf Wunsch begleiten wir Sie oder Ihre Angehörigen persönlich durch den gesamten Umzugstag – für ein sicheres und ruhiges Gefühl.",
  },
];

const whys = [
  {
    title: "Einfühlsam und geduldig",
    text: "Wir wissen, dass ein Umzug im Alter emotional belastend sein kann. Unser Team nimmt sich die Zeit, die Sie brauchen.",
  },
  {
    title: "Erfahrenes Team",
    text: "Unsere Mitarbeiter sind im Umgang mit älteren Menschen geschult und gehen auf individuelle Bedürfnisse ein.",
  },
  {
    title: "Alles aus einer Hand",
    text: "Planung, Verpacken, Transport, Aufbau – Sie haben einen Ansprechpartner für alles.",
  },
  {
    title: "Feste Preise – keine Überraschungen",
    text: "Sie erhalten ein transparentes Angebot mit Festpreis. So wissen Ihre Familie und Sie genau, was auf Sie zukommt.",
  },
  {
    title: "Regional im Kreis Olpe & 30 km Umkreis",
    text: "Wir sind in Olpe, Attendorn, Lennestadt, Finnentrop, Drolshagen, Wenden, Plettenberg, Schmallenberg und Umgebung für Sie da.",
  },
];

const steps = [
  {
    number: "01",
    title: "Kostenlose Beratung",
    text: "Wir kommen gerne zu Ihnen nach Hause oder besprechen alles telefonisch. Gemeinsam erfassen wir Ihren Umzugsbedarf und erstellen ein individuelles Angebot.",
  },
  {
    number: "02",
    title: "Planung & Vorbereitung",
    text: "Unser Team plant den Umzug detailliert und kümmert sich um alle Vorbereitungen – von der Materialbeschaffung bis zur Koordination mit der Zieladresse.",
  },
  {
    number: "03",
    title: "Professionelles Einpacken",
    text: "Wir packen alles sicher und sorgfältig ein – Geschirr, Bilder, Erinnerungsstücke und Möbel. Nichts wird vergessen, nichts wird beschädigt.",
  },
  {
    number: "04",
    title: "Transport & Einzug",
    text: "Mit unserem modernen Fuhrpark transportieren wir Ihren gesamten Hausstand sicher ans Ziel. Im neuen Zuhause bauen wir alles auf und räumen ein.",
  },
];

const page = () => {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Umzugshelden",
    url: "https://umzugshelden.de",
    telephone: "+4915168567708",
    email: "info@umzugshelden.io",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Olpe",
      addressRegion: "Nordrhein-Westfalen",
      addressCountry: "DE",
    },
    areaServed: [
      "Olpe",
      "Attendorn",
      "Lennestadt",
      "Finnentrop",
      "Kirchhundem",
      "Drolshagen",
      "Wenden",
      "Plettenberg",
      "Schmallenberg",
      "Kreuztal",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Seniorenumzug",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Seniorenumzug Olpe",
            description:
              "Professioneller und einfühlsamer Umzugsservice für Senioren im Kreis Olpe und 30 km Umkreis.",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <div className='flex flex-col'>
        <Hero />
        <IntroSection />
        <ChallengesSection />
        <ServicesSection />
        <ProcessSection />
        <ChecklistSection />
        <WhySection />
        <FAQBlock faqs={faqs} title='Häufige Fragen zum Seniorenumzug' />
        <ContactSection />
      </div>
    </>
  );
};

export default page;

/* ─── CHALLENGES ─── */
const challenges = [
  {
    title: "Emotionale Verbundenheit",
    text: "Viele Senioren wohnen seit Jahrzehnten in ihrem Zuhause. Das Loslassen von vertrauten Räumen und Gegenständen ist emotional eine große Herausforderung. Unser Team nimmt sich die Zeit, die es dafür braucht.",
  },
  {
    title: "Körperliche Einschränkungen",
    text: "Schwere Möbel, Treppen ohne Aufzug, lange Wege – körperlich anstrengende Umzüge sind für ältere Menschen oft schlicht nicht möglich. Wir übernehmen die schwere Arbeit vollständig.",
  },
  {
    title: "Koordination mit Familie & Einrichtung",
    text: "Beim Umzug ins betreute Wohnen oder Pflegeheim müssen viele Seiten koordiniert werden. Wir stimmen uns gern direkt mit Angehörigen und der Einrichtung ab, damit der Übergang reibungslos klappt.",
  },
  {
    title: "Jahrzehnte an Hausrat",
    text: "In einem langen Leben sammeln sich viele Dinge an. Wir helfen Ihnen dabei, Wichtiges sicher mitzunehmen und Nicht-Mehr-Gebrauchtes respektvoll zu entsorgen oder zu spenden – nichts überstürzt.",
  },
  {
    title: "Orientierung im neuen Zuhause",
    text: "Damit Sie sich vom ersten Tag an wohlfühlen, richten wir Ihr neues Zuhause so ein, wie Sie es kennen. Vertraute Gegenstände an gewohnten Plätzen geben Sicherheit und Heimgefühl.",
  },
  {
    title: "Zeitdruck durch Wohnungsübergabe",
    text: "Oft steht ein konkreter Übergabetermin fest. Wir planen den Umzug so, dass alles termingerecht und ohne Panik abgeführt wird – auch wenn der Zeitrahmen eng ist.",
  },
];

const ChallengesSection = () => (
  <section className='py-16 bg-gray-50'>
    <div className='container mx-auto px-4'>
      <div className='mb-10'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy'>
          Warum ein Seniorenumzug besondere Sorgfalt braucht
        </h2>
        <p className='font-body text-gray-600 mt-3 max-w-2xl'>
          Ein Umzug im Alter ist keine gewöhnliche Dienstleistung. Diese
          Herausforderungen kennen wir – und gehen gezielt darauf ein.
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {challenges.map((c) => (
          <div
            key={c.title}
            className='bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3'>
            <h3 className='font-sans font-semibold text-navy'>{c.title}</h3>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CHECKLIST ─── */
const checklistItems = [
  { timing: "6 Wochen vorher", task: "Professionellen Umzugsdienst beauftragen und Termin festlegen" },
  { timing: "4 Wochen vorher", task: "Neue Adresse bei Behörden, Kranken- und Pflegeversicherung ummelden" },
  { timing: "4 Wochen vorher", task: "Nachsendeauftrag bei der Post einrichten" },
  { timing: "3 Wochen vorher", task: "Arzt, Apotheke, Bank und Versorger informieren" },
  { timing: "2 Wochen vorher", task: "Grundriss des neuen Zimmers/Wohnung besorgen für Einrichtungsplanung" },
  { timing: "1 Woche vorher", task: "Liebste Gegenstände, Fotos und Dokumente separat und griffbereit sichern" },
  { timing: "Am Umzugstag", task: "Essenzielle Erstausstattung (Medikamente, Kläimungstück, Zahnbürste) separat verpacken" },
  { timing: "Nach dem Einzug", task: "Neue Umgebung gemeinsam erkunden und Lieblingsplätze einrichten" },
];

const ChecklistSection = () => (
  <section className='py-16 bg-white'>
    <div className='container mx-auto px-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
        <div className='flex flex-col gap-6'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy leading-tight'>
            Checkliste für Angehörige: Was frühzeitig zu regeln ist
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Wenn Sie einen Seniorenumzug für Ihre Eltern oder Großeltern
            organisieren, hilft diese Checkliste dabei, nichts Wichtiges zu
            übersehen. Wir unterstützen Sie gern bei der Planung.
          </p>
          <div className='bg-primary/10 border border-primary/20 rounded-xl p-5'>
            <p className='font-sans font-semibold text-navy text-sm mb-1'>
              Unser Tipp
            </p>
            <p className='font-body text-gray-600 text-sm leading-relaxed'>
              Planen Sie mindestens 6 Wochen Vorlauf ein. Das gibt allen
              Beteiligten genügend Zeit, um ruhig und ohne Stress vorzugehen.
              Bei uns können Sie die Beratung kostenlos und unverbindlich
              anfordern.
            </p>
          </div>
          <Link href='#kontakt' className='w-fit'>
            <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold'>
              Kostenlose Beratung anfordern
            </Button>
          </Link>
        </div>
        <div className='flex flex-col gap-3'>
          {checklistItems.map((item) => (
            <div
              key={item.task}
              className='flex gap-4 items-start bg-gray-50 rounded-xl p-4 border border-gray-100'>
              <div className='flex-shrink-0 bg-primary/10 rounded-lg px-3 py-1 mt-0.5'>
                <span className='font-sans font-semibold text-primary text-xs whitespace-nowrap'>
                  {item.timing}
                </span>
              </div>
              <p className='font-body text-gray-700 text-sm leading-relaxed'>
                {item.task}
              </p>
            </div>
          ))}
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
            Kostenlose Beratung anfordern
          </h2>
          <p className='mb-5 font-body text-sm text-gray-300'>
            Wir nehmen uns Zeit für Ihre Situation und melden uns innerhalb von 24 Stunden.
          </p>
          <ContactForm dark />
        </div>
        <div className='flex flex-col gap-6 text-center lg:text-left'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight'>
            <span className='text-primary'>Seniorenumzug</span> in Olpe &amp; 30 km
            Umkreis
          </h1>
          <p className='font-body text-gray-300 text-lg'>
            Einfühlsam, geduldig und zuverlässig – die Umzugshelden begleiten
            Senioren durch jeden Schritt des Umzugs. Mit Erfahrung, Respekt und
            echtem Herzblut im Kreis Olpe und der gesamten Umgebung.
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
        Ein Umzug im Alter ist mehr als ein Ortswechsel – er bedeutet, ein
        vertrautes Zuhause zu verlassen und Neues zu beginnen. Die{" "}
        <strong className='text-navy'>Umzugshelden</strong> verstehen das. Wir
        begleiten Senioren im{" "}
        <strong className='text-navy'>
          Kreis Olpe und einem 30-km-Umkreis
        </strong>{" "}
        mit Geduld, Sorgfalt und persönlichem Engagement – ob Umzug in eine
        kleinere Wohnung, ins betreute Wohnen oder ins Pflegeheim.
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
          Unsere Leistungen beim Seniorenumzug
        </h2>
        <p className='font-body text-gray-600 mt-3'>
          Alles, was Sie für einen stressfreien Umzug brauchen – aus einer Hand.
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
          So läuft Ihr Seniorenumzug ab
        </h2>
        <p className='font-body text-gray-300 mt-3 max-w-xl mx-auto'>
          Klar strukturiert, transparent und mit Ihnen abgestimmt – damit Sie
          sich von Anfang an sicher und gut aufgehoben fühlen.
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
        {steps.map((step) => (
          <div
            key={step.number}
            className='bg-white/10 rounded-xl p-8 flex flex-col gap-4 border border-white/20'>
            <span className='font-sans font-black text-6xl text-primary/40 leading-none select-none'>
              {step.number}
            </span>
            <h3 className='font-sans font-semibold text-xl text-white'>
              {step.title}
            </h3>
            <p className='font-body text-gray-300 text-sm leading-relaxed'>
              {step.text}
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
            Warum Senioren und ihre Familien uns vertrauen
          </h2>
          <p className='font-body text-gray-600 leading-relaxed'>
            Wir wissen, dass ein Seniorenumzug besondere Anforderungen stellt.
            Unser Team ist einfühlsam, erfahren und nimmt sich die Zeit, die
            jeder Mensch und jede Situation verdient.
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
            alt='Seniorenumzug Umzugshelden Olpe'
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
            Kostenloses Angebot für Ihren Seniorenumzug
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
