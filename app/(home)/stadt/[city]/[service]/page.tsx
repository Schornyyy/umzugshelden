import { getCompaniesByCityAndService } from "@/actions/companyActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
import Headings from "@/components/Headings";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { deslugify } from "@/utils/slugify";
import Link from "next/link";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;

  return {
    title: `${service} in ${city} - Landschaftshelden.io`,
    description: `Finde ${service} in ${city} auf Landschaftshelden.io`,
    keywords: [
      `Gartenbau ${service} in ${city}`,
      `Landschaftsbau ${service} in ${city}`,
      "Garten- und Landschaftsbau",
      "Landschaftshelden.io",
      "Landschaftshelden",
      `Landschaftshelden ${city}`,
      `Landschaftshelden ${city} Gartenbau`,
      `Landschaftshelden ${city} Landschaftsbau`,
      `${service} ${city}`,
      `${service} ${city} Gartenbauunternehmen`,
      `${service} in ${city}`,
    ],
  };
}

const Page = async ({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) => {
  const { city } = await params;
  const { service } = await params;
  const deslugifiedService = deslugify(service);

  let companys = [];

  try {
    companys = await getCompaniesByCityAndService(city, deslugifiedService);
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

  if (companys.length === 0) {
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Keine Unternehmen gefunden</h1>
        <p className='text-gray-600 mt-4'>
          In {city} konnten wir aktuell kein Unternehmen für{" "}
          <strong>{deslugifiedService}</strong> finden. Bitte überprüfen Sie die
          Schreibweise oder versuchen Sie eine andere Dienstleistung.
        </p>
        <Link href='/' className='text-primary underline mt-6 inline-block'>
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className='md:max-w-7xl mx-auto py-12 max-md:p-4'>
      {/* Headline */}
      <h1 className='text-3xl font-bold'>
        {deslugifiedService.charAt(0).toUpperCase() +
          deslugifiedService.slice(1)}{" "}
        in {city} – geprüfte Garten- und Landschaftsbauer im Überblick
      </h1>

      <Headings level={4} className='mb-6'>
        Hier finden Sie professionelle Gartenbau- und Landschaftsbau-Betriebe
        für {service} in {city}.
      </Headings>

      {/* Ergebnisse */}
      <div className='mt-12 md:w-7xl'>
        <ul className='space-y-6 md:space-y-2'>
          <SearchBarResults loading={false} results={companys} />
        </ul>
      </div>

      {/* SEO Text */}
      <div className='mt-12 prose max-w-none'>
        <p>
          Sie suchen nach <strong>{deslugifiedService}</strong> in{" "}
          <strong>{city}</strong>? Bei Landschaftshelden.io finden Sie eine
          Auswahl qualifizierter Garten- und Landschaftsbau-Fachbetriebe, die
          genau auf Ihre Anforderungen zugeschnitten sind. Ob Privatgarten oder
          gewerbliches Außengelände – hier finden Sie den passenden Partner.
        </p>
        <p>
          Unsere gelisteten Unternehmen bieten professionelle Leistungen im
          Bereich <strong>{deslugifiedService}</strong>. Vergleichen Sie
          Angebote, Kundenbewertungen und nehmen Sie direkt Kontakt mit einem
          passenden Anbieter auf.
        </p>
      </div>

      {/* FAQ */}
      <div className='mt-16'>
        <h2 className='text-2xl font-semibold mb-4'>
          Häufige Fragen zu {deslugifiedService} in {city}
        </h2>
        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='faq-1'>
            <AccordionTrigger>
              Was kostet {deslugifiedService} in {city}?
            </AccordionTrigger>
            <AccordionContent>
              Die Kosten für <strong>{deslugifiedService}</strong> hängen von
              der Projektgröße, den verwendeten Materialien und dem
              Leistungsumfang ab. Holen Sie sich ein individuelles Angebot ein.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-2'>
            <AccordionTrigger>
              Wie finde ich den besten Garten- und Landschaftsbauer in {city}?
            </AccordionTrigger>
            <AccordionContent>
              Nutzen Sie Landschaftshelden.io, um Anbieter in Ihrer Region zu
              vergleichen. Lesen Sie Bewertungen, prüfen Sie Referenzen und
              kontaktieren Sie direkt Ihren Wunschbetrieb.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-3'>
            <AccordionTrigger>
              Bieten die Unternehmen in {city} auch individuelle Lösungen an?
            </AccordionTrigger>
            <AccordionContent>
              Ja, viele Garten- und Landschaftsbauer bieten maßgeschneiderte
              Lösungen – von der Planung über die Umsetzung bis hin zur
              langfristigen Pflege Ihrer Außenanlage.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Page;
