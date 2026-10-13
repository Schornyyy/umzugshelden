"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, Loader2, Play, Sparkles } from "lucide-react";
import { auth } from "@/config/firebase";

type Props = {
  ownerId: string;
};

type DirectResult = {
  message: string;
  pageKey?: string;
  proposalId?: string;
  reviewUrl?: string;
  targetRank?: number;
};

type QueueResult = {
  message: string;
  pageKeys: string[];
};

const BATCH_SIZES = [1, 2, 3, 5, 10, 20, 50];

export default function CityServiceOptimizationTrigger({ ownerId }: Props) {
  const [running, setRunning] = useState<"queue" | "direct" | null>(null);
  const [batchSize, setBatchSize] = useState(3);
  const [queueResult, setQueueResult] = useState<QueueResult | null>(null);
  const [directResults, setDirectResults] = useState<DirectResult[]>([]);
  const [directProgress, setDirectProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getToken() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("Keine aktive Anmeldung gefunden. Bitte neu einloggen.");
    }
    return token;
  }

  function resetOutput() {
    setQueueResult(null);
    setDirectResults([]);
    setDirectProgress(null);
    setError(null);
  }

  async function queueBatch() {
    if (
      !window.confirm(
        `Bis zu ${batchSize} fällige Service-Seiten für den automatischen Cron einplanen?`,
      )
    ) {
      return;
    }
    setRunning("queue");
    resetOutput();
    try {
      const token = await getToken();
      const response = await fetch("/api/cron/optimize-city-services", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ ownerId, count: batchSize, mode: "queue" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Die Seiten konnten nicht eingeplant werden.",
        );
      }
      setQueueResult({
        message: data.message,
        pageKeys: Array.isArray(data.pageKeys) ? data.pageKeys : [],
      });
    } catch (queueError) {
      setError(
        queueError instanceof Error
          ? queueError.message
          : "Die Seiten konnten nicht eingeplant werden.",
      );
    } finally {
      setRunning(null);
    }
  }

  async function runDirectly() {
    if (
      !window.confirm(
        `Bis zu ${batchSize} fällige Service-Seiten jetzt direkt nacheinander optimieren? Das Fenster muss bis zum Abschluss geöffnet bleiben.`,
      )
    ) {
      return;
    }
    setRunning("direct");
    resetOutput();
    try {
      const completed: DirectResult[] = [];

      for (let item = 0; item < batchSize; item += 1) {
        let pageKey: string | undefined;
        let retryCount = 0;

        while (true) {
          const token = await getToken();
          const response = await fetch("/api/cron/optimize-city-services", {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ ownerId, mode: "run-now", pageKey }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) {
            throw new Error(
              data.error || "Die direkte Optimierung ist fehlgeschlagen.",
            );
          }
          if (typeof data.pageKey === "string") {
            pageKey = data.pageKey;
          }
          if (data.pending && data.stage === "analysis") {
            setDirectProgress(`${pageKey}: SEO-Seitenplan wurde erstellt.`);
            continue;
          }
          if (data.pending) {
            if (data.stage === "section") {
              setDirectProgress(
                `${pageKey}: Sektion ${data.completedSections} von ${data.totalSections} wurde erstellt.`,
              );
            } else if (data.stage === "internal-links") {
              setDirectProgress(
                `${pageKey}: Interne Verlinkungen wurden optimiert.`,
              );
            } else if (data.stage === "quality-check") {
              setDirectProgress(
                `${pageKey}: SEO-Qualitätsprüfung ${data.qualityScore ?? ""}/100.`,
              );
            } else if (data.stage === "section-repair") {
              setDirectProgress(
                `${pageKey}: Sektion ${data.sectionOrder} wird gezielt verbessert.`,
              );
            }
            if (
              data.stage === "analysis-retry" ||
              data.stage === "generation-retry" ||
              data.stage === "error-retry"
            ) {
              retryCount += 1;
              if (retryCount > 5) {
                throw new Error(
                  `${pageKey ?? "Die Seite"} konnte nach fünf direkten Wiederholungen nicht abgeschlossen werden.`,
                );
              }
              await new Promise((resolve) =>
                window.setTimeout(resolve, 1_000),
              );
            }
            continue;
          }

          completed.push({
            message: data.message,
            pageKey: data.pageKey,
            proposalId: data.proposalId,
            reviewUrl: data.reviewUrl,
            targetRank: data.targetRank,
          });
          setDirectResults([...completed]);
          setDirectProgress(null);
          if (!data.pageKey) {
            item = batchSize;
          }
          break;
        }
      }
    } catch (directError) {
      setError(
        directError instanceof Error
          ? directError.message
          : "Die direkte Optimierung ist fehlgeschlagen.",
      );
    } finally {
      setRunning(null);
    }
  }

  return (
    <section className='mb-6 rounded-md border border-violet-200 bg-violet-50/60 p-4 shadow-sm'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='min-w-0 flex-1'>
          <h2 className='font-semibold text-violet-950'>
            Service-Seiten optimieren
          </h2>
          <p className='mt-1 text-sm leading-5 text-violet-800'>
            Seiten können dauerhaft für den Cron eingeplant oder sofort im
            geöffneten Adminbereich verarbeitet werden. Monatslimit,
            Top-5-Pause und manuelle Freigabe bleiben aktiv.
          </p>
        </div>
        <label className='text-sm font-medium text-violet-950'>
          Anzahl
          <select
            value={batchSize}
            disabled={running !== null}
            onChange={(event) => setBatchSize(Number(event.target.value))}
            className='ml-2 h-11 rounded-md border border-violet-300 bg-white px-3 outline-none focus:border-violet-600'>
            {BATCH_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type='button'
          disabled={running !== null}
          onClick={queueBatch}
          className='inline-flex h-11 items-center gap-2 rounded-md border border-violet-300 bg-white px-4 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50'>
          {running === "queue" ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Clock3 className='h-4 w-4' />
          )}
          Automatisch einplanen
        </button>
        <button
          type='button'
          disabled={running !== null}
          onClick={runDirectly}
          className='inline-flex h-11 items-center gap-2 rounded-md bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50'>
          {running === "direct" ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : batchSize === 1 ? (
            <Play className='h-4 w-4' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          Jetzt direkt starten
        </button>
      </div>

      {running === "direct" && directProgress && (
        <p className='mt-3 text-sm text-violet-800'>{directProgress}</p>
      )}
      {queueResult && (
        <div className='mt-4 border-l-4 border-blue-500 bg-white px-4 py-3 text-sm text-slate-700'>
          <p>{queueResult.message}</p>
          {queueResult.pageKeys.length > 0 && (
            <p className='mt-1 text-xs text-slate-500'>
              {queueResult.pageKeys.join(", ")}
            </p>
          )}
        </div>
      )}
      {directResults.length > 0 && (
        <div className='mt-4 space-y-2 border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm text-slate-700'>
          {directResults.map((result, index) => (
            <div
              key={`${result.pageKey ?? "complete"}-${index}`}
              className='flex flex-wrap items-center gap-3'>
              <span className='min-w-0 flex-1'>
                {result.message}
                {result.pageKey ? ` (${result.pageKey})` : ""}
                {result.targetRank ? ` · Position ${result.targetRank}` : ""}
              </span>
              {result.proposalId && result.reviewUrl && (
                <Link
                  href={result.reviewUrl}
                  target='_blank'
                  className='rounded bg-violet-700 px-3 py-2 text-xs font-semibold text-white'>
                  Vorschlag prüfen
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className='mt-4 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}
    </section>
  );
}
