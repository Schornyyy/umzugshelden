import React from "react";

const Datenschutz = () => {
  return (
    <div className='max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-lg'>
      <h1 className='text-4xl font-bold text-center text-gray-800 mb-8'>
        Datenschutzerklärung
      </h1>

      <div className='prose prose-gray max-w-none'>
        <p className='text-lg text-gray-700 mb-6 leading-relaxed'>
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. Im Folgenden
          informieren wir Sie darüber, welche Daten wir erheben, wie wir sie
          verwenden und welche Rechte Sie als betroffene Person haben.
        </p>

        {/* 1. Verantwortlicher */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            1. Verantwortlicher
          </h2>
          <div className='bg-gray-50 p-6 rounded-lg mb-4'>
            <p className='text-gray-700 mb-2'>
              <strong>Björn Weiß</strong>
              <br />
              Hausmeisterservice Björn Weiß
              <br />
              Duisburger Str. 261
              <br />
              45478 Mülheim an der Ruhr
              <br />
              Deutschland
            </p>
            <p className='text-gray-700'>
              <strong>Telefon:</strong> +49 208 4458875
              <br />
              <strong>E-Mail:</strong>{" "}
              <a
                href='mailto:info@weiss-hausmeisterservice.de'
                className='text-green-600 hover:text-green-800 font-medium'>
                info@weiss-hausmeisterservice.de
              </a>
            </p>
            <p className='text-gray-700 mt-4'>
              <strong>Steuernummer:</strong> 120/2657/2389
            </p>
          </div>
        </section>

        {/* 2. Allgemeine Hinweise */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            2. Allgemeine Hinweise zur Datenverarbeitung
          </h2>
          <p className='text-gray-700 mb-4'>
            Wir verarbeiten personenbezogene Daten nur, soweit dies zur
            Bereitstellung unserer Dienste oder zur Erfüllung vertraglicher
            Pflichten erforderlich ist oder Sie uns Ihre Einwilligung erteilt
            haben. Rechtsgrundlagen sind insbesondere die DSGVO und das
            Bundesdatenschutzgesetz.
          </p>
        </section>

        {/* 3. Kontakt & Kommunikation */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            3. Kontakt und E-Mail-Kommunikation
          </h2>
          <p className='text-gray-700 mb-4'>
            Wenn Sie uns per Kontaktformular, E-Mail oder Telefon kontaktieren,
            werden Ihre Angaben (z. B. Name, E-Mail-Adresse, Telefonnummer,
            Nachricht) zur Bearbeitung der Anfrage gespeichert. Diese Daten
            löschen wir, sobald sie für den Zweck ihrer Verarbeitung nicht mehr
            erforderlich sind, es sei denn, gesetzliche Aufbewahrungsfristen
            stehen entgegen.
          </p>
        </section>

        {/* 4. Online-Streitbeilegung & Verbraucherstreit */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            4. Online-Streitbeilegung und Verbraucherstreitbeilegung
          </h2>
          <p className='text-gray-700 mb-2'>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:
            <br />
            <a
              href='https://ec.europa.eu/odr'
              target='_blank'
              rel='noopener noreferrer'
              className='text-green-600 hover:text-green-800'>
              https://ec.europa.eu/odr
            </a>
          </p>
          <p className='text-gray-700 mb-2'>
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
          <p className='text-gray-700'>
            Verbraucherstreitbeilegung/Universalschlichtungsstelle:
            <br />
            Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle weder verpflichtet noch bereit.
          </p>
          <p className='text-gray-700 mt-4'>
            Mitglied der Initiative „Fairness im Handel“ – weitere
            Informationen:{" "}
            <a
              href='https://www.fairness-im-handel.de'
              className='text-green-600 hover:text-green-800'
              target='_blank'
              rel='noopener noreferrer'>
              https://www.fairness-im-handel.de
            </a>
          </p>
        </section>

        {/* 5. Bereitstellung der Website und Logfiles */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            5. Bereitstellung der Website und Erstellung von Logfiles
          </h2>
          <p className='text-gray-700 mb-4'>
            Beim Aufruf unserer Website werden technische Zugriffsdaten in
            Logfiles gespeichert (z. B. IP-Adresse, Datum, Uhrzeit, aufgerufene
            Seite). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        {/* 6. Hosting */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            6. Hosting
          </h2>
          <p className='text-gray-700 mb-4'>
            Hosting und technische Infrastruktur werden über Dritte
            bereitgestellt (z. B. Vercel). Dabei können personenbezogene Daten
            in Drittländer übermittelt werden; dies erfolgt jeweils mit
            geeigneten Sicherheitsmaßnahmen.
          </p>
        </section>

        {/* 7. Cookies und Tracking */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            7. Cookies und Tracking
          </h2>
          <p className='text-gray-700 mb-4'>
            Unsere Website verwendet nur notwendige Cookies oder ist
            cookie-frei, sofern Sie dem nicht ausdrücklich zugestimmt haben.
            Soweit Dienste Dritter genutzt werden, informieren wir gesondert.
          </p>
        </section>

        {/* 8. Ihre Rechte */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            8. Ihre Rechte als betroffene Person
          </h2>
          <p className='text-gray-700 mb-4'>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Sperrung
            sowie auf Datenübertragbarkeit und Widerspruch gegen die
            Verarbeitung. Zur Geltendmachung Ihrer Rechte wenden Sie sich bitte
            an die oben genannte E-Mail-Adresse.
          </p>
        </section>

        {/* 9. Datensicherheit */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            9. Datensicherheit
          </h2>
          <p className='text-gray-700 mb-4'>
            Wir verwenden geeignete technische und organisatorische Maßnahmen,
            um Ihre Daten vor Verlust und missbräuchlichem Zugriff zu schützen
            (z. B. TLS/SSL, Zugangsbeschränkungen, regelmäßige Backups).
          </p>
        </section>

        {/* 10. Aktualität */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            10. Aktualität und Änderung
          </h2>
          <p className='text-gray-700 mb-4'>
            Diese Datenschutzerklärung ist aktuell gültig und hat den Stand vom
            <strong> 10. November 2025</strong>. Änderungen werden auf dieser
            Seite veröffentlicht.
          </p>
        </section>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <div className='bg-gray-100 min-h-screen flex items-center justify-center py-8 px-4'>
      <Datenschutz />
    </div>
  );
};

export default Page;
