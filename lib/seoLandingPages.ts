import type { SeoLandingCampaignStage } from "@/types/landingpage/SeoLandingPage";

export const SEO_LANDING_CAMPAIGN_COLLECTION = "seoLandingCampaigns";
export const SEO_LANDING_PAGE_COLLECTION = "seoLandingPages_umzugshelden";

/** Städte, die pro Arbeitsschritt parallel lokalisiert werden. */
export const SEO_LANDING_CITIES_PER_STEP = 3;

export function seoLandingPageId(keywordSlug: string, citySlug: string) {
  return `${keywordSlug}__${citySlug}`;
}

export function seoLandingPagePath(keywordSlug: string, citySlug: string) {
  return `/landingpage/${keywordSlug}/${citySlug}`;
}

export const SEO_LANDING_STAGE_LABELS: Record<SeoLandingCampaignStage, string> = {
  research: "Top-5-Recherche & Vektor-Datenbank",
  n8n: "n8n-Auswertung",
  blueprint: "Seitenstruktur planen",
  sections: "Sektionen schreiben",
  cities: "Stadtseiten lokalisieren & verlinken",
  completed: "Fertig",
  failed: "Fehlgeschlagen",
};

export function isSeoLandingCampaignActive(stage: SeoLandingCampaignStage) {
  return stage !== "completed" && stage !== "failed";
}
