import CityServiceContentEditor from "@/components/admin/city/CityServiceContentEditor";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
} from "@/types/city/CityServicePage";
import { notFound } from "next/navigation";

function isServiceKey(value: string): value is CityServiceKey {
  return (CITY_SERVICE_KEYS as readonly string[]).includes(value);
}

export default async function CityServiceTemplateEditorPage({
  params,
}: {
  params: Promise<{ userid: string; service: string }>;
}) {
  const { userid, service } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!isServiceKey(service)) notFound();
  if (!ownerId) {
    return <p className='p-6 text-red-600'>Owner-ID nicht konfiguriert.</p>;
  }

  return (
    <div className='w-full'>
      <CityServiceContentEditor
        mode='template'
        ownerId={ownerId}
        userId={decodeURIComponent(userid)}
        serviceKey={service}
      />
    </div>
  );
}