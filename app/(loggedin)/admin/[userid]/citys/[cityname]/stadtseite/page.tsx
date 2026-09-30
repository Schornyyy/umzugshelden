import CityLandingContentEditor from "@/components/admin/city/CityLandingContentEditor";
import { rawCities } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import { notFound } from "next/navigation";

export default async function CityLandingEditorPage({
  params,
}: {
  params: Promise<{ userid: string; cityname: string }>;
}) {
  const { cityname } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  const citySlug = decodeURIComponent(cityname);
  const cityName = rawCities.find((city) => slugify(city) === citySlug);
  if (!cityName) notFound();
  if (!ownerId) {
    return <p className='p-6 text-red-600'>Owner-ID nicht konfiguriert.</p>;
  }

  return (
    <div className='w-full'>
      <CityLandingContentEditor
        mode='page'
        ownerId={ownerId}
        cityName={cityName}
        citySlug={citySlug}
      />
    </div>
  );
}