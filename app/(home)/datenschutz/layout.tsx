import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Hausmeisterservice Weiß",
  description:
    "Datenschutzerklärung von Hausmeisterservice Weiß. Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer Daten – DSGVO-konform und transparent.",
  keywords:
    "Datenschutz, DSGVO, Datenschutzerklärung, Hausmeisterservice Weiß, Datenverarbeitung, Privatsphäre",
  authors: [{ name: "Hausmeisterservice Weiß" }],
  robots: "index, follow",
  openGraph: {
    title: "Datenschutzerklärung | Hausmeisterservice Weiß",
    description:
      "Datenschutzerklärung von Hausmeisterservice Weiß. Transparente und DSGVO-konforme Angaben zur Verarbeitung personenbezogener Daten.",
    url: "https://weiss-hausmeisterservice.de/datenschutz",
    siteName: "Hausmeisterservice Weiß",
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
