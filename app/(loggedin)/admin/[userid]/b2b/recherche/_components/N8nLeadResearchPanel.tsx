"use client";

import {
  getB2bResearchOverview,
  resumeB2bResearch,
  startB2bResearch,
  stopB2bResearch,
} from "@/actions/b2bResearchActions";
import { Progress } from "@/components/ui/progress";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { B2B_CATEGORY_VALUES } from "@/lib/b2bCategories";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { B2bLeadCategory } from "@/types/B2b";
import type { B2bResearchCity, B2bResearchRun } from "@/types/B2bResearch";
import { LoaderCircle, MapPin, Play, RotateCcw, Square, Workflow } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import B2bCategoryPicker from "./B2bCategoryPicker";

const POLL_INTERVAL_MS = 5_000;
const STALE_AFTER_MS = 45 * 60 * 1_000;

type Overview = {
  run: B2bResearchRun | null;
  center: { name: string; postalCode: string };
  radiusKm: number;
  cities: B2bResearchCity[];
};

const getToken = getAdminIdToken;

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <p className='text-xs opacity-80'>{label}</p>
      <p className='mt-1 text-xl font-bold'>{value}</p>
    </div>
  );
}

export default function N8nLeadResearchPanel() {
  const { companyData } = useCompanyData();
  const { userid } = useParams<{ userid: string }>();
  const ownerId = companyData?.id;
  const [overview, setOverview] = useState<Overview | null>(null);
  const [categories, setCategories] = useState<B2bLeadCategory[]>([...B2B_CATEGORY_VALUES]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    const result = await getB2bResearchOverview({ token: await getToken(), ownerId });
    if (result.success) setOverview(result.data);
    else setError(result.error);
  }, [ownerId]);

  const run = overview?.run ?? null;
  const running = run?.status === "running";
  const stale = running && Date.now() - (run?.heartbeatAt ?? 0) > STALE_AFTER_MS;

  useEffect(() => {
    void refresh().catch((caught) => setError(String(caught)));
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => void refresh().catch(() => undefined), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh, running]);

  async function act(action: (token: string, ownerId: string) => Promise<{ success: boolean; error?: string }>) {
    if (!ownerId) return;
    setBusy(true);
    setError("");
    try {
      const result = await action(await getToken(), ownerId);
      if (!result.success) setError(result.error ?? "Aktion fehlgeschlagen.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    act((token, id) => startB2bResearch({ token, ownerId: id, categories }));
  const stop = () => act((token, id) => stopB2bResearch({ token, ownerId: id }));
  const resume = () => act((token, id) => resumeB2bResearch({ token, ownerId: id }));

  const cityCount = run?.cityCount ?? overview?.cities.length ?? 0;
  const percent = run && cityCount ? Math.round((run.nextCityIndex / cityCount) * 100) : 0;
  const canResume = run && (run.status === "stopped" || stale) && run.nextCityIndex < run.cityCount;

  return (
    <section className='rounded-xl border border-blue-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-3xl'>
          <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
            <Workflow className='h-4 w-4' /> n8n-Workflow
          </p>
          <h2 className='mt-2 text-xl font-bold text-slate-950'>
            Alle Orte im Umkreis automatisch durchsuchen
          </h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Für jeden Ort im {overview?.radiusKm ?? 50}-km-Radius um{" "}
            {overview ? `${overview.center.name} (${overview.center.postalCode})` : "Drolshagen"}{" "}
            sucht n8n die gewählten Zielgruppen in Google Maps, liest Impressum und
            Kontaktseite und extrahiert die Kontaktdaten per KI. Die zurückgelieferte
            leads.csv wird automatisch ins B2B CRM übernommen; bereits bekannte
            Websites werden übersprungen.
          </p>
          {overview && (
            <p className='mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500'>
              <MapPin className='mt-0.5 h-3.5 w-3.5 shrink-0' />
              {overview.cities.length} Orte: {overview.cities.map((city) => city.name).join(", ")}
            </p>
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          {running && !stale ? (
            <button
              type='button'
              onClick={() => void stop()}
              disabled={busy}
              className='flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50'>
              <Square className='h-4 w-4' /> Nach aktuellem Ort anhalten
            </button>
          ) : (
            <>
              {canResume && (
                <button
                  type='button'
                  onClick={() => void resume()}
                  disabled={busy}
                  className='flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-3 text-sm font-semibold text-blue-700 disabled:opacity-50'>
                  <RotateCcw className='h-4 w-4' /> Fortsetzen
                </button>
              )}
              <button
                type='button'
                onClick={() => void start()}
                disabled={busy || !ownerId || !categories.length}
                className='flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>
                {busy ? <LoaderCircle className='h-5 w-5 animate-spin' /> : <Play className='h-5 w-5' />}
                {run ? "Neu starten" : "Starten"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className='mt-5'>
        <B2bCategoryPicker selected={categories} disabled={running || busy} onChange={setCategories} />
      </div>

      {error && (
        <p role='alert' className='mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      )}

      {run && (
        <div className='mt-6 space-y-4'>
          <div className='space-y-1.5'>
            <Progress value={percent} />
            <p className='flex items-center gap-2 text-sm text-slate-600'>
              {running && !stale && <LoaderCircle className='h-4 w-4 animate-spin text-blue-700' />}
              {run.nextCityIndex}/{cityCount} Orte
              {running && run.currentCity && !stale && ` · aktuell: ${run.currentCity}`}
              {stale && " · keine Rückmeldung seit über 45 Minuten – bitte fortsetzen"}
              {run.status === "stopped" && " · angehalten"}
              {run.status === "completed" && " · abgeschlossen"}
            </p>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-5'>
            <StatTile label='Firmen gefunden' value={run.stats.found} tone='bg-slate-50 text-slate-900' />
            <StatTile label='Mit E-Mail' value={run.stats.withEmail} tone='bg-emerald-50 text-emerald-800' />
            <StatTile label='Neu im CRM' value={run.stats.imported} tone='bg-blue-50 text-blue-800' />
            <StatTile label='Aktualisiert' value={run.stats.updated} tone='bg-violet-50 text-violet-800' />
            <StatTile label='Orte mit Fehler' value={run.stats.failedCities} tone='bg-amber-50 text-amber-800' />
          </div>
          {run.lastError && (
            <p className='rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800'>
              Letzter Fehler: {run.lastError}
            </p>
          )}
          {run.cityResults.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='text-xs uppercase text-slate-500'>
                  <tr>
                    <th className='py-2 pr-4'>Ort</th>
                    <th className='py-2 pr-4'>Gefunden</th>
                    <th className='py-2 pr-4'>Mit E-Mail</th>
                    <th className='py-2 pr-4'>Neu</th>
                    <th className='py-2'>Hinweis</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {run.cityResults.map((result) => (
                    <tr key={`${result.city}-${result.finishedAt}`}>
                      <td className='py-2 pr-4 font-medium text-slate-900'>{result.city}</td>
                      <td className='py-2 pr-4'>{result.found}</td>
                      <td className='py-2 pr-4'>{result.withEmail}</td>
                      <td className='py-2 pr-4'>{result.imported}</td>
                      <td className='py-2 text-xs text-red-700'>{result.error ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            href={`/admin/${encodeURIComponent(userid)}/b2b/crm`}
            className='inline-flex text-sm font-semibold text-blue-700 hover:underline'>
            Leads im B2B CRM ansehen →
          </Link>
        </div>
      )}
    </section>
  );
}
