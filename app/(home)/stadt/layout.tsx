import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hausmeisterservice Weiß — Stadtseiten",
  description:
    "Hausmeisterservice Weiß bietet zuverlässige Hausmeisterdienste, Gebäudereinigung und Grundstückspflege in Ihrer Stadt. Jetzt unverbindlich anfragen!",
  keywords: [
    "Hausmeisterservice Weiß",
    "Hausmeisterservice",
    "Gebäudereinigung",
    "Grundstückspflege",
  ],
  openGraph: {
    title: "Hausmeisterservice Weiß — Lokale Stadtseiten",
    description:
      "Professionelle Hausmeisterdienste und Pflege für Immobilien — lokal in Ihrer Stadt. Kontaktieren Sie Hausmeisterservice Weiß für ein Angebot.",
    type: "website",
    locale: "de_DE",
    url: "https://weiss-hausmeisterservice.de/stadt",
  },
  alternates: {
    canonical: "https://weiss-hausmeisterservice.de/stadt",
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
