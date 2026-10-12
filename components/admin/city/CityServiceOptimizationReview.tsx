"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { auth } from "@/config/firebase";
import CityServiceBlockEditor from "@/components/admin/city/CityServiceBlockEditor";
import type { CityServiceOptimizationProposal } from "@/types/city/CityPageGeneration";

type Props = {
  ownerId: string;
  proposalId: string;
};

export default function CityServiceOptimizationReview({
  ownerId,
  proposalId,
}: Props) {
  const [proposal, setProposal] =
    useState<CityServiceOptimizationProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
        const params = new URLSearchParams({ ownerId });
        const response = await fetch(
          `/api/admin/city-service-optimization/${encodeURIComponent(proposalId)}?${params}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Vorschlag konnte nicht geladen werden.");
        }
        if (!cancelled) setProposal(data.proposal);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Vorschlag konnte nicht geladen werden.",
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
  }, [ownerId, proposalId]);

  async function decide(action: "accept" | "reject") {
    if (
      !proposal ||
      !window.confirm(
        action === "accept"
          ? "Diesen Vorschlag veröffentlichen und den aktuellen Stand ersetzen?"
          : "Diesen Vorschlag endgültig ablehnen?",
      )
    ) {
      return;
    }
    setDeciding(action);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
      const response = await fetch(
        `/api/admin/city-service-optimization/${encodeURIComponent(proposalId)}`,
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
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Entscheidung konnte nicht gespeichert werden.");
      }
      setProposal({
        ...proposal,
        status: data.status,
        decidedAt: new Date().toISOString(),
      });
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Entscheidung konnte nicht gespeichert werden.",
      );
    } finally {
      setDeciding(null);
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-64 items-center justify-center text-slate-500'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        Vorschlag wird geladen...
      </div>
    );
  }
  if (!proposal) {
    return <div className='p-6 text-red-700'>{error || "Vorschlag fehlt."}</div>;
  }

  const isPending = proposal.status === "pending";
  return (
    <div className='space-y-6 p-4 sm:p-6'>
      <header className='flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-5'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wide text-violet-700'>
            KI-Optimierung zur Freigabe
          </p>
          <h1 className='mt-1 text-2xl font-bold text-slate-950'>
            {proposal.cityName} · {proposal.serviceKey}
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Alter und neuer Stand bleiben getrennt, bis Sie den Vorschlag
            ausdrücklich annehmen.
          </p>
          {proposal.targetRank && (
            <p className='mt-1 text-xs text-slate-500'>
              Gemessene Suchposition: {proposal.targetRank}
            </p>
          )}
        </div>
        <div className='ml-auto flex gap-2'>
          <button
            type='button'
            disabled={!isPending || Boolean(deciding)}
            onClick={() => decide("reject")}
            className='inline-flex h-10 items-center gap-2 rounded border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:opacity-50'>
            {deciding === "reject" ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <X className='h-4 w-4' />
            )}
            Ablehnen
          </button>
          <button
            type='button'
            disabled={!isPending || Boolean(deciding)}
            onClick={() => decide("accept")}
            className='inline-flex h-10 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50'>
            {deciding === "accept" ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Check className='h-4 w-4' />
            )}
            Freigeben
          </button>
        </div>
      </header>

      {error && (
        <div className='border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}
      {!isPending && (
        <div className='border-l-4 border-slate-500 bg-slate-100 px-4 py-3 text-sm text-slate-700'>
          Status: {proposal.status === "accepted" ? "freigegeben" : "abgelehnt"}
        </div>
      )}

      <div className='grid gap-8 xl:grid-cols-2'>
        <section className='min-w-0'>
          <h2 className='mb-3 text-lg font-bold text-slate-900'>
            Bisheriger Stand
          </h2>
          <CityServiceBlockEditor
            blocks={proposal.previous.blocks}
            onChange={() => undefined}
            readOnly
            cityName={proposal.cityName}
            citySlug={proposal.citySlug}
            serviceKey={proposal.serviceKey}
          />
        </section>
        <section className='min-w-0'>
          <h2 className='mb-3 text-lg font-bold text-violet-900'>
            Neuer KI-Vorschlag
          </h2>
          <CityServiceBlockEditor
            blocks={proposal.draft.blocks}
            onChange={() => undefined}
            readOnly
            cityName={proposal.cityName}
            citySlug={proposal.citySlug}
            serviceKey={proposal.serviceKey}
            primaryKeyword={proposal.draft.strategy.primaryKeyword}
          />
        </section>
      </div>
    </div>
  );
}
