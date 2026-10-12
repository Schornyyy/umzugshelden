import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import type { CityServiceBlock, CityServiceKey } from "@/types/city/CityServicePage";

export type BlogGenerationStage =
  | "keyword"
  | "research"
  | "content"
  | "expand"
  | "links"
  | "completed";

export interface GeneratedBlogDraft {
  title: string;
  slug: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  cityName: string;
  serviceKey: CityServiceKey;
  mainCategory: AdminBlogMainCategory;
  subcategorySlug: string;
  blocks: CityServiceBlock[];
}

export interface BlogGenerationProposal {
  id: string;
  ownerId: string;
  status: "pending" | "accepted" | "rejected";
  serviceKey: CityServiceKey;
  cityName: string;
  keyword: string;
  draft: GeneratedBlogDraft;
  createdAt: string;
  decidedAt?: string;
}
