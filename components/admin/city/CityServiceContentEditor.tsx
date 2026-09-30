"use client";

import {
  getCityServiceEditorData,
  getCityServiceTemplateEditorData,
  saveCityServicePage,
  saveCityServiceTemplate,
} from "@/actions/cityServicePageActions";
import CityServiceBlockEditor from "@/components/admin/city/CityServiceBlockEditor";
import MediathekDialog from "@/components/utils/MediathekDialog";
import type {
  CityServiceBlock,
  CityServiceKey,
  CityServicePage,
  CityServiceSeoSettings,
  CityServiceTemplate,
} from "@/types/city/CityServicePage";
import { Eye, LayoutTemplate, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  mode: "template" | "page";
  ownerId: string;
  userId?: string;
  serviceKey: CityServiceKey;
  cityName?: string;
  citySlug?: string;
};

type Tab = "content" | "seo";

function cloneBlocks(blocks: CityServiceBlock[]) {
  return structuredClone(blocks);
}

export default function CityServiceContentEditor({
  mode,
  ownerId,
  userId,
  serviceKey,
  cityName,
  citySlug,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [template, setTemplate] = useState<CityServiceTemplate | null>(null);
  const [page, setPage] = useState<CityServicePage | null>(null);
  const [blocks, setBlocks] = useState<CityServiceBlock[]>([]);
  const [seo, setSeo] = useState<CityServiceSeoSettings | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
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
          const loadedTemplate = await getCityServiceTemplateEditorData(
            ownerId,
            serviceKey,
          );
          if (cancelled) return;
          setTemplate(loadedTemplate);
          setBlocks(cloneBlocks(loadedTemplate.blocks));
          setSeo({ ...loadedTemplate.seo, keywords: [...loadedTemplate.seo.keywords] });
          setServiceName(loadedTemplate.serviceName);
          setPrimaryKeyword(loadedTemplate.primaryKeyword);
        } else {
          if (!cityName || !citySlug) throw new Error("Stadt fehlt.");
          const loaded = await getCityServiceEditorData({
            ownerId,
            cityName,
            citySlug,
            serviceKey,
          });
          if (cancelled) return;
          setTemplate(loaded.template);
          setPage(loaded.page);
          setBlocks(cloneBlocks(loaded.resolved.blocks));
          setSeo({ ...loaded.resolved.seo, keywords: [...loaded.resolved.seo.keywords] });
          setServiceName(loaded.template.serviceName);
          setPrimaryKeyword(loaded.template.primaryKeyword);
          setInheritTemplate(loaded.page.inheritTemplate);
          setInheritSeo(!loaded.page.seo);
          setPublished(loaded.page.published);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Inhalte konnten nicht geladen werden.",
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
  }, [cityName, citySlug, mode, ownerId, serviceKey]);

  async function handleSave() {
    if (!seo || !template) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (mode === "template") {
        const next = await saveCityServiceTemplate(ownerId, serviceKey, {
          serviceName,
          primaryKeyword,
          blocks,
          seo,
        });
        setTemplate(next);
      } else {
        if (!cityName || !citySlug) throw new Error("Stadt fehlt.");
        const next = await saveCityServicePage(
          ownerId,
          cityName,
          citySlug,
          serviceKey,
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

  function changeTemplateInheritance(nextValue: boolean) {
    setInheritTemplate(nextValue);
    if (!nextValue && template) setBlocks(cloneBlocks(template.blocks));
  }

  function changeSeoInheritance(nextValue: boolean) {
    setInheritSeo(nextValue);
    if (nextValue && template) {
      setSeo({ ...template.seo, keywords: [...template.seo.keywords] });
    }
  }

  if (loading) return <div className='p-8 text-sm text-slate-500'>Lädt...</div>;
  if (!template || !seo) {
    return <div className='p-8 text-sm text-red-600'>{error || "Keine Daten"}</div>;
  }

  const previewCity = citySlug || "olpe";
  const previewUrl = `/stadt/${encodeURIComponent(previewCity)}/${serviceKey}`;
  const templateUrl = `/admin/${encodeURIComponent(userId || ownerId)}/citys/vorlagen/${serviceKey}`;

  return (
    <div className='space-y-5'>
      <header className='flex flex-wrap items-start gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase text-emerald-700'>
            {mode === "template" ? "Service-Vorlage" : cityName}
          </p>
          <h1 className='mt-1 text-2xl font-bold text-slate-950'>
            {serviceName}
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            {mode === "template"
              ? `Wiederverwendbare Basis für alle Städte · Version ${template.version}`
              : `Stadtseite ${cityName} · ${page?.inheritTemplate ? "Vorlage aktiv" : "Eigene Inhalte"}`}
          </p>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <Link
            href={previewUrl}
            target='_blank'
            title='Öffentliche Seite öffnen'
            aria-label='Öffentliche Seite öffnen'
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
          Gespeichert und öffentliche Route aktualisiert.
        </div>
      )}

      {mode === "page" && (
        <section className='grid gap-4 border-y border-slate-200 bg-white py-5 md:grid-cols-2'>
          <div className='flex items-start gap-3'>
            <input
              id='inherit-template'
              type='checkbox'
              checked={inheritTemplate}
              onChange={(event) => changeTemplateInheritance(event.target.checked)}
              className='mt-1 h-4 w-4 accent-emerald-600'
            />
            <label htmlFor='inherit-template'>
              <span className='block text-sm font-semibold text-slate-800'>
                Inhaltsblöcke aus Vorlage übernehmen
              </span>
              <span className='mt-1 block text-xs leading-5 text-slate-500'>
                Änderungen an der Vorlage gelten automatisch für diese Stadt.
              </span>
            </label>
          </div>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-start gap-3'>
              <input
                id='inherit-seo'
                type='checkbox'
                checked={inheritSeo}
                onChange={(event) => changeSeoInheritance(event.target.checked)}
                className='mt-1 h-4 w-4 accent-emerald-600'
              />
              <label htmlFor='inherit-seo'>
                <span className='block text-sm font-semibold text-slate-800'>
                  SEO aus Vorlage übernehmen
                </span>
                <span className='mt-1 block text-xs leading-5 text-slate-500'>
                  Für individuelle Meta-Texte deaktivieren.
                </span>
              </label>
            </div>
            <Link
              href={templateUrl}
              title='Vorlage bearbeiten'
              aria-label='Vorlage bearbeiten'
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50'>
              <LayoutTemplate className='h-4 w-4' />
            </Link>
          </div>
        </section>
      )}

      <nav className='flex items-center gap-1 border-b border-slate-200'>
        <button
          type='button'
          onClick={() => setActiveTab("content")}
          className={`border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "content"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500"
          }`}>
          Inhalte
        </button>
        <button
          type='button'
          onClick={() => setActiveTab("seo")}
          className={`border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "seo"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500"
          }`}>
          SEO & Veröffentlichung
        </button>
      </nav>

      {activeTab === "content" && (
        <div className='space-y-3'>
          {mode === "page" && inheritTemplate && (
            <div className='flex flex-wrap items-center gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold text-amber-950'>
                  Diese Seite verwendet noch die globale Vorlage.
                </p>
                <p className='mt-0.5 text-xs text-amber-800'>
                  Aktiviere eigene Inhalte, um jeden Abschnitt frei zu gestalten.
                </p>
              </div>
              <button
                type='button'
                onClick={() => changeTemplateInheritance(false)}
                className='h-9 rounded bg-amber-900 px-3 text-xs font-semibold text-white hover:bg-amber-800'>
                Individuell bearbeiten
              </button>
            </div>
          )}
          <CityServiceBlockEditor
            blocks={blocks}
            onChange={(nextBlocks) => {
              setBlocks(nextBlocks);
              setSaved(false);
            }}
            readOnly={mode === "page" && inheritTemplate}
            cityName={cityName}
            citySlug={citySlug}
            serviceKey={serviceKey}
            serviceName={serviceName}
            primaryKeyword={primaryKeyword}
          />
        </div>
      )}

      {activeTab === "seo" && (
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <section className='space-y-5 bg-white'>
            {mode === "template" && (
              <div className='grid gap-4 sm:grid-cols-2'>
                <label>
                  <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                    Service-Name
                  </span>
                  <input
                    className='w-full rounded border border-slate-300 px-3 py-2 text-sm'
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                  />
                </label>
                <label>
                  <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                    Primäres Keyword
                  </span>
                  <input
                    className='w-full rounded border border-slate-300 px-3 py-2 text-sm'
                    value={primaryKeyword}
                    onChange={(event) => setPrimaryKeyword(event.target.value)}
                  />
                </label>
              </div>
            )}
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                Meta-Titel
              </span>
              <input
                className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100'
                value={seo.title}
                disabled={mode === "page" && inheritSeo}
                onChange={(event) => setSeo({ ...seo, title: event.target.value })}
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                Meta-Description
              </span>
              <textarea
                rows={4}
                className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100'
                value={seo.description}
                disabled={mode === "page" && inheritSeo}
                onChange={(event) => setSeo({ ...seo, description: event.target.value })}
              />
            </label>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                  Social-Bild
                </span>
                {!(mode === "page" && inheritSeo) && (
                  <MediathekDialog
                    btnName='Aus Mediathek wählen'
                    onSelect={(selection) => {
                      const image = Array.isArray(selection) ? selection[0] : selection;
                      if (image) setSeo({ ...seo, image });
                    }}
                  />
                )}
                <p className='mt-2 truncate text-xs text-slate-500' title={seo.image}>
                  {seo.image}
                </p>
              </div>
              <label>
                <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                  Bild-Alternativtext
                </span>
                <input
                  className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100'
                  value={seo.imageAlt}
                  disabled={mode === "page" && inheritSeo}
                  onChange={(event) => setSeo({ ...seo, imageAlt: event.target.value })}
                />
              </label>
            </div>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                Schema-Beschreibung
              </span>
              <textarea
                rows={3}
                className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100'
                value={seo.schemaDescription}
                disabled={mode === "page" && inheritSeo}
                onChange={(event) => setSeo({ ...seo, schemaDescription: event.target.value })}
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-semibold text-slate-600'>
                Keywords, kommagetrennt
              </span>
              <textarea
                rows={3}
                className='w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100'
                value={seo.keywords.join(", ")}
                disabled={mode === "page" && inheritSeo}
                onChange={(event) =>
                  setSeo({
                    ...seo,
                    keywords: event.target.value
                      .split(",")
                      .map((keyword) => keyword.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          </section>

          <aside className='space-y-5 border-l border-slate-200 pl-6'>
            {mode === "page" && (
              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                  className='h-4 w-4 accent-emerald-600'
                />
                <span className='text-sm font-semibold text-slate-800'>
                  Seite veröffentlicht
                </span>
              </label>
            )}
            <div>
              <p className='text-xs font-semibold uppercase text-slate-400'>
                Platzhalter
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {["{city}", "{service}", "{primaryKeyword}", "{region}", "{localIntro}", "{nearbyCities}"].map((token) => (
                  <code key={token} className='rounded bg-slate-100 px-2 py-1 text-xs text-slate-700'>
                    {token}
                  </code>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}