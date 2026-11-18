"use client";

import { saveCityLocalizationSettings } from "@/actions/cityLocalizationActions";
import ImagePickerField from "@/components/utils/ImagePickerField";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";
import type { CityLocalizationSettings } from "@/types/city/CityLocalization";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

export default function ImagePoolSettings({
  ownerId,
  initialSettings,
}: {
  ownerId: string;
  initialSettings: CityLocalizationSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const imagePools = Object.fromEntries(
      CITY_SERVICE_KEYS.map((key) => [key, settings.imagePools[key] ?? []]),
    ) as Record<(typeof CITY_SERVICE_KEYS)[number], string[]>;
    const result = await saveCityLocalizationSettings({
      token: await getAdminIdToken(),
      ownerId,
      settings: { imagePools, similarityThreshold: settings.similarityThreshold },
    });
    setMessage(result.success ? "Gespeichert." : result.error);
    setSaving(false);
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-semibold text-slate-950'>Bilder & Schwelle</h2>
      <p className='mt-1 max-w-3xl text-sm text-slate-600'>
        Bilder pro Dienstleistung werden pro Stadt in anderer Reihenfolge auf Hero und
        Bild-Text-Abschnitte verteilt; ab 3 Bildern entsteht zusätzlich eine Galerie.
        Bilder veröffentlichter Projekte (gleiche Stadt oder Dienstleistung) werden
        automatisch ergänzt. Stadtseiten nutzen alle Pools zusammen.
      </p>

      <div className='mt-5 grid gap-6 lg:grid-cols-2'>
        {CITY_SERVICE_KEYS.map((key) => (
          <ImagePickerField
            key={key}
            multiple
            label={getDefaultCityServiceName(key)}
            hint={`${settings.imagePools[key]?.length ?? 0} Bilder – empfohlen: mindestens 6`}
            value={settings.imagePools[key] ?? []}
            onChange={(images) =>
              setSettings((current) => ({ ...current, imagePools: { ...current.imagePools, [key]: images } }))
            }
          />
        ))}
      </div>

      <label className='mt-6 block max-w-md text-sm font-medium text-slate-800'>
        Maximale Übereinstimmung: {Math.round(settings.similarityThreshold * 100)} %
        <input
          type='range'
          min={20}
          max={80}
          step={5}
          value={Math.round(settings.similarityThreshold * 100)}
          onChange={(event) => setSettings((current) => ({ ...current, similarityThreshold: Number(event.target.value) / 100 }))}
          className='mt-2 w-full'
        />
        <span className='text-xs font-normal text-slate-500'>
          Seiten darüber werden nicht veröffentlicht, sondern beim nächsten Lauf erneut geschrieben.
        </span>
      </label>

      <div className='mt-5 flex items-center gap-3'>
        <button
          type='button'
          onClick={() => void save()}
          disabled={saving}
          className='inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
          {saving ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          Speichern
        </button>
        {message && <span className='text-sm text-slate-600'>{message}</span>}
      </div>
    </section>
  );
}
