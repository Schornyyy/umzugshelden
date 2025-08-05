import Image from "next/image";
import React from "react";
import { bulletPointsCard } from "@/statics/Lists";
import Link from "next/link";
import Headings from "@/components/Headings";
import ServiceSearchBar from "@/components/ServiceSearchBar";

export async function generateMetadata() {
  // Hier kannst du auch dynamisch Metadaten erstellen, z. B. aus einer Datenquelle
  return {
    title:
      "Landschaftshelden - Kostenlos Garten-Auftrag erstellen & Top-Angebote erhalten",
    description:
      "Erstellen Sie kostenlos Ihren Garten-Auftrag und erhalten Sie professionelle Angebote von geprüften Garten- & Landschaftsbauern in Ihrer Region!",
    openGraph: {
      title:
        "Landschaftshelden - Kostenlos Garten-Auftrag erstellen & Top-Angebote erhalten",
      description:
        "Erstellen Sie kostenlos Ihren Garten-Auftrag und erhalten Sie professionelle Angebote von geprüften Garten- & Landschaftsbauern in Ihrer Region!",
      url: "https://landschaftshelden.io",
      images: [
        {
          url: "/images/JobSmith_hero.png",
          width: 750,
          height: 350,
          alt: "Landschaftshelden Hero",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Landschaftshelden - Kostenlos Garten-Auftrag erstellen & Top-Angebote erhalten",
      description:
        "Erstellen Sie kostenlos Ihren Garten-Auftrag und erhalten Sie professionelle Angebote von geprüften Garten- & Landschaftsbauern in Ihrer Region!",
      image: "/images/JobSmith_hero.png",
    },
  };
}

const page = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="w-full bg-[url('/images/lanschaftshelden_hero_background.png')] bg-cover bg-bottom flex items-end justify-center py-24 relative">
        {/* Dark overlay filter */}
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>
        <div className='flex flex-col gap-6 items-center max-w-4xl w-full px-4 relative z-10'>
          <Headings level={1} className='w-full text-center text-white'>
            Landschaftshelden - Ihr Auftrag, unsere Top-Unternehmen
          </Headings>
          <div className='flex flex-col gap-4 w-full'>
            <Headings level={3} className='text-center text-white'>
              Erstellen Sie Ihren Auftrag und erhalten Sie Angebote von
              geprüften Garten- & Landschaftsbauern
            </Headings>

            {/* Service Search Bar */}
            <div className='w-full flex justify-center'>
              <ServiceSearchBar
                placeholder='Beschreiben Sie Ihr Gartenprojekt...'
                className='w-full'
                redirectPath='/auftrag-erstellen'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto flex flex-col gap-12 px-4 md:py-24 max-md:mt-12'>
        {/* Bullet Points */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 my-12 justify-items-center'>
          {bulletPointsCard.map((item, index) => (
            <div
              key={index}
              className='grid grid-rows-3 items-center justify-center gap-4 p-4 rounded-md shadow-2xl bg-white w-full max-w-[300px]'>
              <h3 className='text-xl font-bold text-center'>{item.title}</h3>
              <p className='text-base text-center'>{item.description}</p>
              <Image
                alt={item.title}
                src={item.iconPath}
                width={32}
                height={32}
              />
            </div>
          ))}
        </div>

        {/* Vertrauen & Qualität Section */}
        <div className='bg-gray-50 rounded-lg p-8 md:p-12 my-16'>
          <div className='text-center mb-12'>
            <h3 className='font-bold text-3xl md:text-4xl mb-4 text-green-600'>
              Einfach, schnell und kostenlos zu Ihrem Gartenprojekt
            </h3>
            <p className='text-base md:text-lg text-gray-700'>
              Landschaftshelden bringt Sie direkt mit qualifizierten Garten- &
              Landschaftsbau-Unternehmen zusammen
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>100%</span>
              </div>
              <h4 className='font-bold text-xl mb-2'>Kostenlos für Sie</h4>
              <p className='text-gray-600'>
                Unser Service ist für Auftraggeber vollständig kostenlos - keine
                Gebühren, keine versteckten Kosten
              </p>
            </div>

            <div className='text-center'>
              <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>Viele</span>
              </div>
              <h4 className='font-bold text-xl mb-2'>Regionale Unternehmen</h4>
              <p className='text-gray-600'>
                Garten- & Landschaftsbau-Unternehmen mit Gewerbeschein aus Ihrer
                Region
              </p>
            </div>

            <div className='text-center'>
              <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>
                  Schnell
                </span>
              </div>
              <h4 className='font-bold text-xl mb-2'>Direkte Kontakte</h4>
              <p className='text-gray-600'>
                Erhalten Sie schnell Kontakt zu interessierten Unternehmen für
                Ihr Gartenprojekt
              </p>
            </div>
          </div>
        </div>

        {/* Sicherheit & Garantie Section */}
        <div className='my-16'>
          <div className='text-center mb-12'>
            <h3 className='font-bold text-3xl md:text-4xl mb-4 text-green-600'>
              Sicher und transparent für Sie
            </h3>
            <p className='text-base md:text-lg text-gray-700 w-full md:w-2/3 mx-auto'>
              Ihre Daten sind bei uns sicher und Sie behalten die volle
              Kontrolle
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
              <div className='flex items-start gap-4'>
                <div className='bg-green-100 rounded-full p-3 flex-shrink-0'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='font-bold text-xl mb-2 text-green-600'>
                    Gewerbliche Unternehmen
                  </h4>
                  <p className='text-gray-600'>
                    Alle registrierten Unternehmen verfügen über einen gültigen
                    Gewerbeschein im Garten- & Landschaftsbau
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
              <div className='flex items-start gap-4'>
                <div className='bg-green-100 rounded-full p-3 flex-shrink-0'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='font-bold text-xl mb-2 text-green-600'>
                    Datenschutz garantiert
                  </h4>
                  <p className='text-gray-600'>
                    Ihre Daten werden DSGVO-konform behandelt und nur zur
                    Auftragsvermittlung verwendet
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
              <div className='flex items-start gap-4'>
                <div className='bg-green-100 rounded-full p-3 flex-shrink-0'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='font-bold text-xl mb-2 text-green-600'>
                    Kostenlose Vermittlung
                  </h4>
                  <p className='text-gray-600'>
                    Für Sie als Auftraggeber ist unser Service 100% kostenlos -
                    keine versteckten Gebühren
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
              <div className='flex items-start gap-4'>
                <div className='bg-green-100 rounded-full p-3 flex-shrink-0'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='font-bold text-xl mb-2 text-green-600'>
                    Sie entscheiden
                  </h4>
                  <p className='text-gray-600'>
                    Sie wählen selbst aus, welche Unternehmen Sie kontaktieren
                    möchten - kein Zwang
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vorteile für Kunden Section */}
        <div className='bg-green-50 rounded-lg p-8 md:p-12 my-16'>
          <div className='text-center mb-12'>
            <h3 className='font-bold text-3xl md:text-4xl mb-4 text-green-600'>
              So einfach funktioniert Landschaftshelden
            </h3>
            <p className='text-base md:text-lg text-gray-700'>
              In nur wenigen Schritten zu Ihrem Gartenprojekt
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='bg-white rounded-lg p-6 shadow-sm text-center'>
              <div className='bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>1</span>
              </div>
              <h4 className='font-bold text-xl mb-3 text-green-600'>
                Projekt beschreiben
              </h4>
              <p className='text-gray-600'>
                Beschreiben Sie Ihr Gartenprojekt in wenigen Worten - kostenlos
                und unverbindlich
              </p>
            </div>

            <div className='bg-white rounded-lg p-6 shadow-sm text-center'>
              <div className='bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>2</span>
              </div>
              <h4 className='font-bold text-xl mb-3 text-green-600'>
                Unternehmen erhalten Info
              </h4>
              <p className='text-gray-600'>
                Passende Garten- & Landschaftsbau-Unternehmen aus Ihrer Region
                erhalten Ihre Projektanfrage
              </p>
            </div>

            <div className='bg-white rounded-lg p-6 shadow-sm text-center'>
              <div className='bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4'>
                <span className='text-xl font-bold text-green-600'>3</span>
              </div>
              <h4 className='font-bold text-xl mb-3 text-green-600'>
                Sie wählen aus
              </h4>
              <p className='text-gray-600'>
                Interessierte Unternehmen melden sich bei Ihnen - Sie
                entscheiden, mit wem Sie arbeiten möchten
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='flex flex-col gap-24 my-32'>
          <div className='text-center'>
            <h3 className='font-bold text-3xl md:text-5xl mb-6'>
              Finden Sie das richtige Unternehmen für Ihr Gartenprojekt
            </h3>
            <p className='text-base md:text-lg w-full md:w-2/3 mx-auto'>
              Landschaftshelden bringt Sie direkt mit Garten- &
              Landschaftsbau-Unternehmen in Ihrer Region zusammen. Erstellen Sie
              kostenlos Ihren Auftrag und lassen Sie sich kontaktieren.
            </p>
          </div>
          <div className='flex flex-col lg:flex-row items-center lg:items-start gap-12'>
            <div className='flex flex-col gap-8 lg:w-1/2'>
              <div>
                <h4 className='font-bold text-2xl md:text-3xl flex items-start gap-4'>
                  <span className='w-2 h-10 bg-green-500 rounded-md'></span>
                  Gewerbliche Fachbetriebe
                </h4>
                <p className='text-base md:text-lg mt-2'>
                  Alle registrierten Unternehmen verfügen über einen gültigen
                  Gewerbeschein im Garten- & Landschaftsbau und arbeiten
                  professionell in ihrer Region.
                </p>
              </div>
              <div>
                <h4 className='font-bold text-2xl md:text-3xl flex items-start gap-4'>
                  <span className='w-2 h-10 bg-green-500 rounded-md'></span>
                  Sie haben die Wahl
                </h4>
                <p className='text-base md:text-lg mt-2'>
                  Sie entscheiden selbst, welche Unternehmen Sie kontaktieren
                  möchten und mit wem Sie Ihr Gartenprojekt realisieren. Kein
                  Zwang, keine Verpflichtungen.
                </p>
              </div>
              <div className='text-center'>
                <h5 className='font-bold text-xl md:text-4xl mb-4'>
                  Bereit für Ihr Traum-Gartenprojekt?
                </h5>
                <Link
                  href='/auftrag-erstellen'
                  className='py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600'>
                  Kostenlos Auftrag erstellen
                </Link>
              </div>
            </div>
            <div className='flex justify-center lg:w-1/2'>
              <Image
                alt='JobSmith Handwerker finden'
                src='/images/JobSmith_CTA_Card.png'
                width={512}
                height={512}
                className='object-cover w-full max-w-xs lg:max-w-xl'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Für Unternehmen */}
      <div className='py-12 bg-green-100'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col lg:flex-row gap-12 lg:items-center'>
            <div className='flex justify-center lg:w-1/2'>
              <Image
                alt='JobSmith Aufträge erhalten'
                src='/images/JobSmith_gefunden_werden.png'
                height={512}
                width={512}
                className='object-cover w-full max-w-sm lg:max-w-none'
              />
            </div>
            <div className='flex flex-col gap-6 lg:w-1/2 max-md:items-center'>
              <h5 className='font-bold text-3xl md:text-5xl'>
                Sie sind Garten- & Landschaftsbau-Unternehmen?
              </h5>
              <p className='text-base md:text-lg'>
                Registrieren Sie sich kostenlos bei Landschaftshelden und
                erhalten Sie Anfragen für Gartenprojekte in Ihrer Region.
              </p>
              <p className='text-base md:text-lg'>
                Erweitern Sie Ihren Kundenkreis durch unsere Plattform und
                gewinnen Sie neue Aufträge. Die Registrierung ist für
                Unternehmen mit Gewerbeschein kostenlos möglich.
              </p>
              <Link
                href='/register/company'
                className='py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 w-fit'>
                Jetzt Partner werden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
