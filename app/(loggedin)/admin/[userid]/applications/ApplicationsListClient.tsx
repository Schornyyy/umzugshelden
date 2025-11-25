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
    <div className='flex flex-col gap-6'>
      {current.length === 0 ? (
        <div className='border rounded-md p-10 text-center text-muted-foreground'>
          Keine Bewerbungen vorhanden.
        </div>
      ) : (
        <ul className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {current.map((app) => (
            <li
              key={app.id}
              className='border rounded-md p-4 bg-card/50 hover:bg-card transition-colors'>
              <Link
                href={`/admin/${userid}/applications/${app.id}`}
                className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {new Date(app.createdAt).toLocaleDateString("de-DE")}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded bg-muted font-semibold`}>
                    {statusLabel(app.status)}
                  </span>
                </div>
                <h3 className='font-semibold text-sm'>{app.name}</h3>
                <p className='text-xs text-muted-foreground line-clamp-2'>
                  {app.jobTitel || "(ohne Stellenbezug)"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {/* Pagination Controls */}
      {initialApplications.length > PAGE_SIZE && (
        <div className='flex items-center justify-between mt-2'>
          <div className='text-xs text-muted-foreground'>
            Seite {page} / {totalPages}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={prevPage}
              disabled={page === 1}>
              Zurück
            </Button>
            <Button
              variant='outline'
              size='sm'
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
