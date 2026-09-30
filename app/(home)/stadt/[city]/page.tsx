import CityLandingPageData, {
  buildCityLandingMetadata,
  buildCityLandingStaticParams,
  type CityLandingRouteProps,
} from "./CityLandingPageData";

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;

export function generateStaticParams() {
  return buildCityLandingStaticParams();
}

export default function CityPage(props: CityLandingRouteProps) {
  return <CityLandingPageData {...props} />;
}

export function generateMetadata(props: CityLandingRouteProps) {
  return buildCityLandingMetadata(props);
}