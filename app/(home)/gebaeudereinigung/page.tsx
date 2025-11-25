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
  return {
    title: "Gebäudereinigung Mülheim an der Ruhr ▷ Hausmeisterservice Weiß",
    description:
      "✓ Professionelle Gebäudereinigung in Mülheim an der Ruhr ✓ Treppenhausreinigung ✓ Glasreinigung ✓ Büroreinigung ✓ Grundreinigung ► Jetzt kostenlos anfragen!",
    openGraph: {
      title: "Gebäudereinigung Mülheim an der Ruhr | Hausmeisterservice Weiß",
      description:
        "Ihre professionelle Gebäudereinigung in Mülheim: Treppenhaus-, Glas- & Büroreinigung, Grundreinigung, Bauendreinigung. Erfahrene Reinigungskräfte, flexible Zeiten, faire Preise.",
      url: "https://weiss-hausmeisterservice.de/gebaeudereinigung",
      images: [
        {
          url: "/images/gebäudereinigung/Hero.png",
          width: 1200,
          height: 630,
          alt: "Gebäudereinigung Mülheim an der Ruhr - Hausmeisterservice Weiß",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Gebäudereinigung Mülheim an der Ruhr | Hausmeisterservice Weiß",
      description:
        "Professionelle Gebäudereinigung in Mülheim: Treppenhaus-, Glas- & Büroreinigung ✓ Grundreinigung ✓ Erfahrene Teams ✓ Flexible Zeiten",
      image: "/images/gebäudereinigung/Hero.png",
    },
  };
}

const page = () => {
  const faqs: FAQType[] = [
    {
      answer:
        "Die Kosten für eine professionelle Gebäudereinigung in Mülheim an der Ruhr hängen von mehreren Faktoren ab. Dazu zählen unter anderem die Größe und Art des Objekts, der gewünschte Reinigungsumfang sowie die Häufigkeit der Reinigung. Pauschale Preise lassen sich daher nur schwer nennen. Um Ihnen ein transparentes und faires Angebot unterbreiten zu können, bieten wir eine individuelle Beratung und eine kostenlose Besichtigung Ihres Objekts vor Ort an. So können wir den Aufwand genau einschätzen und ein auf Ihre Bedürfnisse abgestimmtes Angebot erstellen.",
      question: "Was kostet die Gebäudereinigung in Mülheim?",
    },
    {
      answer:
        "Ja, selbstverständlich! Wir wissen, dass viele Unternehmen oder Einrichtungen Wert darauf legen, dass die Reinigung außerhalb der regulären Geschäftszeiten erfolgt – z. B. früh morgens, spät abends oder am Wochenende. Unser Team ist flexibel einsetzbar und richtet sich ganz nach Ihren zeitlichen Vorgaben. So gewährleisten wir, dass der Betriebsablauf in Ihrem Unternehmen nicht gestört wird und Ihre Räumlichkeiten stets sauber und gepflegt sind.",
      question: "Arbeiten Sie auch außerhalb der Öffnungszeiten?",
    },
    {
      answer:
        "Ja, wir bieten Ihnen gerne eine kostenlose und unverbindliche Besichtigung Ihres Objekts in Mülheim an der Ruhr an. Dabei verschaffen wir uns einen Überblick über die Gegebenheiten vor Ort, klären Ihre individuellen Wünsche und besprechen den passenden Leistungsumfang. Auf Basis dieser Besichtigung erstellen wir ein maßgeschneidertes Angebot – ganz ohne versteckte Kosten. Vereinbaren Sie einfach einen Termin mit uns!",
      question: "Bieten Sie eine kostenlose Besichtigung in Mülheim an?",
    },
    {
      answer: `Unser Reinigungsservice in Mülheim an der Ruhr deckt ein breites Spektrum an Objekten ab. Dazu gehören unter anderem:

Bürogebäude und Verwaltungsgebäude

Arztpraxen und Gesundheitseinrichtungen

Schulen, Kindergärten und öffentliche Einrichtungen

Industriehallen und Produktionsstätten

Einzelhandelsflächen und Ladenlokale

Treppenhäuser und Mehrfamilienhäuser

Baustellen (Bauendreinigung)

Privathaushalte (z. B. Glasreinigung oder Grundreinigung)

Ganz gleich, ob es sich um ein kleines Büro oder ein großes Industrieobjekt handelt – wir stellen uns flexibel auf Ihre Anforderungen ein und sorgen für Sauberkeit mit System.`,
      question: "Welche Objekte reinigen Sie?",
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
        backgroundImage: "url('/images/gebäudereinigung/Hero.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "fill",
      }}>
      <div className='container mx-auto px-4 gap-12 items-center py-48'>
        <div className='flex flex-col gap-6 w-full items-center'>
          <Headings
            level={1}
            className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
            Professionelle Gebäudereinigung in Mülheim an der Ruhr
          </Headings>
          <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
            sauber, zuverlässig & flexibel
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
        Sie suchen eine zuverlässige{" "}
        <strong>Gebäudereinigung in Mülheim an der Ruhr</strong>? Ob Büro,
        Treppenhaus oder Praxis – wir bieten Ihnen maßgeschneiderte
        Reinigungslösungen für gewerbliche und private Immobilien. Vertrauen Sie
        auf langjährige Erfahrung, geschultes Personal und höchste
        Hygienestandards.
      </p>
    </div>
  );
};

const ServiceSection = () => {
  const services = [
    {
      titel: "Treppenhausreinigung",
      text: "Saubere Treppenhäuser sind die Visitenkarte eines Gebäudes. Wir übernehmen die regelmäßige Reinigung von Treppenhäusern in Wohnanlagen, Bürogebäuden und öffentlichen Einrichtungen – gründlich, zuverlässig und auf Wunsch auch mehrmals wöchentlich.",
      iconpath: "/images/gebäudereinigung/Rectangle-7.png",
    },
    {
      titel: "Glas- & Fensterreinigung",
      text: "Klare Sicht mit System: Unsere Profis sorgen für streifenfreie Sauberkeit auf Fenstern, Glasfassaden und Glasdächern – innen wie außen. Auch in schwer erreichbaren Bereichen.",
      iconpath: "/images/gebäudereinigung/Rectangle-8.png",
    },
    {
      titel: "Wintergartenreinigung",
      text: "Wir bringen Licht ins Dunkel: Mit speziellen Geräten reinigen wir Glasdächer, Rahmen und Scheiben Ihres Wintergartens materialschonend und rückstandsfrei – für den perfekten Ausblick.",
      iconpath: "/images/gebäudereinigung/Rectangle-9.png",
    },
    {
      titel: "Osmosereinigung",
      text: "Chemiefrei & effizient: Mit unserer Osmosereinigung (reines, entmineralisiertes Wasser) reinigen wir Glasflächen, Fassaden oder PV-Anlagen – ganz ohne Rückstände oder Schlieren.",
      iconpath: "/images/gebäudereinigung/Rectangle-12.png",
    },
    {
      titel: "Bauendreinigung",
      text: "Baustaub ade: Wir reinigen gründlich nach Bau-, Umbau- oder Sanierungsarbeiten. Ob Grobreinigung oder Feinreinigung – wir machen Ihre Immobilie bezugsfertig und präsentieren sie im besten Licht.",
      iconpath: "/images/gebäudereinigung/Rectangle-13.png",
    },
    {
      titel: "Außenflächenreinigung",
      text: "Gepflegte Außenbereiche wirken einladend: Wir reinigen Einfahrten, Wege, Höfe, Stellplätze und Eingangsbereiche – inkl. Entfernung von Laub, Unkraut, Schmutz und Moos.",
      iconpath: "/images/gebäudereinigung/Rectangle-19.png",
    },
    {
      titel: "Grundreinigung",
      text: "Für den perfekten Neustart: Bei der Grundreinigung entfernen wir hartnäckige Verschmutzungen, Pflegefilme und Rückstände auf Böden, Fliesen, Türen oder Sanitäranlagen – ideal vor Übergaben oder Neubezügen.",
      iconpath: "/images/gebäudereinigung/Rectangle-20.png",
    },
    {
      titel: "Büro- & Unterhaltsreinigung",
      text: "Für einen sauberen Arbeitsplatz: Wir reinigen Büros, Besprechungsräume, Sanitärbereiche und Gemeinschaftsflächen regelmäßig und diskret – abgestimmt auf Ihre Arbeitszeiten und Bedürfnisse.",
      iconpath: "/images/gebäudereinigung/Rectangle-22 (1).png",
    },
    {
      titel: "Sonderreinigung",
      text: "Jede Herausforderung ist willkommen: Ob Brandschäden, Wasserschäden oder hygienisch sensible Bereiche – unsere Sonderreinigungen decken spezielle Anforderungen ab, individuell und professionell.",
      iconpath: "/images/gebäudereinigung/Rectangle-22.png",
    },
  ];

  return (
    <div
      className='container mx-auto max-md:p-6 py-24 flex flex-col gap-6'
      id='services'>
      <div className='flex flex-col gap-3 w-full md:w-1/2'>
        <Headings level={2}>
          Leistungsbeschreibungen – Gebäudereinigung Mülheim an der Ruhr
        </Headings>
        <p>
          Von der regelmäßigen Objektbetreuung bis zur gründlichen
          Gebäudereinigung: Wir bieten Ihnen ein Rundum-sorglos-Paket für Ihre
          Immobilie in Mülheim an der Ruhr und Umgebung.
        </p>
      </div>
      <div className='grid md:grid-cols-3 grid-cols-1 grid-flow-row-dense md:grid-rows-3 gap-8'>
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
      titel: "Persönlicher Ansprechpartner vor Ort",
      text: "Bei uns sprechen Sie nicht mit einem Callcenter, sondern mit einem festen Ansprechpartner, der Ihre Immobilie kennt – und sich kümmert.",
    },
    {
      titel: "Schnelle Erreichbarkeit im Raum Mülheim & Umgebung",
      text: "Wir reagieren kurzfristig und flexibel – ob für regelmäßige Einsätze oder spontane Sonderreinigungen.",
    },
    {
      titel: "Reinigungskräfte aus der Region",
      text: "Verlässliche Teams aus Mülheim und dem Ruhrgebiet sorgen für Kontinuität, Vertrauen und kurze Anfahrtszeiten.",
    },
    {
      titel: "Flexible Einsatzzeiten – auch außerhalb Ihrer Öffnungszeiten",
      text: "Ob frühmorgens, abends oder am Wochenende: Wir richten uns nach Ihrem Tagesablauf – nicht umgekehrt.",
    },
  ];

  return (
    <div className='container mx-auto py-24 flex flex-col md:flex-row gap-12 max-md:p-6 items-center'>
      <div className='flex flex-col gap-6 w-full md:w-1/2'>
        <div className='flex flex-col'>
          <Headings level={2}>
            Ihr Reinigungsdienst in Mülheim mit System
          </Headings>
          <p>
            Als erfahrener Reinigungsdienst in Mülheim an der Ruhr stehen wir
            für zuverlässige, planbare und gründliche Gebäudereinigung –
            angepasst an Ihre individuellen Anforderungen. Wir wissen:
            Sauberkeit ist mehr als nur Optik – sie schafft Wohlbefinden,
            schützt Werte und steigert die Lebens- oder Arbeitsqualität.
            <br />
            Was uns auszeichnet:
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
        src={"/images/gebäudereinigung/image5.jpeg"}
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
                href={"mailto:info@weiss-hausmeisterservice.de"}
                className='hover:text-primary text-sm md:text-base break-all'>
                info@weiss-hausmeisterservice.de
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
