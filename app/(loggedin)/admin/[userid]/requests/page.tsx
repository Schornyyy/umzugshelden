import Headings from "@/components/Headings";
import Link from "next/link";
import { listRequestsByOwner } from "@/actions/requestsActions";

export default async function RequestsAdminPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  const ownerId = process.env.NEXT_PUBLIC_OWNERID;
  if (!ownerId)
    return <p className='p-6 text-red-600'>Owner-ID nicht konfiguriert.</p>;
  const requests = await listRequestsByOwner(ownerId);
  // Sort by createdAt DESC
  requests.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 py-2 md:gap-8 md:px-6 md:py-8'>
      <div className='flex flex-col gap-2'>
        <Headings level={3}>Anfragen</Headings>
        <p className='text-sm text-muted-foreground'>
          Eingegangene Kontaktanfragen (neueste zuerst)
        </p>
      </div>

      {requests.length === 0 ? (
        <div className='rounded-md border border-slate-200 bg-white p-8 text-center text-muted-foreground shadow-sm'>
          Keine Anfragen vorhanden.
        </div>
      ) : (
        <ul className='grid gap-3 md:gap-4'>
          {requests.map((r) => (
            <li
              key={r.id}
              className='rounded-md border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30 md:p-5'>
              <div className='flex flex-col gap-2'>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                  <h3 className='font-semibold text-base'>{r.name}</h3>
                  <span className='text-xs text-muted-foreground'>
                    {new Date(r.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground break-all'>
                  {r.email}
                </p>
                <p className='mt-1 text-sm leading-6 line-clamp-3'>{r.message}</p>
                <div className='mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-muted-foreground'>
                  <span>{r.phone || "Kein Telefon"}</span>
                  <Link
                    href={`/admin/${userid}/requests/${r.id}`}
                    className='shrink-0 rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-blue-700'>
                    Details & Notizen
                  </Link>
                </div>
                {r.notices.length > 0 && (
                  <div className='text-xs font-medium text-emerald-700'>
                    {r.notices.length} Notiz{r.notices.length > 1 ? "en" : ""}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
