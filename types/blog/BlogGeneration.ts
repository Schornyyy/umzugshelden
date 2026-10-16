import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import type { CityServiceBlock, CityServiceKey } from "@/types/city/CityServicePage";
import type { BlogKeywordType } from "@/lib/blogKeywords";

export type BlogGenerationStage =
  | "keyword"
  | "research"
  | "blueprint"
  | "sections"
  | "content"
  | "expand"
  | "links"
  | "quality"
  | "section-repair"
  | "completed";

export interface GeneratedBlogDraft {
  title: string;
  slug: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  primaryKeyword: string;
  primaryKeywordNormalized: string;
  keywordType: BlogKeywordType;
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
  operation?: "create" | "optimize";
  targetBlogId?: string;
  serviceKey: CityServiceKey;
  cityName: string;
  keyword: string;
  draft: GeneratedBlogDraft;
  qualityScore?: number;
  qualitySummary?: string;
  generationWarnings?: string[];
  createdAt: string;
  decidedAt?: string;
}
