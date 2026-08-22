"use client";
import { useState } from "react";
import Link from "next/link";
import { Application } from "@/types/Applications";
import { Button } from "@/components/ui/button";

interface Props {
  initialApplications: Application[];
  userid: string;
}

const PAGE_SIZE = 12;

export default function ApplicationsListClient({
  initialApplications,
  userid,
}: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(initialApplications.length / PAGE_SIZE)
  );
  const start = (page - 1) * PAGE_SIZE;
  const current = initialApplications.slice(start, start + PAGE_SIZE);

  function nextPage() {
    setPage((p) => Math.min(totalPages, p + 1));
  }
  function prevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  function statusLabel(code: Application["status"]): string {
    switch (code) {
      case "pending":
        return "Offen";
      case "in_review":
        return "In Prüfung";
      case "accepted":
        return "Angenommen";
      case "rejected":
        return "Abgelehnt";
      default:
        return code;
    }
  }

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      {current.length === 0 ? (
        <div className='rounded-md border border-slate-200 bg-white p-10 text-center text-muted-foreground shadow-sm'>
          Keine Bewerbungen vorhanden.
        </div>
      ) : (
        <ul className='grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3'>
          {current.map((app) => (
            <li
              key={app.id}
              className='rounded-md border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30'>
              <Link
                href={`/admin/${userid}/applications/${app.id}`}
                className='flex min-h-32 flex-col gap-3 p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {new Date(app.createdAt).toLocaleDateString("de-DE")}
                  </span>
                  <span
                    className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700'>
                    {statusLabel(app.status)}
                  </span>
                </div>
                <h3 className='text-base font-semibold'>{app.name}</h3>
                <p className='mt-auto text-sm text-muted-foreground line-clamp-2'>
                  {app.jobTitel || "(ohne Stellenbezug)"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {/* Pagination Controls */}
      {initialApplications.length > PAGE_SIZE && (
        <div className='mt-2 flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm'>
          <div className='text-xs text-muted-foreground'>
            Seite {page} / {totalPages}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-10'
              onClick={prevPage}
              disabled={page === 1}>
              Zurück
            </Button>
            <Button
              variant='outline'
              className='h-10'
              onClick={nextPage}
              disabled={page === totalPages}>
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
