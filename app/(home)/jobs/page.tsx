import Headings from "@/components/Headings";
import { getAllJobsbyOwnerId } from "@/actions/jobActions";
import Link from "next/link";

export default async function JobsPage() {
  const ownerId = process.env.NEXT_PUBLIC_OWNERID;

  if (!ownerId) {
    return (
      <div className='mx-auto max-w-5xl px-4 py-12'>
        <Headings level={2}>Stellenangebote</Headings>
        <p className='mt-4 text-red-600'>
          Fehler: Keine Owner-ID konfiguriert. Bitte `NEXT_PUBLIC_OWNERID`
          setzen.
        </p>
      </div>
    );
  }

  const jobs = await getAllJobsbyOwnerId(ownerId);

  return (
    <div className='mx-auto max-w-5xl px-4 py-12'>
      <div className='mb-8'>
        <Headings level={2}>Stellenangebote</Headings>
        <p className='mt-2 text-muted-foreground'>
          Hier finden Sie unsere aktuellen offenen Positionen.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className='rounded-md border bg-card p-8 text-center'>
          <p className='text-muted-foreground'>
            Aktuell sind keine Stellen ausgeschrieben.
          </p>
        </div>
      ) : (
        <ul className='grid gap-6 sm:grid-cols-2'>
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className='block rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow'>
                <h3 className='text-lg font-semibold'>{job.titel}</h3>
                {job.shortText ? (
                  <p className='mt-2 text-sm text-muted-foreground'>
                    {job.shortText}
                  </p>
                ) : job.text ? (
                  <p className='mt-2 text-sm text-muted-foreground line-clamp-4'>
                    {job.text}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
