"use client";

import { getCityLocalizationOverview } from "@/actions/cityLocalizationActions";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { CityLocalizationRun, CityLocalizationSettings } from "@/types/city/CityLocalization";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DuplicateReportPanel from "./_components/DuplicateReportPanel";
import ImagePoolSettings from "./_components/ImagePoolSettings";
import LinkCleanupPanel from "./_components/LinkCleanupPanel";
import LocalizationRunPanel from "./_components/LocalizationRunPanel";

type Overview = {
  run: CityLocalizationRun | null;
  settings: CityLocalizationSettings;
  pendingCount: number;
  individualDuplicateCount: number;
};

export default function CityLocalizationPage() {
  const { companyData } = useCompanyData();
  const ownerId = companyData?.id;
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    const result = await getCityLocalizationOverview({ token: await getAdminIdToken(), ownerId });
    if (result.success) setOverview(result.data);
    else setError(result.error);
  }, [ownerId]);

  useEffect(() => {
    void refresh().catch((caught) => setError(String(caught)));
  }, [refresh]);

  return (
    <main className='mx-auto w-full max-w-6xl space-y-6 pb-12'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-wider text-blue-700'>Städte</p>
        <h1 className='mt-2 text-3xl font-bold text-slate-950'>Lokalisierung & Duplicate Content</h1>
        <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-600'>
          Stadt- und Stadt-Service-Seiten, die nur die Vorlage mit ausgetauschtem Stadtnamen
          zeigen, gelten für Google als Duplicate bzw. Thin Content. Hier misst du die
          Übereinstimmung und lässt jede Seite eigenständig neu schreiben.
        </p>
      </header>

      {error && <p role='alert' className='rounded-lg bg-red-50 p-4 text-sm text-red-700'>{error}</p>}

      {!ownerId || !overview ? (
        <p className='flex items-center gap-2 text-slate-600'><LoaderCircle className='animate-spin' size={18} /> Wird geladen …</p>
      ) : (
        <>
          <LinkCleanupPanel ownerId={ownerId} />
          <DuplicateReportPanel ownerId={ownerId} />
          <LocalizationRunPanel
            ownerId={ownerId}
            run={overview.run}
            pendingCount={overview.pendingCount}
            individualDuplicateCount={overview.individualDuplicateCount}
            onChanged={refresh}
          />
          <ImagePoolSettings ownerId={ownerId} initialSettings={overview.settings} />
        </>
      )}
    </main>
  );
}
