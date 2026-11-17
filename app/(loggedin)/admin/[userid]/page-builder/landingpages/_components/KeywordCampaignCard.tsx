"use client";

import { Progress } from "@/components/ui/progress";
import {
  isSeoLandingCampaignActive,
  SEO_LANDING_STAGE_LABELS,
  seoLandingPagePath,
} from "@/lib/seoLandingPages";
import { cities } from "@/statics/Lists";
import type { SeoLandingCampaign } from "@/types/landingpage/SeoLandingPage";
import { slugify } from "@/utils/slugify";
import {
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const buttonClass =
  "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:opacity-50";

export default function KeywordCampaignCard({
  campaign,
  running,
  busy,
  progress,
  onRun,
  onStop,
  onPublish,
  onDelete,
}: {
  campaign: SeoLandingCampaign;
  running: boolean;
  busy: boolean;
  progress: string;
  onRun: () => void;
  onStop: () => void;
  onPublish: (published: boolean) => void;
  onDelete: () => void;
}) {
  const active = isSeoLandingCampaignActive(campaign.stage);
  const percent = campaign.cityCount
    ? Math.round((campaign.completedCities / campaign.cityCount) * 100)
    : 0;
  const examplePath = seoLandingPagePath(campaign.keywordSlug, slugify(cities[0] ?? ""));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              campaign.stage === "failed"
                ? "text-red-700"
                : campaign.published
                  ? "text-emerald-700"
                  : "text-blue-700"
            }`}>
            {SEO_LANDING_STAGE_LABELS[campaign.stage]}
            {campaign.stage === "completed" && (campaign.published ? " · Veröffentlicht" : " · Entwurf")}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{campaign.keyword}</h3>
          <p className="mt-1 text-sm text-slate-500">
            /landingpage/{campaign.keywordSlug}/[stadt]
            {campaign.sourceCount ? ` · ${campaign.sourceCount} Top-Seiten analysiert` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <button type="button" onClick={onStop} className={`${buttonClass} border-slate-300 text-slate-700`}>
              <Square size={14} /> Anhalten
            </button>
          ) : (
            (active || campaign.stage === "failed") && (
              <button
                type="button"
                disabled={busy}
                onClick={onRun}
                className={`${buttonClass} border-blue-300 text-blue-700 hover:bg-blue-50`}>
                <Play size={14} /> {campaign.stage === "failed" ? "Erneut versuchen" : "Fortsetzen"}
              </button>
            )
          )}
          {campaign.completedCities > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onPublish(!campaign.published)}
              className={`${buttonClass} ${
                campaign.published
                  ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
              }`}>
              {campaign.published ? <EyeOff size={14} /> : <Eye size={14} />}
              {campaign.published ? "Offline nehmen" : "Veröffentlichen"}
            </button>
          )}
          {campaign.published && (
            <Link
              href={examplePath}
              target="_blank"
              className={`${buttonClass} border-slate-300 text-slate-700 hover:bg-slate-50`}>
              Beispiel <ExternalLink size={14} />
            </Link>
          )}
          <button
            type="button"
            disabled={busy || running}
            onClick={() => {
              if (window.confirm(`Kampagne „${campaign.keyword}“ inklusive aller Stadtseiten löschen?`)) onDelete();
            }}
            className={`${buttonClass} border-red-200 text-red-700 hover:bg-red-50`}
            aria-label="Kampagne löschen">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <Progress value={percent} />
        <p className="flex items-center gap-2 text-xs text-slate-500">
          {running && <LoaderCircle className="animate-spin" size={12} />}
          {campaign.completedCities}/{campaign.cityCount} Städte
          {running && progress ? ` · ${progress}` : ""}
        </p>
      </div>

      {campaign.lastError && !running && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700">{campaign.lastError}</p>
      )}
      {campaign.warnings.length > 0 && (
        <details className="mt-3 text-xs text-amber-800">
          <summary className="cursor-pointer">{campaign.warnings.length} Hinweise</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {campaign.warnings.slice(0, 20).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
