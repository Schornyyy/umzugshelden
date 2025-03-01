import { bulletPointsCompanyyCard } from "@/statics/Lists";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
    description:
      "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
    openGraph: {
      title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
      description:
        "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
      url: "https://jobsmith.de/gartenlandschaftsbau",
      images: [
        {
          url: "/images/fuer_unternehemen_hero.png",
          width: 750,
          height: 350,
          alt: "Garten- & Landschaftsbau Aufträge in meiner Nähe",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
      description:
        "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
      image: "/images/fuer_unternehemen_hero.png",
    },
  };
}

const page = async () => {
  return (
    <div className='container mx-auto my-12 px-4'>
      {/* Hauptbereich */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
        <Image
          alt='Garten- & Landschaftsbau Aufträge in meiner Nähe'
          src={"/images/fuer_unternehemen_hero.png"}
          height={512}
          width={512}
          className='object-cover w-full max-h-96 rounded-lg'
        />
        <div className='flex flex-col gap-6'>
          <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-center lg:text-left'>
            Erhalte Garten- & Landschaftsbau Aufträge direkt aus deiner Nähe!
          </h1>
          <p className='text-base sm:text-lg text-center lg:text-left'>
            Du bist im Garten- und Landschaftsbau tätig und suchst nach neuen
            Aufträgen in deiner Region? Mit unserer Plattform findest du gezielt
            Galabau-Aufträge in deiner Nähe – schnell, unkompliziert und genau
            auf deine Dienstleistungen abgestimmt.
          </p>
          <ul className='list-disc list-inside'>
            <li>Erhalte passende Aufträge in deiner Nähe</li>
            <li>Steigere deine Auftragslage und Umsätze</li>
            <li>Finde neue Kunden und Aufträge</li>
          </ul>
          <p className='text-base sm:text-lg text-center lg:text-left'>
            Warte nicht länger – lasse dich jettz von potenziellen Kunden in
            deiner nähe finden, die professionellen Garten- und Landschaftsbau
            in deiner Nähe suchen!
          </p>
          <div className='flex justify-center lg:justify-start'>
            <Link
              href={"/register/company"}
              className='py-2 px-6 rounded-xl bg-green-500 hover:bg-green-600 text-white'>
              Jetzt kostenlos registrieren
            </Link>
          </div>
        </div>
      </div>

      {/* Bullet Points Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 my-12 justify-items-center mt-24'>
        {bulletPointsCompanyyCard.map((item, index) => (
          <div
            key={index}
            className='flex flex-col gap-4 p-4 rounded-md shadow-2xl bg-white w-full max-w-[300px]'>
            <h3 className='text-lg sm:text-xl font-bold text-center'>
              {item.title}
            </h3>
            <p className='text-sm sm:text-base text-center'>
              {item.description}
            </p>
            <Image
              alt={item.title}
              src={item.iconPath}
              width={32}
              height={32}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default page;
