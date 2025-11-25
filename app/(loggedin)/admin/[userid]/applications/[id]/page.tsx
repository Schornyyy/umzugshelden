import { getApplicationById } from "@/actions/applicationActions";
import Headings from "@/components/Headings";
import { notFound } from "next/navigation";
import ApplicationDetailClient from "./ApplicationDetailClient";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ userid: string; id: string }>;
}) {
  const { userid, id } = await params;
  const application = await getApplicationById(id, userid);
  if (!application) notFound();
  return (
    <div className='max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <Headings level={3}>Bewerbung bearbeiten</Headings>
        <p className='text-sm text-muted-foreground'>ID: {application.id}</p>
      </div>
      <ApplicationDetailClient
        initialApplication={application}
        userid={userid}
      />
    </div>
  );
}
