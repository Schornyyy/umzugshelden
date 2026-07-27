import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import ContactForm from "@/components/ContactForm";
import { CheckIcon, ClockIcon, MailIcon, PhoneIcon } from "lucide-react";
import Image from "next/image";
import { FAQType } from "@/types/utils/FAQType";
import FAQBlock from "@/components/utils/FAQBlock";

export async function generateMetadata() {
  // Metadaten für Hausmeisterservice Weiß in Mülheim an der Ruhr
  return {
    title:
      "Hausmeisterservice Weiß — Hausmeisterservice in Mülheim an der Ruhr",
    description:
      "Hausmeisterservice Weiß bietet zuverlässige Hausmeisterdienste, Gebäudereinigung und Grundstückspflege in Mülheim an der Ruhr und Umgebung.",
    openGraph: {
      title: "Hausmeisterservice Weiß — Hausmeisterservice Mülheim an der Ruhr",
      description:
        "Zuverlässige Hausmeisterdienste, schnelle Reaktionen und faire Preise. Kontaktieren Sie uns für ein unverbindliches Angebot.",
      url: "https://umzugshelden.io",
      images: [
        {
          url: "/images/fahrzeug.png",
          width: 1200,
          height: 630,
          alt: "Hausmeisterservice Weiß Fahrzeug",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Hausmeisterservice Weiß — Hausmeisterservice Mülheim an der Ruhr",
      description:
        "Zuverlässige Hausmeisterdienste, Gebäudereinigung und Grundstückspflege in Mülheim an der Ruhr.",
      image: "/images/fahrzeug.png",
    },
  };
}

const page = () => {
  const faqs: FAQType[] = [
    {
      answer:
        "Die Kosten richten sich nach Umfang, Häufigkeit und Art der Dienstleistungen. Wir erstellen Ihnen gern ein unverbindliches, maßgeschneidertes Angebot.",
      question: "Was kostet der Hausmeisterservice in Mülheim an der Ruhr?",
    },
    {
      answer:
        "Ja, selbstverständlich. Wir übernehmen auch Einzelaufträge wie Entrümpelungen, Renovierungen oder kurzfristige Winterdiensteinsätze.",
      question:
        "Können auch Einzelaufträge wie Entrümpelungen beauftragt werden?",
    },
    {
      answer:
        "Wir betreuen Mehrfamilienhäuser, Gewerbeimmobilien, Bürogebäude sowie öffentliche Einrichtungen.",
      question: "Welche Objekte betreuen Sie?",
    },
    {
      answer:
        "In der Regel sind kurzfristige Einsätze innerhalb von 24–48 Stunden möglich, je nach Auftragslage.",
      question: "Wie kurzfristig können Termine vergeben werden?",
    },
  ];

  return (
    <div className='flex flex-col'>
      <Hero />
      <InfoSection />
      <ServiceSection />
      <WhySection />
      <ReviewCarousel />
      <FAQBlock
        faqs={faqs}
        title='Häufige Fragen zur Gebäudereinigung in Mülheim an der Ruhr'
      />
      <ContactSection />
    </div>
  );
};

export default page;

const Hero = () => {
  return (
    <div
      style={{
        backgroundImage:
          "url('/images/hausmeisterservice/hausmeisterservice_background.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "fill",
      }}>
      <div className='container mx-auto px-4 gap-12 items-center py-48'>
        <div className='flex flex-col gap-6 w-full items-center'>
          <Headings
            level={1}
            className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
            Hausmeisterservice Mülheim an der Ruhr
          </Headings>
          <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
            Zuverlässige Objektpflege & kompetente Betreuung aus einer Hand
          </p>
          <div className='flex flex-col md:flex-row gap-4 md:gap-12 w-full px-4 md:px-0 md:w-auto'>
            <Link href={"#kontakt"} className='w-full md:w-auto'>
              <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                Angebot erhalten
              </Button>
            </Link>
            <Link href={"#services"} className='w-full md:w-auto'>
              <Button
                variant={"outline"}
                className='bg-transparent text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                Dienstleistungen ansehen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoSection = () => {
  return (
    <div className='container mx-auto py-36 flex flex-col bg-white items-center'>
      <p className='max-w-5xl items-center text-center'>
        Sie suchen einen professionellen{" "}
        <strong>Hausmeisterservice in Mülheim an der Ruhr</strong>, der
        zuverlässig, flexibel und rund um die Uhr erreichbar ist? Dann sind Sie
        bei uns genau richtig! Wir kümmern uns mit Fachwissen, Erfahrung und
        Leidenschaft um Ihre Immobilie – von der regelmäßigen Objektbetreuung
        bis hin zu Sonderaufträgen wie Entrümpelungen oder Renovierungsarbeiten.
        Für private, gewerbliche oder kommunale Objekte – wir stehen Ihnen zur
        Seite.
      </p>
    </div>
  );
};

const ServiceSection = () => {
  const services = [
    {
      titel: "Objektbetreuung",
      text: "Von A bis Z – mit regelmäßigen Kontrollen, Koordination von Handwerkern und einem offenen Auge für Details sorgen wir für den Werterhalt Ihrer Immobilie.",
      iconpath: "/images/hausmeisterservice/35.png",
    },
    {
      titel: "Mülltonnenservice",
      text: "Wir übernehmen das für Sie! Kein Stress mit Müllterminen mehr – unser Service sorgt für Ordnung und Sauberkeit rund ums Haus.",
      iconpath: "/images/hausmeisterservice/Rectangle-36.png",
    },
    {
      titel: "Instandhaltung, Wartung & Reparatur",
      text: "Ob tropfender Wasserhahn oder defektes Licht – wir sind zur Stelle, bevor aus Kleinigkeiten größere Schäden werden.",
      iconpath: "/images/hausmeisterservice/Rectangle-37.png",
    },
    {
      titel: "Winterdienst",
      text: "Sicher durch den Winter – mit professionellem Räum- und Streudienst. Verlässlich, schnell und rechtssicher.",
      iconpath: "/images/hausmeisterservice/Rectangle-38.png",
    },
    {
      titel: "Entrümpelungen",
      text: "Vom Dachboden bis zum Keller – wir räumen auf, entsorgen fachgerecht und hinterlassen alles besenrein.",
      iconpath: "/images/hausmeisterservice/Rectangle-39.png",
    },
    {
      titel: "Renovierungsarbeiten",
      text: "Ob Streichen, Verputzen oder kleine Umbauten – wir bringen Handwerk und Stil unter ein Dach.",
      iconpath: "/images/hausmeisterservice/Rectangle-40.png",
    },
  ];

  return (
    <div
      className='container mx-auto max-md:p-6 py-24 flex flex-col gap-6'
      id='services'>
      <div className='flex flex-col gap-3 w-full md:w-1/2'>
        <Headings level={2}>
          Unsere Leistungen rund um die Hausmeisterservice in Mülheim
        </Headings>
        <p>
          Wir bieten ein umfassendes Pflegepaket für Ihr Grundstück – ganzjährig
          und professionell
        </p>
      </div>
      <div className='grid md:grid-cols-3 grid-cols-1 grid-flow-row-dense md:grid-rows-2 gap-8'>
        {services.map((service) => (
          <div
            className='flex flex-col gap-3 p-6 bg-white rounded-lg shadow-md'
            key={service.titel}>
            <div className='flex flex-row gap-3 items-center'>
              <Image
                src={service.iconpath}
                alt={service.titel}
                height={64}
                width={64}
                className='object-contain'
              />
              <Headings level={3}>{service.titel}</Headings>
            </div>
            <p className='text-sm md:text-base'>{service.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhySection = () => {
  const whys = [
    {
      titel: "Lokaler Service – schnell vor Ort & bestens vernetzt",
      text: "Wir sind direkt in Mülheim an der Ruhr ansässig und kennen die Anforderungen der Region. Dadurch sind wir schnell bei Ihnen und können flexibel reagieren – ob im Alltag oder bei Notfällen.",
    },
    {
      titel: "Langjährige Erfahrung & Fachkompetenz",
      text: "Unser Team besteht aus erfahrenen Hausmeistern, Handwerkern und Technikern. Diese Kombination ermöglicht eine umfassende Betreuung Ihrer Immobilie – fachgerecht, effizient und mit Blick fürs Detail.",
    },
    {
      titel: "Zuverlässigkeit & Erreichbarkeit",
      text: "Wir halten, was wir versprechen – pünktlich, gewissenhaft und engagiert. Bei uns erreichen Sie immer einen Ansprechpartner, auch kurzfristig und außerhalb regulärer Zeiten.",
    },
    {
      titel: "Transparente Preise ohne Überraschungen",
      text: "Faire und nachvollziehbare Preisgestaltung ist für uns selbstverständlich. Wir bieten Ihnen volle Kostentransparenz – ohne versteckte Gebühren oder Kleingedrucktes.",
    },
    {
      titel: "Individuelle Betreuung für jede Immobilie",
      text: "Jedes Objekt ist einzigartig. Deshalb erhalten Sie bei uns keine Standardlösungen, sondern einen auf Ihre Bedürfnisse abgestimmten Hausmeisterservice – von der kleinen Wohnanlage bis zum großen Gewerbekomplex.",
    },
  ];

  return (
    <div className='container mx-auto py-24 flex flex-col md:flex-row gap-12 max-md:p-6 items-center'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col'>
          <Headings level={2}>
            Warum wir – Ihr starker Partner für Hausmeisterservice in Mülheim an
            der Ruhr
          </Headings>
          <p>
            Wir stehen für Qualität, Verlässlichkeit und persönlichen Service.
            Als erfahrener{" "}
            <strong>Hausmeisterservice in Mülheim an der Ruhr</strong> wissen
            wir genau, worauf es bei der professionellen Objektbetreuung
            ankommt. Unsere Kunden profitieren von individuellen Lösungen, einem
            engagierten Team und schnellen Reaktionszeiten – immer mit dem Ziel,
            Ihre Immobilie in bestem Zustand zu halten.
          </p>
        </div>
        <div className='flex flex-col gap-4'>
          {whys.map((why) => (
            <div key={why.titel} className='flex flex-col gap-2'>
              <div className='flex flex-row'>
                <CheckIcon color='green' width={24} height={24} />
                <Headings level={4}>{why.titel}</Headings>
              </div>
              <p>{why.text}</p>
            </div>
          ))}
        </div>
        <Link href={"#kontakt"} className='w-fit'>
          <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
            Angebot erhalten
          </Button>
        </Link>
      </div>
      <Image
        src={"/images/image.png"}
        alt='Hausmeisterserviceweiss'
        height={720}
        width={720}
        className='object-cover rounded-md shadow-md max-h-[50vh]'
      />
    </div>
  );
};

const ContactSection = () => {
  return (
    <div
      className='flex flex-col py-12'
      id='kontakt'
      style={{
        backgroundImage: "url('/images/Kontakt_background.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "fill",
        backgroundPosition: "top",
      }}>
      <div className='container max-w-6xl flex flex-col gap-6 bg-white shadow-md p-6 md:p-12 rounded-lg items-center mx-4 md:mx-auto'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <p className='text-2xl md:text-4xl font-bold'>
            Schnell und einfach Kontakt aufnehmen
          </p>
          <p className='text-base md:text-lg px-4 md:px-0'>
            Sie haben Fragen oder möchten ein unverbindliches Angebot? Schreiben
            Sie uns oder rufen Sie direkt an – wir sind für Sie da.
          </p>
        </div>
        <div className='flex flex-col md:flex-row gap-8 md:gap-4 items-start md:items-center justify-between w-full'>
          <div className='w-full md:w-1/2'>
            <ContactForm />
          </div>
          <div className='flex flex-col gap-6 w-full md:w-1/2 md:pl-24 justify-center'>
            <div className='flex flex-row gap-2 items-center'>
              <PhoneIcon
                color='black'
                height={24}
                width={24}
                className='flex-shrink-0'
              />
              <Link
                href={"tel:+4920284458875"}
                className='hover:text-primary text-sm md:text-base'>
                +49 2084 458875
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-center'>
              <MailIcon
                color='black'
                height={24}
                width={24}
                className='flex-shrink-0'
              />
              <Link
                href={"mailto:info@umzugshelden.io"}
                className='hover:text-primary text-sm md:text-base break-all'>
                info@umzugshelden.io
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-start'>
              <ClockIcon
                color='black'
                width={24}
                height={24}
                className='flex-shrink-0'
              />
              <div className='flex flex-col text-sm md:text-base'>
                <p>Öffnungszeiten:</p>
                <p>Mo.: 08:00 - 17:00</p>
                <p>Di. - Fr.: 09:00 - 17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
