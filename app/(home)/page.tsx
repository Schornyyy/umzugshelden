import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import ContactForm from "@/components/ContactForm";
import { ClockIcon, MailIcon, PhoneIcon } from "lucide-react";

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
      url: "https://weiss-hausmeisterservice.de",
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
  return (
    <div className='flex flex-col'>
      <Hero />
      <ServiceSection />
      <ReviewCarousel />
      <AboutUsSection />
      <ContactSection />
    </div>
  );
};

export default page;

const Hero = () => {
  return (
    <div
      style={{
        backgroundImage: "url('/images/Hero_background.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "fill",
      }}>
      <div className='container mx-auto px-4 py-32 gap-12 items-center'>
        <div className='flex flex-col gap-6 w-full items-center'>
          <Headings
            level={1}
            className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
            Zuverlässiger Hausmeisterservice in Mülheim an der Ruhr
          </Headings>
          <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
            Ob Haus, Garten oder Gebäude – wir kümmern uns drum. Schnell,
            gründlich und mit Herz.
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

const ServiceSection = () => {
  return (
    <div
      className='container mx-auto py-20 md:py-40 flex flex-col gap-20 md:gap-40 px-4 md:px-0'
      id='services'>
      {/* Überschrift */}
      <div className='flex flex-col gap-2 w-full md:w-3/4'>
        <Headings level={2} className='text-3xl md:text-4xl lg:text-5xl'>
          Unsere Leistungen – alles aus einer Hand
        </Headings>
        <p className='text-base md:text-lg'>
          Von der regelmäßigen Objektbetreuung bis zur gründlichen
          Gebäudereinigung: Wir bieten Ihnen ein Rundum-sorglos-Paket für Ihre
          Immobilie in Mülheim an der Ruhr und Umgebung.
        </p>
      </div>
      {/* Hausmeisterservice */}
      <div className='flex flex-col-reverse md:flex-row gap-8 md:gap-12 md:justify-end items-center'>
        <Image
          src='/images/gebäude.png'
          alt='Hausmeisterserviceweiss Büro'
          width={700}
          height={700}
          className='w-full md:w-1/3 object-cover rounded-xl shadow-md h-[250px]'
        />
        <div className='flex flex-col gap-4 w-full md:w-1/3'>
          <Headings level={3} className='text-2xl md:text-3xl'>
            Ihr Ansprechpartner für alle Hausmeisterdienste
          </Headings>
          <p className='text-base md:text-lg'>
            Ob kleinere Reparaturen, Kontrolle der Haustechnik oder regelmäßige
            Objektpflege – wir übernehmen sämtliche Aufgaben rund ums Haus.
            Verlässlich, pünktlich und mit Blick fürs Detail.
          </p>
          <Link href={"/hausmeisterservice"} className='w-full md:w-auto'>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center'>
              Mehr Erfahren
            </Button>
          </Link>
        </div>
      </div>
      {/* Grundstückpflege */}
      <div className='flex flex-col md:flex-row gap-8 md:gap-12 md:justify-start items-center'>
        <Image
          src='/images/pflege.png'
          alt='Grundstückspflege'
          width={700}
          height={700}
          className='w-full md:w-1/3 object-cover rounded-xl shadow-md h-[250px]'
        />
        <div className='flex flex-col gap-4 w-full md:w-1/3'>
          <Headings level={3} className='text-2xl md:text-3xl'>
            Grünanlagenpflege, die Eindruck macht
          </Headings>
          <p className='text-base md:text-lg'>
            Wir sorgen für gepflegte Außenbereiche – vom regelmäßigen Rasenmähen
            über Heckenschnitt bis zur Laubentsorgung. Saubere und einladende
            Grundstücke sind unsere Handschrift.
          </p>
          <Link href={"/grundstueckpflege"} className='w-full md:w-auto'>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center'>
              Mehr Erfahren
            </Button>
          </Link>
        </div>
      </div>
      {/* gebäudereinigung */}
      <div className='flex flex-col-reverse md:flex-row gap-8 md:gap-12 md:justify-end items-center'>
        <Image
          src='/images/glasreinigung.png'
          alt='Hausmeisterserviceweiss Büro'
          width={700}
          height={700}
          className='w-full md:w-1/3 object-cover rounded-xl shadow-md h-[250px]'
        />
        <div className='flex flex-col gap-4 w-full md:w-1/3'>
          <Headings level={3} className='text-2xl md:text-3xl'>
            Saubere Gebäude, zufriedene Nutzer
          </Headings>
          <p className='text-base md:text-lg'>
            Ob Treppenhausreinigung, Glasreinigung oder Büroflächen – wir
            bringen alles auf Hochglanz. Mit modernen Mitteln, geschultem
            Personal und verlässlichem Rhythmus.
          </p>
          <Link href={"/gebaeudereinigung"} className='w-full md:w-auto'>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center'>
              Mehr Erfahren
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const AboutUsSection = () => {
  return (
    <div className='container mx-auto flex flex-col gap-12 items-center my-12 md:my-24 px-4 md:px-0'>
      <div className='flex flex-col gap-8 md:gap-12 items-center text-center w-full md:w-2/3'>
        <Headings level={2} className='text-2xl md:text-3xl font-bold'>
          Hausmeisterservice mit Herz und Verstand
        </Headings>
        <p className='text-base md:text-lg'>
          Als langjähriger Mitarbeiter des Hausmeisterservice Stefan Hoffmann
          übernehme ich zum 01.01.2025 unter dem Namen Hausmeisterservice Weiß
          die Verantwortung für den Betrieb, der über viele Jahre hinweg unter
          der Leitung von Herrn Stefan Hoffmann erfolgreich geführt wurde.
        </p>
        <p className='text-base md:text-lg'>
          Unser Unternehmen bietet ein umfassendes Spektrum an Dienstleistungen,
          die darauf abzielen, Ihre Immobilie optimal zur Geltung zu bringen.
          Wir betreuen ihre Immobilie Individuell und auf ihre Bedürfnisse
          abgestimmt.
        </p>
        <Link href={"#kontakt"} className='mt-4 md:mt-6 w-full md:w-auto'>
          <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center'>
            Jetzt kontaktieren
          </Button>
        </Link>
      </div>
      <Image
        src={"/images/fahrzeug.png"}
        alt='Hausmeisterservice Weiß Fahrzeug'
        width={800}
        height={600}
        className='object-fill w-full md:w-auto'
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
