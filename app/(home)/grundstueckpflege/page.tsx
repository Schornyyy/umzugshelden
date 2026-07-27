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
        "Die Kosten richten sich nach Größe, Zustand und gewünschtem Leistungsumfang. Wir erstellen Ihnen gerne ein kostenloses, individuelles Angebot nach einer Besichtigung vor Ort.",
      question: "Was kostet die Grundstückspflege in Mülheim an der Ruhr?",
    },
    {
      answer:
        "Nein, nicht zwingend. Bei regelmäßig beauftragten Leistungen oder vereinbartem Zugang übernehmen wir die Pflege auch in Ihrer Abwesenheit.",
      question: "Muss ich bei der Grundstückspflege anwesend sein?",
    },
    {
      answer:
        "Ja. Unser Team ist für größere Objekte wie Firmenareale, Wohnanlagen oder Parkplätze bestens ausgestattet.",
      question:
        "Können auch größere Flächen oder gewerbliche Anlagen gepflegt werden?",
    },
    {
      answer:
        "Der optimale Zeitraum liegt meist im späten Frühjahr oder Herbst – abhängig von der Pflanzenart. Wir beraten Sie gerne dazu.",
      question: "Wann ist die beste Zeit für Hecken- oder Strauchschnitt?",
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
        title='Häufige Fragen zur Grundstückspflege in Mülheim an der Ruhr'
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
          "url('/images/grunstückpflege/grundstueckpflege_hero.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "fill",
      }}>
      <div className='container mx-auto px-4 gap-12 items-center py-48'>
        <div className='flex flex-col gap-6 w-full items-center'>
          <Headings
            level={1}
            className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
            Professionelle Grundstückspflege in Mülheim an der Ruhr
          </Headings>
          <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
            Zuverlässige Pflege für Rasen, Beete, Hecken & mehr – für Privat und
            Gewerbe. Jetzt unverbindlich beraten lassen!
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
        Ein ordentlich gepflegtes Grundstück ist die Visitenkarte Ihres Hauses
        oder Unternehmens. Ob private Grünflächen, gewerbliche Außenanlagen oder
        Gemeinschaftsgrundstücke – unsere professionelle{" "}
        <strong>Grundstückspflege in Mülheim an der Ruhr</strong> sorgt für
        einen dauerhaft positiven Eindruck. Mit modernster Ausrüstung,
        geschultem Personal und einem zuverlässigen Service übernehmen wir alle
        anfallenden Pflegearbeiten rund ums Jahr – individuell und flexibel auf
        Ihre Bedürfnisse abgestimmt. Vertrauen Sie auf Erfahrung, Qualität und
        faire Preise. Egal, ob regelmäßige Pflege oder einmaliger Einsatz – wir
        sind für Sie da!
      </p>
    </div>
  );
};

const ServiceSection = () => {
  const services = [
    {
      titel: "Rasenschnitt",
      text: "Regelmäßiger Rasenschnitt sorgt für ein gepflegtes Erscheinungsbild und gesundes Wachstum. Wir mähen, trimmen und entsorgen das Schnittgut fachgerecht.",
      iconpath: "/images/grunstückpflege/Rectangle-28.png",
    },
    {
      titel: "Sträucher- & Heckenschnitt",
      text: "Für dichte, gepflegte Hecken und Sträucher – zum richtigen Zeitpunkt geschnitten und in Form gebracht. Inklusive Schnittentsorgung.",
      iconpath: "/images/grunstückpflege/Rectangle-29.png",
    },
    {
      titel: "Beet- & Rabattenpflege",
      text: "Wir pflegen Ihre Blumenbeete und Rabatten, entfernen Unkraut, lockern den Boden und sorgen für eine schöne, saubere Optik.",
      iconpath: "/images/grunstückpflege/Rectangle-30.png",
    },
    {
      titel: "Laubbeseitigung",
      text: "Im Herbst und Frühjahr sorgen wir für die gründliche Entfernung von Laub auf Rasen, Wegen und Einfahrten – inklusive Abtransport.",
      iconpath: "/images/grunstückpflege/Rectangle-31.png",
    },
    {
      titel: "Moos- & Unkrautentfernung",
      text: "Unkraut und Moos lassen Flächen schnell ungepflegt wirken. Wir entfernen beides gründlich von Gehwegen, Einfahrten und Pflasterflächen.",
      iconpath: "/images/grunstückpflege/Rectangle-32.png",
    },
    {
      titel: "Grauflächenpflege",
      text: "Ob Parkplatz, Gehweg oder Zufahrt – wir halten Ihre befestigten Flächen sauber und frei von Verschmutzungen, Unkraut oder Grünbelag.",
      iconpath: "/images/grunstückpflege/Rectangle-34.png",
    },
  ];

  return (
    <div
      className='container mx-auto max-md:p-6 py-24 flex flex-col gap-6'
      id='services'>
      <div className='flex flex-col gap-3 w-full md:w-1/2'>
        <Headings level={2}>
          Unsere Leistungen rund um die Grundstückspflege in Mülheim
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
      titel: "Zuverlässigkeit",
      text: "Wir kommen pünktlich und arbeiten gründlich – ohne Ausreden.",
    },
    {
      titel: "Flexibilität",
      text: " Sie bestimmen den Rhythmus – wöchentlich, monatlich oder saisonal.",
    },
    {
      titel: "Komplettservice",
      text: "Von Rasen bis Parkplatz – alles aus einer Hand.",
    },
    {
      titel: "Fachgerechte Pflege",
      text: "Mit Know-how, Erfahrung und professioneller Ausrüstung.",
    },
    {
      titel: "Persönlicher Kontakt",
      text: "Fester Ansprechpartner und individuelle Betreuung.",
    },
  ];

  return (
    <div className='container mx-auto py-24 flex flex-col md:flex-row gap-12 max-md:p-6 items-center'>
      <div className='flex flex-col gap-6 w-full md:w-1/2'>
        <div className='flex flex-col'>
          <Headings level={2}>
            Grundstückspflege mit System – Darum entscheiden sich Kunden in
            Mülheim für uns
          </Headings>
          <p>
            Wir wissen, wie viel Aufwand die regelmäßige Pflege eines
            Grundstücks bedeutet – und wie ärgerlich es ist, wenn Dienstleister
            unzuverlässig arbeiten oder Leistungen unvollständig erbracht
            werden.
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
        src={"/images/grunstückpflege/about.jpg"}
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
