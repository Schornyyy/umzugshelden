"use client";

import { cleanCityLinks } from "@/actions/cityLocalizationActions";
import { getAdminIdToken } from "@/lib/adminIdToken";
import type { CityLinkCleanupResult } from "@/lib/cityInternalLinks";
import { Link2Off, LoaderCircle, ScanSearch } from "lucide-react";
import { useState } from "react";

export default function LinkCleanupPanel({ ownerId }: { ownerId: string }) {
  const [result, setResult] = useState<(CityLinkCleanupResult & { dryRun: boolean }) | null>(null);
  const [busy, setBusy] = useState<"check" | "clean" | null>(null);
  const [error, setError] = useState("");

  async function run(dryRun: boolean) {
    if (!dryRun && !window.confirm("Alle Links, die nicht auf eine veröffentlichte eigene Seite zeigen, werden entfernt (der Text bleibt). Fortfahren?")) {
      return;
    }
    setBusy(dryRun ? "check" : "clean");
    setError("");
    const response = await cleanCityLinks({ token: await getAdminIdToken(), ownerId, dryRun });
    if (response.success) setResult({ ...response.data, dryRun });
    else setError(response.error);
    setBusy(null);
  }

  const found = result ? result.pagesChanged + result.proposalsChanged : 0;

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl'>
          <h2 className='text-lg font-semibold text-slate-950'>Interne Links prüfen</h2>
          <p className='mt-1 text-sm text-slate-600'>
            Erlaubt sind nur Links auf veröffentlichte eigene Seiten (Stadtseiten,
            Stadt-Dienstleistungen, Blogartikel) – wie bei der Blog-Generierung. Alles andere
            (z. B. example.com, ihre-domain.de, erfundene Pfade) wird zu normalem Text.
            Geprüft werden alle Stadtseiten und offene KI-Vorschläge.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            disabled={busy !== null}
            onClick={() => void run(true)}
            className='inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50'>
            {busy === "check" ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <ScanSearch className='h-4 w-4' />}
            Links prüfen
          </button>
          <button
            type='button'
            disabled={busy !== null}
            onClick={() => void run(false)}
            className='inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
            {busy === "clean" ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Link2Off className='h-4 w-4' />}
            Falsche Links entfernen
          </button>
        </div>
      </div>
      {error && <p role='alert' className='mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {result && (
        <div className={`mt-4 rounded-md p-4 text-sm ${found ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
          {found ? (
            <>
              <p className='font-semibold'>
                {result.dryRun ? "Gefunden" : "Entfernt"}: {result.linksRemoved} falsche Links in {result.pagesChanged} Seiten
                und {result.proposalsChanged} offenen Vorschlägen.
              </p>
              {result.examples.length > 0 && (
                <p className='mt-1 break-all text-xs'>Beispiele: {result.examples.join(" · ")}</p>
              )}
            </>
          ) : (
            <p className='font-semibold'>Keine falschen Links gefunden.{!result.dryRun && " Alle Stadtseiten wurden neu erzeugt."}</p>
          )}
        </div>
      )}
    </section>
  );
}
