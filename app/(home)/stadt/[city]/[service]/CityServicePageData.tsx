import { getResolvedCityServicePage } from "@/actions/cityServicePageActions";
import CityServiceBlocksRenderer from "@/components/city/CityServiceBlocksRenderer";
import ServiceSchema from "@/components/ServiceSchema";
import {
  assertCitySeoCoverage,
  getCityServiceSeoContent,
} from "@/lib/cityServiceSeo";
import {
  resolveCityServiceText,
  type CityServiceTemplateContext,
} from "@/lib/cityServiceTemplate";
import { cities, getNearbyCities, rawCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
  type ResolvedCityServicePage,
} from "@/types/city/CityServicePage";
import { deslugify, slugify } from "@/utils/slugify";
import { redirect } from "next/navigation";

export type CityServiceRouteProps = {
  params: Promise<{ city: string; service: string }>;
};

function isAllowedCity(cityName: string) {
  return rawCities.some(
    (city) =>
      slugify(city).toLowerCase() === slugify(cityName).toLowerCase(),
  );
}

function getCanonicalCityName(cityName: string) {
  return (
    rawCities.find(
      (city) =>
        slugify(city).toLowerCase() === slugify(cityName).toLowerCase(),
    ) ?? cityName
  );
}

function isServiceKey(value: string): value is CityServiceKey {
  return (CITY_SERVICE_KEYS as readonly string[]).includes(value);
}

function decodeCitySlug(value: string) {
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

function joinGerman(values: readonly string[]) {
  if (values.length === 0) return "weitere Orte im Einsatzgebiet";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
}

function buildPageContext(
  resolved: ResolvedCityServicePage,
  cityName: string,
  nearbyCityNames: readonly string[],
  regionName: string,
  localIntro: string,
): CityServiceTemplateContext {
  return {
    city: cityName,
    service: resolved.template.serviceName,
    primaryKeyword: resolved.template.primaryKeyword,
    region: regionName,
    localIntro,
    nearbyCities: joinGerman(nearbyCityNames),
  };
}

async function loadPageData(cityParam: string, serviceParam: string) {
  const cityName = getCanonicalCityName(
    deslugify(decodeCitySlug(cityParam)),
  );
  const serviceKey = serviceParam.trim().toLowerCase();

  if (!isAllowedCity(cityName) || !isServiceKey(serviceKey)) return null;

  const citySlug = slugify(cityName);
  const resolved = await getResolvedCityServicePage({
    cityName,
    citySlug,
    serviceKey,
  });
  const nearbyCities = getNearbyCities(cityName);
  const localAreaBlock = resolved.blocks.find(
    (block) => block.type === "localArea" && block.enabled,
  );
  const nearbyLimit =
    localAreaBlock?.type === "localArea" ? localAreaBlock.nearbyLimit : 3;
  const localSeo = getCityServiceSeoContent({
    cityName,
    serviceKey,
    serviceName: resolved.template.serviceName,
    primaryKeyword: resolved.template.primaryKeyword,
    nearbyCities,
    nearbyLimit,
  });
  const context = buildPageContext(
    resolved,
    cityName,
    nearbyCities.map((nearby) => nearby.name).slice(0, nearbyLimit),
    localSeo.regionName,
    localSeo.introText,
  );

  return {
    cityName,
    citySlug,
    serviceKey,
    resolved,
    localSeo,
    context,
  };
}

export function buildCityServiceStaticParams() {
  assertCitySeoCoverage(cities);
  return cities.flatMap((city) =>
    CITY_SERVICE_KEYS.map((service) => ({
      city: slugify(city),
      service,
    })),
  );
}

export default async function CityServicePageData({
  params,
}: CityServiceRouteProps) {
  const { city, service } = await params;
  const data = await loadPageData(city, service);

  if (!data) redirect(`/stadt/${encodeURIComponent(city.trim())}`);
  if (!data.resolved.page.published) {
    redirect(`/stadt/${encodeURIComponent(data.citySlug)}`);
  }

  const path = `/stadt/${encodeURIComponent(data.citySlug)}/${data.serviceKey}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: "https://umzugshelden.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: data.cityName,
        item: `https://umzugshelden.io/stadt/${encodeURIComponent(data.citySlug)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${data.resolved.template.serviceName} in ${data.cityName}`,
        item: `https://umzugshelden.io${path}`,
      },
    ],
  };
  const featureBlock = data.resolved.blocks.find(
    (block) => block.id === "features" && block.type === "checkList",
  );

  return (
    <>
      <ServiceSchema
        name={`${data.resolved.template.serviceName} in ${data.cityName}`}
        serviceType={data.resolved.template.serviceName}
        description={resolveCityServiceText(
          data.resolved.seo.schemaDescription,
          data.context,
        )}
        path={path}
        city={data.cityName}
        image={data.resolved.seo.image}
        alternateNames={data.resolved.seo.keywords.map(
          (keyword) =>
            `${resolveCityServiceText(keyword, data.context)} ${data.cityName}`,
        )}
        offers={featureBlock?.type === "checkList" ? featureBlock.items : []}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CityServiceBlocksRenderer
        blocks={data.resolved.blocks}
        cityName={data.cityName}
        citySlug={data.citySlug}
        serviceKey={data.serviceKey}
        context={data.context}
        localSeo={data.localSeo}
      />
    </>
  );
}

export async function buildCityServiceMetadata({
  params,
}: CityServiceRouteProps) {
  const { city, service } = await params;
  const data = await loadPageData(city, service);

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
  const url = `https://umzugshelden.io/stadt/${encodeURIComponent(data.citySlug)}/${data.serviceKey}`;
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
      googleBot: {
        index: data.resolved.page.published,
        follow: data.resolved.page.published,
        "max-snippet": -1,
        "max-image-preview": "large" as const,
        "max-video-preview": -1,
      },
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