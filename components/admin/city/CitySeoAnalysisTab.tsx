"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import type { SeoAnalysisRun } from "@/types/city/SeoAnalysis";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Gauge,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

interface Props {
  ownerId: string;
  citySlug: string;
  pageKey?: string;
  pageLabel?: string;
  targetUrl: string;
  defaultKeyword: string;
  onGeneratePage?: (analysisId: string) => void | Promise<void>;
  generatingPage?: boolean;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50";
  if (score >= 50) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

type ResultView = "overview" | "recommendations" | "draft";

export function CitySeoAnalysisTab({
  ownerId,
  citySlug,
  pageKey = citySlug,
  pageLabel = "Stadtseite",
  targetUrl,
  defaultKeyword,
  onGeneratePage,
  generatingPage = false,
}: Props) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [runs, setRuns] = useState<SeoAnalysisRun[]>([]);
  const [selected, setSelected] = useState<SeoAnalysisRun | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultView, setResultView] = useState<ResultView>("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Keine aktive Anmeldung gefunden. Bitte neu einloggen.");
    return token;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!ownerId) return;
      try {
        const token = await getToken();
        const params = new URLSearchParams({ ownerId, citySlug, pageKey });
        const response = await fetch(`/api/admin/seo-analysis?${params}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Analysen konnten nicht geladen werden.");
        }
        if (!cancelled) {
          const loadedRuns = data.runs as SeoAnalysisRun[];
          setRuns(loadedRuns);
          setSelected(loadedRuns[0] ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Analysen konnten nicht geladen werden."
          );
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [citySlug, getToken, ownerId, pageKey]);

  async function analyze() {
    const cleanedKeyword = keyword.trim();
    if (!cleanedKeyword) {
      setError("Bitte ein Hauptkeyword eintragen.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/seo-analysis", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ownerId,
          citySlug,
          pageKey,
          targetUrl,
          keyword: cleanedKeyword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "SEO-Analyse fehlgeschlagen.");
      }
      const run = data.run as SeoAnalysisRun;
      setRuns((current) => [run, ...current].slice(0, 10));
      setSelected(run);
      setResultView("overview");
    } catch (analysisError) {
      setError(
        analysisError instanceof Error ? analysisError.message : "SEO-Analyse fehlgeschlagen."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function copyText(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1800);
    } catch {
      setError("Der Text konnte nicht kopiert werden. Bitte markiere ihn manuell.");
    }
  }

  const targetPage = selected
    ? selected.pages.find((page) => page.url === selected.urls[0]) ?? selected.pages[0]
    : undefined;
  const bestCompetitor = selected
    ? selected.pages
        .filter((page) => page.url !== selected.urls[0])
        .sort((first, second) => second.score - first.score)[0]
    : undefined;
  const highPriorityCount =
    selected?.report.recommendations.filter((item) => item.priority === "hoch").length ?? 0;

  return (
    <div className='space-y-6'>
      <header className='overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-sm sm:px-7'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='max-w-2xl'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200'>
              <Sparkles className='h-3.5 w-3.5' />
              SEO-Assistent
            </span>
            <h1 className='mt-3 text-xl font-bold sm:text-2xl'>SEO-Auswertung & KI</h1>
            <p className='mt-2 text-sm leading-6 text-slate-300'>
              Vergleiche „{pageLabel}“ mit Wettbewerbern und erhalte konkrete,
              priorisierte Verbesserungsvorschläge.
            </p>
          </div>
          <div className='grid grid-cols-3 gap-2 text-center sm:w-72'>
            {[
              ["1", "URLs"],
              ["2", "Analyse"],
              ["3", "Umsetzen"],
            ].map(([step, label]) => (
              <div key={step} className='rounded-xl border border-white/10 bg-white/5 px-2 py-3'>
                <span className='mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-emerald-950'>
                  {step}
                </span>
                <span className='mt-1.5 block text-[11px] text-slate-300'>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 px-5 py-5 sm:px-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-xl bg-emerald-100 p-2.5 text-emerald-700'>
              <Target className='h-5 w-5' />
            </div>
            <div>
              <h2 className='font-semibold text-slate-950'>Seiten für den Vergleich festlegen</h2>
              <p className='mt-1 text-sm text-slate-600'>
                Zielseite und die fünf stärksten Wettbewerber werden automatisch ermittelt.
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-6 p-5 sm:p-6'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-emerald-200 bg-emerald-50/60 p-4'>
              <span className='inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800'>
                <Target className='h-3.5 w-3.5' />
                Automatisch erkannte Zielseite
              </span>
              <p className='mt-2 break-all text-sm text-slate-700'>{targetUrl}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-slate-50/60 p-4'>
              <span className='inline-flex items-center gap-1.5 text-xs font-bold text-slate-700'>
                <Trophy className='h-3.5 w-3.5 text-amber-500' />
                Automatische Wettbewerber
              </span>
              <p className='mt-2 text-sm text-slate-600'>
                Die ersten fünf relevanten organischen Treffer werden gesucht und gecrawlt.
              </p>
            </div>
          </div>

          <label className='block'>
            <span className='flex items-center gap-2 text-sm font-semibold text-slate-800'>
              Hauptkeyword
            </span>
            <span className='mt-1 block text-xs text-slate-500'>
              Für dieses Keyword werden die fünf Wettbewerber bestimmt.
            </span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder='z. B. Umzugsunternehmen Köln'
              className='mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
            />
          </label>

          {error && (
            <div
              role='alert'
              className='flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
              {error}
            </div>
          )}

          <div className='flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center'>
            <button
              type='button'
              disabled={analyzing || !ownerId}
              onClick={analyze}
              className='inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50'>
              {analyzing ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='h-4 w-4' />
              )}
              {analyzing ? "Analyse läuft..." : "SEO-Analyse starten"}
            </button>
            <p className='flex items-center gap-1.5 text-xs text-slate-500'>
              <Clock3 className='h-3.5 w-3.5' />
              Suche und Analyse können bis zu zwei Minuten dauern.
            </p>
          </div>
        </div>
      </section>

      {(loadingHistory || runs.length > 0) && (
        <section aria-labelledby='analysis-history'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <div>
              <h2 id='analysis-history' className='font-semibold text-slate-900'>
                Frühere Auswertungen
              </h2>
              <p className='mt-0.5 text-xs text-slate-500'>Die letzten zehn Analysen bleiben verfügbar.</p>
            </div>
            {!loadingHistory && (
              <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'>
                {runs.length} gespeichert
              </span>
            )}
          </div>
          {loadingHistory ? (
            <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500'>
              <Loader2 className='h-4 w-4 animate-spin' /> Auswertungen werden geladen...
            </div>
          ) : (
            <div className='flex gap-2 overflow-x-auto pb-2'>
              {runs.map((run) => {
                const runTarget = run.pages.find((page) => page.url === run.urls[0]) ?? run.pages[0];
                return (
                  <button
                    type='button'
                    key={run.id}
                    onClick={() => {
                      setSelected(run);
                      setResultView("overview");
                    }}
                    className={`min-w-48 shrink-0 rounded-xl border px-4 py-3 text-left transition ${
                      selected?.id === run.id
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                    <span className='flex items-center justify-between gap-3'>
                      <span className='text-xs font-semibold text-slate-700'>
                        {new Date(run.createdAt).toLocaleDateString("de-DE")}
                      </span>
                      {runTarget && (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${scoreColor(runTarget.score)}`}>
                          {runTarget.score}
                        </span>
                      )}
                    </span>
                    <span className='mt-1 block text-xs text-slate-500'>
                      {run.pages.length} analysiert · {run.keywords.length} Keywords
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {selected && (
        <section className='space-y-5' aria-labelledby='analysis-result'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-xs font-bold uppercase tracking-wider text-emerald-700'>Analyseergebnis</p>
              <h2 id='analysis-result' className='mt-1 text-xl font-bold text-slate-950'>
                Das Wichtigste auf einen Blick
              </h2>
            </div>
            <p className='text-xs text-slate-500'>
              Erstellt am {new Date(selected.createdAt).toLocaleString("de-DE")}
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-xl border border-slate-200 bg-white p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-500'>Dein SEO-Score</span>
                <Gauge className='h-4 w-4 text-emerald-600' />
              </div>
              <p className='mt-2 text-2xl font-bold text-slate-950'>
                {targetPage ? `${targetPage.score}/100` : "–"}
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-500'>Bester Wettbewerber</span>
                <Trophy className='h-4 w-4 text-amber-500' />
              </div>
              <p className='mt-2 text-2xl font-bold text-slate-950'>
                {bestCompetitor ? `${bestCompetitor.score}/100` : "–"}
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-500'>Analysierte Seiten</span>
                <BarChart3 className='h-4 w-4 text-blue-600' />
              </div>
              <p className='mt-2 text-2xl font-bold text-slate-950'>{selected.pages.length}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-500'>Dringende Maßnahmen</span>
                <AlertTriangle className='h-4 w-4 text-red-500' />
              </div>
              <p className='mt-2 text-2xl font-bold text-slate-950'>{highPriorityCount}</p>
            </div>
          </div>

          {selected.failures?.length > 0 && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 p-4'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-700' />
                <div className='min-w-0'>
                  <h3 className='font-semibold text-amber-950'>
                    {selected.failures.length} URL(s) konnten nicht geladen werden
                  </h3>
                  <ul className='mt-2 space-y-1 text-xs text-amber-900'>
                    {selected.failures.map((failure) => (
                      <li key={failure.url} className='break-all'>
                        <span className='font-semibold'>{failure.url}</span>: {failure.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <nav
            aria-label='Bereiche der SEO-Auswertung'
            className='grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1'>
            {[
              { id: "overview" as const, label: "Überblick", icon: BarChart3 },
              { id: "recommendations" as const, label: "Maßnahmen", icon: ListChecks },
              { id: "draft" as const, label: "KI-Entwurf", icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type='button'
                onClick={() => setResultView(id)}
                aria-current={resultView === id ? "page" : undefined}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition sm:text-sm ${
                  resultView === id
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}>
                <Icon className='h-4 w-4' />
                {label}
                {id === "recommendations" && highPriorityCount > 0 && (
                  <span className='rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700'>
                    {highPriorityCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {resultView === "overview" && (
            <div className='space-y-5'>
              <section className='rounded-2xl border border-violet-200 bg-violet-50/60 p-5 sm:p-6'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-xl bg-violet-100 p-2 text-violet-700'>
                    <Sparkles className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-violet-950'>KI-Zusammenfassung</h3>
                    <p className='mt-2 text-sm leading-6 text-slate-700'>{selected.report.summary}</p>
                  </div>
                </div>
                <div className='mt-5 grid gap-4 lg:grid-cols-2'>
                  <div className='rounded-xl border border-emerald-200 bg-white p-4'>
                    <h4 className='flex items-center gap-2 text-sm font-semibold text-emerald-800'>
                      <CheckCircle2 className='h-4 w-4' />
                      Das funktioniert bereits gut
                    </h4>
                    <ul className='mt-3 space-y-2'>
                      {selected.report.strengths.map((item) => (
                        <li key={item} className='flex gap-2 text-sm leading-5 text-slate-700'>
                          <Check className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='rounded-xl border border-amber-200 bg-white p-4'>
                    <h4 className='flex items-center gap-2 text-sm font-semibold text-amber-800'>
                      <Lightbulb className='h-4 w-4' />
                      Hier ist die Konkurrenz stärker
                    </h4>
                    <ul className='mt-3 space-y-2'>
                      {selected.report.competitorAdvantages.map((item) => (
                        <li key={item} className='flex gap-2 text-sm leading-5 text-slate-700'>
                          <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <div className='mb-3'>
                  <h3 className='font-semibold text-slate-950'>Seitenvergleich</h3>
                  <p className='mt-1 text-xs text-slate-500'>
                    Technische und inhaltliche Kennzahlen jeder analysierten Seite.
                  </p>
                </div>
                <div className='grid gap-3 lg:grid-cols-2'>
                  {selected.pages.map((page) => {
                    const originalIndex = selected.urls.indexOf(page.url);
                    return (
                      <article
                        key={page.url}
                        className={`rounded-xl border bg-white p-4 ${
                          originalIndex === 0 ? "border-emerald-300 shadow-sm" : "border-slate-200"
                        }`}>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <span
                              className={`text-xs font-bold ${
                                originalIndex === 0 ? "text-emerald-700" : "text-slate-500"
                              }`}>
                              {originalIndex === 0 ? "DEINE ZIELSEITE" : `WETTBEWERBER ${originalIndex}`}
                            </span>
                            <a
                              href={page.finalUrl}
                              target='_blank'
                              rel='noreferrer'
                              className='mt-1 flex items-center gap-1 break-all text-sm font-medium text-slate-800 hover:text-emerald-700'>
                              {page.finalUrl}
                              <ExternalLink className='h-3.5 w-3.5 shrink-0' />
                            </a>
                          </div>
                          <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-bold ${scoreColor(page.score)}`}>
                            {page.score}/100
                          </span>
                        </div>
                        <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-3'>
                          <div>
                            <dt className='text-slate-500'>Wörter</dt>
                            <dd className='mt-0.5 font-semibold text-slate-900'>{page.wordCount}</dd>
                          </div>
                          <div>
                            <dt className='text-slate-500'>Überschriften</dt>
                            <dd className='mt-0.5 font-semibold text-slate-900'>
                              {page.headings.h1.length} / {page.headings.h2.length} / {page.headings.h3.length}
                            </dd>
                          </div>
                          <div>
                            <dt className='text-slate-500'>Bilder ohne Alt</dt>
                            <dd className='mt-0.5 font-semibold text-slate-900'>
                              {page.imagesWithoutAlt} von {page.images}
                            </dd>
                          </div>
                          <div>
                            <dt className='text-slate-500'>Interne Links</dt>
                            <dd className='mt-0.5 font-semibold text-slate-900'>{page.internalLinks}</dd>
                          </div>
                          <div>
                            <dt className='text-slate-500'>Externe Links</dt>
                            <dd className='mt-0.5 font-semibold text-slate-900'>{page.externalLinks}</dd>
                          </div>
                          <div>
                            <dt className='text-slate-500'>Schemas</dt>
                            <dd className='mt-0.5 truncate font-semibold text-slate-900'>
                              {page.schemaTypes.join(", ") || "Keine"}
                            </dd>
                          </div>
                        </dl>
                        <p className='mt-3 text-xs text-slate-500'>
                          Titel: {page.titleLength} Zeichen · Meta-Description: {page.metaDescriptionLength} Zeichen
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {resultView === "recommendations" && (
            <section className='rounded-2xl border border-slate-200 bg-white p-5 sm:p-6'>
              <div className='mb-5'>
                <h3 className='font-semibold text-slate-950'>Priorisierte Maßnahmen</h3>
                <p className='mt-1 text-sm text-slate-600'>
                  Starte oben und arbeite die Empfehlungen der Reihe nach ab.
                </p>
              </div>
              <div className='space-y-3'>
                {selected.report.recommendations.map((recommendation, index) => (
                  <article
                    key={`${recommendation.area}-${index}`}
                    className='rounded-xl border border-slate-200 p-4'>
                    <div className='flex items-start gap-3'>
                      <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700'>
                        {index + 1}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h4 className='font-semibold text-slate-900'>{recommendation.area}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              recommendation.priority === "hoch"
                                ? "bg-red-100 text-red-700"
                                : recommendation.priority === "mittel"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}>
                            {recommendation.priority}
                          </span>
                        </div>
                        <p className='mt-2 text-sm text-slate-600'>{recommendation.finding}</p>
                        <div className='mt-3 rounded-lg bg-emerald-50 px-3 py-2.5'>
                          <p className='text-xs font-bold uppercase tracking-wide text-emerald-700'>
                            Nächster Schritt
                          </p>
                          <p className='mt-1 text-sm font-medium text-slate-900'>{recommendation.action}</p>
                        </div>
                        {recommendation.competitorExample && (
                          <p className='mt-2 text-xs text-slate-500'>
                            <span className='font-semibold'>Beispiel der Konkurrenz:</span>{" "}
                            {recommendation.competitorExample}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {resultView === "draft" && (
            <section className='rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6'>
              <div className='mb-5'>
                <h3 className='font-semibold text-slate-950'>KI-Inhaltsentwurf</h3>
                <p className='mt-1 text-sm text-slate-600'>
                  Nutze die Vorschläge als Ausgangspunkt und passe sie an deine Seite an.
                </p>
              </div>
              {selected.report.pageBlueprint && onGeneratePage && (
                <div className='mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 p-5 text-white shadow-sm'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <p className='flex items-center gap-2 font-semibold'>
                        <Sparkles className='h-5 w-5 text-violet-200' />
                        Komplette Seite mit KI erstellen
                      </p>
                      <p className='mt-1.5 max-w-2xl text-sm leading-5 text-violet-100'>
                        Die KI setzt diesen Blueprint als editierbare Seite um. Für jeweils
                        750–1.000 Wörter wird ein eigener, auf die zugehörigen Abschnitte
                        spezialisierter Prompt verwendet.
                      </p>
                      <p className='mt-2 text-xs font-medium text-violet-200'>
                        Geplant: ca. {selected.report.pageBlueprint.recommendedWordCount.toLocaleString("de-DE")} Wörter
                        {" · "}
                        {Math.max(
                          1,
                          Math.ceil(selected.report.pageBlueprint.recommendedWordCount / 1_000),
                        )} KI-Textpakete
                      </p>
                    </div>
                    <button
                      type='button'
                      disabled={generatingPage}
                      onClick={() => onGeneratePage(selected.id)}
                      className='inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-violet-800 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60'>
                      {generatingPage ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Sparkles className='h-4 w-4' />
                      )}
                      {generatingPage ? "Seite wird erstellt..." : "Blueprint jetzt umsetzen"}
                    </button>
                  </div>
                </div>
              )}
              <dl className='grid gap-3'>
                {[
                  ["SEO-Titel", selected.report.suggestedTitle, "title"],
                  ["Meta-Description", selected.report.suggestedMetaDescription, "description"],
                  ["H1-Überschrift", selected.report.suggestedH1, "h1"],
                ].map(([label, value, field]) => (
                  <div key={field} className='rounded-xl border border-emerald-100 bg-white p-4'>
                    <dt className='flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-500'>
                      {label}
                      <button
                        type='button'
                        onClick={() => copyText(value, field)}
                        className='inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold normal-case tracking-normal text-emerald-700 hover:bg-emerald-50'>
                        {copiedField === field ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                        {copiedField === field ? "Kopiert" : "Kopieren"}
                      </button>
                    </dt>
                    <dd className='mt-2 text-sm leading-6 text-slate-900'>{value}</dd>
                  </div>
                ))}
              </dl>

              {selected.report.pageBlueprint && (
                <div className='mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4'>
                  <div className='flex items-center gap-2'>
                    <Target className='h-4 w-4 text-violet-700' />
                    <h4 className='text-sm font-semibold text-violet-950'>Strategische Ausrichtung</h4>
                  </div>
                  <dl className='mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3'>
                    <div>
                      <dt className='text-xs font-semibold text-violet-700'>Suchintention</dt>
                      <dd className='mt-1 text-slate-800'>{selected.report.pageBlueprint.searchIntent}</dd>
                    </div>
                    <div>
                      <dt className='text-xs font-semibold text-violet-700'>Zielgruppe</dt>
                      <dd className='mt-1 text-slate-800'>{selected.report.pageBlueprint.targetAudience}</dd>
                    </div>
                    <div>
                      <dt className='text-xs font-semibold text-violet-700'>Empfohlener Umfang</dt>
                      <dd className='mt-1 text-slate-800'>
                        ca. {selected.report.pageBlueprint.recommendedWordCount.toLocaleString("de-DE")} Wörter
                      </dd>
                    </div>
                    <div>
                      <dt className='text-xs font-semibold text-violet-700'>Hauptkeyword</dt>
                      <dd className='mt-1 font-medium text-slate-800'>
                        {selected.report.pageBlueprint.primaryKeyword}
                      </dd>
                    </div>
                    <div className='sm:col-span-2'>
                      <dt className='text-xs font-semibold text-violet-700'>Tonalität</dt>
                      <dd className='mt-1 text-slate-800'>{selected.report.pageBlueprint.tone}</dd>
                    </div>
                  </dl>
                  {selected.report.pageBlueprint.secondaryKeywords.length > 0 && (
                    <div className='mt-4 border-t border-violet-200 pt-3'>
                      <p className='text-xs font-semibold text-violet-700'>Ergänzende Keywords</p>
                      <div className='mt-2 flex flex-wrap gap-1.5'>
                        {selected.report.pageBlueprint.secondaryKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className='rounded-full bg-white px-2 py-1 text-xs font-medium text-violet-800'>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className='mt-6'>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>Kompletter Seitenaufbau</h4>
                    <p className='mt-1 text-xs text-slate-500'>
                      Reihenfolge, Überschriften, Inhalte und Conversion-Elemente für die Umsetzung.
                    </p>
                  </div>
                  {selected.report.pageBlueprint && (
                    <span className='text-xs font-semibold text-emerald-700'>
                      {selected.report.pageBlueprint.sections.length} Abschnitte
                    </span>
                  )}
                </div>
                <div className='mt-3 space-y-3'>
                  {selected.report.pageBlueprint
                    ? selected.report.pageBlueprint.sections.map((section) => (
                        <article
                          key={`${section.order}-${section.heading}`}
                          className='rounded-xl border border-emerald-100 bg-white p-4'>
                          <div className='flex items-start gap-3'>
                            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800'>
                              {section.order}
                            </span>
                            <div className='min-w-0 flex-1'>
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600'>
                                  {section.headingLevel}
                                </span>
                                <span className='text-xs font-medium text-slate-500'>{section.sectionType}</span>
                                <span className='ml-auto text-xs text-slate-400'>
                                  ca. {section.targetWordCount} Wörter
                                </span>
                              </div>
                              <h5 className='mt-2 font-semibold text-slate-950'>{section.heading}</h5>
                              <p className='mt-1 text-xs font-medium text-emerald-700'>{section.purpose}</p>
                              <p className='mt-3 text-sm leading-6 text-slate-700'>{section.contentBrief}</p>
                              {section.keyPoints.length > 0 && (
                                <ul className='mt-3 grid gap-1.5 sm:grid-cols-2'>
                                  {section.keyPoints.map((point) => (
                                    <li key={point} className='flex gap-2 text-xs leading-5 text-slate-600'>
                                      <Check className='mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600' />
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {section.cta && (
                                <div className='mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900'>
                                  <span className='font-bold'>CTA:</span> {section.cta}
                                </div>
                              )}
                              {section.keywords.length > 0 && (
                                <div className='mt-3 flex flex-wrap gap-1.5'>
                                  {section.keywords.map((keyword) => (
                                    <span
                                      key={keyword}
                                      className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'>
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))
                    : selected.report.contentOutline.map((section, index) => (
                        <article
                          key={`${section.heading}-${index}`}
                          className='flex gap-3 rounded-xl border border-emerald-100 bg-white p-4'>
                          <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800'>
                            {index + 1}
                          </span>
                          <div>
                            <h5 className='font-semibold text-slate-900'>{section.heading}</h5>
                            <p className='mt-1 text-sm text-slate-600'>{section.goal}</p>
                            {section.keywords.length > 0 && (
                              <div className='mt-2 flex flex-wrap gap-1.5'>
                                {section.keywords.map((keyword) => (
                                  <span
                                    key={keyword}
                                    className='rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'>
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                </div>
              </div>

              {selected.report.pageBlueprint && (
                <div className='mt-6 grid gap-3 lg:grid-cols-2'>
                  <div className='rounded-xl border border-emerald-100 bg-white p-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>Conversion & Vertrauen</h4>
                    <dl className='mt-3 space-y-3 text-sm'>
                      <div>
                        <dt className='text-xs font-semibold text-slate-500'>Primärer CTA</dt>
                        <dd className='mt-1 text-slate-800'>{selected.report.pageBlueprint.primaryCta}</dd>
                      </div>
                      <div>
                        <dt className='text-xs font-semibold text-slate-500'>Sekundärer CTA</dt>
                        <dd className='mt-1 text-slate-800'>{selected.report.pageBlueprint.secondaryCta}</dd>
                      </div>
                    </dl>
                    <p className='mt-4 text-xs font-semibold text-slate-500'>Vertrauenselemente</p>
                    <ul className='mt-2 space-y-1.5'>
                      {selected.report.pageBlueprint.trustElements.map((element) => (
                        <li key={element} className='flex gap-2 text-xs text-slate-700'>
                          <CheckCircle2 className='h-3.5 w-3.5 shrink-0 text-emerald-600' />
                          {element}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='rounded-xl border border-emerald-100 bg-white p-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>Technische Ergänzungen</h4>
                    <p className='mt-3 text-xs font-semibold text-slate-500'>Interne Links</p>
                    <ul className='mt-2 space-y-2'>
                      {selected.report.pageBlueprint.internalLinkSuggestions.map((link) => (
                        <li key={`${link.anchorText}-${link.targetPage}`} className='text-xs text-slate-700'>
                          <span className='font-semibold'>{link.anchorText}</span>
                          <span className='text-slate-400'> → </span>
                          {link.targetPage}
                          {link.sectionOrder ? (
                            <span className='text-slate-400'> · Abschnitt {link.sectionOrder}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <p className='mt-4 text-xs font-semibold text-slate-500'>Strukturierte Daten</p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {selected.report.pageBlueprint.schemaRecommendations.map((schema) => (
                        <span
                          key={schema}
                          className='rounded bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700'>
                          {schema}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className='mt-6'>
                <h4 className='text-sm font-semibold text-slate-900'>FAQ-Ideen</h4>
                <div className='mt-3 grid gap-3 lg:grid-cols-2'>
                  {selected.report.suggestedFaqs.map((faq, index) => (
                    <article
                      key={`${faq.question}-${index}`}
                      className='rounded-xl border border-emerald-100 bg-white p-4'>
                      <h5 className='font-semibold text-slate-900'>{faq.question}</h5>
                      <p className='mt-2 text-sm leading-5 text-slate-600'>{faq.answerGuidance}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
