import { listApplicationsByOwner } from "@/actions/applicationActions";
import Headings from "@/components/Headings";
import ApplicationsListClient from "./ApplicationsListClient";

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  const applications = await listApplicationsByOwner(userid);
  // sort by createdAt desc
  applications.sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className='max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <Headings level={3}>Bewerbungen</Headings>
        <p className='text-sm text-muted-foreground'>
          Übersicht aller eingegangenen Bewerbungen (Status, Name, Stelle)
        </p>
      </div>
      <ApplicationsListClient
        initialApplications={applications}
        userid={userid}
      />
    </div>
  );
}
