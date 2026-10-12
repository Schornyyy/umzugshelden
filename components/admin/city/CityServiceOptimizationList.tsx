"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Loader2, Sparkles } from "lucide-react";
import { auth } from "@/config/firebase";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import type { CityServiceOptimizationProposal } from "@/types/city/CityPageGeneration";

type Props = {
  ownerId: string;
  userId: string;
};

export default function CityServiceOptimizationList({
  ownerId,
  userId,
}: Props) {
  const [proposals, setProposals] = useState<
    CityServiceOptimizationProposal[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
        const params = new URLSearchParams({ ownerId });
        const response = await fetch(
          `/api/admin/city-service-optimizations?${params}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Freigaben konnten nicht geladen werden.");
        }
        if (!cancelled) setProposals(data.proposals);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Freigaben konnten nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  if (loading) {
    return (
      <div className='flex min-h-64 items-center justify-center text-slate-500'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        Freigaben werden geladen...
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl py-2 md:px-6 md:py-8'>
      <header className='mb-6'>
        <p className='text-xs font-bold uppercase tracking-wide text-violet-700'>
          Städte
        </p>
        <h1 className='mt-1 text-2xl font-bold text-slate-950'>
          Offene Freigaben
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          Hier stehen alle automatisch und manuell erzeugten Service-Seiten,
          die noch nicht veröffentlicht oder abgelehnt wurden.
        </p>
      </header>

      {error && (
        <div className='border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}

      {!error && proposals.length === 0 && (
        <div className='rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
          <Sparkles className='mx-auto h-8 w-8 text-emerald-600' />
          <h2 className='mt-3 font-semibold text-slate-900'>
            Keine offenen Freigaben
          </h2>
          <p className='mt-1 text-sm text-slate-500'>
            Neue KI-Vorschläge erscheinen automatisch an dieser Stelle.
          </p>
        </div>
      )}

      <div className='space-y-3'>
        {proposals.map((proposal) => (
          <article
            key={proposal.id}
            className='flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700'>
              <Sparkles className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h2 className='font-semibold text-slate-950'>
                {getDefaultCityServiceName(proposal.serviceKey)} in{" "}
                {proposal.cityName}
              </h2>
              <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500'>
                <span className='inline-flex items-center gap-1'>
                  <Clock3 className='h-3.5 w-3.5' />
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(proposal.createdAt))}
                </span>
                <span>
                  {proposal.source === "cron"
                    ? "Automatisch erstellt"
                    : "Manuell erstellt"}
                </span>
                {proposal.targetRank && (
                  <span>Suchposition {proposal.targetRank}</span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/${encodeURIComponent(userId)}/citys/${encodeURIComponent(proposal.citySlug)}/services/${proposal.serviceKey}/optimierungen/${proposal.id}`}
              className='inline-flex h-10 items-center gap-2 rounded bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800'>
              Prüfen
              <ArrowRight className='h-4 w-4' />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
