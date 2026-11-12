import "server-only";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  landingPageSchema,
  type LandingPage,
} from "@/lib/landingPageSettings";

export const LANDING_PAGE_COLLECTION = "landing_pages_umzugshelden";

export async function listPublicLandingPages(): Promise<LandingPage[]> {
  const snapshot = await getAdminDatabase()
    .collection(LANDING_PAGE_COLLECTION)
    .get();

  return snapshot.docs
    .map((document) => landingPageSchema.safeParse(document.data()))
    .filter((result) => result.success)
    .map((result) => result.data)
    .sort((first, second) => first.serviceName.localeCompare(second.serviceName, "de"));
}

export async function getPublicLandingPage(
  slug: string,
): Promise<LandingPage | null> {
  const snapshot = await getAdminDatabase()
    .collection(LANDING_PAGE_COLLECTION)
    .doc(slug)
    .get();
  if (!snapshot.exists) return null;

  const parsed = landingPageSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("Ungültige Landingpage-Daten:", parsed.error);
    return null;
  }
  return parsed.data;
}
