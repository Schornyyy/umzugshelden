import Link from "next/link";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Headings from "@/components/Headings";
import { getAllCompanysFromDatabaseByCity } from "@/actions/companyActions";
import { getGalbauServices } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import SearchBarResults from "../../unternehmen-finden/_components/SearchbarResults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const companys = await getAllCompanysFromDatabaseByCity(city);

  if (companys.length === 0) {
    return {
      title: "Unternehmen nicht gefunden",
      description: "Dieses Unternehmen konnte nicht gefunden werden.",
    };
  }

  return {
    title: `${companys.length} Garten- und Landschaftsbauer in ${city} - Landschaftshelden.io`,
    description: `Finde ${companys.length} Garten- und Landschaftsbauer in ${city} auf Landschaftshelden.io`,
    keywords: [
      `Galabau Unternehmen in ${city}`,
      `Garten und Landschaftsbauer in ${city}`,
      "Glabau",
      "Landschaftshelden.io",
      "Landschaftshelden",
      `Glabau ${city}`,
    ],
  };
}

const Page = async ({ params }: { params: Promise<{ city: string }> }) => {
  const { city } = await params;

  try {
    const companys = await getAllCompanysFromDatabaseByCity(city);

    if (companys.length === 0) {
      return (
        <div className='container mx-auto py-24 text-center'>
          <h1 className='text-2xl font-bold'>Unternehmen nicht gefunden</h1>
          <p className='text-gray-600 mt-4'>
            Wir konnten keine Unternehmen in dieser Stadt finden. Bitte
            überprüfen Sie die URL oder versuchen Sie es mit einer anderen
            Stadt.
          </p>
          <Link href='/' className='text-primary underline mt-6 inline-block'>
            Zurück zur Startseite
          </Link>
        </div>
      );
    }

    return (
      <div className='md:max-w-7xl mx-auto py-12 max-md:p-4'>
        {/* H1 Headline */}
        <h1 className='text-3xl font-bold'>
          Garten- und Lanschaftsbeuer in {city} – GaLaBauer im Überblick
        </h1>

        <Headings level={4} className='mb-6'>
          Wählen Sie eine Dienstleistung aus oder finden Sie unten die besten
          Ladnschaftshelden aus Ihrer Stadt.
        </Headings>

        {/* Einleitung */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {getGalbauServices().map((service) => (
            <Link
              href={`/${city}/${slugify(service)}`}
              key={service}
              className=' bg-green-500 p-4 rounded-xl flex items-center justify-center'>
              <span className='text-white md:text-lg font-semibold text-center text-[12px]'>
                {service}
              </span>
            </Link>
          ))}
        </div>

        {/* Ergebnisse */}
        <div className='mt-12 md:w-7xl'>
          <></>
          <ul className='space-y-6 md:space-y-2'>
            <SearchBarResults loading={false} results={companys} />
          </ul>
        </div>

        {/* Fließtext */}
        <div className='mt-12 prose max-w-none'>
          <p>
            Wenn Sie auf der Suche nach einem erfahrenen Anbieter für{" "}
            <strong>Garten- und Landschaftsbau in {city}</strong> sind, sind Sie
            hier genau richtig. Auf Reinigungshelden.io finden Sie eine
            sorgfältig zusammengestellte Auswahl an Fachbetrieben in Ihrer
            Region. Ob Gartenpflege, Neubepflanzung oder Pflasterarbeiten – die{" "}
            <strong>Garten- und Landschaftsbauer aus {city}</strong> bieten
            professionelle Lösungen für private und gewerbliche Außenanlagen.
          </p>
          <p>
            Vertrauen Sie auf die Fachkompetenz unserer{" "}
            <strong>Garten- und Landschaftsbau-Experten in {city}</strong> und
            holen Sie sich noch heute ein individuelles Angebot ein. Vergleichen
            Sie Leistungen, Bewertungen und Preise bequem online.
          </p>
        </div>

        {/* FAQ Sektion */}
        <div className='mt-16'>
          <h2 className='text-2xl font-semibold mb-4'>
            Häufige Fragen zum Garten- und Landschaftsbau in {city}
          </h2>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='faq-1'>
              <AccordionTrigger>
                Was kostet Garten- und Landschaftsbau in {city}?
              </AccordionTrigger>
              <AccordionContent>
                Die Kosten für{" "}
                <strong>Garten- und Landschaftsbau in {city}</strong> hängen vom
                Projektumfang, den verwendeten Materialien und der Größe der
                Fläche ab. Viele Betriebe bieten unverbindliche Beratung und
                maßgeschneiderte Angebote an.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value='faq-2'>
              <AccordionTrigger>
                Welche Leistungen bieten Garten- und Landschaftsbauer in {city}{" "}
                an?
              </AccordionTrigger>
              <AccordionContent>
                Typische Leistungen umfassen Gartenneuanlage, Wege- und
                Terrassenbau, Pflanzarbeiten, Rasenpflege sowie Zaun- und
                Mauerbau. Viele{" "}
                <strong>Garten- und Landschaftsbauer in {city}</strong> bieten
                auch kreative Gestaltungslösungen für Privatgärten und
                Firmengelände.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value='faq-3'>
              <AccordionTrigger>
                Wie finde ich den besten Garten- und Landschaftsbauer in {city}?
              </AccordionTrigger>
              <AccordionContent>
                Auf Reinigungshelden.io können Sie verschiedene{" "}
                <strong>
                  Fachbetriebe für Garten- und Landschaftsbau in {city}
                </strong>{" "}
                vergleichen, Kundenbewertungen lesen und direkt Kontakt
                aufnehmen. So finden Sie schnell den passenden Partner für Ihr
                Projekt.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Fehler beim Laden der Unternehmensdaten:", error);
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Fehler beim Laden der Daten</h1>
        <p className='text-gray-600 mt-4'>
          Es gab einen Fehler. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }
};

export default Page;
