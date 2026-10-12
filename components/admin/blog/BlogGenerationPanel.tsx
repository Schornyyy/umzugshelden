"use client";

import { auth } from "@/config/firebase";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BlogGenerationPanel({
  ownerId,
  userId,
}: {
  ownerId: string;
  userId: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [openProposals, setOpenProposals] = useState<
    BlogGenerationProposal[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function loadProposals() {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const params = new URLSearchParams({ ownerId });
      const response = await fetch(`/api/admin/blog-generations?${params}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!cancelled && response.ok && data.success) {
        setOpenProposals(data.proposals);
      }
    }
    loadProposals();
    return () => {
      cancelled = true;
    };
  }, [ownerId, proposalId]);

  async function generate() {
    if (
      !window.confirm(
        "Einen regionalen Blogentwurf recherchieren und zur Freigabe erstellen?",
      )
    ) {
      return;
    }
    setGenerating(true);
    setMessage(null);
    setError(null);
    setProposalId(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
      let workflowId: string | undefined;
      while (true) {
        const response = await fetch("/api/admin/generate-blog", {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ ownerId, workflowId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Bloggenerierung fehlgeschlagen.");
        }
        workflowId = data.workflowId;
        setMessage(data.message || "Nächster Generierungsschritt...");
        if (!data.pending && data.proposalId) {
          setProposalId(data.proposalId);
          return;
        }
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Bloggenerierung fehlgeschlagen.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className='rounded-xl border border-violet-200 bg-violet-50 p-5'>
      <div className='flex flex-wrap items-end gap-4'>
        <div className='min-w-64 flex-1'>
          <p className='text-xs font-bold uppercase tracking-wide text-violet-700'>
            Regionale Blog-KI
          </p>
          <h2 className='mt-1 text-lg font-semibold text-violet-950'>
            Suchstarken Blogentwurf erstellen
          </h2>
          <p className='mt-1 text-sm text-violet-800'>
            Rotiert automatisch durch alle Dienstleistungen, wählt eine noch
            nicht verwendete Stadt, prüft vorhandene Themen und analysiert die
            Google-Top-5.
          </p>
        </div>
        <button
          type='button'
          onClick={generate}
          disabled={generating}
          className='inline-flex h-10 items-center gap-2 rounded bg-violet-700 px-4 text-sm font-semibold text-white disabled:opacity-50'>
          {generating ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {generating ? "Recherche läuft..." : "Blog generieren"}
        </button>
      </div>
      {message && <p className='mt-3 text-sm text-violet-800'>{message}</p>}
      {error && <p className='mt-3 text-sm text-red-700'>{error}</p>}
      {proposalId && (
        <Link
          href={`/admin/${encodeURIComponent(userId)}/blog/freigaben/${encodeURIComponent(proposalId)}`}
          className='mt-3 inline-flex rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white'>
          Entwurf prüfen und freigeben
        </Link>
      )}
      {openProposals.length > 0 && (
        <div className='mt-5 border-t border-violet-200 pt-4'>
          <h3 className='text-sm font-semibold text-violet-950'>
            Offene Blogfreigaben
          </h3>
          <div className='mt-2 grid gap-2 md:grid-cols-2'>
            {openProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/admin/${encodeURIComponent(userId)}/blog/freigaben/${encodeURIComponent(proposal.id)}`}
                className='rounded border border-violet-200 bg-white p-3 text-sm hover:border-violet-400'>
                <span className='block font-semibold text-slate-900'>
                  {proposal.draft.title}
                </span>
                <span className='text-xs text-slate-500'>
                  {proposal.cityName} · {proposal.keyword}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
