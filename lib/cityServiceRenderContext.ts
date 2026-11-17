import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { getCityServiceSeoContent } from "@/lib/cityServiceSeo";
import type { CityServiceTemplateContext } from "@/lib/cityServiceTemplate";
import { getNearbyCities } from "@/statics/Lists";
import type { CityServiceKey } from "@/types/city/CityServicePage";

/** Baut Platzhalter-Kontext und Local-SEO-Daten für den CityServiceBlocksRenderer. */
export function buildCityServiceRenderContext(input: {
  cityName: string;
  serviceKey: CityServiceKey;
  primaryKeyword?: string;
}) {
  const serviceName = getDefaultCityServiceName(input.serviceKey);
  const primaryKeyword = input.primaryKeyword || serviceName;
  const nearbyCities = getNearbyCities(input.cityName);
  const localSeo = getCityServiceSeoContent({
    cityName: input.cityName,
    serviceKey: input.serviceKey,
    serviceName,
    primaryKeyword,
    nearbyCities,
    nearbyLimit: 3,
  });
  const context: CityServiceTemplateContext = {
    city: input.cityName,
    service: serviceName,
    primaryKeyword,
    region: localSeo.regionName,
    localIntro: localSeo.introText,
    nearbyCities: nearbyCities
      .slice(0, 3)
      .map((city) => city.name)
      .join(", "),
  };
  return { serviceName, localSeo, context };
}
