import { notFound } from "next/navigation";
import CityServiceOptimizationList from "@/components/admin/city/CityServiceOptimizationList";

export default async function CityServiceOptimizationListPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) notFound();

  return (
    <CityServiceOptimizationList
      ownerId={ownerId}
      userId={decodeURIComponent(userid)}
    />
  );
}
