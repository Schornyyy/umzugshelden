"use client";

import { createProject, generateProject } from "@/actions/projectActions";
import ImagePickerField from "@/components/utils/ImagePickerField";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { cities } from "@/statics/Lists";
import { CITY_SERVICE_KEYS, type CityServiceKey } from "@/types/city/CityServicePage";
import { FilePlus2, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm";

export default function ProjectCreateForm({
  ownerId,
  onCreated,
}: {
  ownerId: string;
  onCreated: (projectId: string) => void;
}) {
  const [briefing, setBriefing] = useState("");
  const [title, setTitle] = useState("");
  const [serviceKey, setServiceKey] = useState<CityServiceKey>("umzugsservice");
  const [cityName, setCityName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [running, setRunning] = useState<"ai" | "manual" | null>(null);
  const [error, setError] = useState("");

  async function submit(mode: "ai" | "manual") {
    setRunning(mode);
    setError("");
    try {
      const base = { token: await getAdminIdToken(), ownerId, briefing, serviceKey, cityName, thumbnailUrl, images };
      const result = mode === "ai"
        ? await generateProject(base)
        : await createProject({ ...base, title: title || briefing.split("\n")[0].slice(0, 140) });
      if (!result.success) throw new Error(result.error);
      onCreated(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Projekt konnte nicht angelegt werden.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'>
      <div className='flex items-start gap-3'>
        <span className='rounded-lg bg-violet-50 p-2 text-violet-700'>
          <Sparkles size={22} />
        </span>
        <div>
          <h2 className='text-lg font-semibold text-slate-950'>Neues Projekt</h2>
          <p className='mt-1 text-sm text-slate-600'>
            Beschreibe das Projekt in eigenen Worten. Die KI erstellt daraus Titel,
            Kartentext, Eckdaten, alle Abschnitte sowie Meta-Titel und
            Meta-Description. Danach kannst du alles im Pagebuilder anpassen.
          </p>
        </div>
      </div>

      <div className='mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
        <div className='space-y-4'>
          <label className='block space-y-1 text-sm font-medium text-slate-800'>
            Projektbeschreibung
            <textarea
              value={briefing}
              onChange={(event) => setBriefing(event.target.value)}
              rows={9}
              placeholder='z. B. Umzug einer 4-Zimmer-Wohnung von Olpe nach Attendorn im März, 3. OG ohne Aufzug, Klavier, Küchenmontage, 6 Helfer, an einem Tag erledigt …'
              className={inputClass}
            />
          </label>
          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='space-y-1 text-sm font-medium text-slate-800'>
              Dienstleistung
              <select
                value={serviceKey}
                onChange={(event) => setServiceKey(event.target.value as CityServiceKey)}
                className={inputClass}>
                {CITY_SERVICE_KEYS.map((key) => (
                  <option key={key} value={key}>{getDefaultCityServiceName(key)}</option>
                ))}
              </select>
            </label>
            <label className='space-y-1 text-sm font-medium text-slate-800'>
              Ort
              <input
                value={cityName}
                onChange={(event) => setCityName(event.target.value)}
                list='project-cities'
                placeholder='z. B. Olpe'
                className={inputClass}
              />
              <datalist id='project-cities'>
                {cities.map((city) => <option key={city} value={city} />)}
              </datalist>
            </label>
          </div>
          <label className='block space-y-1 text-sm font-medium text-slate-800'>
            Titel <span className='font-normal text-slate-500'>(nur für „Leer anlegen“, sonst von der KI)</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
          </label>
        </div>
        <div className='space-y-5'>
          <ImagePickerField label='Thumbnail' value={thumbnailUrl} onChange={setThumbnailUrl} previewSize='lg' />
          <ImagePickerField
            multiple
            label='Projektbilder (optional)'
            hint='Werden auf Bild-Text-Abschnitte verteilt; ab 2 Bildern entsteht zusätzlich eine Galerie.'
            value={images}
            onChange={setImages}
          />
        </div>
      </div>

      {error && <p role='alert' className='mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <div className='mt-5 flex flex-wrap justify-end gap-3'>
        <button
          type='button'
          onClick={() => void submit("manual")}
          disabled={running !== null || !thumbnailUrl || !(title || briefing).trim()}
          className='inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50'>
          {running === "manual" ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <FilePlus2 className='h-4 w-4' />}
          Leer anlegen
        </button>
        <button
          type='button'
          onClick={() => void submit("ai")}
          disabled={running !== null || !thumbnailUrl || briefing.trim().length < 30}
          className='inline-flex items-center gap-2 rounded-md bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
          {running === "ai" ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
          {running === "ai" ? "KI schreibt das Projekt …" : "Mit KI generieren"}
        </button>
      </div>
    </section>
  );
}
