import Headings from "@/components/Headings";
import { getRequestById } from "@/actions/requestsActions";
import { notFound } from "next/navigation";
import RequestDetailClient from "./RequestDetailClient";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ userid: string; id: string }>;
}) {
  const { userid, id } = await params;
  const request = await getRequestById(id, userid);
  if (!request) notFound();

  return (
    <div className='max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <Headings level={3}>Anfrage Details</Headings>
        <p className='text-sm text-muted-foreground'>ID: {request.id}</p>
      </div>
      <RequestDetailClient initialRequest={request} userid={userid} />
    </div>
  );
}
