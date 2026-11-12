"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import {
  LANDING_PAGE_SERVICE_KEYS,
  LANDING_PAGE_TEMPLATES,
  landingPageSchema,
  type LandingPage,
  type LandingPageServiceKey,
} from "@/lib/landingPageSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import {
  ExternalLink,
  FilePlus2,
  LayoutTemplate,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

const responseSchema = z.object({ pages: z.array(landingPageSchema) });
const legacyPages = [
  {
    slug: "umzug",
    serviceName: "Umzug",
    title: "Bestehende individuelle Umzugs-Landingpage",
  },
  {
    slug: "entrümpelung",
    serviceName: "Entrümpelung",
    title: "Bestehende individuelle Entrümpelungs-Landingpage",
  },
] as const;

export default function LandingpagesPage() {
  const { companyData } = useCompanyData();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [selectedService, setSelectedService] =
    useState<LandingPageServiceKey>("umzugsservice");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPages = useCallback(async () => {
    if (!companyData?.id) return;
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bitte erneut anmelden.");
      const response = await fetch(
        `/api/page-builder/landingpages?ownerId=${encodeURIComponent(companyData.id)}`,
        {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result
            ? String(result.error)
            : "Landingpages konnten nicht geladen werden.";
        throw new Error(message);
      }
      setPages(responseSchema.parse(result).pages);
    } catch (caughtError) {
      console.error("Landingpages laden fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Landingpages konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }, [companyData?.id]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const generatedServices = useMemo(
    () => new Set(pages.map((page) => page.serviceKey)),
    [pages],
  );
  const availableServices = LANDING_PAGE_SERVICE_KEYS.filter(
    (serviceKey) => !generatedServices.has(serviceKey),
  );
  const visibleLegacyPages: Array<(typeof legacyPages)[number]> = [
    ...legacyPages,
  ];

  useEffect(() => {
    if (
      availableServices.length > 0 &&
      !availableServices.includes(selectedService)
    ) {
      setSelectedService(availableServices[0]);
    }
  }, [availableServices, selectedService]);

  async function generateLandingPage() {
    if (!companyData?.id) return;
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bitte erneut anmelden.");
      const response = await fetch("/api/page-builder/landingpages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: companyData.id,
          serviceKey: selectedService,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result
            ? String(result.error)
            : "Landingpage konnte nicht generiert werden.";
        throw new Error(message);
      }
      const page = landingPageSchema.parse(result);
      setPages((current) =>
        [...current, page].sort((first, second) =>
          first.serviceName.localeCompare(second.serviceName, "de"),
        ),
      );
      setSuccess(`Landingpage „${page.serviceName}“ wurde veröffentlicht.`);
    } catch (caughtError) {
      console.error("Landingpage generieren fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Landingpage konnte nicht generiert werden.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Page-builder Elemente
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Landingpages</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Hier sehen Sie alle aus Dienstleistungsvorlagen erzeugten Landingpages.
          Jede Vorlage enthält ein passendes Anfrageformular und wird direkt
          veröffentlicht.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => void loadPages()}>
            Neu laden
          </button>
        </div>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <FilePlus2 size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Landingpage generieren
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Wählen Sie eine noch nicht veröffentlichte Dienstleistung aus.
            </p>
          </div>
        </div>

        {availableServices.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1 text-sm font-medium text-slate-800">
              Dienstleistung und Formular-Template
              <select
                value={selectedService}
                onChange={(event) =>
                  setSelectedService(
                    event.target.value as LandingPageServiceKey,
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm">
                {availableServices.map((serviceKey) => (
                  <option key={serviceKey} value={serviceKey}>
                    {LANDING_PAGE_TEMPLATES[serviceKey].serviceName} ·{" "}
                    {LANDING_PAGE_TEMPLATES[serviceKey].questions.length} Fragen
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              disabled={generating}
              onClick={() => void generateLandingPage()}>
              {generating ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <LayoutTemplate size={16} />
              )}
              Generieren und veröffentlichen
            </Button>
          </div>
        ) : (
          <p className="mt-5 rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
            Für alle Dienstleistungen wurde bereits eine Landingpage generiert.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">
            Veröffentlichte Landingpages
          </h2>
          <span className="text-sm text-slate-500">
            {pages.length + visibleLegacyPages.length} Seiten
          </span>
        </div>

        {loading ? (
          <p role="status" className="flex items-center gap-2 py-8 text-slate-600">
            <LoaderCircle className="animate-spin" size={18} />
            Landingpages werden geladen ...
          </p>
        ) : pages.length === 0 && visibleLegacyPages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <LayoutTemplate className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-medium text-slate-800">
              Noch keine Landingpage generiert
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Wählen Sie oben eine Dienstleistung aus, um zu starten.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleLegacyPages.map((page) => (
              <article
                key={page.slug}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Bestehende Spezialseite
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {page.serviceName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      /landingpage/{page.slug}
                    </p>
                  </div>
                  <Link
                    href={`/landingpage/${page.slug}`}
                    target="_blank"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Öffnen <ExternalLink size={14} />
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {page.title}
                </p>
              </article>
            ))}
            {pages.map((page) => (
              <article
                key={page.slug}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Veröffentlicht
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {page.serviceName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      /landingpage/{page.slug}
                    </p>
                  </div>
                  <Link
                    href={`/landingpage/${page.slug}`}
                    target="_blank"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Öffnen <ExternalLink size={14} />
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {page.title}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Formular: {page.questions.length} dienstleistungsspezifische
                  Fragen plus Kontaktdaten
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
