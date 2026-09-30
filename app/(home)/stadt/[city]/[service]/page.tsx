import CityServicePageData, {
  buildCityServiceMetadata,
  buildCityServiceStaticParams,
  type CityServiceRouteProps,
} from "./CityServicePageData";

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;

export function generateStaticParams() {
  return buildCityServiceStaticParams();
}

export default function ServicePage(props: CityServiceRouteProps) {
  return <CityServicePageData {...props} />;
}

export function generateMetadata(props: CityServiceRouteProps) {
  return buildCityServiceMetadata(props);
}