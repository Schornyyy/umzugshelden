import {
  ensureProfileForCatalogPartner,
  findCatalogPartnerByOwnerId,
  getPartner,
  getPartnerProfile,
  listPartnerEvents,
} from "@/actions/partnerActions";
import { PartnerEvent } from "@/types/PartnerEvent";
import Image from "next/image";
import { PartnerQuickActions } from "@/components/PartnerQuickActions";

export const metadata = { title: "Meine Statistiken" };

export default async function PartnerSelfStatsPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  // Find the catalog partner for this logged-in owner
  const catalog = await findCatalogPartnerByOwnerId(userid);
  if (!catalog) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <h1 className='text-xl font-semibold mb-2'>Statistiken</h1>
        <p className='text-sm text-slate-600'>Kein Partner-Profil gefunden.</p>
      </div>
    );
  }

  const partner = await getPartner(catalog.id);
  const events: PartnerEvent[] = await listPartnerEvents(catalog.id, 25);
  const profileId = await ensureProfileForCatalogPartner(catalog.id);
  const profile = await getPartnerProfile(profileId);

  const daysActive = Math.max(
    1,
    Math.round((Date.now() - (partner?.createdAt || Date.now())) / 86400000)
  );
  const avgPerDay = partner?.clicks ? partner.clicks / daysActive : 0;

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-10'>
      {/* Header */}
      <div className='flex items-start gap-6'>
        {partner?.logo && (
          <Image
            src={partner.logo}
            alt={partner.name}
            width={80}
            height={80}
            className='h-20 w-20 object-contain rounded bg-slate-50 border'
          />
        )}
        <div className='flex-1'>
          <h1 className='text-2xl font-bold mb-1'>
            {partner?.name || "Mein Partnerprofil"}
          </h1>
          <p className='text-sm text-slate-500'>
            Kategorie: {partner?.category || "–"} · Status:{" "}
            {partner?.active ? "Aktiv" : "Inaktiv"}
          </p>
          <div className='mt-4 flex flex-wrap gap-4 text-sm'>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Gesamt Klicks</div>
              <div className='text-lg font-semibold'>
                {partner?.clicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Website-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner?.websiteClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>E-Mail-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner?.emailClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Telefon-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner?.phoneClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Seitenaufrufe</div>
              <div className='text-lg font-semibold'>{partner?.views ?? 0}</div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Ø Klicks/Tag</div>
              <div className='text-lg font-semibold'>
                {avgPerDay.toFixed(2)}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Tage aktiv</div>
              <div className='text-lg font-semibold'>{daysActive}</div>
            </div>
          </div>
          {/* Quick Actions */}
          <div className='mt-4'>
            <PartnerQuickActions
              partnerId={catalog.id}
              website={partner?.link}
              email={profile?.email}
              phone={profile?.phone}
            />
          </div>
        </div>
      </div>

      {/* Events */}
      <div id='events'>
        <h2 className='font-semibold text-lg mb-4'>Letzte Ereignisse</h2>
        {!events.length && (
          <p className='text-sm text-slate-500'>Keine Ereignisse.</p>
        )}
        <ul className='space-y-2 max-h-96 overflow-auto pr-2'>
          {events.map((ev) => (
            <li
              key={ev.id}
              className='text-xs flex items-center justify-between bg-white border rounded px-3 py-2'>
              <span className='font-medium'>
                {ev.type === "website_click"
                  ? "Website Klick"
                  : ev.type === "email_click"
                  ? "E-Mail Klick"
                  : ev.type === "phone_click"
                  ? "Telefon Klick"
                  : ev.type === "view"
                  ? "Seitenaufruf"
                  : ev.type}
              </span>
              <span className='text-slate-500'>
                {new Date(ev.createdAt).toLocaleString("de-DE")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
