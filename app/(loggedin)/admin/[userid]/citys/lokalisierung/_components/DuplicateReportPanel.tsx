"use client";

import { getCityDuplicateReport } from "@/actions/cityLocalizationActions";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import type { CityDuplicateReport, CityDuplicateRow, CityPageKind } from "@/types/city/CityLocalization";
import { ExternalLink, LoaderCircle, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const STATUS_LABEL: Record<CityDuplicateRow["status"], string> = {
  template: "Vorlage",
  individual: "Individuell",
  localized: "KI-lokalisiert",
};

export function kindLabel(kind: CityPageKind) {
  return kind === "stadt" ? "Stadtseite" : getDefaultCityServiceName(kind);
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

function SimilarityBar({ value, threshold }: { value: number; threshold: number }) {
  return (
    <div className='flex items-center gap-2'>
      <div className='h-2 w-24 overflow-hidden rounded-full bg-slate-100'>
        <div
          className={`h-full ${value > threshold ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(100, Math.round(value * 100))}%` }}
        />
      </div>
      <span className='w-10 text-xs tabular-nums text-slate-700'>{percent(value)}</span>
    </div>
  );
}

export default function DuplicateReportPanel({ ownerId }: { ownerId: string }) {
  const [report, setReport] = useState<CityDuplicateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<CityPageKind | "all">("all");

  async function check() {
    setLoading(true);
    setError("");
    const result = await getCityDuplicateReport({ token: await getAdminIdToken(), ownerId });
    if (result.success) setReport(result.data);
    else setError(result.error);
    setLoading(false);
  }

  const rows = useMemo(
    () => (report?.rows ?? []).filter((row) => kind === "all" || row.kind === kind),
    [kind, report],
  );
  const kinds = useMemo(() => [...new Set((report?.rows ?? []).map((row) => row.kind))], [report]);

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl'>
          <h2 className='text-lg font-semibold text-slate-950'>Duplikat-Check</h2>
          <p className='mt-1 text-sm text-slate-600'>
            Misst pro Seite, wie viel Text (5-Wort-Folgen, Stadtnamen neutralisiert) wörtlich
            auch in der Vorlage oder auf einer anderen Stadt derselben Dienstleistung steht.
          </p>
        </div>
        <button
          type='button'
          onClick={() => void check()}
          disabled={loading}
          className='inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
          {loading ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <ScanSearch className='h-4 w-4' />}
          {report ? "Erneut prüfen" : "Jetzt prüfen"}
        </button>
      </div>
      {error && <p role='alert' className='mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      {report && (
        <div className='mt-5 space-y-4'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-lg bg-slate-50 p-4'>
              <p className='text-xs text-slate-500'>Seiten geprüft</p>
              <p className='mt-1 text-2xl font-bold text-slate-950'>{report.totalPages}</p>
            </div>
            <div className={`rounded-lg p-4 ${report.duplicatePages ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
              <p className='text-xs opacity-80'>Über {percent(report.threshold)} Übereinstimmung</p>
              <p className='mt-1 text-2xl font-bold'>{report.duplicatePages}</p>
            </div>
            <div className='rounded-lg bg-slate-50 p-4'>
              <p className='text-xs text-slate-500'>Ø Übereinstimmung</p>
              <p className='mt-1 text-2xl font-bold text-slate-950'>{percent(report.averageSimilarity)}</p>
            </div>
          </div>

          <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
            Filter
            <select value={kind} onChange={(event) => setKind(event.target.value as CityPageKind | "all")} className='rounded-md border border-slate-300 px-2 py-1.5'>
              <option value='all'>Alle Seitentypen</option>
              {kinds.map((entry) => <option key={entry} value={entry}>{kindLabel(entry)}</option>)}
            </select>
          </label>

          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left text-sm'>
              <thead className='text-xs uppercase text-slate-500'>
                <tr>
                  <th className='py-2 pr-3'>Seite</th>
                  <th className='py-2 pr-3'>Status</th>
                  <th className='py-2 pr-3'>wie Vorlage</th>
                  <th className='py-2 pr-3'>wie andere Stadt</th>
                  <th className='py-2 pr-3'>Wörter</th>
                  <th className='py-2'>Bilder</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {rows.slice(0, 120).map((row) => (
                  <tr key={row.key}>
                    <td className='py-2 pr-3'>
                      <Link href={row.path} target='_blank' className='inline-flex items-center gap-1 font-medium text-slate-900 hover:underline'>
                        {row.cityName} · {kindLabel(row.kind)} <ExternalLink size={12} />
                      </Link>
                    </td>
                    <td className='py-2 pr-3 text-xs text-slate-600'>{STATUS_LABEL[row.status]}</td>
                    <td className='py-2 pr-3'><SimilarityBar value={row.similarityToTemplate} threshold={report.threshold} /></td>
                    <td className='py-2 pr-3'><SimilarityBar value={row.maxSimilarityToOthers} threshold={report.threshold} /></td>
                    <td className='py-2 pr-3 tabular-nums'>{row.wordCount}</td>
                    <td className={`py-2 tabular-nums ${row.imageCount < 3 ? "text-amber-700" : ""}`}>{row.imageCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 120 && <p className='mt-2 text-xs text-slate-500'>Es werden die 120 auffälligsten Seiten angezeigt.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
