"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
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

  function toggleProposal(proposalId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(proposalId)) next.delete(proposalId);
      else next.add(proposalId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) =>
      current.size === proposals.length
        ? new Set()
        : new Set(proposals.map((proposal) => proposal.id)),
    );
  }

  async function decideSelected(action: "accept" | "reject") {
    const selected = proposals.filter((proposal) =>
      selectedIds.has(proposal.id),
    );
    if (
      !selected.length ||
      !window.confirm(
        action === "accept"
          ? `${selected.length} ausgewählte Vorschläge veröffentlichen?`
          : `${selected.length} ausgewählte Vorschläge endgültig ablehnen?`,
      )
    ) {
      return;
    }

    setDeciding(action);
    setBatchMessage(null);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Keine aktive Anmeldung gefunden.");

      const succeeded = new Set<string>();
      const failures: Array<{ id: string; error: string }> = [];
      for (let offset = 0; offset < selected.length; offset += 5) {
        const group = selected.slice(offset, offset + 5);
        const results = await Promise.all(
          group.map(async (proposal) => {
            const response = await fetch(
              `/api/admin/city-service-optimization/${encodeURIComponent(proposal.id)}`,
              {
                method: "PUT",
                headers: {
                  authorization: `Bearer ${token}`,
                  "content-type": "application/json",
                },
                body: JSON.stringify({ ownerId, action }),
              },
            );
            const data = await response.json().catch(() => ({}));
            return {
              proposal,
              success: response.ok && data.success,
              error:
                data.error ||
                "Die Entscheidung konnte nicht gespeichert werden.",
            };
          }),
        );
        results.forEach((result) => {
          if (result.success) succeeded.add(result.proposal.id);
          else failures.push({ id: result.proposal.id, error: result.error });
        });
        setBatchProgress(
          `${Math.min(offset + group.length, selected.length)} von ${selected.length} verarbeitet`,
        );
      }

      setProposals((current) =>
        current.filter((proposal) => !succeeded.has(proposal.id)),
      );
      setSelectedIds(new Set(failures.map((failure) => failure.id)));
      setBatchMessage(
        `${succeeded.size} ${
          action === "accept" ? "Vorschläge veröffentlicht" : "Vorschläge abgelehnt"
        }.`,
      );
      if (failures.length) {
        setError(
          `${failures.length} Entscheidungen konnten nicht gespeichert werden: ${[
            ...new Set(failures.map((failure) => failure.error)),
          ].join(" ")}`,
        );
      }
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Die Sammelentscheidung ist fehlgeschlagen.",
      );
    } finally {
      setDeciding(null);
      setBatchProgress(null);
    }
  }

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

      {proposals.length > 0 && (
        <div className='mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <label className='inline-flex items-center gap-2 text-sm font-medium text-slate-700'>
            <input
              type='checkbox'
              checked={
                proposals.length > 0 && selectedIds.size === proposals.length
              }
              onChange={toggleAll}
              disabled={deciding !== null}
              className='h-4 w-4 rounded border-slate-300 text-violet-700'
            />
            Alle auswählen
          </label>
          <span className='text-sm text-slate-500'>
            {selectedIds.size} ausgewählt
          </span>
          <div className='ml-auto flex flex-wrap gap-2'>
            <button
              type='button'
              disabled={!selectedIds.size || deciding !== null}
              onClick={() => decideSelected("reject")}
              className='inline-flex h-10 items-center gap-2 rounded border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:opacity-50'>
              {deciding === "reject" ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <X className='h-4 w-4' />
              )}
              Ausgewählte ablehnen
            </button>
            <button
              type='button'
              disabled={!selectedIds.size || deciding !== null}
              onClick={() => decideSelected("accept")}
              className='inline-flex h-10 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50'>
              {deciding === "accept" ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Check className='h-4 w-4' />
              )}
              Ausgewählte veröffentlichen
            </button>
          </div>
          {batchProgress && (
            <p className='w-full text-xs text-slate-500'>{batchProgress}</p>
          )}
          {batchMessage && (
            <p className='w-full text-sm text-emerald-700'>{batchMessage}</p>
          )}
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
            className={`flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
              selectedIds.has(proposal.id)
                ? "border-violet-500 ring-2 ring-violet-100"
                : "border-slate-200"
            }`}>
            <input
              type='checkbox'
              aria-label={`${getDefaultCityServiceName(proposal.serviceKey)} in ${proposal.cityName} auswählen`}
              checked={selectedIds.has(proposal.id)}
              onChange={() => toggleProposal(proposal.id)}
              disabled={deciding !== null}
              className='h-5 w-5 rounded border-slate-300 text-violet-700'
            />
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
