import { getCompaniesByCityAndService } from "@/actions/companyActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { deslugify } from "@/utils/slugify";
import { getGalbauBranches } from "@/statics/Lists";
import Link from "next/link";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const deslugifiedService = deslugify(service);

  return {
    title: `TOP ${deslugifiedService} in ${city} | Kostenlose Angebote - Landschaftshelden.io`,
    description: `Die besten Anbieter für ${deslugifiedService} in ${city}. Jetzt kostenlosen Auftrag erstellen und bis zu 5 Angebote von geprüften Galabau-Betrieben erhalten.`,
    keywords: [
      `${deslugifiedService} ${city}`,
      `${deslugifiedService} in ${city}`,
      `Garten Landschaftsbau ${city}`,
      `GaLaBau ${deslugifiedService} ${city}`,
      `Beste ${deslugifiedService} ${city}`,
      "Kostenlose Angebote",
      "Auftrag erstellen",
      "Landschaftshelden",
      `Galabau ${city}`,
      `Landschaftsgärtner ${city}`,
    ],
    openGraph: {
      title: `TOP ${deslugifiedService} in ${city} | Kostenlose Angebote`,
      description: `Finden Sie die besten Anbieter für ${deslugifiedService} in ${city}. Kostenlos Auftrag erstellen und professionelle Angebote erhalten.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://landschaftshelden.io/stadt/${city}/${service}`,
    },
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
      <div className='container mx-auto py-24 px-4'>
        {/* SEO Hero Section for No Results */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold mb-6'>
            {deslugifiedService} in {city}
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
            Suchen Sie professionelle{" "}
            <strong>
              {deslugifiedService} in {city}
            </strong>
            ? Erstellen Sie jetzt kostenlos einen Auftrag und erhalten Sie bis
            zu 5 Angebote von qualifizierten Betrieben aus Ihrer Region.
          </p>

          {/* Call-to-Action Button */}
          <div className='flex justify-center mb-12'>
            <Link
              href={`/auftrag-erstellen?service=${encodeURIComponent(
                deslugifiedService
              )}&city=${city}`}
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
              🚀 Jetzt kostenlosen Auftrag für {deslugifiedService} erstellen
            </Link>
          </div>
        </div>

        {/* Local SEO Content */}
        <div className='prose max-w-none mb-12'>
          <h2>
            Professionelle {deslugifiedService} in {city} finden
          </h2>
          <p>
            Sie benötigen{" "}
            <strong>
              {deslugifiedService} in {city}
            </strong>{" "}
            und möchten den besten Anbieter finden? Landschaftshelden.io macht
            es Ihnen einfach: Mit nur einem kostenlosen Auftrag erreichen Sie
            mehrere qualifizierte Galabau-Betriebe und erhalten die besten
            Angebote für Ihr Projekt.
          </p>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-6'>
            <h4 className='text-green-800 font-semibold mb-3'>
              🌱 Warum Landschaftshelden.io für {deslugifiedService} in {city}?
            </h4>
            <ul className='text-green-700 space-y-2'>
              <li>
                ✅ <strong>100% kostenlos</strong> – Keine versteckten Gebühren
              </li>
              <li>
                ✅ <strong>Schnell & einfach</strong> – Auftrag in 2 Minuten
                erstellt
              </li>
              <li>
                ✅ <strong>Geprüfte Betriebe</strong> – Nur seriöse Garten- und
                Landschaftsbauer
              </li>
              <li>
                ✅ <strong>Bis zu 5 Angebote</strong> – Beste Preise für Ihr
                Projekt
              </li>
              <li>
                ✅ <strong>Lokale Experten</strong> – Betriebe aus {city} und
                Umgebung
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center'>
          <h2 className='text-2xl font-bold mb-4'>
            Bereit für Ihr {deslugifiedService}-Projekt in {city}?
          </h2>
          <p className='text-lg mb-6 opacity-90'>
            Kostenlos · Unverbindlich · In 2 Minuten erledigt
          </p>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              deslugifiedService
            )}&city=${city}`}
            className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
            Jetzt kostenlosen Auftrag erstellen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto py-12 px-4'>
      {/* SEO-optimized Hero Section */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4'>
          TOP {companys.length} Anbieter für {deslugifiedService} in {city}
        </h1>
        <p className='text-xl text-gray-600 mb-6 max-w-4xl mx-auto'>
          Vergleichen Sie die besten{" "}
          <strong>
            {deslugifiedService}-Anbieter in {city}
          </strong>
          . Erstellen Sie kostenlos einen Auftrag und erhalten Sie bis zu 5
          professionelle Angebote von geprüften Galabau-Betrieben aus Ihrer
          Region.
        </p>

        {/* Primary CTA */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              deslugifiedService
            )}&city=${city}`}
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors inline-flex items-center justify-center'>
            🚀 Kostenlosen Auftrag für {deslugifiedService} erstellen
          </Link>
          <Link
            href={`/stadt/${city}`}
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center'>
            📋 Alle Services in {city} ansehen
          </Link>
        </div>
      </div>

      {/* Featured Companies */}
      <div className='mb-12'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-semibold'>
            Empfohlene {deslugifiedService}-Anbieter in {city}
          </h2>
        </div>

        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <p className='text-blue-800 text-center'>
            <strong>💡 Tipp:</strong> Erstellen Sie einen kostenlosen Auftrag
            für {deslugifiedService}
            und lassen Sie sich von mehreren Betrieben unverbindlich beraten. So
            finden Sie das beste Angebot für Ihr Projekt!
          </p>
        </div>

        <SearchBarResults loading={false} results={companys} />
      </div>

      {/* Local SEO Content */}
      <div className='prose max-w-none mb-12'>
        <h2>
          Professionelle {deslugifiedService} in {city} – Ihr Weg zum perfekten
          Ergebnis
        </h2>
        <p>
          Sie planen ein{" "}
          <strong>
            {deslugifiedService}-Projekt in {city}
          </strong>{" "}
          und suchen den richtigen Partner? Landschaftshelden.io macht es Ihnen
          einfach: Mit nur einem Auftrag erreichen Sie mehrere qualifizierte
          <strong>
            {" "}
            {deslugifiedService}-Experten in {city}
          </strong>{" "}
          und können die besten Angebote vergleichen.
        </p>

        <h3>
          Warum sollten Sie mehrere Angebote für {deslugifiedService} einholen?
        </h3>
        <p>
          Bei{" "}
          <strong>
            {deslugifiedService}-Projekten in {city}
          </strong>{" "}
          können die Preise stark variieren. Durch den Vergleich mehrerer
          Angebote sparen Sie nicht nur Geld, sondern finden auch den Betrieb,
          der am besten zu Ihren Vorstellungen passt.
        </p>

        <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-6'>
          <h4 className='text-green-800 font-semibold mb-3'>
            🌱 Vorteile für Ihr {deslugifiedService}-Projekt:
          </h4>
          <ul className='text-green-700 space-y-2'>
            <li>
              ✅ <strong>Spezialisierte Experten</strong> – Nur qualifizierte{" "}
              {deslugifiedService}-Anbieter
            </li>
            <li>
              ✅ <strong>Kostenloser Vergleich</strong> – Bis zu 5 Angebote ohne
              Gebühren
            </li>
            <li>
              ✅ <strong>Lokale Betriebe</strong> – Kurze Anfahrtswege aus{" "}
              {city} und Umgebung
            </li>
            <li>
              ✅ <strong>Transparente Preise</strong> – Faire Kostenvoranschläge
            </li>
            <li>
              ✅ <strong>Geprüfte Qualität</strong> – Nur seriöse Garten- und
              Landschaftsbauer
            </li>
          </ul>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center mb-12'>
        <h2 className='text-2xl md:text-3xl font-bold mb-4'>
          Bereit für Ihr {deslugifiedService}-Projekt in {city}?
        </h2>
        <p className='text-xl mb-6 opacity-90'>
          Kostenlos · Unverbindlich · In 2 Minuten erledigt
        </p>
        <Link
          href={`/auftrag-erstellen?service=${encodeURIComponent(
            deslugifiedService
          )}&city=${city}`}
          className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
          Jetzt kostenlosen Auftrag erstellen
        </Link>
      </div>

      {/* FAQ Section */}
      <div className='mb-12'>
        <h2 className='text-2xl font-semibold mb-6 text-center'>
          Häufige Fragen zu {deslugifiedService} in {city}
        </h2>
        <Accordion type='single' collapsible className='max-w-4xl mx-auto'>
          <AccordionItem value='faq-1'>
            <AccordionTrigger>
              Was kostet {deslugifiedService} in {city}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Die Kosten für{" "}
                <strong>
                  {deslugifiedService} in {city}
                </strong>{" "}
                hängen von der Projektgröße, den verwendeten Materialien und dem
                Leistungsumfang ab. Durch den Vergleich mehrerer Angebote
                erhalten Sie transparente Preise und können bis zu 30% sparen.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-2'>
            <AccordionTrigger>
              Wie finde ich den besten {deslugifiedService}-Anbieter in {city}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Der beste Weg ist ein direkter Vergleich mehrerer Anbieter. Mit
                Landschaftshelden.io können Sie kostenlos einen Auftrag für
                {deslugifiedService} erstellen und erhalten bis zu 5
                professionelle Angebote von geprüften Betrieben aus {city} und
                Umgebung.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-3'>
            <AccordionTrigger>
              Wie schnell erhalte ich Angebote für {deslugifiedService} in{" "}
              {city}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Nach der Erstellung Ihres kostenlosen Auftrags werden
                qualifizierte
                {deslugifiedService}-Betriebe in {city} automatisch
                benachrichtigt. Die ersten Angebote erhalten Sie meist bereits
                innerhalb von 24 Stunden.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-4'>
            <AccordionTrigger>
              Bieten die Unternehmen in {city} auch individuelle{" "}
              {deslugifiedService}-Lösungen an?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Ja, alle gelisteten Betriebe bieten maßgeschneiderte Lösungen
                für
                {deslugifiedService} – von der Planung über die Umsetzung bis
                hin zur langfristigen Betreuung Ihres Projekts in {city}.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Final CTA */}
      <div className='text-center bg-gray-50 rounded-xl p-8'>
        <h2 className='text-2xl font-bold mb-4'>
          Starten Sie jetzt Ihr {deslugifiedService}-Projekt in {city}
        </h2>
        <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
          Über 1.000 Kunden haben bereits erfolgreich ihre Garten-Projekte
          realisiert. Werden auch Sie zum zufriedenen Landschaftshelden-Kunden!
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              deslugifiedService
            )}&city=${city}`}
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
            🚀 Kostenlosen Auftrag erstellen
          </Link>
          <Link
            href={`/stadt/${city}`}
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors'>
            📋 Alle Services in {city} ansehen
          </Link>
        </div>
      </div>

      {/* Branchen-spezifische Unterseiten Links */}
      <div className='mt-16 border-t pt-12'>
        <h2 className='text-2xl font-semibold mb-6 text-center'>
          {deslugifiedService} in {city} nach Branchen
        </h2>
        <p className='text-gray-600 text-center mb-8 max-w-3xl mx-auto'>
          Finden Sie spezialisierten {deslugifiedService} für Ihre Branche in{" "}
          {city}. Unsere Partner-Betriebe haben Erfahrung mit den besonderen
          Anforderungen verschiedener Geschäftsbereiche.
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {getGalbauBranches().map((branche) => (
            <Link
              href={`/stadt/${city}/${service}/${branche
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[äöüß]/g, (match) => {
                  const replacements: { [key: string]: string } = {
                    ä: "ae",
                    ö: "oe",
                    ü: "ue",
                    ß: "ss",
                  };
                  return replacements[match] || match;
                })}`}
              key={branche}
              className='bg-white border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md group'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900 group-hover:text-green-600 transition-colors'>
                    {deslugifiedService} für {branche}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Spezialisierte Anbieter in {city}
                  </p>
                </div>
                <div className='text-green-500 group-hover:text-green-600 transition-colors'>
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className='text-center mt-8'>
          <p className='text-gray-600 text-sm mb-4'>
            Diese spezialisierten Seiten helfen Ihnen, {deslugifiedService}
            -Anbieter in {city} zu finden, die Erfahrung mit den spezifischen
            Anforderungen Ihrer Branche haben.
          </p>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              deslugifiedService
            )}&city=${city}`}
            className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block'>
            Oder direkt kostenlosen Auftrag erstellen
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Page;
