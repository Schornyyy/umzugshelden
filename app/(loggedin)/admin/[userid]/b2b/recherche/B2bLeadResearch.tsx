"use client";

import { auth } from "@/config/firebase";
import { B2B_CATEGORIES } from "@/lib/b2bCategories";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { B2bLeadCategory } from "@/types/B2b";
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import B2bCategoryPicker from "./_components/B2bCategoryPicker";
import N8nLeadResearchPanel from "./_components/N8nLeadResearchPanel";

const categories = B2B_CATEGORIES;

type CategoryResult = {
  success: boolean;
  found: number;
  withEmail: number;
  imported: number;
  updated: number;
  missingEmail: string[];
  aiFailed: number;
  error?: string;
};

export default function B2bLeadResearch() {
  const { companyData } = useCompanyData();
  const [center, setCenter] = useState("Drolshagen");
  const [selectedCategories, setSelectedCategories] = useState<B2bLeadCategory[]>(
    categories.map((category) => category.value),
  );
  const [runningCategory, setRunningCategory] = useState<B2bLeadCategory | null>(null);
  const [results, setResults] = useState<
    Partial<Record<B2bLeadCategory, CategoryResult>>
  >({});
  const [error, setError] = useState("");

  async function runResearch() {
    if (!companyData?.id || !center.trim() || !selectedCategories.length) return;
    setError("");
    setResults({});
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) {
      setError("Bitte erneut anmelden.");
      return;
    }

    for (const category of selectedCategories) {
      setRunningCategory(category);
      try {
        const response = await fetch("/api/admin/b2b/discover", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ownerId: companyData.id,
            center: center.trim(),
            radiusKm: 50,
            category,
          }),
        });
        const payload = (await response.json()) as CategoryResult;
        if (!response.ok) {
          throw new Error(payload.error || "Recherche fehlgeschlagen.");
        }
        setResults((current) => ({ ...current, [category]: payload }));
      } catch (researchError) {
        console.error("B2B research failed", researchError);
        const message =
          researchError instanceof Error
            ? researchError.message
            : "Recherche fehlgeschlagen.";
        setResults((current) => ({
          ...current,
          [category]: {
            success: false,
            found: 0,
            withEmail: 0,
            imported: 0,
            updated: 0,
            missingEmail: [],
            aiFailed: 0,
            error: message,
          },
        }));
      }
    }
    setRunningCategory(null);
  }

  const running = runningCategory !== null;

  return (
    <main className='space-y-6 pb-12'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
          B2B Lead-Recherche
        </p>
        <h1 className='mt-2 text-3xl font-bold text-slate-950'>
          Öffentliche Geschäftskontakte finden
        </h1>
        <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
          Öffentliche Kontaktdaten aus Google Maps und Impressumsseiten finden und
          direkt ins B2B CRM übernehmen.
        </p>
      </header>

      {error && (
        <p role='alert' className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      )}

      <N8nLeadResearchPanel />

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-1 text-lg font-bold text-slate-950'>
          Alternative: Direktsuche ohne n8n
        </h2>
        <p className='mb-5 text-sm text-slate-600'>
          Durchsucht Google Maps mit Puppeteer rund um einen einzelnen Mittelpunkt und
          lässt Gemini die passende E-Mail auswählen.
        </p>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]'>
          <label className='text-sm font-semibold text-slate-700'>
            Mittelpunkt
            <div className='relative mt-2'>
              <MapPin className='absolute left-3 top-2.5 h-5 w-5 text-slate-400' />
              <input
                value={center}
                onChange={(event) => setCenter(event.target.value)}
                disabled={running}
                className='w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3'
                placeholder='Ort oder Adresse'
              />
            </div>
          </label>
          <div>
            <p className='text-sm font-semibold text-slate-700'>Radius</p>
            <div className='mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-900'>
              50 km
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <B2bCategoryPicker
            selected={selectedCategories}
            disabled={running}
            onChange={setSelectedCategories}
          />
        </div>

        <div className='mt-6 flex flex-wrap items-center justify-between gap-4'>
          <p className='max-w-2xl text-xs leading-5 text-slate-500'>
            Es werden ausschließlich öffentlich auffindbare Firmenkontaktdaten
            gespeichert. Google kann die Anzahl sichtbarer Treffer begrenzen; ein
            vollständiges Branchenregister kann deshalb nicht garantiert werden.
          </p>
          <button
            type='button'
            onClick={runResearch}
            disabled={running || !center.trim() || !selectedCategories.length}
            className='flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>
            {running ? (
              <LoaderCircle className='h-5 w-5 animate-spin' />
            ) : (
              <Search className='h-5 w-5' />
            )}
            {running
              ? `${categories.find((entry) => entry.value === runningCategory)?.label} wird gesucht ...`
              : "Recherche starten"}
          </button>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-2'>
        {categories.map((category) => {
          const result = results[category.value];
          const isRunning = runningCategory === category.value;
          return (
            <article
              key={category.value}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='flex items-center gap-2 font-bold text-slate-950'>
                  <Building2 className='h-5 w-5 text-blue-700' />
                  {category.label}
                </h2>
                {isRunning && <LoaderCircle className='h-5 w-5 animate-spin text-blue-700' />}
                {result?.success && <CheckCircle2 className='h-5 w-5 text-emerald-600' />}
              </div>
              {result ? (
                result.success ? (
                  <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                    <div className='rounded-lg bg-slate-50 p-3'>
                      <p className='text-xs text-slate-500'>Gefunden</p>
                      <p className='mt-1 text-xl font-bold text-slate-950'>{result.found}</p>
                    </div>
                    <div className='rounded-lg bg-emerald-50 p-3'>
                      <p className='text-xs text-emerald-700'>Mit E-Mail</p>
                      <p className='mt-1 text-xl font-bold text-emerald-800'>{result.withEmail}</p>
                    </div>
                    <div className='rounded-lg bg-blue-50 p-3'>
                      <p className='text-xs text-blue-700'>Neu importiert</p>
                      <p className='mt-1 text-xl font-bold text-blue-800'>{result.imported}</p>
                    </div>
                    <div className='rounded-lg bg-violet-50 p-3'>
                      <p className='text-xs text-violet-700'>Aktualisiert</p>
                      <p className='mt-1 text-xl font-bold text-violet-800'>{result.updated}</p>
                    </div>
                    {(result.missingEmail.length > 0 || result.aiFailed > 0) && (
                      <div className='col-span-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800'>
                        {result.missingEmail.length} Firmen ohne öffentlich auffindbare
                        E-Mail. {result.aiFailed > 0 && (
                          <span>
                            <Sparkles className='mr-1 inline h-3.5 w-3.5' />
                            KI-Auswahl bei {result.aiFailed} Treffern fehlgeschlagen; die
                            gefundene Adresse wurde zur manuellen Prüfung markiert.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700'>
                    {result.error}
                  </p>
                )
              ) : (
                <p className='mt-4 text-sm text-slate-500'>Noch nicht durchsucht.</p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

