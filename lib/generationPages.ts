import "server-only";

import { listPublicBlogPages } from "@/lib/blogPublicData";
import {
  getPublicCityLandingSitemapRecords,
  getPublicCityServiceSitemapRecords,
} from "@/lib/cityPublicData";
import {
  buildGenerationPages,
  type GenerationPage,
} from "@/lib/generationPagePolicy";

export { restrictGenerationAnalysis } from "@/lib/generationPagePolicy";

export async function getGenerationPages(): Promise<GenerationPage[]> {
  const [blogs, landings, services] = await Promise.all([
    listPublicBlogPages(),
    getPublicCityLandingSitemapRecords(),
    getPublicCityServiceSitemapRecords(),
  ]);
  return buildGenerationPages({ blogs, landings, services });
}
