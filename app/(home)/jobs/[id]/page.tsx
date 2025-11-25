import Headings from "@/components/Headings";
import { getJobById } from "@/actions/jobActions";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import ApplicationForm from "@/components/ApplicationForm";
import { RichTextRender } from "@/components/RichTextRender";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID;

  if (!ownerId) {
    // Ohne Owner kann die Seite nicht sinnvoll arbeiten
    redirect("/jobs");
  }

  const job = await getJobById(id, ownerId);
  if (!job) {
    notFound();
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-12'>
      <div className='mb-6 flex items-center justify-between'>
        <Headings level={2}>{job.titel}</Headings>
        <form action='/jobs'>
          <Button type='submit' variant='outline'>
            Zur Übersicht
          </Button>
        </form>
      </div>

      {job.shortText && (
        <p className='text-muted-foreground mb-6'>{job.shortText}</p>
      )}

      {job.text && <RichTextRender value={job.text} />}
      {job && <ApplicationForm jobTitel={job.titel} />}
    </div>
  );
}
