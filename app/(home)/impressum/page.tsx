import React from "react";

const Impressum = () => {
  return (
    <div className='max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg'>
      <h1 className='text-3xl font-semibold text-center text-gray-800 mb-6'>
        Impressum
      </h1>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Angaben gemäß § 5 TMG
      </h2>
      <p className='text-gray-600 mb-2'>
        <strong>Firma:</strong> Umzugshelden
      </p>
      <p className='text-gray-600 mb-2'>
        <strong>Inhaber:</strong> Muhammed Ali Güngör
      </p>
      <p className='text-gray-600 mb-4'>
        <strong>Unternehmensform:</strong> Einzelunternehmen
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>Adresse</h2>
      <p className='text-gray-600 mb-4'>
        In der Trift 1
        <br />
        57489 Drolshagen
        <br />
        Deutschland
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>Kontakt</h2>
      <p className='text-gray-600 mb-2'>
        <strong>E-Mail:</strong>{" "}
        <a
          href='mailto:info@umzugshelden.io'
          className='text-blue-600 hover:text-blue-800'>
          info@umzugshelden.io
        </a>
      </p>
      <p className='text-gray-600 mb-4'>
        <strong>Telefon:</strong>{" "}
        <a
          href='tel:+4915168567708'
          className='text-blue-600 hover:text-blue-800'>
          +49 151 68567708
        </a>
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>Steuernummer</h2>
      <p className='text-gray-600 mb-6'>Steuer-Nr.: wird nachgetragen</p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Haftungsausschluss
      </h2>
      <p className='text-gray-600 mb-4'>
        Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
        Dennoch übernehmen wir keine Haftung für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte. Als Diensteanbieter sind wir
        gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
        allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
        jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf
        eine rechtswidrige Tätigkeit hinweisen.
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Haftung für Links
      </h2>
      <p className='text-gray-600 mb-4'>
        Unsere Website enthält Links zu externen Webseiten Dritter, auf deren
        Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden
        Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
        Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
        verantwortlich.
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>Urheberrecht</h2>
      <p className='text-gray-600 mb-4'>
        Die auf dieser Website veröffentlichten Inhalte und Werke unterliegen
        dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
        Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
        Urheberrechts bedürfen der vorherigen schriftlichen Zustimmung des
        jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
        sind nur für den privaten, nicht kommerziellen Gebrauch erlaubt.
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Online-Streitbeilegung
      </h2>
      <p className='text-gray-600 mb-4'>
        Die Europäische Kommission stellt eine Plattform zur Online-
        Streitbeilegung (OS) bereit:{" "}
        <a
          href='https://ec.europa.eu/odr'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:text-blue-800'>
          https://ec.europa.eu/odr
        </a>
        <br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>

      <h2 className='text-xl font-semibold text-gray-700 mb-4'>
        Verbraucherstreitbeilegung
      </h2>
      <p className='text-gray-600 mb-6'>
        Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle weder verpflichtet noch bereit.
      </p>
    </div>
  );
};

const Page = () => {
  return (
    <div className='bg-gray-100 min-h-screen flex items-center justify-center py-8 px-4'>
      <Impressum />
    </div>
  );
};

export default Page;
