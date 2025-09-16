import {
  getPartner,
  listPartnerEvents,
  updatePartnerFromForm,
  ensureProfileForCatalogPartner,
  getPartnerProfile,
} from "@/actions/partnerActions";
import { PartnerEvent } from "@/types/PartnerEvent";
import Image from "next/image";
import { PartnerProfileEditor } from "@/components/PartnerProfileEditor";
import { PartnerQuickActions } from "@/components/PartnerQuickActions";

export const metadata = { title: "Partner Dashboard" };

export default async function PartnerDashboardPage({
  params,
}: {
  params: Promise<{ userid: string; partnerId: string }>;
}) {
  const { partnerId } = await params;
  const partner = await getPartner(partnerId);
  if (!partner) {
    return <div className='p-6'>Partner nicht gefunden.</div>;
  }
  const events: PartnerEvent[] = await listPartnerEvents(partnerId, 25);

  // Ensure there is a profile doc connected to this partner and load it
  const profileId = await ensureProfileForCatalogPartner(partnerId);
  const profile = await getPartnerProfile(profileId);

  const daysActive = Math.max(
    1,
    Math.round((Date.now() - (partner.createdAt || Date.now())) / 86400000)
  );
  const avgPerDay = partner.clicks ? partner.clicks / daysActive : 0;

  async function action(formData: FormData) {
    "use server";
    await updatePartnerFromForm(partnerId, formData);
  }

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-10'>
      {/* Header */}
      <div className='flex items-start gap-6'>
        {partner.logo && (
          <Image
            src={partner.logo}
            alt={partner.name}
            width={80}
            height={80}
            className='h-20 w-20 object-contain rounded bg-slate-50 border'
          />
        )}
        <div className='flex-1'>
          <h1 className='text-2xl font-bold mb-1'>{partner.name}</h1>
          <p className='text-sm text-slate-500'>
            Kategorie: {partner.category || "–"} · Status:{" "}
            {partner.active ? "Aktiv" : "Inaktiv"}
          </p>
          <div className='mt-4 flex flex-wrap gap-4 text-sm'>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Gesamt Klicks</div>
              <div className='text-lg font-semibold'>{partner.clicks ?? 0}</div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Website-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner.websiteClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>E-Mail-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner.emailClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Telefon-Klicks</div>
              <div className='text-lg font-semibold'>
                {partner.phoneClicks ?? 0}
              </div>
            </div>
            <div className='p-3 rounded-lg border bg-white'>
              <div className='text-xs text-slate-500'>Seitenaufrufe</div>
              <div className='text-lg font-semibold'>{partner.views ?? 0}</div>
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
              partnerId={partner.id}
              website={partner.link}
              email={profile?.email}
              phone={profile?.phone}
            />
          </div>
        </div>
        {/* Right column left empty for balance */}
      </div>
      {/* Content sections */}
      <nav className='sticky top-0 z-10 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border rounded-lg p-2 flex flex-wrap gap-2 text-xs'>
        <a href='#catalog' className='px-2 py-1 rounded hover:bg-slate-100'>
          Katalogdaten
        </a>
        <a href='#events' className='px-2 py-1 rounded hover:bg-slate-100'>
          Ereignisse
        </a>
        <a href='#profile' className='px-2 py-1 rounded hover:bg-slate-100'>
          Partnerseite
        </a>
      </nav>

      <div id='catalog' className='grid md:grid-cols-2 gap-10 items-start'>
        <form
          action={action}
          className='space-y-4 bg-white p-6 rounded-xl border shadow-sm'>
          <h2 className='font-semibold text-lg'>Partner bearbeiten</h2>
          <div>
            <label className='block text-xs font-medium mb-1'>Name</label>
            <input
              name='name'
              defaultValue={partner.name}
              className='w-full border rounded px-2 py-1 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Logo URL</label>
            <input
              name='logo'
              defaultValue={partner.logo}
              className='w-full border rounded px-2 py-1 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Kategorie</label>
            <input
              name='category'
              defaultValue={partner.category}
              className='w-full border rounded px-2 py-1 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Benefit</label>
            <textarea
              name='benefit'
              defaultValue={partner.benefit}
              rows={3}
              className='w-full border rounded px-2 py-1 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>
              Beschreibung
            </label>
            <textarea
              name='description'
              defaultValue={partner.description}
              rows={3}
              className='w-full border rounded px-2 py-1 text-sm'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium mb-1'>
                Priorität
              </label>
              <input
                type='number'
                name='priority'
                defaultValue={partner.priority ?? 100}
                className='w-full border rounded px-2 py-1 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Link</label>
              <input
                name='link'
                defaultValue={partner.link}
                className='w-full border rounded px-2 py-1 text-sm'
              />
            </div>
          </div>
          <label className='flex items-center gap-2 text-xs'>
            <input
              type='checkbox'
              name='active'
              defaultChecked={partner.active}
            />{" "}
            Aktiv
          </label>
          <button
            type='submit'
            className='px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium'>
            Speichern
          </button>
        </form>
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

      {/* Full Partnerseite Editor (Logo, Bilder, Texte, Kontakt) */}
      {profile ? (
        <div id='profile' className='bg-white p-6 rounded-xl border shadow-sm'>
          <h2 className='font-semibold text-lg mb-4'>
            Partnerseite bearbeiten
          </h2>
          <PartnerProfileEditor
            profile={{
              id: profile.id,
              contactPerson: profile.contactPerson || "",
              email: profile.email || "",
              website: profile.website,
              phone: profile.phone,
              logo: (profile as unknown as { logo?: string }).logo,
              images: (profile as unknown as { images?: string[] }).images || [
                "",
                "",
                "",
              ],
              texts: (profile as unknown as { texts?: string[] }).texts || [
                "",
                "",
                "",
              ],
            }}
          />
        </div>
      ) : (
        <div className='text-sm text-slate-500'>
          Profil konnte nicht geladen werden.
        </div>
      )}
    </div>
  );
}
