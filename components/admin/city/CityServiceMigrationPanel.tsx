"use client";

import { migrateCityServicePages } from "@/actions/cityServicePageActions";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";
import { Database, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CityServiceMigrationPanel({
  ownerId,
  userId,
}: {
  ownerId: string;
  userId: string;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof migrateCityServicePages>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigration() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      setResult(await migrateCityServicePages(ownerId));
    } catch (migrationError) {
      setError(
        migrationError instanceof Error
          ? migrationError.message
          : "Migration fehlgeschlagen.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className='mb-6 border-y border-slate-200 bg-white py-5'>
      <div className='flex flex-wrap items-start gap-4'>
        <div className='max-w-2xl'>
          <h2 className='font-semibold text-slate-950'>
            Stadt- und Dienstleistungsseiten
          </h2>
          <p className='mt-1 text-sm leading-6 text-slate-600'>
            Die Migration legt eine Stadtseiten-Vorlage, fünf Service-Vorlagen
            und alle Stadt-/Service-Verknüpfungen an. Bereits vorhandene
            Dokumente werden nicht überschrieben.
          </p>
        </div>
        <button
          type='button'
          disabled={running}
          onClick={runMigration}
          className='ml-auto inline-flex min-h-10 items-center gap-2 rounded bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-50'>
          <Database className='h-4 w-4' />
          {running ? "Migration läuft..." : "Datenbank vorbereiten"}
        </button>
      </div>

      {result && (
        <p className='mt-4 text-sm text-emerald-700'>
          {result.templatesCreated + result.landingTemplatesCreated} Vorlagen,
          {" "}{result.landingPagesCreated} Stadtseiten und {result.pagesCreated}
          {" "}Dienstleistungsseiten angelegt. Bereits vorhanden: {result.templatesSkipped + result.landingTemplatesSkipped + result.pagesSkipped + result.landingPagesSkipped}.
        </p>
      )}
      {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}

      <div className='mt-5 flex flex-wrap gap-2'>
        <Link
          href={`/admin/${encodeURIComponent(userId)}/citys/vorlagen/stadtseite`}
          className='inline-flex min-h-9 items-center gap-2 rounded border border-emerald-600 px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50'>
          <LayoutTemplate className='h-4 w-4' />
          Stadtseiten-Vorlage
        </Link>
        {CITY_SERVICE_KEYS.map((serviceKey) => (
          <Link
            key={serviceKey}
            href={`/admin/${encodeURIComponent(userId)}/citys/vorlagen/${serviceKey}`}
            className='inline-flex min-h-9 items-center gap-2 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-slate-500 hover:bg-slate-50'>
            <LayoutTemplate className='h-4 w-4 text-emerald-700' />
            {getDefaultCityServiceName(serviceKey)}
          </Link>
        ))}
      </div>
    </section>
  );
}