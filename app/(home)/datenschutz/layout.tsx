import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Datenschutzerklärung | GS-Creatives - DSGVO-konforme Datenverarbeitung",
  description:
    "Vollständige DSGVO-konforme Datenschutzerklärung für GS-Creatives. Erfahren Sie, wie wir Ihre Daten schützen und verarbeiten. Transparenz und Datenschutz haben höchste Priorität.",
  keywords:
    "Datenschutz, DSGVO, Datenschutzerklärung, GS-Creatives, Webdesign, Datenverarbeitung, Privatsphäre",
  authors: [{ name: "GS-Creatives" }],
  robots: "index, follow",
  openGraph: {
    title: "Datenschutzerklärung | GS-Creatives",
    description:
      "DSGVO-konforme Datenschutzerklärung für GS-Creatives. Transparenz und Datenschutz haben höchste Priorität.",
    url: "https://gs-creatives.de/datenschutz",
    siteName: "GS-Creatives",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function DatenschutzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
