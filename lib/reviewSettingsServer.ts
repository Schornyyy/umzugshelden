import "server-only";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  defaultReviewSettings,
  reviewSettingsSchema,
  type ReviewSettings,
} from "@/lib/reviewSettings";

export async function getPublicReviewSettings(): Promise<ReviewSettings> {
  const snapshot = await getAdminDatabase()
    .collection("page_builder_elements_umzugshelden")
    .doc("reviews")
    .get();

  return snapshot.exists
    ? reviewSettingsSchema.parse(snapshot.data())
    : defaultReviewSettings;
}
