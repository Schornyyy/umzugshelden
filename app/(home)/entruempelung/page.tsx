import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import ServiceSchema from "@/components/ServiceSchema";
import { FAQType } from "@/types/utils/FAQType";
import {
  CheckIcon,
  MailIcon,
  PhoneIcon,
  Trash2Icon,
  HomeIcon,
  TruckIcon,
  RecycleIcon,
  KeyIcon,
  WarehouseIcon,
  SearchIcon,
  ClipboardListIcon,
  PackageOpenIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Entrümpelung Olpe & 30 km Umkreis — Schnell & günstig | Umzugshelden",
    description:
      "Professionelle Entrümpelung in Olpe und 30 km Umkreis: Wohnungsentrümpelung, Haushaltsauflösung, Kellerentrümpelung – faire Festpreise, besenreine Übergabe. Jetzt kostenloses Angebot anfordern!",
    keywords: [
      "Entrümpelung Olpe",
      "Haushaltsauflösung Olpe",
      "Wohnungsentrümpelung Kreis Olpe",
      "Entrümpelung Attendorn",
      "Kellerentrümpelung Olpe",
      "Sperrmüll Olpe",
      "Entrümpelung Sauerland",
      "Haushaltsauflösung nach Todesfall Olpe",
    ],
    openGraph: {
      title: "Entrümpelung Olpe & Umgebung | Umzugshelden",
      description:
        "Schnelle, diskrete und günstige Entrümpelung im Kreis Olpe und 30 km Umkreis – mit besenreiner Übergabe.",
      url: "https://umzugshelden.de/entrümpelung",
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: "https://umzugshelden.de/entrümpelung",
    },
  };
}

const faqs: FAQType[] = [
  {
    question: "Was kostet eine Entrümpelung in Olpe?",
    answer:
      "Die Kosten richten sich nach Umfang, Menge und Art der zu entsorgenden Gegenstände. Nach einer kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot – ohne versteckte Nachkosten. In vielen Fällen kann der Wert verwertbarer Gegenstände verrechnet werden.",
  },
  {
    question: "Wie schnell könnt ihr mit der Entrümpelung beginnen?",
    answer:
      "In dringenden Fällen – z. B. nach einem Todesfall oder bei Wohnungsübergaben – können wir oft innerhalb weniger Tage einen Termin anbieten. Kontaktieren Sie uns, wir finden gemeinsam eine schnelle Lösung.",
  },
  {
    question: "Was passiert mit noch verwertbaren Gegenständen?",
    answer:
      "Gut erhaltene Möbel, Kleidung und Haushaltsgegenstände werden nach Möglichkeit gespendet oder an Secondhand-Läden weitergegeben. Wertvolle Gegenstände werden Ihnen vorab gezeigt und können verrechnet werden.",
  },
  {
    question: "Macht ihr auch Haushaltsauflösungen nach einem Todesfall?",
    answer:
      "Ja, und das mit besonderer Diskretion und Sensibilität. Wir wissen, dass solche Situationen emotional belastend sind, und gehen respektvoll mit dem Nachlass um. Geben Sie uns einfach Bescheid – wir nehmen uns die Zeit, die Sie brauchen.",
  },
  {
    question: "Wird die Wohnung nach der Entrümpelung besenrein übergeben?",
    answer:
      "Ja, zur besenreinen Übergabe gehört bei uns der Standard. Auf Wunsch bieten wir auch eine Grundreinigung als Zusatzleistung an, damit Sie die Wohnung direkt übergeben oder weitervermieten können.",
  },
  {
    question: "Entsorgt ihr auch Sondermüll oder Elektrogeräte?",
    answer:
      "Ja, wir entsorgen alte Elektrogeräte, Farben, Lacke und andere Sonderabfälle fachgerecht und gemäß den gesetzlichen Vorschriften. Sprechen Sie uns auf besondere Gegenstände an.",
  },
];

const services = [
  {
    icon: <HomeIcon className="text-primary" size={32} />,
    title: "Wohnungsentrümpelung",
    text: "Wir räumen Wohnungen jeder Größe komplett frei – schnell, gründlich und zu einem fairen Festpreis inklusive besenreiner Übergabe.",
  },
  {
    icon: <PackageOpenIcon className="text-primary" size={32} />,
    title: "Haushaltsauflösung",
    text: "Komplette Haushaltsauflösungen – auch nach einem Todesfall oder Umzug ins Pflegeheim. Diskret, respektvoll und strukturiert.",
  },
  {
    icon: <WarehouseIcon className="text-primary" size={32} />,
    title: "Keller- & Dachbodenentrümpelung",
    text: "Jahrzehntealte Ansammlungen in Keller, Dachboden oder Garage werden vollständig geräumt und ordnungsgemäß entsorgt.",
  },
  {
    icon: <TruckIcon className="text-primary" size={32} />,
    title: "Gewerbeentrümpelung",
    text: "Lager, Büros und Geschäftsräume werden professionell und termingerecht geräumt – auch außerhalb der Geschäftszeiten.",
  },
  {
    icon: <RecycleIcon className="text-primary" size={32} />,
    title: "Umweltgerechte Entsorgung",
    text: "Alle Gegenstände werden sortenrein getrennt, verwertbare Materialien recycelt und Sondermüll fachgerecht entsorgt.",
  },
  {
    icon: <Trash2Icon className="text-primary" size={32} />,
    title: "Sperrmüll & Großentsorgung",
    text: "Einzelne Möbel, Haushaltsgeräte oder größere Mengen Sperrmüll – wir holen alles ab und sorgen für die korrekte Entsorgung.",
  },
];

const steps = [
  {
    number: "01",
    icon: <SearchIcon className="text-primary" size={28} />,
    title: "Kostenlose Besichtigung vor Ort",
    text: "Wir kommen zu Ihnen und verschaffen uns ein genaues Bild vom Umfang. Das dauert in der Regel 20–30 Minuten und ist vollständig kostenlos und unverbindlich.",
    detail: "Auch kurzfristig möglich.",
  },
  {
    number: "02",
    icon: <ClipboardListIcon className="text-primary" size={28} />,
    title: "Verbindliches Festpreisangebot",
    text: "Sie erhalten noch am selben Tag oder innerhalb von 24 Stunden ein schriftliches Angebot. Darin sind alle Leistungen aufgeführt – inklusive Entsorgungskosten. Der Preis gilt.",
    detail: "Keine bösen Überraschungen.",
  },
  {
    number: "03",
    icon: <Trash2Icon className="text-primary" size={28} />,
    title: "Professionelle Entrümpelung",
    text: "Unser Team räumt alles systematisch aus – zügig, sorgfältig und ohne Beschädigungen an der Bausubstanz. Wertgegenstände werden Ihnen vorab zur Ansicht vorgelegt.",
    detail: "Wir arbeiten strukturiert und respektvoll.",
  },
  {
    number: "04",
    icon: <RecycleIcon className="text-primary" size={28} />,
    title: "Entsorgung, Verwertung & Spende",
    text: "Gut erhaltene Gegenstände gehen an Sozialkaufhäuser oder werden wiederverwertet. Der Rest wird sortenrein getrennt und umweltgerecht entsorgt – der Wert kann verrechnet werden.",
    detail: "Nachhaltig und fair.",
  },
  {
    number: "05",
    icon: <KeyIcon className="text-primary" size={28} />,
    title: "Besenreine Übergabe",
    text: "Nach der Entrümpelung kehren wir alle Räume durch und geben sie besenrein an Sie zurück. Auf Wunsch organisieren wir auch eine anschließende Grundreinigung.",
    detail: "Direkt übergabefertig.",
  },
];

const whys = [
  {
    title: "Faire Festpreise – keine Nachforderungen",
    text: "Der vereinbarte Preis gilt. Keine Überraschungen auf der Rechnung.",
  },
  {
    title: "Schnelle Terminvergabe – auch kurzfristig",
    text: "Wir wissen, dass Entrümpelungen oft unter Zeitdruck stehen. Wir helfen schnell.",
  },
  {
    title: "Diskretion bei sensiblen Situationen",
    text: "Todesfälle, Zwangsräumungen, Pflegeheimumzüge – wir gehen taktvoll vor.",
  },
  {
    title: "Wertanrechnung möglich",
    text: "Brauchbare Möbel und Gegenstände können den Preis erheblich senken.",
  },
  {
    title: "Umweltgerechte Entsorgung",
    text: "Alles wird korrekt getrennt, recycelt oder spendenbereit weitergegeben.",
  },
  {
    title: "Regional im Kreis Olpe & 30 km Umkreis",
    text: "Wir sind in Olpe, Attendorn, Lennestadt, Drolshagen, Plettenberg und Umgebung vor Ort.",
  },
];

const page = () => {
  return (
    <>
      <ServiceSchema
        name='Entrümpelung im Kreis Olpe'
        serviceType='Entrümpelung und Haushaltsauflösung'
        description='Professionelle Entrümpelung und Haushaltsauflösung im Kreis Olpe mit Wertanrechnung, Entsorgung und besenreiner Übergabe.'
        path='/entruempelung'
      />
      <div className="flex flex-col">
        <Hero />
        <IntroSection />
        <ServicesSection />
        <ProcessSection />
        <WhySection />
        <FAQBlock faqs={faqs} title="Häufige Fragen zur Entrümpelung" />
        <ContactSection />
      </div>
    </>
  );
};

export default page;

/* ─── HERO ─── */
const Hero = () => (
  <section
    className="relative min-h-[600px] flex items-center"
    style={{
      backgroundImage: "url('/images/Umzugsunternehmen_Olpe.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
    <div className="absolute inset-0 bg-navy/85" />
    <div className="relative z-10 container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="border border-white/10 bg-[#0b1f3a] p-6 shadow-2xl rounded lg:p-8">
          <h2 className="mb-3 font-sans text-xl font-semibold text-white">
            Entrümpelung anfragen
          </h2>
          <p className="mb-5 font-body text-sm text-gray-300">
            Teilen Sie uns Umfang und Wunschtermin mit – Bilder helfen bei der ersten Einschätzung.
          </p>
          <ContactForm dark />
        </div>
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <h1 className="font-sans font-bold text-4xl md:text-6xl text-white leading-tight">
            <span className="text-primary">Entrümpelung</span> in Olpe &amp; 30 km
            Umkreis
          </h1>
          <p className="font-body text-gray-300 text-lg">
            Wohnungsentrümpelung, Haushaltsauflösung oder Kellerentrümpelung –
            Umzugshelden erledigen das zuverlässig, diskret und zu fairen
            Festpreisen im Kreis Olpe und der gesamten Umgebung.
          </p>
          <div>
            <Link href="#leistungen">
              <Button
                variant="outline"
                className="font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold text-base">
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
  <section className="py-16 bg-white">
    <div className="container mx-auto px-4 max-w-3xl text-center">
      <p className="font-body text-gray-600 text-lg leading-relaxed">
        Eine Entrümpelung ist oft mehr als nur aufräumen – sie steht für einen
        Neuanfang, eine Erbschaft oder den Abschluss eines Lebensabschnitts. Die{" "}
        <strong className="text-navy">Umzugshelden</strong> erledigen das für
        Sie: schnell, gründlich und mit dem nötigen Fingerspitzengefühl – im{" "}
        <strong className="text-navy">Kreis Olpe und einem 30-km-Umkreis</strong>.
      </p>
    </div>
  </section>
);

/* ─── SERVICES ─── */
const ServicesSection = () => (
  <section className="py-20 bg-gray-50" id="leistungen">
    <div className="container mx-auto px-4">
      <div className="mb-12">
        <h2 className="font-sans font-bold text-3xl md:text-4xl text-navy">
          Unsere Entrümpelungsleistungen
        </h2>
        <p className="font-body text-gray-600 mt-3">
          Von der einzelnen Kellerkammer bis zur kompletten Haushaltsauflösung.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((s) => (
          <div
            key={s.title}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-4">
            {s.icon}
            <h3 className="font-sans font-semibold text-xl text-navy">
              {s.title}
            </h3>
            <p className="font-body text-gray-600 text-sm leading-relaxed">
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
  <section className="py-20 bg-navy" id="ablauf">
    <div className="container mx-auto px-4">
      <div className="mb-12 text-center">
        <h2 className="font-sans font-bold text-3xl md:text-4xl text-white">
          So läuft Ihre Entrümpelung ab
        </h2>
        <p className="font-body text-gray-300 mt-3 max-w-xl mx-auto">
          Strukturiert, transparent und ohne Stress – von der Besichtigung bis
          zur besenreinen Übergabe.
        </p>
      </div>
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className="grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-0.5 h-12 bg-primary/30 hidden lg:block" />
              )}
            </div>
            <div className="pb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-sans font-black text-3xl text-primary/30 leading-none">
                  {step.number}
                </span>
                <h3 className="font-sans font-semibold text-xl text-white">
                  {step.title}
                </h3>
              </div>
              <p className="font-body text-gray-300 leading-relaxed">
                {step.text}
              </p>
              <p className="font-body text-primary text-sm mt-2 font-medium">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link href="#kontakt">
          <Button className="font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold text-base">
            Jetzt Besichtigung vereinbaren
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ─── WHY ─── */
const WhySection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6">
          <h2 className="font-sans font-bold text-3xl md:text-4xl text-navy leading-tight">
            Warum Kunden in Olpe uns vertrauen
          </h2>
          <p className="font-body text-gray-600 leading-relaxed">
            Eine Entrümpelung braucht ein Team, das nicht nur zügig arbeitet,
            sondern auch mit dem nötigen Respekt vorgeht. Genau das bieten wir.
          </p>
          <div className="flex flex-col gap-4">
            {whys.map((w) => (
              <div key={w.title} className="flex gap-3 items-start">
                <CheckIcon
                  className="text-primary flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <p className="font-sans font-semibold text-navy">{w.title}</p>
                  <p className="font-body text-gray-600 text-sm">{w.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="#kontakt" className="w-fit">
            <Button className="font-sans bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold">
              Jetzt anfragen
            </Button>
          </Link>
        </div>
        <div className="rounded-xl overflow-hidden shadow-xl">
          <Image
            src="/images/Umzugsunternhemen_olpe.png"
            alt="Entrümpelung Umzugshelden Olpe"
            width={700}
            height={500}
            className="w-full object-cover"
          />
        </div>
      </div>
    </div>
  </section>
);

/* ─── CONTACT ─── */
const ContactSection = () => (
  <section className="py-16 bg-navy" id="kontakt">
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col gap-6">
          <h2 className="font-sans font-bold text-3xl text-white">
            Kostenloses Angebot für Ihre Entrümpelung
          </h2>
          <p className="font-body text-gray-300">
            Füllen Sie das Formular aus und wir melden uns innerhalb von 24
            Stunden mit einem unverbindlichen Angebot bei Ihnen.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <PhoneIcon className="text-primary flex-shrink-0" size={20} />
              <Link
                href="tel:+4915168567708"
                className="font-body text-gray-300 hover:text-primary transition-colors">
                +49 151 68567708
              </Link>
            </div>
            <div className="flex gap-3 items-center">
              <MailIcon className="text-primary flex-shrink-0" size={20} />
              <Link
                href="mailto:info@umzugshelden.io"
                className="font-body text-gray-300 hover:text-primary transition-colors">
                info@umzugshelden.io
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <ContactForm />
        </div>
      </div>
    </div>
  </section>
);