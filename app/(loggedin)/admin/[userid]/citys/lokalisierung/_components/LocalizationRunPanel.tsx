"use client";

import { setCityLocalizationRunning, startCityLocalization } from "@/actions/cityLocalizationActions";
import { Progress } from "@/components/ui/progress";
import { getAdminIdToken } from "@/lib/adminIdToken";
import type { CityLocalizationRun } from "@/types/city/CityLocalization";
import { LoaderCircle, Pause, Play, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CityPageKind } from "@/types/city/CityLocalization";
import { kindLabel, PAGE_KINDS } from "./DuplicateReportPanel";

const STATUS_STYLE = {
  localized: "text-emerald-700",
  skipped: "text-slate-500",
  too_similar: "text-amber-700",
  failed: "text-red-700",
} as const;
const STATUS_TEXT = {
  localized: "live",
  skipped: "übersprungen",
  too_similar: "zu ähnlich",
  failed: "Fehler",
} as const;

export default function LocalizationRunPanel({
  ownerId,
  run,
  pendingCount,
  pendingByKind,
  individualDuplicateCount,
  onChanged,
}: {
  ownerId: string;
  run: CityLocalizationRun | null;
  pendingCount: number;
  pendingByKind: Partial<Record<CityPageKind, number>>;
  individualDuplicateCount: number;
  onChanged: () => Promise<void>;
}) {
  const [driving, setDriving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [includeIndividual, setIncludeIndividual] = useState(false);
  const [scope, setScope] = useState<"all" | "stadt" | "services">("all");
  const stopRef = useRef(false);
  const scopeKinds: CityPageKind[] | undefined =
    scope === "stadt" ? ["stadt"] : scope === "services" ? PAGE_KINDS.filter((kind) => kind !== "stadt") : undefined;
  const scopedPending = scopeKinds
    ? scopeKinds.reduce((sum, kind) => sum + (pendingByKind[kind] ?? 0), 0)
    : pendingCount;
  const startCount = scopedPending + (includeIndividual ? individualDuplicateCount : 0);

  useEffect(() => () => {
    stopRef.current = true;
  }, []);

  /** Arbeitet Schritte ab, solange das Fenster offen ist (sonst übernimmt der Cron). */
  async function drive() {
    stopRef.current = false;
    setDriving(true);
    let errors = 0;
    while (!stopRef.current) {
      const response = await fetch("/api/admin/city-localization", {
        method: "POST",
        headers: { authorization: `Bearer ${await getAdminIdToken()}`, "content-type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      const data = (await response.json().catch(() => null)) as { success?: boolean; pending?: boolean; message?: string; error?: string } | null;
      if (!data?.success) {
        errors += 1;
        setProgress(`Fehler (${errors}/5): ${data?.error ?? response.status}`);
        if (errors >= 5) break;
        await new Promise((resolve) => window.setTimeout(resolve, 3_000));
        continue;
      }
      errors = 0;
      setProgress(data.message ?? "");
      await onChanged();
      if (!data.pending) break;
    }
    setDriving(false);
    setProgress("");
  }

  async function act(action: () => Promise<{ success: boolean; error?: string }>, thenDrive: boolean) {
    setBusy(true);
    setError("");
    const result = await action();
    if (!result.success) setError(result.error ?? "Aktion fehlgeschlagen.");
    await onChanged();
    setBusy(false);
    if (result.success && thenDrive) void drive();
  }

  const running = run?.status === "running";
  const percent = run?.total ? Math.round((run.cursor / run.total) * 100) : 0;

  return (
    <section className='rounded-xl border border-violet-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl'>
          <h2 className='flex items-center gap-2 text-lg font-semibold text-slate-950'>
            <Sparkles className='h-5 w-5 text-violet-700' /> Seiten individuell neu schreiben
          </h2>
          <p className='mt-1 text-sm text-slate-600'>
            Die KI schreibt jede Seite, die noch die Vorlage erbt, für ihre Stadt komplett neu
            (Texte, lokale FAQ, Meta-Titel und -Description) und verteilt eigene Bilder. Nur
            Seiten unter der Übereinstimmungs-Schwelle gehen live. Bereits bearbeitete Seiten
            bleiben unverändert.
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-800'>
            {pendingCount} Seiten erben aktuell noch die Vorlage, davon {pendingByKind.stadt ?? 0} Stadtseiten (/stadt/…).
          </p>
          <label className='mt-2 flex items-center gap-2 text-sm text-slate-700'>
            Umfang
            <select
              value={scope}
              disabled={running || busy}
              onChange={(event) => setScope(event.target.value as typeof scope)}
              className='rounded-md border border-slate-300 px-2 py-1.5'>
              <option value='all'>Alle Seiten ({pendingCount})</option>
              <option value='stadt'>Nur Stadtseiten /stadt/… ({pendingByKind.stadt ?? 0})</option>
              <option value='services'>Nur Stadt-Service-Seiten ({pendingCount - (pendingByKind.stadt ?? 0)})</option>
            </select>
          </label>
          {individualDuplicateCount > 0 && (
            <label className='mt-2 flex items-start gap-2 text-sm text-slate-700'>
              <input
                type='checkbox'
                checked={includeIndividual}
                disabled={running || busy}
                onChange={(event) => setIncludeIndividual(event.target.checked)}
                className='mt-0.5 h-4 w-4'
              />
              <span>
                Auch {individualDuplicateCount} bereits individuelle Seiten neu schreiben, die trotzdem
                über der Schwelle liegen (Struktur und Bilder bleiben, nur Texte werden neu formuliert).
              </span>
            </label>
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          {running ? (
            <>
              {!driving && (
                <button type='button' disabled={busy} onClick={() => void drive()} className='inline-flex items-center gap-2 rounded-md border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800 disabled:opacity-50'>
                  <Play className='h-4 w-4' /> Hier weiterarbeiten
                </button>
              )}
              <button
                type='button'
                disabled={busy}
                onClick={() => {
                  stopRef.current = true;
                  void act(async () => setCityLocalizationRunning({ token: await getAdminIdToken(), ownerId, running: false }), false);
                }}
                className='inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50'>
                <Pause className='h-4 w-4' /> Pausieren
              </button>
            </>
          ) : (
            <>
              {run?.status === "stopped" && (
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => void act(async () => setCityLocalizationRunning({ token: await getAdminIdToken(), ownerId, running: true }), true)}
                  className='inline-flex items-center gap-2 rounded-md border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800 disabled:opacity-50'>
                  <Play className='h-4 w-4' /> Fortsetzen
                </button>
              )}
              <button
                type='button'
                disabled={busy || startCount === 0}
                onClick={() => {
                  if (window.confirm(`${startCount} Seiten werden per KI neu geschrieben und nach bestandener Prüfung direkt veröffentlicht. Starten?`)) {
                    void act(async () => startCityLocalization({
                        token: await getAdminIdToken(),
                        ownerId,
                        includeIndividualDuplicates: includeIndividual,
                        kinds: scopeKinds,
                      }), true);
                  }
                }}
                className='inline-flex items-center gap-2 rounded-md bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
                {busy ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
                {run ? "Neuen Lauf starten" : "Starten"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p role='alert' className='mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      {run && (
        <div className='mt-5 space-y-4'>
          <div className='space-y-1.5'>
            <Progress value={percent} />
            <p className='flex items-center gap-2 text-sm text-slate-600'>
              {driving && <LoaderCircle className='h-4 w-4 animate-spin text-violet-700' />}
              {run.cursor}/{run.total} Seiten bearbeitet
              {run.status === "stopped" && " · pausiert"}
              {run.status === "completed" && " · abgeschlossen"}
              {running && !driving && " · läuft im Hintergrund (Cron alle 5 Minuten)"}
              {progress && ` · ${progress}`}
            </p>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
            {([
              ["Live", run.stats.localized, "bg-emerald-50 text-emerald-800"],
              ["Zu ähnlich", run.stats.tooSimilar, "bg-amber-50 text-amber-800"],
              ["Fehler", run.stats.failed, "bg-red-50 text-red-800"],
              ["Übersprungen", run.stats.skipped, "bg-slate-50 text-slate-800"],
            ] as const).map(([label, value, tone]) => (
              <div key={label} className={`rounded-lg p-3 ${tone}`}>
                <p className='text-xs opacity-80'>{label}</p>
                <p className='mt-1 text-xl font-bold'>{value}</p>
              </div>
            ))}
          </div>
          {(run.stats.tooSimilar > 0 || run.stats.failed > 0) && run.status === "completed" && (
            <p className='rounded-md bg-amber-50 p-3 text-xs text-amber-800'>
              Zu ähnliche oder fehlgeschlagene Seiten erben weiter die Vorlage und werden beim
              nächsten Lauf automatisch erneut versucht.
            </p>
          )}
          {run.results.length > 0 && (
            <ul className='divide-y divide-slate-100 text-sm'>
              {run.results.map((result) => (
                <li key={`${result.key}-${result.finishedAt}`} className='flex flex-wrap justify-between gap-2 py-1.5'>
                  <span className='text-slate-800'>{result.cityName} · {kindLabel(result.kind)}</span>
                  <span className={`text-xs font-semibold ${STATUS_STYLE[result.status]}`}>
                    {STATUS_TEXT[result.status]}
                    {typeof result.similarity === "number" && ` · ${Math.round(result.similarity * 100)} %`}
                    {result.error && ` · ${result.error}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
