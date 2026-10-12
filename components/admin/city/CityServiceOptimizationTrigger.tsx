"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { auth } from "@/config/firebase";

type Props = {
  ownerId: string;
};

type Result = {
  message: string;
  pageKey?: string;
  proposalId?: string;
  reviewUrl?: string;
  targetRank?: number;
  suspended?: boolean;
};

export default function CityServiceOptimizationTrigger({ ownerId }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runOnce() {
    if (
      !window.confirm(
        "Jetzt genau eine fällige Service-Seite analysieren und gegebenenfalls einen neuen Freigabevorschlag erstellen?",
      )
    ) {
      return;
    }
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Keine aktive Anmeldung gefunden. Bitte neu einloggen.");
      }
      for (let stage = 0; stage < 2; stage += 1) {
        const response = await fetch("/api/cron/optimize-city-services", {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ ownerId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Die manuelle Optimierung ist fehlgeschlagen.",
          );
        }
        if (data.pending && data.stage === "analysis" && stage === 0) {
          continue;
        }
        setResult({
          message: data.message,
          pageKey: data.pageKey,
          proposalId: data.proposalId,
          reviewUrl: data.reviewUrl,
          targetRank: data.targetRank,
          suspended: data.suspended,
        });
        return;
      }
      throw new Error(
        "Die Optimierung konnte nicht in zwei Schritten abgeschlossen werden.",
      );
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Die manuelle Optimierung ist fehlgeschlagen.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className='mb-6 rounded-md border border-violet-200 bg-violet-50/60 p-4 shadow-sm'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='min-w-0 flex-1'>
          <h2 className='font-semibold text-violet-950'>
            Service-Seiten selbst verbessern
          </h2>
          <p className='mt-1 text-sm leading-5 text-violet-800'>
            Pro Klick wird genau eine fällige Seite geprüft. Monatslimit,
            Top-5-Pause und Freigabe bleiben aktiv.
          </p>
        </div>
        <button
          type='button'
          disabled={running}
          onClick={runOnce}
          className='inline-flex h-11 items-center gap-2 rounded-md bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50'>
          {running ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {running ? "Eine Seite wird geprüft..." : "Eine Seite optimieren"}
        </button>
      </div>

      {result && (
        <div className='mt-4 flex flex-wrap items-center gap-3 border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm text-slate-700'>
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
      )}
      {error && (
        <div className='mt-4 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}
    </section>
  );
}
