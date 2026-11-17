import { LANDING_PAGE_ROBOTS } from "@/lib/landingPageSettings";
import type { Review } from "@/lib/reviewSettings";
import { getPublicReviewSettings } from "@/lib/reviewSettingsServer";
import type { Metadata } from "next";
import UmzugLandingPage from "./_components/UmzugLandingPage";

// Statisch vorgerendert (CDN), Bewertungen werden stündlich aktualisiert.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Professioneller Umzug zum Festpreis | Umzugshelden",
  description:
    "Stressfrei umziehen mit den Umzugshelden: sorgfältige Planung, versicherter Transport und verbindliches Angebot. Jetzt kostenlos anfragen.",
  alternates: { canonical: "https://www.umzugshelden.io/landingpage/umzug" },
  robots: LANDING_PAGE_ROBOTS,
};

async function loadReviews(): Promise<Review[] | undefined> {
  try {
    return (await getPublicReviewSettings()).reviews;
  } catch (error) {
    // Ohne Bewertungen statisch ausliefern; das Karussell lädt sie dann im Browser nach.
    console.error("Bewertungen für die Umzug-Landingpage nicht verfügbar:", error);
    return undefined;
  }
}

export default async function UmzugLandingpageRoute() {
  return <UmzugLandingPage reviews={await loadReviews()} />;
}
