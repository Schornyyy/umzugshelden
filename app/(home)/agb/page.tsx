import React from "react";

export async function generateMetadata() {
  return {
    title: "AGB — Allgemeine Geschäftsbedingungen | Umzugshelden",
    description:
      "Allgemeine Geschäftsbedingungen der Umzugshelden, Inhaber Muhammed Ali Güngör, Drolshagen.",
  };
}

const sections = [
  {
    title: "§ 1 Geltungsbereich",
    content: `Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen Umzugshelden (Inhaber: Muhammed Ali Güngör, Einzelunternehmen, In der Trift 1, 57489 Drolshagen – nachfolgend „Auftragnehmer") und seinen Kunden (nachfolgend „Auftraggeber") über die Erbringung von Umzugsdienstleistungen, Anstricharbeiten und Möbel-Ab- sowie Aufbauservice.

Abweichende Bedingungen des Auftraggebers werden nicht anerkannt, es sei denn, der Auftragnehmer stimmt ihrer Geltung ausdrücklich schriftlich zu.`,
  },
  {
    title: "§ 2 Vertragsschluss",
    content: `Angebote des Auftragnehmers sind freibleibend und unverbindlich. Ein Vertrag kommt erst durch schriftliche oder per E-Mail übermittelte Auftragsbestätigung des Auftragnehmers oder durch Beginn der Leistungserbringung zustande.

Kostenvoranschläge sind unverbindlich, sofern sie nicht ausdrücklich als Festpreis gekennzeichnet sind.`,
  },
  {
    title: "§ 3 Leistungsumfang",
    content: `Der Leistungsumfang ergibt sich aus der Auftragsbestätigung oder dem vereinbarten Angebot. Zusatzleistungen, die nicht im Angebot enthalten sind, werden gesondert berechnet.

Der Auftraggeber ist verpflichtet, dem Auftragnehmer alle für die Leistungserbringung notwendigen Informationen rechtzeitig mitzuteilen (z. B. Adresse, Stockwerk, vorhandener Aufzug, besondere Sperrigkeit von Gegenständen).`,
  },
  {
    title: "§ 4 Preise und Zahlung",
    content: `Alle Preise verstehen sich in Euro inklusive der gesetzlichen Mehrwertsteuer, sofern diese anfällt. Die Zahlung ist unmittelbar nach Leistungserbringung fällig, sofern nichts anderes vereinbart wurde.

Bei Zahlungsverzug ist der Auftragnehmer berechtigt, Verzugszinsen in gesetzlicher Höhe zu berechnen. Für Barzahlungen wird eine Quittung ausgestellt.`,
  },
  {
    title: "§ 5 Stornierung und Rücktritt",
    content: `Eine kostenfreie Stornierung ist bis 48 Stunden vor dem vereinbarten Termin möglich. Bei späteren Stornierungen behält sich der Auftragnehmer das Recht vor, eine Ausfallgebühr von bis zu 50 % des vereinbarten Preises in Rechnung zu stellen.

Bei höherer Gewalt (z. B. Unfall, Fahrzeugausfall, extreme Witterungsbedingungen) ist der Auftragnehmer berechtigt, den Termin ohne Kostenfolge zu verschieben.`,
  },
  {
    title: "§ 6 Haftung",
    content: `Der Auftragnehmer haftet für Schäden an transportierten oder montierten Gegenständen nur bei nachgewiesenem Verschulden. Die Haftung ist auf den Zeitwert der beschädigten Gegenstände begrenzt, es sei denn, es liegt grobe Fahrlässigkeit oder Vorsatz vor.

Für Schäden durch mangelhafte oder falsche Informationen seitens des Auftraggebers übernimmt der Auftragnehmer keine Haftung. Wertgegenstände, Bargeld, Dokumente und zerbrechliche Artikel, die nicht ausdrücklich als Transportgut angegeben wurden, sind vom Haftungsumfang ausgeschlossen.`,
  },
  {
    title: "§ 7 Mitwirkungspflichten des Auftraggebers",
    content: `Der Auftraggeber ist verpflichtet, für einen reibungslosen Ablauf zu sorgen. Dazu gehört insbesondere: Halteverbot-Schilder rechtzeitig zu beantragen (falls erforderlich), Zugänge freizuhalten, Aufzüge bereitzustellen und den Auftragnehmer über besondere Gegebenheiten zu informieren.

Mehrkosten, die durch unterlassene Mitwirkung entstehen, trägt der Auftraggeber.`,
  },
  {
    title: "§ 8 Datenschutz",
    content: `Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und den Bestimmungen der DSGVO. Daten werden ausschließlich zur Vertragserfüllung verwendet und nicht an Dritte weitergegeben.`,
  },
  {
    title: "§ 9 Schlussbestimmungen",
    content: `Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, Olpe.

Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.`,
  },
];

const Page = () => {
  return (
    <div className='bg-gray-50 min-h-screen py-12 px-4'>
      <div className='max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12'>
        <h1 className='font-sans font-bold text-3xl md:text-4xl text-navy text-center mb-2'>
          Allgemeine Geschäftsbedingungen
        </h1>
        <p className='font-body text-gray-500 text-center mb-10 text-sm'>
          Umzugshelden · Inhaber Muhammed Ali Güngör · In der Trift 1, 57489
          Drolshagen
        </p>

        <div className='space-y-8'>
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className='font-sans font-semibold text-xl text-navy mb-3 pb-2 border-b border-primary/30'>
                {s.title}
              </h2>
              <p className='font-body text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base'>
                {s.content}
              </p>
            </section>
          ))}
        </div>

        <p className='font-body text-gray-400 text-sm mt-10 text-center'>
          Stand: Juli 2026
        </p>
      </div>
    </div>
  );
};

export default Page;
