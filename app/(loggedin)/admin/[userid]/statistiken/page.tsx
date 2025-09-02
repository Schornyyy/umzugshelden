import React from "react";
import {
  getAggregateOverview,
  getRecentGlobalEvents,
  getTopCompanies,
  AggregateOverviewResult,
} from "@/actions/companyStatsActions";
import Link from "next/link";

// Simple presentational helpers
function KpiCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className='rounded-lg border bg-white p-4 shadow-sm flex flex-col gap-1'>
      <span className='text-xs uppercase tracking-wide text-gray-500'>
        {title}
      </span>
      <span className='text-2xl font-semibold'>{value}</span>
      {sub && <span className='text-[11px] text-gray-400'>{sub}</span>}
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className='mb-10'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>{title}</h2>
        {action}
      </div>
      <div className='bg-white border rounded-lg p-4'>{children}</div>
    </div>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export const revalidate = 86400; // refresh once per day (24h)

export default async function AdminStatsPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;

  // Default: Monat + zusätzlich Quartal & Jahr parallel (könnte später per Tabs clientseitig gemacht werden)
  const [month, quarter, year, recentEvents, top] = await Promise.all([
    getAggregateOverview("month"),
    getAggregateOverview("quarter"),
    getAggregateOverview("year"),
    getRecentGlobalEvents(30),
    getTopCompanies(50),
  ]);

  const periodMap: Record<string, AggregateOverviewResult> = {
    Monat: month,
    Quartal: quarter,
    Jahr: year,
  };

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 space-y-12'>
      <header>
        <h1 className='text-3xl font-bold mb-2'>Statistiken & Performance</h1>
        <p className='text-gray-600 text-sm'>
          Übersicht über Interaktionen (Klicks) & Unternehmensentwicklung.
          Aktualisierung täglich.
        </p>
      </header>

      {/* KPI Blöcke für Monat / Quartal / Jahr */}
      <div className='grid gap-8 md:grid-cols-3'>
        {Object.entries(periodMap).map(([label, data]) => (
          <div key={label} className='space-y-3'>
            <h3 className='font-medium text-sm text-gray-500'>{label}</h3>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              <KpiCard
                title='Gesamt-Klicks'
                value={data.totalClicks}
                sub={`${Object.values(data.clicksByType).reduce(
                  (a, b) => a + b,
                  0
                )} Events`}
              />
              <KpiCard
                title='Neue Firmen'
                value={data.newCompanies}
                sub={`${data.newCompanyList.length} gelistet`}
              />
              <KpiCard
                title='Neue Aufträge'
                value={data.newContracts}
                sub='Im Zeitraum'
              />
              <KpiCard
                title='Distinct Typen'
                value={Object.keys(data.clicksByType).length}
                sub='Click-Typen'
              />
              <KpiCard
                title='Durchschn. / Tag'
                value={Math.round(
                  data.totalClicks /
                    Math.max(1, (data.range.end - data.range.start) / 86400000)
                )}
                sub='Approx.'
              />
            </div>
            <div className='flex flex-wrap gap-2 text-[11px] text-gray-600'>
              {Object.entries(data.clicksByType).map(([t, c]) => (
                <span key={t} className='bg-gray-100 rounded px-2 py-1'>
                  {t}: {c}
                </span>
              ))}
            </div>
            {data.newCompanyList.length > 0 && (
              <div className='mt-2'>
                <p className='text-[11px] text-gray-500 mb-1'>Neue Firmen</p>
                <ul className='space-y-1 max-h-32 overflow-auto pr-1'>
                  {data.newCompanyList.map((c) => (
                    <li
                      key={c.id}
                      className='text-xs flex justify-between gap-2'>
                      <span className='truncate'>{c.name || "Unbenannt"}</span>
                      <Link
                        href={`/admin/${userid}/companys/${c.id}`}
                        className='text-green-600 hover:underline'>
                        Details
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <Section title='Top Unternehmen (Klicks gesamt)'>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='text-left border-b'>
                <th className='py-2 pr-4'>#</th>
                <th className='py-2 pr-4'>Unternehmen</th>
                <th className='py-2 pr-4'>Total</th>
                <th className='py-2 pr-4'>Phone</th>
                <th className='py-2 pr-4'>Email</th>
                <th className='py-2 pr-4'>Website</th>
                <th className='py-2 pr-4'>Adresse</th>
                <th className='py-2 pr-4'>Profil</th>
                <th className='py-2 pr-4'>Aktualisiert</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row, idx) => (
                <tr
                  key={row.companyId}
                  className='border-b last:border-none hover:bg-gray-50'>
                  <td className='py-1 pr-4'>{idx + 1}</td>
                  <td className='py-1 pr-4 max-w-[180px] truncate'>
                    <Link
                      href={`/admin/${userid}/companys/${row.companyId}`}
                      className='text-green-600 hover:underline'>
                      {row.name || row.companyId}
                    </Link>
                  </td>
                  <td className='py-1 pr-4 font-semibold'>{row.clicksTotal}</td>
                  <td className='py-1 pr-4'>{row.clicksByType.phone}</td>
                  <td className='py-1 pr-4'>{row.clicksByType.email}</td>
                  <td className='py-1 pr-4'>{row.clicksByType.website}</td>
                  <td className='py-1 pr-4'>{row.clicksByType.adress}</td>
                  <td className='py-1 pr-4'>{row.clicksByType.company}</td>
                  <td className='py-1 pr-4 text-xs text-gray-500'>
                    {row.updatedAt ? formatDate(row.updatedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title='Letzte Aktivitäten (global)'>
        <ul className='divide-y text-sm'>
          {recentEvents.map((ev) => (
            <li key={ev.id} className='py-2 flex justify-between gap-4'>
              <span className='truncate'>
                {ev.clickType} →{" "}
                <Link
                  href={`/admin/${userid}/companys/${ev.companyId}`}
                  className='text-green-600 hover:underline'>
                  {ev.companyId}
                </Link>
              </span>
              <span className='text-xs text-gray-500'>
                {formatDate(ev.timestamp)}
              </span>
            </li>
          ))}
          {recentEvents.length === 0 && (
            <li className='py-4 text-center text-gray-500 text-xs'>
              Keine Events im Zeitraum
            </li>
          )}
        </ul>
      </Section>
    </div>
  );
}
