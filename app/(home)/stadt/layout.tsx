import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umzugshelden — Umzugsservice in Ihrer Stadt",
  description:
    "Umzugshelden bietet professionellen Umzugsservice, Anstricharbeiten und Möbelmontage im Kreis Olpe und 25 km Umkreis. Jetzt unverbindlich anfragen!",
  keywords: [
    "Umzugsservice",
    "Umzugshelden",
    "Anstricharbeiten",
    "Möbelmontage",
    "Kreis Olpe",
  ],
  openGraph: {
    title: "Umzugshelden — Lokale Stadtseiten",
    description:
      "Professioneller Umzugsservice im Kreis Olpe und Umgebung — kontaktieren Sie Umzugshelden für ein kostenloses Angebot.",
    type: "website",
    locale: "de_DE",
    url: "https://umzugshelden.de/stadt",
  },
  alternates: {
    canonical: "https://umzugshelden.de/stadt",
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
