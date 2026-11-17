"use client";

import { MapPinned } from "lucide-react";
import { useState } from "react";
import KeywordCampaignCard from "./KeywordCampaignCard";
import KeywordCampaignForm from "./KeywordCampaignForm";
import { useKeywordCampaigns } from "./useKeywordCampaigns";

export default function KeywordLandingPageSection({ ownerId }: { ownerId?: string }) {
  const {
    campaigns,
    loading,
    error,
    runningId,
    progress,
    create,
    resume,
    stop,
    setPublished,
    remove,
  } = useKeywordCampaigns(ownerId);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function withBusy(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <MapPinned size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            SEO-Landingpages für jede Stadt
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Keyword eingeben: Die Top-5-Seiten werden gescrapt und in der
            Vektor-Datenbank gespeichert, n8n liefert die Auswertung, daraus
            entsteht die Seitenstruktur. Anschließend wird jede Stadtseite
            lokalisiert und intern verlinkt.
          </p>
        </div>
      </div>

      <KeywordCampaignForm disabled={runningId !== null} onCreate={create} />

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading && !campaigns.length ? (
          <p className="text-sm text-slate-500">Kampagnen werden geladen …</p>
        ) : (
          campaigns.map((campaign) => (
            <KeywordCampaignCard
              key={campaign.id}
              campaign={campaign}
              running={runningId === campaign.id}
              busy={busyId === campaign.id || (runningId !== null && runningId !== campaign.id)}
              progress={progress}
              onRun={() => void resume(campaign)}
              onStop={stop}
              onPublish={(published) => void withBusy(campaign.id, () => setPublished(campaign.id, published))}
              onDelete={() => void withBusy(campaign.id, () => remove(campaign.id))}
            />
          ))
        )}
      </div>
    </section>
  );
}
