"use client";

import CityServiceBlockEditor from "@/components/admin/city/CityServiceBlockEditor";
import { auth } from "@/config/firebase";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BlogGenerationReview({
  ownerId,
  proposalId,
}: {
  ownerId: string;
  proposalId: string;
}) {
  const [proposal, setProposal] =
    useState<BlogGenerationProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [publishedPath, setPublishedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
        const params = new URLSearchParams({ ownerId });
        const response = await fetch(
          `/api/admin/blog-generation/${encodeURIComponent(proposalId)}?${params}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Blogvorschlag konnte nicht geladen werden.");
        }
        if (!cancelled) setProposal(data.proposal);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Blogvorschlag konnte nicht geladen werden.",
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
    if (!proposal) return;
    setDeciding(action);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
      const response = await fetch(
        `/api/admin/blog-generation/${encodeURIComponent(proposalId)}`,
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
        throw new Error(data.error || "Entscheidung fehlgeschlagen.");
      }
      setProposal({ ...proposal, status: data.status });
      setPublishedPath(data.publishedPath || null);
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Entscheidung fehlgeschlagen.",
      );
    } finally {
      setDeciding(null);
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-64 items-center justify-center'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        Blogvorschlag wird geladen...
      </div>
    );
  }
  if (!proposal) return <div className='p-6 text-red-700'>{error}</div>;

  return (
    <div className='space-y-6 p-6'>
      <header className='flex flex-wrap items-start gap-4 rounded-xl border bg-white p-5'>
        <div className='flex-1'>
          <p className='text-xs font-bold uppercase text-violet-700'>
            Blog zur Freigabe
          </p>
          <h1 className='mt-1 text-2xl font-bold'>{proposal.draft.title}</h1>
          <p className='mt-2 text-sm text-slate-600'>
            {proposal.cityName} · {proposal.keyword}
          </p>
          {typeof proposal.qualityScore === "number" && (
            <p className='mt-2 text-sm font-medium text-slate-700'>
              SEO-Qualitätsprüfung: {proposal.qualityScore}/100
              {proposal.qualitySummary
                ? ` · ${proposal.qualitySummary}`
                : ""}
            </p>
          )}
          {proposal.generationWarnings?.map((warning) => (
            <p
              key={warning}
              className='mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800'>
              {warning}
            </p>
          ))}
        </div>
        {proposal.status === "pending" && (
          <div className='flex gap-2'>
            <button
              type='button'
              disabled={Boolean(deciding)}
              onClick={() => decide("reject")}
              className='inline-flex h-10 items-center gap-2 rounded border border-red-300 px-4 text-sm font-semibold text-red-700'>
              <X className='h-4 w-4' /> Ablehnen
            </button>
            <button
              type='button'
              disabled={Boolean(deciding)}
              onClick={() => decide("accept")}
              className='inline-flex h-10 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white'>
              <Check className='h-4 w-4' /> Freigeben und veröffentlichen
            </button>
          </div>
        )}
      </header>
      {error && <div className='bg-red-50 p-3 text-sm text-red-700'>{error}</div>}
      {publishedPath && (
        <Link
          href={`/blog/${publishedPath}`}
          target='_blank'
          className='inline-flex rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>
          Veröffentlichten Blog öffnen
        </Link>
      )}
      <CityServiceBlockEditor
        blocks={proposal.draft.blocks}
        onChange={() => undefined}
        readOnly
        cityName={proposal.cityName}
        citySlug={proposal.cityName.toLocaleLowerCase("de").replace(/\s+/gu, "-")}
        serviceKey={proposal.serviceKey}
        primaryKeyword={proposal.keyword}
      />
    </div>
  );
}
