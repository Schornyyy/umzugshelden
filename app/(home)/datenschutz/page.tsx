import React from "react";

const Datenschutz = () => {
  return (
    <div className='max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-lg'>
      <h1 className='text-4xl font-bold text-center text-gray-800 mb-8'>
        Datenschutzerklärung
      </h1>

      <div className='prose prose-gray max-w-none'>
        <p className='text-lg text-gray-700 mb-6 leading-relaxed'>
          Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen.
          In dieser Datenschutzerklärung informieren wir Sie ausführlich
          darüber, wie wir mit Ihren Daten umgehen.
        </p>

        {/* 1. Verantwortlicher */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            1. Verantwortlicher im Sinne der DSGVO
          </h2>
          <div className='bg-gray-50 p-6 rounded-lg mb-4'>
            <p className='text-gray-700 mb-2'>
              <strong>GS-Creatives.de</strong>
              <br />
              In der Trifft. 1<br />
              57489 Drolshagen
              <br />
              Deutschland
            </p>
            <p className='text-gray-700'>
              <strong>E-Mail:</strong>{" "}
              <a
                href='mailto:kontakt@gs-creatives.de'
                className='text-green-600 hover:text-green-800 font-medium'>
                kontakt@gs-creatives.de
              </a>
              <br />
              <br />
              <strong>Website:</strong>{" "}
              <a
                href='https://gs-creatives.de'
                className='text-green-600 hover:text-green-800 font-medium'>
                gs-creatives.de
              </a>
            </p>
          </div>
        </section>

        {/* 2. Allgemeine Hinweise zur Datenverarbeitung */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            2. Allgemeine Hinweise zur Datenverarbeitung
          </h2>
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            2.1 Umfang der Verarbeitung personenbezogener Daten
          </h3>
          <p className='text-gray-700 mb-4'>
            Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich
            nur, soweit dies zur Bereitstellung einer funktionsfähigen Website
            sowie unserer Inhalte und Leistungen erforderlich ist. Die
            Verarbeitung personenbezogener Daten unserer Nutzer erfolgt
            regelmäßig nur nach Einwilligung des Nutzers. Eine Ausnahme gilt in
            solchen Fällen, in denen eine vorherige Einholung einer Einwilligung
            aus tatsächlichen Gründen nicht möglich ist und die Verarbeitung der
            Daten durch gesetzliche Vorschriften gestattet ist.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            2.2 Rechtsgrundlage für die Verarbeitung personenbezogener Daten
          </h3>
          <div className='bg-blue-50 p-4 rounded-lg mb-4'>
            <ul className='list-disc list-inside space-y-2 text-gray-700'>
              <li>
                <strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung der
                betroffenen Person
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Verarbeitung zur
                Erfüllung eines Vertrags
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Verarbeitung zur
                Erfüllung rechtlicher Verpflichtungen
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Verarbeitung zur
                Wahrung berechtigter Interessen
              </li>
            </ul>
          </div>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            2.3 Datenlöschung und Speicherdauer
          </h3>
          <p className='text-gray-700 mb-4'>
            Die personenbezogenen Daten der betroffenen Person werden gelöscht
            oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine
            Speicherung kann darüber hinaus erfolgen, wenn dies durch den
            europäischen oder nationalen Gesetzgeber in unionsrechtlichen
            Verordnungen, Gesetzen oder sonstigen Vorschriften, denen der
            Verantwortliche unterliegt, vorgesehen wurde. Eine Sperrung oder
            Löschung der Daten erfolgt auch dann, wenn eine durch die genannten
            Normen vorgeschriebene Speicherfrist abläuft, es sei denn, dass eine
            Erforderlichkeit zur weiteren Speicherung der Daten für einen
            Vertragsabschluss oder eine Vertragserfüllung besteht.
          </p>
        </section>

        {/* 3. Bereitstellung der Website und Erstellung von Logfiles */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            3. Bereitstellung der Website und Erstellung von Logfiles
          </h2>
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            3.1 Beschreibung und Umfang der Datenverarbeitung
          </h3>
          <p className='text-gray-700 mb-4'>
            Bei jedem Aufruf unserer Internetseite erfasst unser System
            automatisiert Daten und Informationen vom Computersystem des
            aufrufenden Rechners. Folgende Daten werden hierbei erhoben:
          </p>
          <div className='bg-yellow-50 p-4 rounded-lg mb-4'>
            <ul className='list-disc list-inside space-y-1 text-gray-700'>
              <li>
                Informationen über den Browsertyp und die verwendete Version
              </li>
              <li>Das Betriebssystem des Nutzers</li>
              <li>Den Internet-Service-Provider des Nutzers</li>
              <li>Die IP-Adresse des Nutzers (anonymisiert)</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>
                Websites, von denen das System des Nutzers auf unsere
                Internetseite gelangt
              </li>
              <li>
                Websites, die vom System des Nutzers über unsere Website
                aufgerufen werden
              </li>
            </ul>
          </div>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            3.2 Rechtsgrundlage für die Datenverarbeitung
          </h3>
          <p className='text-gray-700 mb-4'>
            Rechtsgrundlage für die vorübergehende Speicherung der Daten und der
            Logfiles ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            3.3 Zweck der Datenverarbeitung
          </h3>
          <p className='text-gray-700 mb-4'>
            Die vorübergehende Speicherung der IP-Adresse durch das System ist
            notwendig, um eine Auslieferung der Website an den Rechner des
            Nutzers zu ermöglichen. Hierfür muss die IP-Adresse des Nutzers für
            die Dauer der Sitzung gespeichert bleiben. Die Speicherung in
            Logfiles erfolgt, um die Funktionsfähigkeit der Website
            sicherzustellen. Zudem dienen uns die Daten zur Optimierung der
            Website und zur Sicherstellung der Sicherheit unserer
            informationstechnischen Systeme.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            3.4 Dauer der Speicherung
          </h3>
          <p className='text-gray-700 mb-4'>
            Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes
            ihrer Erhebung nicht mehr erforderlich sind. Im Falle der Erfassung
            der Daten zur Bereitstellung der Website ist dies der Fall, wenn die
            jeweilige Sitzung beendet ist. Im Falle der Speicherung der Daten in
            Logfiles ist dies nach spätestens sieben Tagen der Fall.
          </p>
        </section>

        {/* 4. Hosting über Vercel */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            4. Hosting über Vercel
          </h2>
          <p className='text-gray-700 mb-4'>
            Unsere Website wird über die Hosting-Plattform Vercel Inc., 340 S
            Lemon Ave #4133, Walnut, CA 91789, USA gehostet.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            4.1 Art und Umfang der Verarbeitung
          </h3>
          <p className='text-gray-700 mb-4'>
            Vercel verarbeitet im Rahmen des Hostings automatisch technische
            Daten, die beim Besuch unserer Website anfallen:
          </p>
          <ul className='list-disc list-inside space-y-1 text-gray-700 mb-4 ml-4'>
            <li>IP-Adresse</li>
            <li>Datum und Uhrzeit der Anfrage</li>
            <li>Inhalt der Anforderung (konkrete Seite)</li>
            <li>Zugriffsstatus/HTTP-Statuscode</li>
            <li>Jeweils übertragene Datenmenge</li>
            <li>Website, von der die Anforderung kommt</li>
            <li>Informationen zu Browser und Betriebssystem</li>
          </ul>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            4.2 Zweck und Rechtsgrundlage
          </h3>
          <p className='text-gray-700 mb-4'>
            <strong>Zweck:</strong> Bereitstellung und Betrieb unserer Website
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
            (berechtigte Interessen)
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            4.3 Speicherdauer
          </h3>
          <p className='text-gray-700 mb-4'>
            Die Löschung der Daten erfolgt entsprechend den Richtlinien von
            Vercel. Details finden Sie in der Datenschutzerklärung von Vercel:
            <a
              href='https://vercel.com/legal/privacy-policy'
              className='text-green-600 hover:text-green-800 font-medium ml-1'
              target='_blank'
              rel='noopener noreferrer'>
              https://vercel.com/legal/privacy-policy
            </a>
          </p>
        </section>

        {/* 5. Firebase (Google) */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            5. Firebase (Google Cloud Services)
          </h2>
          <p className='text-gray-700 mb-4'>
            Wir nutzen Firebase von Google LLC, 1600 Amphitheatre Parkway,
            Mountain View, CA 94043, USA für die Authentifizierung, Datenbank
            und Storage-Funktionen.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            5.1 Firebase Authentication
          </h3>
          <div className='bg-green-50 p-4 rounded-lg mb-4'>
            <p className='text-gray-700 mb-2'>
              <strong>Erhobene Daten:</strong>
            </p>
            <ul className='list-disc list-inside space-y-1 text-gray-700'>
              <li>E-Mail-Adresse</li>
              <li>Verschlüsseltes Passwort</li>
              <li>Eindeutige Benutzer-ID (UID)</li>
              <li>Anmelde-/Registrierungszeitpunkt</li>
              <li>Letzte Anmeldung</li>
            </ul>
          </div>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            5.2 Firestore Database
          </h3>
          <div className='bg-green-50 p-4 rounded-lg mb-4'>
            <p className='text-gray-700 mb-2'>
              <strong>Gespeicherte Daten:</strong>
            </p>
            <ul className='list-disc list-inside space-y-1 text-gray-700'>
              <li>Unternehmensdaten (Name, Adresse, Kontaktdaten)</li>
              <li>Leistungsbeschreibungen</li>
              <li>Auftragsdaten und Anfragen</li>
              <li>Benutzerprofile und Einstellungen</li>
              <li>Kommunikationsdaten zwischen Nutzern</li>
            </ul>
          </div>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            5.3 Firebase Storage
          </h3>
          <p className='text-gray-700 mb-4'>
            Für das Hochladen und Speichern von Dateien wie Bildern, Dokumenten
            oder anderen Medien verwenden wir Firebase Storage.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            5.4 Zweck und Rechtsgrundlage
          </h3>
          <p className='text-gray-700 mb-4'>
            <strong>Zweck:</strong> Bereitstellung der Plattform-Funktionen,
            Benutzerverwaltung, Datenspeicherung
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigte
            Interessen)
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            5.5 Datenübertragung in Drittländer
          </h3>
          <p className='text-gray-700 mb-4'>
            Google verarbeitet Daten auch in den USA. Die Übertragung erfolgt
            auf Grundlage der Standarddatenschutzklauseln der EU-Kommission.
            Details finden Sie hier:
            <a
              href='https://firebase.google.com/support/privacy'
              className='text-green-600 hover:text-green-800 font-medium ml-1'
              target='_blank'
              rel='noopener noreferrer'>
              https://firebase.google.com/support/privacy
            </a>
          </p>
        </section>

        {/* 6. E-Mail-Kommunikation */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            6. E-Mail-Kommunikation und automatische Benachrichtigungen
          </h2>
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            6.1 Kontaktformular und E-Mail-Verkehr
          </h3>
          <p className='text-gray-700 mb-4'>
            Wenn Sie uns per Kontaktformular oder E-Mail kontaktieren, werden
            die von Ihnen gemachten Angaben zum Zwecke der Bearbeitung der
            Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            6.2 Automatische E-Mail-Benachrichtigungen
          </h3>
          <div className='bg-orange-50 p-4 rounded-lg mb-4'>
            <p className='text-gray-700 mb-2'>
              <strong>Funktionsweise:</strong> Wenn ein neuer Auftrag in Ihrer
              Region erstellt wird, erhalten registrierte Unternehmen im Umkreis
              von 50km automatisch eine E-Mail-Benachrichtigung.
            </p>
            <p className='text-gray-700 mb-2'>
              <strong>Verarbeitete Daten:</strong>
            </p>
            <ul className='list-disc list-inside space-y-1 text-gray-700'>
              <li>E-Mail-Adresse des Unternehmens</li>
              <li>Standort des Unternehmens (für Radius-Berechnung)</li>
              <li>Auftragsdaten (anonymisiert in der E-Mail)</li>
              <li>Versandzeitpunkt der E-Mail</li>
            </ul>
          </div>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            6.3 Widerspruchsrecht
          </h3>
          <p className='text-gray-700 mb-4'>
            Sie können der Verwendung Ihrer E-Mail-Adresse für automatische
            Benachrichtigungen jederzeit widersprechen. Nutzen Sie dafür den
            Abmelde-Link in jeder E-Mail oder kontaktieren Sie uns direkt.
          </p>

          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            6.4 Rechtsgrundlage
          </h3>
          <p className='text-gray-700 mb-4'>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1
            lit. f DSGVO (berechtigte Interessen)
          </p>
        </section>

        {/* 7. Cookies und Tracking */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            7. Cookies und Tracking
          </h2>
          <div className='bg-green-100 p-6 rounded-lg'>
            <h3 className='text-xl font-semibold text-gray-800 mb-3'>
              ✅ Cookie-freie Website
            </h3>
            <p className='text-gray-700 text-lg'>
              Unsere Website verwendet <strong>keine Cookies</strong> und{" "}
              <strong>keine Tracking-Technologien</strong>. Es werden keine
              Daten zur Analyse Ihres Nutzungsverhaltens gespeichert oder an
              Dritte übertragen.
            </p>
          </div>
        </section>

        {/* 8. Ihre Rechte als betroffene Person */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            8. Ihre Rechte als betroffene Person
          </h2>
          <p className='text-gray-700 mb-4'>
            Werden personenbezogene Daten von Ihnen verarbeitet, sind Sie
            Betroffener i.S.d. DSGVO und es stehen Ihnen folgende Rechte
            gegenüber dem Verantwortlichen zu:
          </p>

          <div className='grid md:grid-cols-2 gap-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                🔍 Auskunftsrecht (Art. 15 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie können von uns eine Bestätigung darüber verlangen, ob
                personenbezogene Daten, die Sie betreffen, von uns verarbeitet
                werden.
              </p>
            </div>

            <div className='bg-yellow-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                ✏️ Berichtigungsrecht (Art. 16 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie haben ein Recht auf Berichtigung und/oder Vervollständigung
                gegenüber dem Verantwortlichen, sofern die verarbeiteten
                personenbezogenen Daten, die Sie betreffen, unrichtig oder
                unvollständig sind.
              </p>
            </div>

            <div className='bg-red-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                🗑️ Löschungsrecht (Art. 17 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie können von uns die Löschung Ihrer personenbezogenen Daten
                verlangen, sofern die Voraussetzungen des Art. 17 DSGVO erfüllt
                sind.
              </p>
            </div>

            <div className='bg-purple-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                ⏸️ Einschränkungsrecht (Art. 18 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie können von uns die Einschränkung der Verarbeitung verlangen,
                wenn eine der Voraussetzungen in Art. 18 Abs. 1 DSGVO gegeben
                ist.
              </p>
            </div>

            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                📋 Datenübertragbarkeit (Art. 20 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie haben das Recht, die Sie betreffenden personenbezogenen
                Daten in einem strukturierten, gängigen und maschinenlesbaren
                Format zu erhalten.
              </p>
            </div>

            <div className='bg-orange-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                🚫 Widerspruchsrecht (Art. 21 DSGVO)
              </h3>
              <p className='text-gray-700 text-sm'>
                Sie haben das Recht, aus Gründen, die sich aus ihrer besonderen
                Situation ergeben, jederzeit gegen die Verarbeitung der Sie
                betreffenden personenbezogenen Daten Widerspruch einzulegen.
              </p>
            </div>
          </div>

          <div className='bg-gray-100 p-6 rounded-lg mt-6'>
            <h3 className='text-xl font-semibold text-gray-800 mb-3'>
              📧 Geltendmachung Ihrer Rechte
            </h3>
            <p className='text-gray-700 mb-2'>
              Möchten Sie von einem dieser Rechte Gebrauch machen, wenden Sie
              sich bitte an:
            </p>
            <p className='text-gray-700'>
              <strong>E-Mail:</strong>{" "}
              <a
                href='mailto:kontakt@gs-creatives.de'
                className='text-green-600 hover:text-green-800 font-medium'>
                kontakt@gs-creatives.de
              </a>
              <br />
              <strong>Betreff:</strong> &quot;Datenschutzanfrage - [Ihr
              Anliegen]&quot;
            </p>
          </div>

          <div className='bg-red-100 p-6 rounded-lg mt-6'>
            <h3 className='text-xl font-semibold text-gray-800 mb-3'>
              ⚖️ Beschwerderecht
            </h3>
            <p className='text-gray-700'>
              Unbeschadet eines anderweitigen verwaltungsrechtlichen oder
              gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde
              bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat
              ihres Aufenthaltsorts, ihres Arbeitsplatzes oder des Orts des
              mutmaßlichen Verstoßes, zu, wenn Sie der Ansicht sind, dass die
              Verarbeitung der Sie betreffenden personenbezogenen Daten gegen
              die DSGVO verstößt.
            </p>
            <p className='text-gray-700 mt-2'>
              <strong>Zuständige Aufsichtsbehörde für NRW:</strong>
              <br />
              Landesbeauftragte für Datenschutz und Informationsfreiheit
              Nordrhein-Westfalen
              <br />
              Postfach 20 04 44, 40102 Düsseldorf
              <br />
              <a
                href='https://www.ldi.nrw.de/'
                className='text-green-600 hover:text-green-800 font-medium'>
                www.ldi.nrw.de
              </a>
            </p>
          </div>
        </section>

        {/* 9. Datensicherheit */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            9. Datensicherheit
          </h2>
          <p className='text-gray-700 mb-4'>
            Wir verwenden innerhalb des Website-Besuchs das verbreitete
            SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils
            höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt
            wird. In der Regel handelt es sich dabei um eine
            256-Bit-Verschlüsselung. Falls Ihr Browser keine
            256-Bit-Verschlüsselung unterstützt, greifen wir stattdessen auf
            128-Bit-v3-Technologie zurück.
          </p>

          <div className='bg-blue-50 p-4 rounded-lg mb-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              🔐 Sicherheitsmaßnahmen
            </h3>
            <ul className='list-disc list-inside space-y-1 text-gray-700'>
              <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Sichere Authentifizierung über Firebase Auth</li>
              <li>Regelmäßige Sicherheitsupdates</li>
              <li>Verschlüsselte Datenspeicherung</li>
              <li>Zugriffskontrollen und Berechtigungsmanagement</li>
              <li>Regelmäßige Backups</li>
            </ul>
          </div>
        </section>

        {/* 10. Aktualität und Änderung der Datenschutzerklärung */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2'>
            10. Aktualität und Änderung der Datenschutzerklärung
          </h2>
          <p className='text-gray-700 mb-4'>
            Diese Datenschutzerklärung ist aktuell gültig und hat den Stand vom{" "}
            <strong>5. August 2025</strong>.
          </p>
          <p className='text-gray-700 mb-4'>
            Durch die Weiterentwicklung unserer Website und Angebote darüber
            oder aufgrund geänderter gesetzlicher beziehungsweise behördlicher
            Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu
            ändern. Die jeweils aktuelle Datenschutzerklärung kann jederzeit auf
            der Website unter
            <a
              href='https://gs-creatives.de/datenschutz'
              className='text-green-600 hover:text-green-800 font-medium ml-1'>
              https://gs-creatives.de/datenschutz
            </a>{" "}
            von Ihnen abgerufen und ausgedruckt werden.
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
