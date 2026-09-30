import CityServiceContentEditor from "@/components/admin/city/CityServiceContentEditor";
import { rawCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
} from "@/types/city/CityServicePage";
import { slugify } from "@/utils/slugify";
import { notFound } from "next/navigation";

function isServiceKey(value: string): value is CityServiceKey {
  return (CITY_SERVICE_KEYS as readonly string[]).includes(value);
}

export default async function CityServicePageEditor({
  params,
}: {
  params: Promise<{ userid: string; cityname: string; service: string }>;
}) {
  const { userid, cityname, service } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  const citySlug = decodeURIComponent(cityname);
  const cityName = rawCities.find((city) => slugify(city) === citySlug);

  if (!cityName || !isServiceKey(service)) notFound();
  if (!ownerId) {
    return <p className='p-6 text-red-600'>Owner-ID nicht konfiguriert.</p>;
  }

  return (
    <div className='w-full'>
      <CityServiceContentEditor
        mode='page'
        ownerId={ownerId}
        userId={decodeURIComponent(userid)}
        serviceKey={service}
        cityName={cityName}
        citySlug={citySlug}
      />
    </div>
  );
}