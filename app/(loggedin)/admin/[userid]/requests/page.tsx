import Headings from "@/components/Headings";
import Link from "next/link";
import { listRequestsByOwner } from "@/actions/requestsActions";

export default async function RequestsAdminPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  // Owner scoping: userid must match request ownerId, we fetch only those.
  const requests = await listRequestsByOwner(userid);
  // Sort by createdAt DESC
  requests.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className='flex flex-col gap-10 max-w-5xl mx-auto px-6 py-10'>
      <div className='flex flex-col gap-2'>
        <Headings level={3}>Anfragen</Headings>
        <p className='text-sm text-muted-foreground'>
          Eingegangene Kontaktanfragen (neueste zuerst)
        </p>
      </div>

      {requests.length === 0 ? (
        <div className='border rounded-md p-8 text-center text-muted-foreground'>
          Keine Anfragen vorhanden.
        </div>
      ) : (
        <ul className='grid gap-4'>
          {requests.map((r) => (
            <li
              key={r.id}
              className='border rounded-md p-5 bg-card/50 hover:bg-card transition-colors'>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold text-base'>{r.name}</h3>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {new Date(r.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground break-all'>
                  {r.email}
                </p>
                <p className='text-sm line-clamp-2 mt-1'>{r.message}</p>
                <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{r.phone || "Kein Telefon"}</span>
                  <Link
                    href={`/admin/${userid}/requests/${r.id}`}
                    className='underline underline-offset-4 hover:text-primary'>
                    Details & Notizen
                  </Link>
                </div>
                {r.notices.length > 0 && (
                  <div className='mt-2 text-xs text-green-600'>
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
