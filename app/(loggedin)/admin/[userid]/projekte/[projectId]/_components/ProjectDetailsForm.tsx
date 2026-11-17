"use client";

import ProjectCard from "@/components/projects/ProjectCard";
import ImagePickerField from "@/components/utils/ImagePickerField";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { projectPath } from "@/lib/projects";
import { CITY_SERVICE_KEYS, type CityServiceKey } from "@/types/city/CityServicePage";
import type { Project } from "@/types/project/Project";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className='block space-y-1 text-sm font-medium text-slate-800'>
      <span className='flex justify-between gap-2'>
        {label}
        {hint && <span className='font-normal text-slate-500'>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const counter = (value: string, max: number) => `${value.length}/${max}`;

export default function ProjectDetailsForm({
  project,
  onChange,
}: {
  project: Project;
  onChange: (patch: Partial<Project>) => void;
}) {
  const updateFact = (index: number, patch: Partial<Project["facts"][number]>) =>
    onChange({ facts: project.facts.map((fact, i) => (i === index ? { ...fact, ...patch } : fact)) });

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
      <div className='space-y-6 rounded-xl border border-slate-200 bg-white p-6'>
        <section className='space-y-4'>
          <h3 className='font-semibold text-slate-950'>Seite</h3>
          <Field label='Titel (H1)'>
            <input value={project.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
          </Field>
          <Field label='URL' hint={projectPath(project.slug)}>
            <input value={project.slug} onChange={(e) => onChange({ slug: e.target.value })} className={inputClass} />
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Dienstleistung'>
              <select
                value={project.serviceKey}
                onChange={(e) => onChange({ serviceKey: e.target.value as CityServiceKey })}
                className={inputClass}>
                {CITY_SERVICE_KEYS.map((key) => (
                  <option key={key} value={key}>{getDefaultCityServiceName(key)}</option>
                ))}
              </select>
            </Field>
            <Field label='Ort'>
              <input value={project.cityName} onChange={(e) => onChange({ cityName: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className='space-y-4 border-t border-slate-100 pt-6'>
          <h3 className='font-semibold text-slate-950'>Vorschau (Projektkarte)</h3>
          <Field label='Vorschau-Titel' hint={counter(project.previewTitle, 80)}>
            <input value={project.previewTitle} onChange={(e) => onChange({ previewTitle: e.target.value })} className={inputClass} />
          </Field>
          <Field label='Vorschau-Text' hint={counter(project.previewText, 300)}>
            <textarea rows={3} value={project.previewText} onChange={(e) => onChange({ previewText: e.target.value })} className={inputClass} />
          </Field>
          <ImagePickerField
            label='Thumbnail'
            value={project.thumbnailUrl}
            onChange={(thumbnailUrl) => onChange({ thumbnailUrl })}
            previewSize='lg'
          />
          <Field label='Alt-Text des Thumbnails'>
            <input value={project.thumbnailAlt} onChange={(e) => onChange({ thumbnailAlt: e.target.value })} className={inputClass} />
          </Field>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-slate-800'>Eckdaten</p>
            {project.facts.map((fact, index) => (
              <div key={index} className='flex gap-2'>
                <input
                  value={fact.label}
                  placeholder='z. B. Umfang'
                  onChange={(e) => updateFact(index, { label: e.target.value })}
                  className={`${inputClass} max-w-[40%]`}
                />
                <input
                  value={fact.value}
                  placeholder='z. B. 4 Zimmer'
                  onChange={(e) => updateFact(index, { value: e.target.value })}
                  className={inputClass}
                />
                <button
                  type='button'
                  aria-label='Eckdatum entfernen'
                  onClick={() => onChange({ facts: project.facts.filter((_, i) => i !== index) })}
                  className='rounded-md border border-red-200 px-2 text-red-600'>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {project.facts.length < 6 && (
              <button
                type='button'
                onClick={() => onChange({ facts: [...project.facts, { label: "", value: "" }] })}
                className='inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700'>
                <Plus size={14} /> Eckdatum hinzufügen
              </button>
            )}
          </div>
          <ImagePickerField
            multiple
            label='Projektbilder'
            hint='Bilder in den Abschnitten änderst du direkt im Pagebuilder.'
            value={project.images}
            onChange={(images) => onChange({ images })}
          />
        </section>

        <section className='space-y-4 border-t border-slate-100 pt-6'>
          <h3 className='font-semibold text-slate-950'>Suchmaschine</h3>
          <Field label='Meta-Titel' hint={counter(project.metaTitle, 60)}>
            <input value={project.metaTitle} onChange={(e) => onChange({ metaTitle: e.target.value })} className={inputClass} />
          </Field>
          <Field label='Meta-Description' hint={counter(project.metaDescription, 160)}>
            <textarea rows={3} value={project.metaDescription} onChange={(e) => onChange({ metaDescription: e.target.value })} className={inputClass} />
          </Field>
        </section>
      </div>

      <aside className='space-y-6'>
        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>Kartenvorschau</p>
          <div className='pointer-events-none'>
            <ProjectCard project={project} />
          </div>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-4'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>Google-Vorschau</p>
          <p className='truncate text-xs text-emerald-700'>umzugshelden.io{projectPath(project.slug)}</p>
          <p className='mt-1 line-clamp-1 text-lg text-blue-800'>{project.metaTitle || project.title}</p>
          <p className='mt-1 line-clamp-2 text-sm text-slate-600'>{project.metaDescription || project.previewText}</p>
        </div>
      </aside>
    </div>
  );
}
