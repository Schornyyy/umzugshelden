import BlogGenerationReview from "@/components/admin/blog/BlogGenerationReview";
import { notFound } from "next/navigation";

export default async function BlogGenerationReviewPage({
  params,
}: {
  params: Promise<{ userid: string; proposalId: string }>;
}) {
  const { proposalId } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) notFound();
  return (
    <BlogGenerationReview ownerId={ownerId} proposalId={proposalId} />
  );
}
