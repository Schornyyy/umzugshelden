"use client";

import { auth } from "@/config/firebase";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";
import {
  Check,
  Clock3,
  Loader2,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const BATCH_SIZES = [1, 2, 3, 5, 10, 20, 50];

export default function BlogGenerationPanel({
  ownerId,
  userId,
}: {
  ownerId: string;
  userId: string;
}) {
  const [running, setRunning] = useState<"queue" | "direct" | null>(null);
  const [batchSize, setBatchSize] = useState(3);
  const [operation, setOperation] = useState<"optimize" | "create">(
    "optimize",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalIds, setProposalIds] = useState<string[]>([]);
  const [openProposals, setOpenProposals] = useState<
    BlogGenerationProposal[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  async function getToken() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Keine aktive Anmeldung gefunden.");
    return token;
  }

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
  }, [ownerId, reloadKey]);

  function resetOutput() {
    setMessage(null);
    setProgress(null);
    setError(null);
    setProposalIds([]);
  }

  async function createQueue(count: number) {
    const token = await getToken();
    const response = await fetch("/api/admin/generate-blog", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ownerId, count, mode: "queue", operation }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !Array.isArray(data.workflowIds)) {
      throw new Error(data.error || "Blogaufträge konnten nicht angelegt werden.");
    }
    return {
      workflowIds: data.workflowIds as string[],
      message: String(data.message || ""),
    };
  }

  async function queueBlogs() {
    if (
      !window.confirm(
        `${batchSize} ${
          operation === "optimize"
            ? "bestehende Blogartikel optimieren"
            : "neue Blogartikel erstellen"
        } und dauerhaft für den automatischen Cron einplanen?`,
      )
    ) {
      return;
    }
    setRunning("queue");
    resetOutput();
    try {
      const queued = await createQueue(batchSize);
      setMessage(queued.message);
    } catch (queueError) {
      setError(
        queueError instanceof Error
          ? queueError.message
          : "Blogaufträge konnten nicht angelegt werden.",
      );
    } finally {
      setRunning(null);
    }
  }

  async function runDirectly() {
    if (
      !window.confirm(
        `${batchSize} ${
          operation === "optimize"
            ? "bestehende Blogartikel jetzt vollständig optimieren"
            : "neue Blogartikel jetzt vollständig erstellen"
        }? Das Fenster muss bis zum Abschluss geöffnet bleiben.`,
      )
    ) {
      return;
    }
    setRunning("direct");
    resetOutput();
    try {
      const queued = await createQueue(batchSize);
      const completedProposals: string[] = [];
      for (
        let workflowIndex = 0;
        workflowIndex < queued.workflowIds.length;
        workflowIndex += 1
      ) {
        const workflowId = queued.workflowIds[workflowIndex];
        let requestRetries = 0;
        while (true) {
          const token = await getToken();
          const response = await fetch("/api/admin/generate-blog", {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              ownerId,
              workflowId,
              mode: "run",
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) {
            requestRetries += 1;
            if (requestRetries > 5) {
              throw new Error(
                data.error ||
                  "Bloggenerierung ist nach fünf direkten Wiederholungen fehlgeschlagen.",
              );
            }
            setProgress(
              `Blog ${workflowIndex + 1}/${queued.workflowIds.length}: temporärer Fehler, direkter Versuch ${requestRetries}/5`,
            );
            await new Promise((resolve) =>
              window.setTimeout(resolve, 1_000),
            );
            continue;
          }
          requestRetries = 0;
          const article = `${workflowIndex + 1}/${queued.workflowIds.length}`;
          if (data.stage === "sections") {
            setProgress(
              `Blog ${article}: Sektion ${data.completedSections ?? 0} von ${data.totalSections ?? "?"}`,
            );
          } else if (data.stage === "quality") {
            setProgress(`Blog ${article}: SEO-Qualitätsprüfung`);
          } else if (data.stage === "section-repair") {
            setProgress(
              `Blog ${article}: Sektion ${Number(data.sectionIndex) + 1} wird verbessert`,
            );
          } else {
            setProgress(
              `Blog ${article}: ${data.message || "Nächster Arbeitsschritt"}`,
            );
          }
          if (!data.pending && data.proposalId) {
            completedProposals.push(data.proposalId);
            setProposalIds([...completedProposals]);
            break;
          }
        }
      }
      setMessage(
        `${completedProposals.length} ${
          completedProposals.length === 1
            ? "Blogvorschlag wurde"
            : "Blogvorschläge wurden"
        } vollständig erstellt.`,
      );
      setProgress(null);
      setReloadKey((current) => current + 1);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Bloggenerierung fehlgeschlagen.",
      );
    } finally {
      setRunning(null);
    }
  }

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
      current.size === openProposals.length
        ? new Set()
        : new Set(openProposals.map((proposal) => proposal.id)),
    );
  }

  async function decideSelected(action: "accept" | "reject") {
    const selected = openProposals.filter((proposal) =>
      selectedIds.has(proposal.id),
    );
    if (
      !selected.length ||
      !window.confirm(
        action === "accept"
          ? `${selected.length} Blogvorschläge veröffentlichen?`
          : `${selected.length} Blogvorschläge endgültig ablehnen?`,
      )
    ) {
      return;
    }
    setDeciding(action);
    setError(null);
    try {
      const token = await getToken();
      const succeeded = new Set<string>();
      const failures: string[] = [];
      for (let offset = 0; offset < selected.length; offset += 5) {
        const group = selected.slice(offset, offset + 5);
        const results = await Promise.all(
          group.map(async (proposal) => {
            const response = await fetch(
              `/api/admin/blog-generation/${encodeURIComponent(proposal.id)}`,
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
              id: proposal.id,
              success: response.ok && data.success,
              error: String(data.error || "Entscheidung fehlgeschlagen."),
            };
          }),
        );
        results.forEach((result) => {
          if (result.success) succeeded.add(result.id);
          else failures.push(result.error);
        });
        setProgress(
          `${Math.min(offset + group.length, selected.length)} von ${selected.length} Freigaben verarbeitet`,
        );
      }
      setOpenProposals((current) =>
        current.filter((proposal) => !succeeded.has(proposal.id)),
      );
      setSelectedIds(
        new Set(
          selected
            .filter((proposal) => !succeeded.has(proposal.id))
            .map((proposal) => proposal.id),
        ),
      );
      setMessage(
        `${succeeded.size} ${
          action === "accept"
            ? "Blogvorschläge veröffentlicht"
            : "Blogvorschläge abgelehnt"
        }.`,
      );
      if (failures.length) {
        setError(
          `${failures.length} Entscheidungen sind fehlgeschlagen: ${[
            ...new Set(failures),
          ].join(" ")}`,
        );
      }
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Sammelentscheidung fehlgeschlagen.",
      );
    } finally {
      setDeciding(null);
      setProgress(null);
    }
  }

  return (
    <section className='rounded-xl border border-violet-200 bg-violet-50 p-5'>
      <div className='flex flex-wrap items-end gap-4'>
        <div className='min-w-64 flex-1'>
          <p className='text-xs font-bold uppercase tracking-wide text-violet-700'>
            Persistente Blog-SEO-Pipeline
          </p>
          <h2 className='mt-1 text-lg font-semibold text-violet-950'>
            Suchstarke Blogartikel erstellen
          </h2>
          <p className='mt-1 text-sm text-violet-800'>
            Keyword, Wettbewerbsanalyse, SEO-Blueprint, einzelne Sektionen,
            interne Links und Qualitätsprüfung werden getrennt gespeichert.
          </p>
        </div>
        <label className='text-sm font-medium text-violet-950'>
          Aufgabe
          <select
            value={operation}
            disabled={running !== null}
            onChange={(event) =>
              setOperation(event.target.value as "optimize" | "create")
            }
            className='ml-2 h-10 rounded border border-violet-300 bg-white px-3'>
            <option value='optimize'>Bestehende verbessern</option>
            <option value='create'>Neue erstellen</option>
          </select>
        </label>
        <label className='text-sm font-medium text-violet-950'>
          Anzahl
          <select
            value={batchSize}
            disabled={running !== null}
            onChange={(event) => setBatchSize(Number(event.target.value))}
            className='ml-2 h-10 rounded border border-violet-300 bg-white px-3'>
            {BATCH_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type='button'
          onClick={queueBlogs}
          disabled={running !== null}
          className='inline-flex h-10 items-center gap-2 rounded border border-violet-300 bg-white px-4 text-sm font-semibold text-violet-800 disabled:opacity-50'>
          {running === "queue" ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Clock3 className='h-4 w-4' />
          )}
          Automatisch einplanen
        </button>
        <button
          type='button'
          onClick={runDirectly}
          disabled={running !== null}
          className='inline-flex h-10 items-center gap-2 rounded bg-violet-700 px-4 text-sm font-semibold text-white disabled:opacity-50'>
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

      {progress && <p className='mt-3 text-sm text-violet-800'>{progress}</p>}
      {message && <p className='mt-3 text-sm text-emerald-700'>{message}</p>}
      {error && <p className='mt-3 text-sm text-red-700'>{error}</p>}
      {proposalIds.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {proposalIds.map((proposalId, index) => (
            <Link
              key={proposalId}
              href={`/admin/${encodeURIComponent(userId)}/blog/freigaben/${encodeURIComponent(proposalId)}`}
              className='inline-flex rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white'>
              Blogvorschlag {index + 1} prüfen
            </Link>
          ))}
        </div>
      )}

      {openProposals.length > 0 && (
        <div className='mt-5 border-t border-violet-200 pt-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <h3 className='font-semibold text-violet-950'>
              Offene Blogfreigaben
            </h3>
            <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
              <input
                type='checkbox'
                checked={
                  openProposals.length > 0 &&
                  selectedIds.size === openProposals.length
                }
                onChange={toggleAll}
                disabled={deciding !== null}
                className='h-4 w-4 rounded border-slate-300'
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
                className='inline-flex h-9 items-center gap-2 rounded border border-red-300 px-3 text-sm font-semibold text-red-700 disabled:opacity-50'>
                {deciding === "reject" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <X className='h-4 w-4' />
                )}
                Ablehnen
              </button>
              <button
                type='button'
                disabled={!selectedIds.size || deciding !== null}
                onClick={() => decideSelected("accept")}
                className='inline-flex h-9 items-center gap-2 rounded bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50'>
                {deciding === "accept" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Check className='h-4 w-4' />
                )}
                Veröffentlichen
              </button>
            </div>
          </div>
          <div className='mt-3 grid gap-2 md:grid-cols-2'>
            {openProposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`flex gap-3 rounded border bg-white p-3 text-sm ${
                  selectedIds.has(proposal.id)
                    ? "border-violet-500 ring-2 ring-violet-100"
                    : "border-violet-200"
                }`}>
                <input
                  type='checkbox'
                  aria-label={`${proposal.draft.title} auswählen`}
                  checked={selectedIds.has(proposal.id)}
                  onChange={() => toggleProposal(proposal.id)}
                  disabled={deciding !== null}
                  className='mt-1 h-4 w-4 shrink-0 rounded border-slate-300'
                />
                <Link
                  href={`/admin/${encodeURIComponent(userId)}/blog/freigaben/${encodeURIComponent(proposal.id)}`}
                  className='min-w-0 flex-1'>
                  <span className='block font-semibold text-slate-900'>
                    {proposal.draft.title}
                  </span>
                  <span className='text-xs text-slate-500'>
                    {proposal.cityName} · {proposal.keyword}
                    {typeof proposal.qualityScore === "number"
                      ? ` · SEO ${proposal.qualityScore}/100`
                      : ""}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
