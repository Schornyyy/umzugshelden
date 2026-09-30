"use client";

import {
  getCityLandingEditorData,
  getCityLandingTemplateEditorData,
  saveCityLandingPage,
  saveCityLandingTemplate,
} from "@/actions/cityServicePageActions";
import CityServiceBlockEditor from "@/components/admin/city/CityServiceBlockEditor";
import MediathekDialog from "@/components/utils/MediathekDialog";
import type {
  CityLandingPage,
  CityLandingTemplate,
  CityServiceBlock,
  CityServiceSeoSettings,
} from "@/types/city/CityServicePage";
import { Eye, LayoutTemplate, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  mode: "template" | "page";
  ownerId: string;
  cityName?: string;
  citySlug?: string;
};

function cloneBlocks(blocks: CityServiceBlock[]) {
  return structuredClone(blocks);
}

export default function CityLandingContentEditor({
  mode,
  ownerId,
  cityName,
  citySlug,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [template, setTemplate] = useState<CityLandingTemplate | null>(null);
  const [page, setPage] = useState<CityLandingPage | null>(null);
  const [blocks, setBlocks] = useState<CityServiceBlock[]>([]);
  const [seo, setSeo] = useState<CityServiceSeoSettings | null>(null);
  const [inheritTemplate, setInheritTemplate] = useState(true);
  const [inheritSeo, setInheritSeo] = useState(true);
  const [published, setPublished] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (mode === "template") {
          const loaded = await getCityLandingTemplateEditorData(ownerId);
          if (cancelled) return;
          setTemplate(loaded);
          setBlocks(cloneBlocks(loaded.blocks));
          setSeo({ ...loaded.seo, keywords: [...loaded.seo.keywords] });
        } else {
          if (!cityName || !citySlug) throw new Error("Stadt fehlt.");
          const loaded = await getCityLandingEditorData({
            ownerId,
            cityName,
            citySlug,
          });
          if (cancelled) return;
          setTemplate(loaded.template);
          setPage(loaded.page);
          setBlocks(cloneBlocks(loaded.resolved.blocks));
          setSeo({
            ...loaded.resolved.seo,
            keywords: [...loaded.resolved.seo.keywords],
          });
          setInheritTemplate(loaded.page.inheritTemplate);
          setInheritSeo(!loaded.page.seo);
          setPublished(loaded.page.published);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Stadtseite konnte nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cityName, citySlug, mode, ownerId]);

  async function handleSave() {
    if (!template || !seo) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (mode === "template") {
        const next = await saveCityLandingTemplate(ownerId, { blocks, seo });
        setTemplate(next);
      } else {
        if (!cityName || !citySlug) throw new Error("Stadt fehlt.");
        const next = await saveCityLandingPage(
          ownerId,
          cityName,
          citySlug,
          {
            inheritTemplate,
            blocks: inheritTemplate ? undefined : blocks,
            seo: inheritSeo ? undefined : seo,
            published,
          },
        );
        setPage(next);
      }
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Speichern fehlgeschlagen.",
      );
    } finally {
      setSaving(false);
    }
  }

  function setContentInheritance(value: boolean) {
    setInheritTemplate(value);
    if (!value && template) setBlocks(cloneBlocks(template.blocks));
  }

  function setSeoInheritance(value: boolean) {
    setInheritSeo(value);
    if (value && template) {
      setSeo({ ...template.seo, keywords: [...template.seo.keywords] });
    }
  }

  if (loading) return <div className='p-8 text-sm text-slate-500'>Lädt...</div>;
  if (!template || !seo) {
    return <div className='p-8 text-sm text-red-600'>{error || "Keine Daten"}</div>;
  }

  const previewUrl = `/stadt/${encodeURIComponent(citySlug || "olpe")}`;
  const templateUrl = `/admin/${encodeURIComponent(ownerId)}/citys/vorlagen/stadtseite`;
  const seoDisabled = mode === "page" && inheritSeo;

  return (
    <div className='space-y-5'>
      <header className='flex flex-wrap items-start gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase text-emerald-700'>
            {mode === "template" ? "Stadtseiten-Vorlage" : cityName}
          </p>
          <h1 className='mt-1 text-2xl font-bold text-slate-950'>
            Stadtübersicht bearbeiten
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            {mode === "template"
              ? `Wiederverwendbare Basis für alle Städte · Version ${template.version}`
              : page?.inheritTemplate
                ? "Gemeinsame Vorlage aktiv"
                : "Eigene Stadtinhalte aktiv"}
          </p>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <Link
            href={previewUrl}
            target='_blank'
            title='Öffentliche Stadtseite öffnen'
            aria-label='Öffentliche Stadtseite öffnen'
            className='flex h-10 w-10 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'>
            <Eye className='h-4 w-4' />
          </Link>
          <button
            type='button'
            onClick={handleSave}
            disabled={saving}
            className='inline-flex h-10 items-center gap-2 rounded bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-50'>
            <Save className='h-4 w-4' />
            {saving ? "Speichert..." : "Speichern"}
          </button>
        </div>
      </header>

      {error && (
        <div className='border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}
      {saved && (
        <div className='border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>
          Gespeichert und öffentliche Stadtseite aktualisiert.
        </div>
      )}

      {mode === "page" && (
        <section className='grid gap-4 border-y border-slate-200 py-5 md:grid-cols-2'>
          <label className='flex items-start gap-3'>
            <input
              type='checkbox'
              checked={inheritTemplate}
              onChange={(event) => setContentInheritance(event.target.checked)}
              className='mt-1 h-4 w-4 accent-emerald-600'
            />
            <span>
              <span className='block text-sm font-semibold text-slate-800'>
                Blöcke aus Stadtseiten-Vorlage übernehmen
              </span>
              <span className='mt-1 block text-xs leading-5 text-slate-500'>
                Deaktivieren, um {cityName} individuell auszuarbeiten.
              </span>
            </span>
          </label>
          <div className='flex items-start justify-between gap-3'>
            <label className='flex items-start gap-3'>
              <input
                type='checkbox'
                checked={inheritSeo}
                onChange={(event) => setSeoInheritance(event.target.checked)}
                className='mt-1 h-4 w-4 accent-emerald-600'
              />
              <span>
                <span className='block text-sm font-semibold text-slate-800'>
                  SEO aus Vorlage übernehmen
                </span>
                <span className='mt-1 block text-xs leading-5 text-slate-500'>
                  Deaktivieren für individuelle Meta-Texte.
                </span>
              </span>
            </label>
            <Link
              href={templateUrl}
              title='Stadtseiten-Vorlage bearbeiten'
              aria-label='Stadtseiten-Vorlage bearbeiten'
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50'>
              <LayoutTemplate className='h-4 w-4' />
            </Link>
          </div>
        </section>
      )}

      <nav className='flex border-b border-slate-200'>
        {(["content", "seo"] as const).map((tab) => (
          <button
            key={tab}
            type='button'
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === tab
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500"
            }`}>
            {tab === "content" ? "Inhalte" : "SEO & Veröffentlichung"}
          </button>
        ))}
      </nav>

      {activeTab === "content" && (
        <CityServiceBlockEditor
          blocks={blocks}
          onChange={setBlocks}
          readOnly={mode === "page" && inheritTemplate}
        />
      )}

      {activeTab === "seo" && (
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <section className='space-y-5'>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Meta-Titel</span>
              <input className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100' value={seo.title} disabled={seoDisabled} onChange={(event) => setSeo({ ...seo, title: event.target.value })} />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Meta-Description</span>
              <textarea rows={4} className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100' value={seo.description} disabled={seoDisabled} onChange={(event) => setSeo({ ...seo, description: event.target.value })} />
            </label>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Social-Bild</span>
                {!seoDisabled && (
                  <MediathekDialog
                    btnName='Aus Mediathek wählen'
                    onSelect={(selection) => {
                      const image = Array.isArray(selection) ? selection[0] : selection;
                      if (image) setSeo({ ...seo, image });
                    }}
                  />
                )}
                <p className='mt-2 truncate text-xs text-slate-500' title={seo.image}>{seo.image}</p>
              </div>
              <label>
                <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Bild-Alternativtext</span>
                <input className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100' value={seo.imageAlt} disabled={seoDisabled} onChange={(event) => setSeo({ ...seo, imageAlt: event.target.value })} />
              </label>
            </div>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Schema-Beschreibung</span>
              <textarea rows={3} className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100' value={seo.schemaDescription} disabled={seoDisabled} onChange={(event) => setSeo({ ...seo, schemaDescription: event.target.value })} />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>Keywords, kommagetrennt</span>
              <textarea rows={3} className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100' value={seo.keywords.join(", ")} disabled={seoDisabled} onChange={(event) => setSeo({ ...seo, keywords: event.target.value.split(",").map((keyword) => keyword.trim()).filter(Boolean) })} />
            </label>
          </section>
          <aside className='space-y-5 border-l border-slate-200 pl-6'>
            {mode === "page" && (
              <label className='flex items-center gap-3'>
                <input type='checkbox' checked={published} onChange={(event) => setPublished(event.target.checked)} className='h-4 w-4 accent-emerald-600' />
                <span className='text-sm font-semibold text-slate-800'>Seite veröffentlicht</span>
              </label>
            )}
            <div>
              <p className='text-xs font-semibold uppercase text-slate-400'>Platzhalter</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {["{city}", "{region}", "{nearbyCities}"].map((token) => (
                  <code key={token} className='rounded bg-slate-100 px-2 py-1 text-xs text-slate-700'>{token}</code>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}