import { getCompaniesByCityAndService } from "@/actions/companyActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
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
  params: Promise<{ city: string; service: string; branche: string }>;
}) {
  const { city, service, branche } = await params;
  const serviceDes = deslugify(service);
  const branchDes = deslugify(branche);
  const capitalizedService =
    serviceDes.charAt(0).toUpperCase() + serviceDes.slice(1);
  const capitalizedBranch =
    branchDes.charAt(0).toUpperCase() + branchDes.slice(1);

  return {
    title: `TOP ${capitalizedService} in ${city} für ${capitalizedBranch} | Kostenlose Angebote - Landschaftshelden.io`,
    description: `Die besten ${capitalizedService}-Anbieter in ${city} für ${capitalizedBranch}. Jetzt kostenlosen Auftrag erstellen und bis zu 5 Angebote von spezialisierten Galabau-Betrieben erhalten.`,
    keywords: [
      `${capitalizedService} ${city} ${capitalizedBranch}`,
      `${serviceDes} Anbieter ${city} für ${branchDes}`,
      `${capitalizedService} für ${capitalizedBranch} ${city}`,
      `GaLaBau ${serviceDes} ${city}`,
      `Beste ${serviceDes} ${city}`,
      "Kostenlose Angebote",
      "Auftrag erstellen",
      "Landschaftshelden",
      `Galabau ${city}`,
      `Landschaftsgärtner ${city}`,
    ],
    alternates: {
      canonical: `https://www.landschaftshelden.io/stadt/${city}/${service}/${branche}`,
    },
    openGraph: {
      title: `TOP ${capitalizedService} in ${city} für ${capitalizedBranch}`,
      description: `Finden Sie spezialisierte ${capitalizedService}-Anbieter in ${city} für ${capitalizedBranch}. Kostenlos Auftrag erstellen und professionelle Angebote erhalten.`,
      type: "website",
      locale: "de_DE",
      url: `https://www.landschaftshelden.io/stadt/${city}/${service}/${branche}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${capitalizedService} in ${city} für ${capitalizedBranch}`,
      description: `Spezialisierte ${serviceDes}-Dienstleister in ${city} für ${branchDes}. Jetzt vergleichen und Auftrag erstellen.`,
    },
  };
}

const Page = async ({
  params,
}: {
  params: Promise<{ city: string; service: string; branche: string }>;
}) => {
  const { city, service, branche } = await params;
  const servicedes = deslugify(service);
  const branchdes = deslugify(branche);
  const capitalizedService =
    servicedes.charAt(0).toUpperCase() + servicedes.slice(1);
  const capitalizedBranch =
    branchdes.charAt(0).toUpperCase() + branchdes.slice(1);

  let companys = [];

  try {
    companys = await getCompaniesByCityAndService(city, servicedes);
  } catch (error) {
    console.error("Fehler beim Laden der Unternehmensdaten:", error);
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Fehler beim Laden der Daten</h1>
        <p className='text-gray-600 mt-4'>
          Bitte versuchen Sie es später erneut.
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
            {capitalizedService} in {city} für {capitalizedBranch}
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
            Suchen Sie spezialisierte{" "}
            <strong>
              {capitalizedService} in {city} für {capitalizedBranch}
            </strong>
            ? Erstellen Sie jetzt kostenlos einen Auftrag und erhalten Sie bis
            zu 5 Angebote von qualifizierten Betrieben aus Ihrer Region.
          </p>

          {/* Call-to-Action Button */}
          <div className='flex justify-center mb-12'>
            <Link
              href={`/auftrag-erstellen?service=${encodeURIComponent(
                servicedes
              )}&city=${city}&branche=${encodeURIComponent(branchdes)}`}
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
              🚀 Jetzt kostenlosen Auftrag für {capitalizedBranch} erstellen
            </Link>
          </div>
        </div>

        {/* Local SEO Content */}
        <div className='prose max-w-none mb-12'>
          <h2>
            Spezialisierte {capitalizedService} in {city} für{" "}
            {capitalizedBranch}
          </h2>
          <p>
            Sie benötigen{" "}
            <strong>
              {capitalizedService} in {city}
            </strong>{" "}
            speziell für
            <strong> {capitalizedBranch}</strong>? Landschaftshelden.io
            verbindet Sie kostenlos mit spezialisierten Galabau-Betrieben, die
            Erfahrung in Ihrer Branche haben und maßgeschneiderte Lösungen
            anbieten.
          </p>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-6'>
            <h4 className='text-green-800 font-semibold mb-3'>
              🌱 Warum spezialisierte Anbieter für {capitalizedBranch}?
            </h4>
            <ul className='text-green-700 space-y-2'>
              <li>
                ✅ <strong>Branchenspezifische Expertise</strong> – Erfahrung
                mit {capitalizedBranch}
              </li>
              <li>
                ✅ <strong>Maßgeschneiderte Lösungen</strong> – Angepasst an
                Ihre Anforderungen
              </li>
              <li>
                ✅ <strong>Kostenlose Beratung</strong> – Individuelle
                Projektplanung
              </li>
              <li>
                ✅ <strong>Lokale Experten</strong> – Betriebe aus {city} und
                Umgebung
              </li>
              <li>
                ✅ <strong>Transparente Preise</strong> – Bis zu 5 Angebote zum
                Vergleich
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center'>
          <h2 className='text-2xl font-bold mb-4'>
            Bereit für Ihr {capitalizedService}-Projekt für {capitalizedBranch}{" "}
            in {city}?
          </h2>
          <p className='text-lg mb-6 opacity-90'>
            Kostenlos · Unverbindlich · In 2 Minuten erledigt
          </p>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              servicedes
            )}&city=${city}&branche=${encodeURIComponent(branchdes)}`}
            className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
            Jetzt kostenlosen Auftrag erstellen
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${capitalizedService} in ${city} für ${capitalizedBranch}`,
    description: `Vergleichen Sie Anbieter für ${capitalizedService} in ${city} für ${capitalizedBranch} auf Reinigungshelden.io – schnell, kostenlos & transparent.`,
    provider: {
      "@type": "Organization",
      name: "Reinigungshelden.io",
      url: "https://www.reinigungshelden.io",
      logo: "https://www.reinigungshelden.io/logo.png",
    },
    serviceType: capitalizedService,
    areaServed: {
      "@type": "City",
      name: city,
    },
    audience: {
      "@type": "Audience",
      audienceType: capitalizedBranch,
    },
    url: `https://www.reinigungshelden.io/${city}/${servicedes}/${branchdes}`,
  };

  return (
    <div className='max-w-7xl mx-auto py-12 px-4'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* SEO-optimized Hero Section */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4'>
          TOP {companys.length} {capitalizedService}-Anbieter in {city} für{" "}
          {capitalizedBranch}
        </h1>
        <p className='text-xl text-gray-600 mb-6 max-w-4xl mx-auto'>
          Vergleichen Sie die besten{" "}
          <strong>
            {capitalizedService}-Spezialisten in {city} für {capitalizedBranch}
          </strong>
          . Erstellen Sie kostenlos einen Auftrag und erhalten Sie bis zu 5
          professionelle Angebote von erfahrenen Galabau-Betrieben.
        </p>

        {/* Primary CTA */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              servicedes
            )}&city=${city}&branche=${encodeURIComponent(branchdes)}`}
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors inline-flex items-center justify-center'>
            🚀 Kostenlosen Auftrag für {capitalizedBranch} erstellen
          </Link>
          <Link
            href={`/stadt/${city}/${service}`}
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center'>
            📋 Alle {capitalizedService} in {city} ansehen
          </Link>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className='text-sm text-gray-600 mb-8' aria-label='Breadcrumb'>
        <ol className='list-none p-0 inline-flex space-x-2 flex-wrap'>
          <li>
            <Link href='/' className='text-green-600 hover:underline'>
              Landschaftshelden.io
            </Link>
            <span className='mx-2'>/</span>
          </li>
          <li>
            <Link
              href={`/stadt/${city}`}
              className='text-green-600 hover:underline capitalize'>
              {city}
            </Link>
            <span className='mx-2'>/</span>
          </li>
          <li>
            <Link
              href={`/stadt/${city}/${service}`}
              className='text-green-600 hover:underline capitalize'>
              {deslugify(service)}
            </Link>
            <span className='mx-2'>/</span>
          </li>
          <li className='text-gray-500 capitalize' aria-current='page'>
            {deslugify(branche)}
          </li>
        </ol>
      </nav>

      {/* Featured Companies */}
      <div className='mb-12'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-semibold'>
            Spezialisierte {capitalizedService}-Anbieter für {capitalizedBranch}
          </h2>
        </div>

        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <p className='text-blue-800 text-center'>
            <strong>💡 Branchenexpertise:</strong> Diese Betriebe haben
            spezielle Erfahrung mit
            {capitalizedService} für {capitalizedBranch} und bieten
            maßgeschneiderte Lösungen für Ihre individuellen Anforderungen.
          </p>
        </div>

        <SearchBarResults loading={false} results={companys} />
      </div>

      {/* Local SEO Content */}
      <div className='prose max-w-none mb-12'>
        <h2>
          Spezialisierte {capitalizedService} in {city} für {capitalizedBranch}{" "}
          – Ihre Experten vor Ort
        </h2>
        <p>
          Sie suchen nach{" "}
          <strong>
            {capitalizedService} in {city}
          </strong>{" "}
          mit speziellem Know-how für
          <strong> {capitalizedBranch}</strong>? Bei Landschaftshelden.io finden
          Sie qualifizierte Garten- und Landschaftsbau-Fachbetriebe, die genau
          auf die Anforderungen Ihrer Branche zugeschnitten sind.
        </p>

        <h3>Warum branchenspezifische Expertise wichtig ist</h3>
        <p>
          <strong>{capitalizedBranch}</strong> stellt besondere Anforderungen an
          <strong> {capitalizedService}</strong>. Unsere Partner-Betriebe in{" "}
          {city} verstehen diese spezifischen Bedürfnisse und bieten
          maßgeschneiderte Lösungen, die genau zu Ihrem Geschäftsbereich passen.
        </p>

        <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-6'>
          <h4 className='text-green-800 font-semibold mb-3'>
            🌱 Vorteile spezialisierter {capitalizedService}-Anbieter für{" "}
            {capitalizedBranch}:
          </h4>
          <ul className='text-green-700 space-y-2'>
            <li>
              ✅ <strong>Branchenspezifische Erfahrung</strong> – Verstehen die
              Anforderungen von {capitalizedBranch}
            </li>
            <li>
              ✅ <strong>Maßgeschneiderte Konzepte</strong> – Lösungen speziell
              für Ihre Branche entwickelt
            </li>
            <li>
              ✅ <strong>Compliance & Standards</strong> – Kenntnis
              branchenrelevanter Vorschriften
            </li>
            <li>
              ✅ <strong>Effiziente Umsetzung</strong> – Optimierte
              Arbeitsabläufe für {capitalizedBranch}
            </li>
            <li>
              ✅ <strong>Langfristige Betreuung</strong> – Nachhaltige Pflege-
              und Wartungskonzepte
            </li>
          </ul>
        </div>

        <h3>
          So finden Sie den richtigen {capitalizedService}-Partner für{" "}
          {capitalizedBranch} in {city}
        </h3>
        <p>
          Mit Landschaftshelden.io ist es einfach: Erstellen Sie kostenlos einen
          Auftrag und beschreiben Sie Ihre spezifischen Anforderungen als{" "}
          <strong>{capitalizedBranch}</strong>. Sie erhalten bis zu 5
          maßgeschneiderte Angebote von erfahrenen Betrieben aus {city}
          und Umgebung.
        </p>
      </div>

      {/* Call-to-Action Section */}
      <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center mb-12'>
        <h2 className='text-2xl md:text-3xl font-bold mb-4'>
          Bereit für Ihr {capitalizedService}-Projekt für {capitalizedBranch} in{" "}
          {city}?
        </h2>
        <p className='text-xl mb-6 opacity-90'>
          Kostenlos · Unverbindlich · Branchenspezifisch
        </p>
        <Link
          href={`/auftrag-erstellen?service=${encodeURIComponent(
            servicedes
          )}&city=${city}&branche=${encodeURIComponent(branchdes)}`}
          className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
          Jetzt kostenlosen Auftrag erstellen
        </Link>
      </div>

      {/* FAQ Section */}
      <div className='mb-12'>
        <h2 className='text-2xl font-semibold mb-6 text-center'>
          Häufige Fragen zu {capitalizedService} in {city} für{" "}
          {capitalizedBranch}
        </h2>
        <Accordion type='single' collapsible className='max-w-4xl mx-auto'>
          <AccordionItem value='faq-1'>
            <AccordionTrigger>
              Was kostet {capitalizedService} in {city} für {capitalizedBranch}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Die Preise für{" "}
                <strong>
                  {capitalizedService} in {city}
                </strong>{" "}
                für
                <strong> {capitalizedBranch}</strong> hängen von der
                Projektgröße, den spezifischen Anforderungen Ihrer Branche und
                dem gewünschten Leistungsumfang ab. Durch den Vergleich mehrerer
                Angebote erhalten Sie transparente, branchenspezifische Preise.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-2'>
            <AccordionTrigger>
              Gibt es spezialisierte {capitalizedService}-Anbieter für{" "}
              {capitalizedBranch} in {city}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Ja, viele Galabau-Betriebe in {city} haben sich auf die
                spezifischen Anforderungen von{" "}
                <strong>{capitalizedBranch}</strong> spezialisiert. Sie
                verstehen die besonderen Bedürfnisse Ihrer Branche und bieten
                maßgeschneiderte {capitalizedService}-Lösungen.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-3'>
            <AccordionTrigger>
              Wie schnell erhalte ich Angebote für {capitalizedService} für{" "}
              {capitalizedBranch} in {city}?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Nach der Erstellung Ihres kostenlosen Auftrags werden
                spezialisierte Betriebe für <strong>{capitalizedBranch}</strong>{" "}
                in {city} automatisch benachrichtigt. Die ersten
                branchenspezifischen Angebote erhalten Sie meist bereits
                innerhalb von 24 Stunden.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='faq-4'>
            <AccordionTrigger>
              Welche besonderen Vorteile bieten branchenspezifische{" "}
              {capitalizedService}-Anbieter?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Spezialisierte Anbieter für <strong>{capitalizedBranch}</strong>{" "}
                verstehen die einzigartigen Anforderungen Ihrer Branche, kennen
                relevante Vorschriften und Standards und können effizientere,
                kostenoptimierte Lösungen für
                {capitalizedService} in {city} anbieten.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Final CTA */}
      <div className='text-center bg-gray-50 rounded-xl p-8'>
        <h2 className='text-2xl font-bold mb-4'>
          Starten Sie jetzt Ihr {capitalizedService}-Projekt für{" "}
          {capitalizedBranch} in {city}
        </h2>
        <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
          Profitieren Sie von der Erfahrung spezialisierter Galabau-Betriebe,
          die genau verstehen, was {capitalizedBranch} für erfolgreiche{" "}
          {capitalizedService}-Projekte benötigt.
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href={`/auftrag-erstellen?service=${encodeURIComponent(
              servicedes
            )}&city=${city}&branche=${encodeURIComponent(branchdes)}`}
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors'>
            🚀 Kostenlosen Auftrag erstellen
          </Link>
          <Link
            href={`/stadt/${city}/${service}`}
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors'>
            📋 Alle {capitalizedService} in {city} ansehen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
