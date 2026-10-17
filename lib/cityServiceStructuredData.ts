import type { CityServiceSeoContent } from "@/lib/cityServiceSeo";
import {
  resolveCityServiceText,
  type CityServiceTemplateContext,
} from "@/lib/cityServiceTemplate";
import type { CityServiceBlock } from "@/types/city/CityServicePage";
import type { FAQType } from "@/types/utils/FAQType";

export function getResolvedCityServiceFaqs(
  blocks: readonly CityServiceBlock[],
  context: CityServiceTemplateContext,
  localSeo: CityServiceSeoContent,
): FAQType[] {
  return blocks.flatMap((block) => {
    if (!block.enabled || block.type !== "faq") return [];

    const faqs = block.items.map((item) => ({
      question: resolveCityServiceText(item.question, context),
      answer: resolveCityServiceText(item.answer, context),
    }));
    if (block.includeLocalQuestion) faqs.push(localSeo.localFaq);
    return faqs;
  });
}
