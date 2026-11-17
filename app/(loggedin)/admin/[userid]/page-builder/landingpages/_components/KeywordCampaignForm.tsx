"use client";

import { Button } from "@/components/ui/button";
import {
  LANDING_PAGE_SERVICE_KEYS,
  LANDING_PAGE_TEMPLATES,
  type LandingPageServiceKey,
} from "@/lib/landingPageSettings";
import { cities } from "@/statics/Lists";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function KeywordCampaignForm({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (keyword: string, serviceKey: LandingPageServiceKey) => Promise<void>;
}) {
  const [keyword, setKeyword] = useState("");
  const [serviceKey, setServiceKey] = useState<LandingPageServiceKey>("umzugsservice");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    if (
      !window.confirm(
        `Für „${trimmed}“ werden ${cities.length} Stadt-Landingpages erzeugt. Das Fenster sollte geöffnet bleiben; offene Schritte arbeitet sonst der Cron weiter ab. Starten?`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(trimmed, serviceKey);
      setKeyword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end">
      <label className="flex-1 space-y-1 text-sm font-medium text-slate-800">
        Keyword
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="z. B. Umzugsfirma"
          minLength={3}
          maxLength={80}
          required
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-800">
        Dienstleistung (Formular & Verlinkung)
        <select
          value={serviceKey}
          onChange={(event) => setServiceKey(event.target.value as LandingPageServiceKey)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm">
          {LANDING_PAGE_SERVICE_KEYS.map((key) => (
            <option key={key} value={key}>
              {LANDING_PAGE_TEMPLATES[key].serviceName}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={disabled || submitting || keyword.trim().length < 3}>
        {submitting ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
        Für {cities.length} Städte generieren
      </Button>
    </form>
  );
}
