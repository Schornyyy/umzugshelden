import Headings from "@/components/Headings";
import CustomerLogoLoop from "@/components/ui/blocks/CustomerLogoLoop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FAQBlock from "@/components/utils/FAQBlock";
import AutoFillInputs from "@/components/utils/AutoFillInputs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ReferenceBlock from "@/components/blocks/ReferenceBlock";
import { FAQType } from "@/types/utils/FAQType";

const page = () => {
  const faq: FAQType[] = [
    {
      question: "Für welche Handwerksbetriebe ist das geeignet?",
      answer:
        "Unsere Lösung funktioniert für alle Gewerke – egal ob Maler, Sanitär, Gartenbau oder Elektro. Entscheidend ist: Du willst wachsen und mehr Kundenanfragen über deine Website erhalten.",
    },
    {
      question: "Was ist der Unterschied zu einer normalen Website?",
      answer:
        "Wir erstellen keine Visitenkarten-Seite, sondern ein System mit Strategie, SEO und Tracking. Ziel ist, dass du messbar mehr Anfragen bekommst – ohne Werbung zu schalten.",
    },
    {
      question: "Wie schnell sehe ich Ergebnisse?",
      answer:
        "Erste Google-Platzierungen und Anfragen siehst du meist nach 4–8 Wochen. Mit jedem Monat steigt deine Sichtbarkeit weiter – nachhaltig statt kurzfristig.",
    },
    {
      question: "Kann ich selbst Änderungen vornehmen?",
      answer:
        "Ja! Du bekommst Zugriff auf ein einfaches System, mit dem du Texte und Bilder jederzeit selbst anpassen kannst – ganz ohne technisches Wissen.",
    },
    {
      question: "Was kostet das Ganze?",
      answer:
        "Die Kosten hängen von deiner Ausgangssituation und deinen Zielen ab. Nach einem kostenlosen Website-Check erhältst du ein transparentes Angebot, das zu deinem Betrieb passt.",
    },
  ];

  return (
    <div className='flex flex-col gap-24 md:gap-44 container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <Hero />
      <CustomerLogoLoop />
      <ServicePoints />
      <System />
      <ReferenceBlock
        maxReferences={3}
        title='Über 10 erfolgreiche Projekte mit Handwerksbetrieben.'
        subtext='Ergebnisse, die zählen – keine leeren Versprechen.'
      />
      <CTASection />
      <FAQBlock
        faqs={faq}
        title='Häufige Fragen rund um unsere Webdesign-Lösung für Handwerker'
      />
    </div>
  );
};

export default page;

const Hero = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-start mt-12 md:mt-24'>
      <div className='flex flex-col gap-6'>
        <Headings level={1}>
          Websites, die für dich arbeiten – statt nur schön auszusehen.
        </Headings>
        <p>
          Wir entwickeln für Handwerksbetriebe Websites mit System,
          Lead-Tracking und SEO. So bekommst du nachhaltig neue Anfragen über
          Google – ohne einen Cent für Werbung zu zahlen. Sichtbar, messbar und
          perfekt auf dein Gewerk abgestimmt.
        </p>
        <div className='flex flex-row gap-4 md:gap-12'>
          <Link href={"/website-check"}>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto'>
              Kostenloser Website check
            </Button>
          </Link>
        </div>
      </div>
      <div
        id='autofill-form'
        className='flex flex-col gap-2 bg-white p-6 rounded-lg shadow-lg w-full md:w-auto'>
        <p className='self-center text-center text-xl font-bold'>
          Erhalte neue Aufträge
        </p>
        <Input
          placeholder='Dein Name'
          className='mb-4 mt-2  border-b border-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 w-full'
        />
        <Input
          placeholder='Deine Telefonnummer'
          className='mb-4 mt-2  border-b border-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 w-full'
        />
        <Input
          placeholder='Deine E-Mail'
          className='mb-4 mt-2  border-b border-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 w-full'
        />
        <Input
          placeholder='Dienstleistung'
          className='mb-4 mt-2  border-b border-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 w-full'
        />
        <Input
          placeholder='Deine Anmerkung'
          className='mb-4 mt-2  border-b border-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 w-full'
        />
        <div
          id='autofill-form-done'
          style={{ display: "none" }}
          className='bg-green-50 text-green-900 p-3 rounded-md text-center mb-4'>
          Vielen Dank! Wir melden uns in Kürze.
        </div>

        <AutoFillInputs
          targetId='autofill-form'
          values={[
            "Lukas Schmidt",
            "0151 23456789",
            "lukas@example.de",
            "Gartenpflege",
            "Bitte rufen Sie am Nachmittag zurück",
          ]}
          typingSpeed={50}
          pauseBetween={700}
          loop={true}
        />
        <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full'>
          Anfrage senden
        </Button>
      </div>
    </div>
  );
};

const ServicePoints = () => {
  const points = [
    {
      title: "Sichtbarkeit",
      text: "Mit gezieltem SEO wirst du in deiner Region gefunden – genau von den Kunden, die nach deinem Handwerk suchen.",
      iconPath: "/icons/megaphone.svg",
    },
    {
      title: "Anfragen statt Klicks",
      text: "Wir liefern keine Besucherzahlen, sondern echte Auftragsanfragen.",
      iconPath: "/icons/contract.svg",
    },
    {
      title: "Keine Ads",
      text: "Schluss mit Werbebudget. Deine Website bringt Anfragen von selbst – ganz organisch.",
      iconPath: "/icons/noAds.svg",
    },
    {
      title: "Messbar & nachhaltig",
      text: "Dank integriertem Tracking siehst du, was funktioniert – und bleibst langfristig sichtbar.",
      iconPath: "/icons/checklist.svg",
    },
  ];

  return (
    <div className='flex flex-col md:flex-row gap-6 md:gap-12'>
      {points.map((point, index) => (
        <div
          key={index}
          className='flex-1 flex flex-col gap-4 p-4 shadow-md rounded-md items-center text-center w-full'>
          <Image
            src={point.iconPath}
            alt={point.title}
            width={64}
            height={64}
            className='w-16 h-16 object-contain'
          />
          <Headings level={3}>{point.title}</Headings>
          <p className='text-center'>{point.text}</p>
        </div>
      ))}
    </div>
  );
};

const System = () => {
  const systemPoints = [
    {
      title: "Wir starten mit System – nicht mit Design.",
      text: "Bevor wir irgendetwas gestalten, analysieren wir deine aktuelle Situation, dein Einzugsgebiet und deine Zielkunden. Auf dieser Basis entwickeln wir eine klare Strategie: Welche Suchbegriffe sind relevant, wie muss deine Website aufgebaut sein und was überzeugt deine Kunden? So entsteht ein Fundament, das Ergebnisse bringt.",
      iconPath: "/images/analyse.png",
    },
    {
      title: "Aus Strategie wird dein digitales Werkzeug.",
      text: "Wir erstellen deine Website so, dass sie funktioniert wie ein Mitarbeiter – sie arbeitet, während du auf der Baustelle bist. Jede Seite ist auf Conversion ausgelegt, klar strukturiert und technisch auf Performance optimiert. Damit Kunden nicht nur klicken, sondern Kontakt aufnehmen.",
      iconPath: "/images/figma.png",
    },
    {
      title: "Sichtbar genau dort, wo deine Kunden suchen.",
      text: "Wir optimieren deine Website gezielt für deine Region und dein Gewerk. So wirst du bei Google gefunden, wenn potenzielle Kunden nach deinen Leistungen suchen. Statt auf Likes zu hoffen, bekommst du planbar mehr Anfragen über Suchmaschinen – nachhaltig und ohne Werbekosten.",
      iconPath: "/images/keywords.png",
    },
    {
      title: "Was messbar ist, kann verbessert werden.",
      text: "Jede Website wird mit einem integrierten Lead-Tracking ausgestattet. Du siehst genau, woher deine Anfragen kommen und wie Kunden auf dich aufmerksam werden. So können wir deine Website kontinuierlich verbessern und langfristig mehr Aufträge für dich herausholen.",
      iconPath: "/images/betreuung.png",
    },
  ];

  return (
    <div className='system-points flex flex-col gap-8'>
      {systemPoints.map((point, index) => {
        const isEven = index % 2 === 0;

        return (
          <div key={index} className='system-point'>
            <div
              className={`sticky-card flex flex-col md:flex-row items-center gap-6 md:gap-24 ${
                isEven ? "md:flex-row-reverse" : ""
              }`}>
              <Image
                src={point.iconPath}
                alt={point.title}
                width={740}
                height={1200}
                className='w-full md:w-96 h-auto object-contain'
              />
              <div className='flex flex-col gap-4'>
                <h3 className='text-2xl md:text-3xl font-bold'>
                  {point.title}
                </h3>
                <p className=' text-base md:text-xl'>{point.text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CTASection = () => {
  return (
    <div className='flex flex-col gap-4 self-center items-center justify-center'>
      <p className='font-bold text-xl max-w-4xl text-center'>
        Finde heraus, ob deine Website Kunden bringt – oder nur Klicks.
      </p>
      <Link href={"/website-check"}>
        <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto'>
          Kostenloser Website check
        </Button>
      </Link>
    </div>
  );
};
