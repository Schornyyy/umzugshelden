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
    <div className='mx-auto flex max-w-6xl flex-col gap-6 py-2 md:gap-8 md:px-6 md:py-8'>
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
