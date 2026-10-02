import { getResolvedCityLandingPage } from "@/actions/cityServicePageActions";
import CityServiceBlocksRenderer from "@/components/city/CityServiceBlocksRenderer";
import ServiceSchema from "@/components/ServiceSchema";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import {
  assertCitySeoCoverage,
  CITY_SERVICE_CONTENT_LAST_MODIFIED,
  getCityServiceSeoContent,
} from "@/lib/cityServiceSeo";
import {
  resolveCityServiceText,
  type CityServiceTemplateContext,
} from "@/lib/cityServiceTemplate";
import { cities, getNearbyCities, rawCities } from "@/statics/Lists";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";
import { deslugify, slugify } from "@/utils/slugify";
import { redirect } from "next/navigation";

export type CityLandingRouteProps = {
  params: Promise<{ city: string }>;
};

function decodeCitySlug(value: string) {
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

function getCanonicalCityName(value: string) {
  return (
    rawCities.find(
      (city) => slugify(city).toLowerCase() === slugify(value).toLowerCase(),
    ) ?? value
  );
}

function joinGerman(values: readonly string[]) {
  if (values.length === 0) return "weitere Orte im Einsatzgebiet";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
}

async function loadCityLandingData(cityParam: string) {
  const cityName = getCanonicalCityName(
    deslugify(decodeCitySlug(cityParam)),
  );
  if (!rawCities.some((city) => slugify(city) === slugify(cityName))) {
    return null;
  }

  const citySlug = slugify(cityName);
  const resolved = await getResolvedCityLandingPage({ cityName, citySlug });
  const nearbyCities = getNearbyCities(cityName);
  const localAreaBlock = resolved.blocks.find(
    (block) => block.type === "localArea" && block.enabled,
  );
  const nearbyLimit =
    localAreaBlock?.type === "localArea" ? localAreaBlock.nearbyLimit : 3;
  const nearbyCityNames = nearbyCities
    .map((nearby) => nearby.name)
    .slice(0, nearbyLimit);
  const localSeo = getCityServiceSeoContent({
    cityName,
    serviceKey: "umzugsservice",
    serviceName: "Umzugsservice",
    primaryKeyword: "Umzugsservice",
    nearbyCities,
    nearbyLimit,
  });
  const context: CityServiceTemplateContext = {
    city: cityName,
    service: "Umzugsservice",
    primaryKeyword: "Umzugsservice",
    region: localSeo.regionName,
    localIntro: localSeo.introText,
    nearbyCities: joinGerman(nearbyCityNames),
  };

  return {
    cityName,
    citySlug,
    resolved,
    localSeo,
    context,
    nearbyCityNames,
  };
}

export function buildCityLandingStaticParams() {
  assertCitySeoCoverage(cities);
  return cities.map((city) => ({ city: slugify(city) }));
}

export default async function CityLandingPageData({
  params,
}: CityLandingRouteProps) {
  const { city } = await params;
  const data = await loadCityLandingData(city);
  if (!data || !data.resolved.page.published) redirect("/stadt");

  const path = `/stadt/${encodeURIComponent(data.citySlug)}`;
  return (
    <>
      <ServiceSchema
        name={`Umzugshelden in ${data.cityName}`}
        serviceType='Umzugs- und Renovierungsservice'
        description={resolveCityServiceText(
          data.resolved.seo.schemaDescription,
          data.context,
        )}
        path={path}
        city={data.cityName}
        region={data.localSeo.regionName}
        areaServed={data.nearbyCityNames}
        image={data.resolved.seo.image}
        imageAlt={resolveCityServiceText(
          data.resolved.seo.imageAlt,
          data.context,
        )}
        alternateNames={data.resolved.seo.keywords.map(
          (keyword) =>
            `${resolveCityServiceText(keyword, data.context)} ${data.cityName}`,
        )}
        offers={CITY_SERVICE_KEYS.map(getDefaultCityServiceName)}
        breadcrumbs={[
          { name: "Startseite", path: "/" },
          { name: data.cityName, path },
        ]}
        dateModified={CITY_SERVICE_CONTENT_LAST_MODIFIED}
      />
      <CityServiceBlocksRenderer
        blocks={data.resolved.blocks}
        cityName={data.cityName}
        citySlug={data.citySlug}
        context={data.context}
        localSeo={data.localSeo}
      />
    </>
  );
}

export async function buildCityLandingMetadata({
  params,
}: CityLandingRouteProps) {
  const { city } = await params;
  const data = await loadCityLandingData(city);
  if (!data) return { title: "Umzugshelden" };

  const title = resolveCityServiceText(data.resolved.seo.title, data.context);
  const description = resolveCityServiceText(
    data.resolved.seo.description,
    data.context,
  );
  const imageAlt = resolveCityServiceText(
    data.resolved.seo.imageAlt,
    data.context,
  );
  const socialImage = new URL(
    data.resolved.seo.image,
    "https://umzugshelden.io",
  ).toString();
  const url = `https://umzugshelden.io/stadt/${encodeURIComponent(data.citySlug)}`;
  const keywords = data.resolved.seo.keywords.flatMap((keyword) => {
    const resolvedKeyword = resolveCityServiceText(keyword, data.context);
    return [
      `${resolvedKeyword} ${data.cityName}`,
      `${resolvedKeyword} in ${data.cityName}`,
    ];
  });

  return {
    title,
    description,
    keywords,
    robots: {
      index: data.resolved.page.published,
      follow: data.resolved.page.published,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "de_DE",
      siteName: "Umzugshelden",
      url,
      images: [{ url: socialImage, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    alternates: { canonical: url },
  };
}