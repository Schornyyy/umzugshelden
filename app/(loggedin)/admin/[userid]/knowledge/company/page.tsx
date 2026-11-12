"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import {
  companyKnowledgeJobSchema,
  type CompanyKnowledgeJob,
} from "@/lib/companyKnowledge";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import {
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  Factory,
  FileText,
  LoaderCircle,
  RefreshCw,
  Settings,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const statusResponseSchema = z.object({
  job: companyKnowledgeJobSchema.nullable(),
});

export default function CompanyKnowledgePage() {
  const { companyData } = useCompanyData();
  const [job, setJob] = useState<CompanyKnowledgeJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const authorizedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bitte erneut anmelden.");
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [],
  );

  const loadStatus = useCallback(
    async (silent = false) => {
      if (!companyData?.id) return;
      if (!silent) setLoading(true);
      try {
        const response = await authorizedFetch(
          `/api/admin/knowledge/company?ownerId=${encodeURIComponent(companyData.id)}`,
          { cache: "no-store" },
        );
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readError(result, "Status konnte nicht geladen werden."));
        }
        setJob(statusResponseSchema.parse(result).job);
        setError("");
      } catch (caughtError) {
        console.error("Firmenwissen-Status laden fehlgeschlagen:", caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Status konnte nicht geladen werden.",
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [authorizedFetch, companyData?.id],
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!job || !["pending", "processing"].includes(job.status)) return;
    const interval = window.setInterval(() => {
      void loadStatus(true);
    }, 2_000);
    return () => window.clearInterval(interval);
  }, [job, loadStatus]);

  async function startIndexing() {
    if (!companyData?.id || starting) return;
    setStarting(true);
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/knowledge/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: companyData.id }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          readError(result, "Verarbeitung konnte nicht gestartet werden."),
        );
      }
      setJob(companyKnowledgeJobSchema.parse(result));
    } catch (caughtError) {
      console.error("Firmenwissen starten fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Verarbeitung konnte nicht gestartet werden.",
      );
    } finally {
      setStarting(false);
    }
  }

  const running =
    job?.status === "pending" || job?.status === "processing";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Wissen
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Firmenwissen
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Mit einem Klick werden öffentliche Unternehmensinhalte sowie interne
          Preis- und Leistungskonfigurationen aufbereitet und als Firmenwissen in
          Pinecone gespeichert.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <Factory size={26} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Gesamtes Firmenwissen aktualisieren
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Vorhandene Firmenwissens-Vektoren werden ersetzt. Manuell
                importierte PDFs, Websites und Podcasts bleiben erhalten.
              </p>
            </div>
          </div>
          <Button
            type="button"
            disabled={starting || running || loading}
            onClick={() => void startIndexing()}
            className="shrink-0">
            {starting || running ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            {running ? "Verarbeitung läuft" : "Jetzt vektorisieren"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: FileText,
              title: "Öffentliche Inhalte",
              text: "Blogs, Stadtseiten, Leistungsseiten, Landingpages und Bewertungen",
            },
            {
              icon: Settings,
              title: "Firmenprofil & Leistungen",
              text: "Öffentliche Stammdaten, Leistungsvorlagen und Seitentexte",
            },
            {
              icon: Calculator,
              title: "Kalkulationswissen",
              text: "Preise, Zuschläge, Fahrzeuge, Möbel-, Pack- und Montagewerte",
            },
            {
              icon: BookOpenCheck,
              title: "Angebotskonfiguration",
              text: "Materialpreise und Leistungslogik ohne konkrete Kundendaten",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Icon className="mt-0.5 shrink-0 text-blue-700" size={19} />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Verarbeitungsstatus
        </h2>
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-600">
            <LoaderCircle className="animate-spin" size={17} /> Status wird
            geladen ...
          </p>
        ) : !job ? (
          <p className="mt-4 text-sm text-slate-600">
            Das Firmenwissen wurde noch nicht vektorisiert.
          </p>
        ) : (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-3">
              <JobStatus job={job} />
              <span className="text-sm text-slate-600">{job.stage}</span>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <Stat label="Quellen" value={job.sourceCount} />
              <Stat label="Vektoren" value={job.chunkCount} />
              <Stat
                label="Letzte Aktualisierung"
                value={new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(job.completedAt ?? job.startedAt ?? job.createdAt)}
              />
            </dl>
            {job.error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {job.error}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function JobStatus({ job }: { job: CompanyKnowledgeJob }) {
  if (job.status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 size={14} /> Aktuell
      </span>
    );
  }
  if (job.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
        <XCircle size={14} /> Fehlgeschlagen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
      <LoaderCircle className="animate-spin" size={14} /> Verarbeitung
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function readError(value: unknown, fallback: string) {
  return value && typeof value === "object" && "error" in value
    ? String(value.error)
    : fallback;
}
