import React from 'react';

const Datenschutz = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Datenschutzerklärung</h1>

      <p className="text-gray-600 mb-4">Wir nehmen den Schutz Ihrer persönlichen Daten ernst. Nachfolgend möchten wir Sie darüber informieren, welche Daten wir erheben, wie wir diese verwenden und welche Rechte Sie hinsichtlich Ihrer Daten haben.</p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Verantwortliche Stelle</h2>
      <p className="text-gray-600 mb-4">
        Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
        <strong>JobSmith </strong><br />
        Heidnocken 1, 57489 Drolshagen<br />
        E-Mail: <a href="mailto:Kontakt@jobsmith.de" className="text-blue-600 hover:text-blue-800">Kontakt@jobsmith.de</a>
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">2. Erhebung und Verarbeitung von Daten</h2>
      <p className="text-gray-600 mb-4">
        Wir erheben keine personenbezogenen Daten, außer Sie stellen uns diese freiwillig zur Verfügung (z. B. über das Kontaktformular oder per E-Mail).
      </p>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">2.1. Hosting über Vercel</h3>
      <p className="text-gray-600 mb-4">
        Diese Website wird über die Hosting-Plattform Vercel betrieben. Vercel speichert automatisch bestimmte technische Daten, um den Betrieb der Website zu gewährleisten, wie z. B. die IP-Adresse und den Browser-Typ. Weitere Informationen finden Sie in der Datenschutzerklärung von Vercel: <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a>.
      </p>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">2.2. Google Search Console</h3>
      <p className="text-gray-600 mb-4">
        Wir nutzen die Google Search Console, um die Leistung unserer Website zu überwachen und zu verbessern. Dabei werden keine personenbezogenen Daten erfasst. Weitere Informationen zur Verarbeitung von Daten durch Google finden Sie in der Google Datenschutzerklärung: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>.
      </p>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">2.3. Keine Cookies</h3>
      <p className="text-gray-600 mb-4">
        Unsere Website verwendet keine Cookies. Es werden keine Daten zum Tracking oder zur Analyse Ihres Nutzungsverhaltens gespeichert.
      </p>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">2.4. Firebase Auth & Storage</h3>
      <p className="text-gray-600 mb-4">
        Zur Authentifizierung und Speicherung von Nutzerdaten verwenden wir Firebase von Google. Firebase speichert Informationen wie E-Mail-Adressen und Authentifizierungstoken. Weitere Informationen zur Verarbeitung von Daten durch Firebase finden Sie in der Firebase-Datenschutzerklärung: <a href="https://firebase.google.com/support/privacy" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://firebase.google.com/support/privacy</a>.
      </p>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">2.5. Domain über Ionos</h3>
      <p className="text-gray-600 mb-4">
        Unsere Domain wird über Ionos (1&1) gehostet. Ionos speichert technische Daten zur Bereitstellung und Verwaltung der Domain. Weitere Informationen zur Datenverarbeitung durch Ionos finden Sie in deren Datenschutzerklärung: <a href="https://www.ionos.de/terms-gtc/terms" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://www.ionos.de/terms-gtc/terms</a>.
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">3. Weitergabe an Dritte</h2>
      <p className="text-gray-600 mb-4">
        Wir geben keine personenbezogenen Daten an Dritte weiter, es sei denn, dies ist zur Erfüllung des Vertrags notwendig oder gesetzlich vorgeschrieben.
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">4. Ihre Rechte</h2>
      <p className="text-gray-600 mb-4">
        Sie haben das Recht, Auskunft über die bei uns gespeicherten Daten zu erhalten, diese zu berichtigen oder zu löschen. Wenn Sie Fragen zum Datenschutz haben oder Ihre Rechte geltend machen möchten, können Sie uns jederzeit unter der oben angegebenen E-Mail-Adresse kontaktieren.
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">5. Änderungen der Datenschutzerklärung</h2>
      <p className="text-gray-600 mb-4">
        Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Änderungen werden auf dieser Seite veröffentlicht.
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">6. Stand der Datenschutzerklärung</h2>
      <p className="text-gray-600 mb-6">Diese Datenschutzerklärung ist aktuell gültig und wurde zuletzt am 04. Januar 2025 aktualisiert.</p>
    </div>
  );
};

const Page = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center py-8 px-4">
      <Datenschutz />
    </div>
  );
};

export default Page;
