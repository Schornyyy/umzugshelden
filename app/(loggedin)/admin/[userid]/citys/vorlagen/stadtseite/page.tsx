import CityLandingContentEditor from "@/components/admin/city/CityLandingContentEditor";

export default async function CityLandingTemplatePage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return <p className='p-6 text-red-600'>Owner-ID nicht konfiguriert.</p>;
  }

  return (
    <div className='w-full'>
      <CityLandingContentEditor
        mode='template'
        ownerId={ownerId}
      />
    </div>
  );
}