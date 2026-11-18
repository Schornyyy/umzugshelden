import CityServiceBlocksRenderer from "@/components/city/CityServiceBlocksRenderer";
import { buildCityServiceRenderContext } from "@/lib/cityServiceRenderContext";
import { generationSiteUrl } from "@/lib/generationPagePolicy";
import { seoLandingPagePath } from "@/lib/seoLandingPages";
import { getPublishedSeoLandingPage } from "@/lib/seoLandingPageServer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type Props = {
  params: Promise<{ service: string; city: string }>;
};

async function loadPage({ params }: Props) {
  const { service, city } = await params;
  return getPublishedSeoLandingPage(
    decodeURIComponent(service),
    decodeURIComponent(city),
  );
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const page = await loadPage(props);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical: `${generationSiteUrl()}${seoLandingPagePath(page.keywordSlug, page.citySlug)}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoCityLandingPage(props: Props) {
  const page = await loadPage(props);
  if (!page) notFound();
  const { localSeo, context } = buildCityServiceRenderContext({
    cityName: page.cityName,
    serviceKey: page.serviceKey,
    primaryKeyword: page.keyword,
  });

  return (
    <main>
      <CityServiceBlocksRenderer
        blocks={page.blocks}
        cityName={page.cityName}
        citySlug={page.citySlug}
        serviceKey={page.serviceKey}
        context={context}
        localSeo={localSeo}
        leadFocus={{
          source: `SEO-Landingpage ${page.keyword} – ${page.cityName}`,
          trackingSource: "seo_landingpage",
          serviceLabel: page.keyword,
        }}
      />
    </main>
  );
}
