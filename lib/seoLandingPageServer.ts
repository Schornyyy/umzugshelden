import "server-only";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  SEO_LANDING_CAMPAIGN_COLLECTION,
  SEO_LANDING_PAGE_COLLECTION,
  seoLandingPageId,
} from "@/lib/seoLandingPages";
import type {
  SeoLandingCampaign,
  SeoLandingPage,
} from "@/types/landingpage/SeoLandingPage";

export function serializeSeoLandingCampaign(
  id: string,
  data: FirebaseFirestore.DocumentData,
): SeoLandingCampaign {
  return {
    id,
    ownerId: String(data.ownerId),
    keyword: String(data.keyword),
    keywordSlug: String(data.keywordSlug),
    serviceKey: data.serviceKey,
    stage: data.stage,
    published: data.published === true,
    cityCount: Number(data.cityCount || 0),
    completedCities: Number(data.completedCities || 0),
    sourceCount:
      typeof data.researchIndex?.sourceCount === "number"
        ? data.researchIndex.sourceCount
        : undefined,
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
    lastError: typeof data.lastError === "string" ? data.lastError : null,
    createdAt: Number(data.createdAt || 0),
    updatedAt: Number(data.updatedAt || 0),
  };
}

export async function getPublishedSeoLandingPage(
  keywordSlug: string,
  citySlug: string,
): Promise<SeoLandingPage | null> {
  const snapshot = await getAdminDatabase()
    .collection(SEO_LANDING_PAGE_COLLECTION)
    .doc(seoLandingPageId(keywordSlug, citySlug))
    .get();
  if (!snapshot.exists || snapshot.get("published") !== true) return null;
  return { ...(snapshot.data() as Omit<SeoLandingPage, "id">), id: snapshot.id };
}

export async function listPublishedSeoLandingPageRecords(): Promise<
  Array<Pick<SeoLandingPage, "keywordSlug" | "citySlug" | "updatedAt">>
> {
  const snapshot = await getAdminDatabase()
    .collection(SEO_LANDING_PAGE_COLLECTION)
    .where("published", "==", true)
    .select("keywordSlug", "citySlug", "updatedAt")
    .get();
  return snapshot.docs.map((document) => ({
    keywordSlug: String(document.get("keywordSlug")),
    citySlug: String(document.get("citySlug")),
    updatedAt: Number(document.get("updatedAt") || 0),
  }));
}

export function seoLandingCampaignReference(campaignId: string) {
  return getAdminDatabase()
    .collection(SEO_LANDING_CAMPAIGN_COLLECTION)
    .doc(campaignId);
}
