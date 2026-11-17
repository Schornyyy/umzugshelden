import type {
  CityServiceBlock,
  CityServiceKey,
} from "@/types/city/CityServicePage";

export type SeoLandingCampaignStage =
  | "research"
  | "n8n"
  | "blueprint"
  | "sections"
  | "cities"
  | "completed"
  | "failed";

/** Ein Keyword, aus dem für jede Stadt eine Landingpage erzeugt wird. */
export interface SeoLandingCampaign {
  id: string;
  ownerId: string;
  keyword: string;
  keywordSlug: string;
  serviceKey: CityServiceKey;
  stage: SeoLandingCampaignStage;
  published: boolean;
  cityCount: number;
  completedCities: number;
  sourceCount?: number;
  warnings: string[];
  lastError?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SeoLandingPage {
  id: string;
  campaignId: string;
  ownerId: string;
  keyword: string;
  keywordSlug: string;
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  blocks: CityServiceBlock[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}
