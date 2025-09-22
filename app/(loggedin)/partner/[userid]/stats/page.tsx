import { getPartner, listPartnerStatsWindow } from "@/actions/partnerActions";
import Image from "next/image";
// PartnerEvent import removed until events section is reintroduced

export const metadata = { title: "Meine Statistiken" };

interface StatsWindowBucket {
  day: string;
  website: number;
  email: number;
  phone: number;
  view: number;
}
interface StatsWindow {
  buckets: StatsWindowBucket[];
  totals: { website: number; email: number; phone: number; view: number };
}

export default async function PartnerSelfStatsPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  const partner = await getPartner(userid);
  if (!partner) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <h1 className='text-xl font-semibold mb-2'>Statistiken</h1>
        <p className='text-sm text-slate-600'>Partner nicht gefunden.</p>
      </div>
    );
  }

  const statsWindow = (await listPartnerStatsWindow(
    partner.id,
    28
  )) as StatsWindow;

  type PartnerMetrics = {
    clicks?: number;
    websiteClicks?: number;
    emailClicks?: number;
    phoneClicks?: number;
    views?: number;
  };
  const pm = partner as typeof partner & PartnerMetrics;
  const daysActive = Math.max(
    1,
    Math.round((Date.now() - (partner.createdAt || Date.now())) / 86400000)
  );
  const totalClicks = pm.clicks || 0;
  const avgPerDay = totalClicks ? totalClicks / daysActive : 0;

  const csvHeader = "day,website,email,phone,view,total";
  const csvLines = statsWindow.buckets.map(
    (b) =>
      `${b.day},${b.website},${b.email},${b.phone},${b.view},${
        b.website + b.email + b.phone + b.view
      }`
  );
  const csv = [csvHeader, ...csvLines].join("\n");
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-10'>
      <div className='flex items-start gap-6'>
        {partner.infos.logoPath && (
          <Image
            src={partner.infos.logoPath}
            alt={partner.company.name}
            width={80}
            height={80}
            className='h-20 w-20 object-contain rounded bg-slate-50 border'
          />
        )}
        <div className='flex-1'>
          <h1 className='text-2xl font-bold mb-1'>{partner.company.name}</h1>
          <p className='text-sm text-slate-500'>
            Kategorie: {partner.category || "–"} · Status:{" "}
            {partner.active ? "Aktiv" : "Inaktiv"}
          </p>
          <div className='mt-4 flex flex-wrap gap-4 text-sm'>
            {[
              { label: "Gesamt Klicks", value: pm.clicks ?? 0 },
              { label: "Website-Klicks", value: pm.websiteClicks ?? 0 },
              { label: "E-Mail-Klicks", value: pm.emailClicks ?? 0 },
              { label: "Telefon-Klicks", value: pm.phoneClicks ?? 0 },
              { label: "Seitenaufrufe", value: pm.views ?? 0 },
              { label: "Ø Klicks/Tag", value: avgPerDay.toFixed(2) },
              { label: "Tage aktiv", value: daysActive },
            ].map((card) => (
              <div key={card.label} className='p-3 rounded-lg border bg-white'>
                <div className='text-xs text-slate-500'>{card.label}</div>
                <div className='text-lg font-semibold'>{card.value}</div>
              </div>
            ))}
          </div>
          <div className='mt-6 flex items-center gap-4'>
            <span className='text-xs text-slate-500'>Letzte 28 Tage</span>
            <a
              href={csvDataUri}
              download={`partner-${partner.id}-stats-28d.csv`}
              className='text-xs px-3 py-1 rounded border bg-white hover:bg-slate-50'>
              CSV Export
            </a>
          </div>
        </div>
      </div>

      <section>
        <h2 className='font-semibold text-lg mb-4'>Tagesverlauf</h2>
        <div className='overflow-x-auto rounded border bg-white'>
          <table className='min-w-full text-xs'>
            <thead className='bg-slate-100 text-slate-600'>
              <tr>
                <th className='px-2 py-2 text-left font-medium'>Tag</th>
                <th className='px-2 py-2 text-right font-medium'>Website</th>
                <th className='px-2 py-2 text-right font-medium'>E-Mail</th>
                <th className='px-2 py-2 text-right font-medium'>Telefon</th>
                <th className='px-2 py-2 text-right font-medium'>Views</th>
                <th className='px-2 py-2 text-left font-medium'>Total</th>
                <th className='px-2 py-2 text-left font-medium'>Graph</th>
              </tr>
            </thead>
            <tbody>
              {statsWindow.buckets.map((b) => {
                const total = b.website + b.email + b.phone + b.view;
                const maxTotal = Math.max(
                  1,
                  statsWindow.buckets.reduce(
                    (m, x) =>
                      Math.max(m, x.website + x.email + x.phone + x.view),
                    0
                  )
                );
                return (
                  <tr key={b.day} className='border-t last:border-b'>
                    <td className='px-2 py-1 whitespace-nowrap'>{b.day}</td>
                    <td className='px-2 py-1 text-right'>{b.website}</td>
                    <td className='px-2 py-1 text-right'>{b.email}</td>
                    <td className='px-2 py-1 text-right'>{b.phone}</td>
                    <td className='px-2 py-1 text-right'>{b.view}</td>
                    <td className='px-2 py-1 text-right'>{total}</td>
                    <td className='px-2 py-1'>
                      <div className='h-2 w-40 bg-slate-100 rounded overflow-hidden'>
                        <div
                          className='h-full bg-green-600'
                          style={{ width: `${(total / maxTotal) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className='bg-slate-50 font-medium'>
              <tr>
                <td className='px-2 py-2'>Summe</td>
                <td className='px-2 py-2 text-right'>
                  {statsWindow.totals.website}
                </td>
                <td className='px-2 py-2 text-right'>
                  {statsWindow.totals.email}
                </td>
                <td className='px-2 py-2 text-right'>
                  {statsWindow.totals.phone}
                </td>
                <td className='px-2 py-2 text-right'>
                  {statsWindow.totals.view}
                </td>
                <td className='px-2 py-2 text-right'>
                  {statsWindow.totals.website +
                    statsWindow.totals.email +
                    statsWindow.totals.phone +
                    statsWindow.totals.view}
                </td>
                <td className='px-2 py-2'></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Ereignisliste kann hier ergänzt werden wenn listPartnerEvents implementiert wird */}
    </div>
  );
}
