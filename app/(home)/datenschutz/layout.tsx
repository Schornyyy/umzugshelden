import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Datenschutzerklärung | Landschaftshelden.io - DSGVO-konforme Datenverarbeitung",
  description:
    "Vollständige DSGVO-konforme Datenschutzerklärung für Landschaftshelden.io. Erfahren Sie, wie wir Ihre Daten schützen und verarbeiten. Transparenz und Datenschutz haben höchste Priorität.",
  keywords:
    "Datenschutz, DSGVO, Datenschutzerklärung, Landschaftshelden, Garten und Landschaftsbau, Datenverarbeitung, Privatsphäre",
  authors: [{ name: "Landschaftshelden.io" }],
  robots: "index, follow",
  openGraph: {
    title: "Datenschutzerklärung | Landschaftshelden.io",
    description:
      "DSGVO-konforme Datenschutzerklärung für Landschaftshelden.io. Transparenz und Datenschutz haben höchste Priorität.",
    url: "https://landschaftshelden.io/datenschutz",
    siteName: "Landschaftshelden.io",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Datenschutzerklärung | Landschaftshelden.io",
    description: "DSGVO-konforme Datenschutzerklärung für Landschaftshelden.io",
  },
  alternates: {
    canonical: "https://landschaftshelden.io/datenschutz",
  },
};

export default function DatenschutzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
