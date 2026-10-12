import type {
  CityServiceBlock,
  CityServiceKey,
  CityServiceSeoSettings,
} from "@/types/city/CityServicePage";

export interface GeneratedCityPageDraft {
  blocks: CityServiceBlock[];
  seo: CityServiceSeoSettings;
  strategy: {
    primaryKeyword: string;
    searchIntent: string;
    conversionGoal: string;
    differentiators: string[];
  };
}

export type CityServiceOptimizationStatus =
  | "pending"
  | "accepted"
  | "rejected";

export interface CityServiceOptimizationProposal {
  id: string;
  ownerId: string;
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
  pageKey: string;
  analysisId?: string;
  status: CityServiceOptimizationStatus;
  source: "manual" | "cron";
  previous: {
    blocks: CityServiceBlock[];
    seo: CityServiceSeoSettings;
    updatedAt: number;
  };
  draft: GeneratedCityPageDraft;
  targetRank?: number;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
