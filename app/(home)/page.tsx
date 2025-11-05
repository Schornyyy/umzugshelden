import Headings from "@/components/Headings";
import CustomerLogoLoop from "@/components/ui/blocks/CustomerLogoLoop";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import BulletPointCards from "./_components/BulletPointCards";
import FAQBlock from "@/components/utils/FAQBlock";
import ReferenceBlock from "@/components/blocks/ReferenceBlock";
import Link from "next/link";
import { FAQType } from "@/types/utils/FAQType";

export async function generateMetadata() {
  // Hier kannst du auch dynamisch Metadaten erstellen, z. B. aus einer Datenquelle
  return {
    title: "GS-Creatives — Webdesign für Handwerksbetriebe",
    description:
      "GS-Creatives erstellt Webdesign und Websites für Handwerksbetriebe, die sichtbar machen und Anfragen bringen.",
    openGraph: {
      title: "GS-Creatives — Webdesign für Handwerksbetriebe",
      description:
        "GS-Creatives erstellt Webdesign und Websites für Handwerksbetriebe, die sichtbar machen und Anfragen bringen.",
      url: "https://gs-creatives.de",
      images: [
        {
          url: "/images/JobSmith_hero.png",
          width: 750,
          height: 350,
          alt: "GS-Creatives Hero",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "GS-Creatives — Webdesign für Handwerksbetriebe",
      description:
        "GS-Creatives erstellt Webdesign und Websites für Handwerksbetriebe, die sichtbar machen und Anfragen bringen.",
      image: "/images/JobSmith_hero.png",
    },
  };
}

const page = () => {
  const faq: FAQType[] = [
    {
      question: "Was kostet eine Website bei euch?",
      answer:
        "Der Preis hängt von deinem Betrieb und deinen Zielen ab. Wir bieten dir keine 0815-Lösung, sondern ein System, das sich rechnet. Nach einem kurzen Gespräch erhältst du ein passendes, transparentes Angebot.",
    },
    {
      question: "Wie lange dauert die Erstellung?",
      answer:
        "In der Regel 3–4 Wochen – je nach Umfang und Feedback. Wir arbeiten mit klaren Prozessen, damit du schnell Ergebnisse bekommst und deine Website zügig online geht.",
    },
    {
      question: "Kann ich Inhalte selbst ändern?",
      answer:
        "Ja. Du bekommst Zugriff auf ein einfaches System, mit dem du Texte, Bilder oder Projekte jederzeit selbst anpassen kannst – ganz ohne Technikkenntnisse.",
    },
    {
      question: "Was unterscheidet euch von anderen Agenturen?",
      answer:
        "Wir bauen keine Show-Websites, sondern Werkzeuge. Jede Seite ist darauf ausgelegt, Anfragen zu generieren – mit SEO, Tracking und klarer Struktur, speziell für Handwerksbetriebe.",
    },
    {
      question: "Funktioniert das auch ohne Werbung?",
      answer:
        "Ja! Unsere Systeme sind so aufgebaut, dass du durch SEO und Tracking dauerhaft sichtbar wirst. Das bringt dir langfristig Kunden – ohne laufende Werbekosten.",
    },
  ];

  return (
    <div className='flex flex-col gap-12 md:gap-44 container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <Hero />
      <CustomerLogoLoop />
      <ProblemSection />
      <BulletPointCards />
      <ReferenceBlock
        maxReferences={6}
        title='Über 10 Handwerksbetriebe vertrauen bereits GS-Creatives.'
        subtext='Echte Ergebnisse. Echte Betriebe. Echte Erfolge.'
      />
      <AboutUs />
      <FAQBlock faqs={faq} title='Häufige Fragen, die uns Handwerker stellen' />
    </div>
  );
};

export default page;

const Hero = () => {
  return (
    <div className='grid grid-rows-1 grid-cols-1 md:grid-cols-2 justify-between mt-12 md:mt-24 gap-8 items-center'>
      <div className='flex flex-col gap-6'>
        <Headings level={1}>
          Deine Website soll Aufträge bringen – nicht nur gut aussehen.
        </Headings>
        <p>
          Wir bauen für Handwerksbetriebe Websites, die wie ein Werkzeug
          funktionieren: messbar, sichtbar und systematisch. Mit Lead-Tracking,
          SEO und klarer Struktur erhältst du nachhaltig Neukunden-Anfragen –
          ganz ohne Werbung.
        </p>
        <div className='flex flex-row gap-4 md:gap-12'>
          <Link href={"/website-check"}>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto text-center'>
              Kostenloser Website check
            </Button>
          </Link>
        </div>
      </div>
      <Image
        alt='Hero Image'
        src='/images/Hero-Image.png'
        width={1200}
        height={1200}
        className='w-full h-auto object-contain'
      />
    </div>
  );
};

const ProblemSection = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 grid-rows-1 gap-6 items-center'>
      <Image
        src={"/images/cta_image.png"}
        alt='CTA Image'
        width={600}
        height={600}
        className='w-full h-auto object-contain'
      />
      <div className='flex flex-col gap-6'>
        <Headings level={2}>
          Schön reicht nicht – deine Website muss verkaufen.
        </Headings>
        <p>
          Viele Handwerker haben eine Website, die zwar gut aussieht, aber keine
          Ergebnisse bringt. Keine Anfragen, keine Sichtbarkeit, kein Wachstum.
          Das Problem: Es fehlt das System dahinter. Wir bauen dir eine Website,
          die für dich arbeitet – mit Tracking, SEO und Strategie, damit dein
          Kalender sich wieder füllt.
        </p>
        <Link href={"/website-check"}>
          <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto'>
            Kostenloser Website check
          </Button>
        </Link>
      </div>
    </div>
  );
};

const AboutUs = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 grid-rows-1 items-center gap-6'>
      <Image
        src={"/images/Team.png"}
        alt='CTA Image'
        width={600}
        height={600}
        className='w-full h-auto object-contain'
      />
      <div className='flex flex-col gap-6'>
        <Headings level={2}>
          Weil wir Websites bauen, die Umsatz bringen – nicht Likes.
        </Headings>
        <p>
          Wir bei GS-Creatives kombinieren modernes Webdesign mit Performance,
          System und klarer Strategie. Unser Fokus liegt nicht auf
          Designpreisen, sondern auf Ergebnissen: mehr Sichtbarkeit, mehr
          Anfragen, mehr Aufträge – und das alles ohne bezahlte Werbung.
        </p>
        <Link href={"/website-check"}>
          <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto'>
            Kostenloser Website check
          </Button>
        </Link>
      </div>
    </div>
  );
};
