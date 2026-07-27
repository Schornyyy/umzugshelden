import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Umzugshelden",
  description:
    "Datenschutzerklärung von Umzugshelden. Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer Daten – DSGVO-konform und transparent.",
  keywords:
    "Datenschutz, DSGVO, Datenschutzerklärung, Umzugshelden, Datenverarbeitung, Privatsphäre",
  authors: [{ name: "Umzugshelden" }],
  robots: "index, follow",
  openGraph: {
    title: "Datenschutzerklärung | Umzugshelden",
    description:
      "Datenschutzerklärung von Umzugshelden. Transparente und DSGVO-konforme Angaben zur Verarbeitung personenbezogener Daten.",
    url: "https://umzugshelden.io/datenschutz",
    siteName: "Umzugshelden",
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
