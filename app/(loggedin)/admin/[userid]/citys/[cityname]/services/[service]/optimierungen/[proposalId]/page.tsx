import { notFound } from "next/navigation";
import CityServiceOptimizationReview from "@/components/admin/city/CityServiceOptimizationReview";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";

export default async function CityServiceOptimizationReviewPage({
  params,
}: {
  params: Promise<{
    userid: string;
    cityname: string;
    service: string;
    proposalId: string;
  }>;
}) {
  const { service, proposalId } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (
    !ownerId ||
    !(CITY_SERVICE_KEYS as readonly string[]).includes(service) ||
    !proposalId
  ) {
    notFound();
  }
  return (
    <CityServiceOptimizationReview
      ownerId={ownerId}
      proposalId={proposalId}
    />
  );
}
