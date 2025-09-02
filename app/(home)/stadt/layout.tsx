import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Garten- und Landschaftsbau in über 1000 deutschen Städten | Landschaftshelden.io",
  description:
    "Finden Sie qualifizierte Garten- und Landschaftsbauer in Ihrer Stadt. Kostenlose Angebote von geprüften Galabau-Betrieben in über 1000 deutschen Städten. Jetzt Auftrag erstellen!",
  keywords: [
    "Garten Landschaftsbau Deutschland",
    "GaLaBau Städte",
    "Landschaftsgärtner finden",
    "Galabau-Betriebe Deutschland",
    "Stadt wählen Gartenbau",
    "Kostenlose Angebote Landschaftsbau",
    "Auftrag erstellen Garten",
    "Landschaftshelden",
    "Deutschlandweit Galabau",
    "Lokale Gartenbauer finden",
  ],
  openGraph: {
    title: "Garten- und Landschaftsbau in über 1000 deutschen Städten",
    description:
      "Qualifizierte Galabau-Betriebe in Ihrer Stadt finden. Kostenlose Angebote von geprüften Garten- und Landschaftsbauern.",
    type: "website",
    locale: "de_DE",
    url: "https://www.landschaftshelden.io/stadt",
  },
  alternates: {
    canonical: "https://www.landschaftshelden.io/stadt",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function StadtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
