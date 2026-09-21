"use client";
import React, { useState, useCallback } from "react";
import type {
  BlogPage,
  BlogPageSettings,
  BlogPageFAQEntry,
} from "@/types/blog/BlogPage";
import { createBlogPage, updateBlogPage } from "@/actions/blogPageActions";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MediathekDialog from "@/components/utils/MediathekDialog";
import Image from "next/image";
import Link from "next/link";
import { Eye, Save } from "lucide-react";
import BlogVisualBuilder from "./BlogVisualBuilder";
import {
  legacySectionsToBlocks,
  normalizeBlogPageSettings,
} from "@/lib/blogBuilder";
// RichTextEditor is already a client component
const SimpleRichTextEditor = dynamic(
  () =>
    import("@/components/RichTextEditor").then((m) => m.SimpleRichTextEditor),
  { ssr: false }
);

import type { AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";

interface EditorProps {
  initialData: BlogPage | null;
  subcategorySlug: string;
  mainCategory: AdminBlogMainCategory;
}

type TabKey = "content" | "settings" | "seo" | "faq";

const emptyFaq = (): BlogPageFAQEntry => ({ question: "", answer: "" });

export default function BlogPageEditorClient({
  initialData,
  subcategorySlug,
  mainCategory,
}: EditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("content");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [titel, setTitel] = useState(initialData?.titel || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    initialData?.thumbnailUrl
  );
  const [keywords, setKeywords] = useState<string>(
    (initialData?.keywords || []).join(", ")
  );
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description || ""
  );
  const [visible, setVisible] = useState(initialData?.visible || false);
  const [blocks, setBlocks] = useState(
    initialData?.blocks?.length
      ? initialData.blocks
      : legacySectionsToBlocks(initialData?.sections || [])
  );
  const [settings, setSettings] = useState<BlogPageSettings>(
    normalizeBlogPageSettings(initialData?.settings)
  );
  const [faq, setFaq] = useState<BlogPageFAQEntry[]>(initialData?.faq || []);

  const onAddFaq = () => setFaq((f) => [...f, emptyFaq()]);
  const onRemoveFaq = (idx: number) =>
    setFaq((f) => f.filter((_, i) => i !== idx));
  const onFaqChange = (idx: number, patch: Partial<BlogPageFAQEntry>) => {
    setFaq((f) => f.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (initialData) {
        await updateBlogPage(initialData.id, {
          titel,
          description,
          thumbnailUrl: thumbnailUrl || null,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          meta_description: metaDescription || null,
          blocks,
          settings,
          faq,
          visible,
        });
      } else {
        await createBlogPage({
          titel,
          description,
          subcategorySlug,
          mainCategory: mainCategory,
          thumbnailUrl,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          meta_description: metaDescription || undefined,
          sections: [],
          blocks,
          settings,
          faq,
          visible,
        });
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fehler beim Speichern";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    initialData,
    titel,
    description,
    thumbnailUrl,
    keywords,
    metaDescription,
    blocks,
    settings,
    faq,
    visible,
    subcategorySlug,
    mainCategory,
    router,
  ]);

  return (
    <div className='space-y-5'>
      <div className='sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-white/95 py-3 backdrop-blur'>
        <button
          className={activeTab === "content" ? "border-b-2 border-slate-900 px-3 py-2 text-sm font-semibold" : "px-3 py-2 text-sm text-gray-600"}
          onClick={() => setActiveTab("content")}>
          Inhalt
        </button>
        <button
          className={activeTab === "settings" ? "border-b-2 border-slate-900 px-3 py-2 text-sm font-semibold" : "px-3 py-2 text-sm text-gray-600"}
          onClick={() => setActiveTab("settings")}>
          Design
        </button>
        <button
          className={activeTab === "seo" ? "border-b-2 border-slate-900 px-3 py-2 text-sm font-semibold" : "px-3 py-2 text-sm text-gray-600"}
          onClick={() => setActiveTab("seo")}>
          Beitrag & SEO
        </button>
        <button
          className={activeTab === "faq" ? "border-b-2 border-slate-900 px-3 py-2 text-sm font-semibold" : "px-3 py-2 text-sm text-gray-600"}
          onClick={() => setActiveTab("faq")}>
          FAQ
        </button>
        <div className='ml-auto flex items-center gap-3'>
          {saved && <span className='text-xs text-emerald-700'>Gespeichert</span>}
          {initialData?.visible && (
            <Link
              href={`/blog/${mainCategory}/${subcategorySlug}/${initialData.slug}`}
              target='_blank'
              title='Öffentliche Seite öffnen'
              aria-label='Öffentliche Seite öffnen'
              className='flex h-9 w-9 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50'>
              <Eye className='h-4 w-4' />
            </Link>
          )}
          <label className='flex items-center gap-2 text-sm font-medium'>
            <input
              type='checkbox'
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className='h-4 w-4 accent-emerald-600'
            />
            Veröffentlicht
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className='inline-flex min-h-9 items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'>
            <Save className='h-4 w-4' />
            {saving ? "Speichere..." : "Speichern"}
          </button>
        </div>
      </div>
      {error && <div className='text-red-600 text-sm'>{error}</div>}

      {activeTab === "content" && (
        <BlogVisualBuilder
          blocks={blocks}
          accentColor={settings.accentColor}
          headingColor={settings.headingColor}
          onChange={(nextBlocks) => {
            setBlocks(nextBlocks);
            setSaved(false);
          }}
        />
      )}

      {activeTab === "seo" && (
        <div className='mx-auto max-w-3xl space-y-5 rounded-md border border-slate-200 bg-white p-6'>
          <div>
            <h2 className='text-lg font-semibold'>Beitrag & Suchmaschinen</h2>
            <p className='mt-1 text-sm text-slate-500'>Titel, Teaser, Vorschaubild und Metadaten des Beitrags.</p>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Titel</label>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              className='w-full border rounded px-2 py-1'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Beschreibung (Teaser)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full border rounded px-2 py-1'
              rows={3}
            />
          </div>
          <div className='space-y-2'>
            <label className='block text-sm font-medium'>Thumbnail</label>
            <div className='flex items-center gap-3'>
              <MediathekDialog
                btnName={thumbnailUrl ? "Ändern" : "Aus Mediathek wählen"}
                onSelect={(u) => {
                  if (typeof u === "string") setThumbnailUrl(u);
                  else if (Array.isArray(u) && u.length) setThumbnailUrl(u[0]);
                }}
              />
              {thumbnailUrl && (
                <button
                  type='button'
                  onClick={() => setThumbnailUrl(undefined)}
                  className='text-xs text-red-600'>
                  Entfernen
                </button>
              )}
            </div>
            {thumbnailUrl && (
              <div className='flex items-center gap-3'>
                <div className='relative w-16 h-16 border rounded overflow-hidden'>
                  <Image
                    src={thumbnailUrl}
                    alt='Thumbnail'
                    fill
                    className='object-cover'
                  />
                </div>
                <p className='text-[10px] break-all max-w-xs'>{thumbnailUrl}</p>
              </div>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Keywords (CSV)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className='w-full border rounded px-2 py-1'
              placeholder='keyword1, keyword2'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className='w-full border rounded px-2 py-1'
              rows={3}
            />
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className='mx-auto max-w-4xl space-y-8 rounded-md border border-slate-200 bg-white p-6'>
          <div>
            <h2 className='text-lg font-semibold'>Seitendesign</h2>
            <p className='mt-1 text-sm text-slate-500'>Globale Darstellung für diesen Beitrag.</p>
          </div>
          <div className='grid gap-5 md:grid-cols-2'>
            <label>
              <span className='mb-1 block text-sm font-medium'>Inhaltsbreite</span>
              <select
                className='w-full rounded border px-3 py-2'
                value={settings.contentWidth}
                onChange={(event) => setSettings({ ...settings, contentWidth: event.target.value as BlogPageSettings["contentWidth"] })}>
                <option value='narrow'>Schmal</option>
                <option value='normal'>Normal</option>
                <option value='wide'>Breit</option>
              </select>
            </label>
            <label>
              <span className='mb-1 block text-sm font-medium'>Schriftstil</span>
              <select
                className='w-full rounded border px-3 py-2'
                value={settings.fontFamily}
                onChange={(event) => setSettings({ ...settings, fontFamily: event.target.value as BlogPageSettings["fontFamily"] })}>
                <option value='sans'>Modern</option>
                <option value='serif'>Editorial</option>
              </select>
            </label>
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
            {([
              ["pageBackground", "Seite"],
              ["contentBackground", "Inhalt"],
              ["textColor", "Text"],
              ["headingColor", "Überschriften"],
              ["accentColor", "Akzent"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                <span className='mb-1 block text-xs font-medium'>{label}</span>
                <input
                  type='color'
                  className='h-11 w-full rounded border bg-white p-1'
                  value={settings[key]}
                  onChange={(event) => setSettings({ ...settings, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            {([
              ["showBreadcrumbs", "Breadcrumbs anzeigen"],
              ["showThumbnail", "Titelbild anzeigen"],
              ["showCta", "CTA anzeigen"],
            ] as const).map(([key, label]) => (
              <label key={key} className='flex items-center gap-2 rounded border p-3 text-sm'>
                <input
                  type='checkbox'
                  checked={settings[key]}
                  onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })}
                  className='h-4 w-4 accent-emerald-600'
                />
                {label}
              </label>
            ))}
          </div>
          {settings.showCta && (
            <div className='grid gap-4 border-t pt-6 md:grid-cols-2'>
              <label>
                <span className='mb-1 block text-sm font-medium'>CTA-Titel</span>
                <input className='w-full rounded border px-3 py-2' value={settings.ctaTitle} onChange={(event) => setSettings({ ...settings, ctaTitle: event.target.value })} />
              </label>
              <label>
                <span className='mb-1 block text-sm font-medium'>Button-Text</span>
                <input className='w-full rounded border px-3 py-2' value={settings.ctaLabel} onChange={(event) => setSettings({ ...settings, ctaLabel: event.target.value })} />
              </label>
              <label>
                <span className='mb-1 block text-sm font-medium'>CTA-Text</span>
                <textarea rows={3} className='w-full rounded border px-3 py-2' value={settings.ctaText} onChange={(event) => setSettings({ ...settings, ctaText: event.target.value })} />
              </label>
              <label>
                <span className='mb-1 block text-sm font-medium'>CTA-Link</span>
                <input className='w-full rounded border px-3 py-2' value={settings.ctaUrl} onChange={(event) => setSettings({ ...settings, ctaUrl: event.target.value })} />
              </label>
            </div>
          )}
        </div>
      )}

      {activeTab === "faq" && (
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <h3 className='font-semibold'>FAQ ({faq.length})</h3>
            <button
              onClick={onAddFaq}
              className='text-sm px-3 py-1 bg-green-600 text-white rounded'>
              FAQ hinzufügen
            </button>
          </div>
          <div className='space-y-8'>
            {faq.map((f, idx) => (
              <div key={idx} className='border rounded p-4 space-y-3 relative'>
                <div className='absolute top-2 right-2'>
                  <button
                    onClick={() => onRemoveFaq(idx)}
                    className='text-xs text-red-600'>
                    Entfernen
                  </button>
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Frage
                  </label>
                  <input
                    value={f.question}
                    onChange={(e) =>
                      onFaqChange(idx, { question: e.target.value })
                    }
                    className='w-full border rounded px-2 py-1'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Antwort
                  </label>
                  <SimpleRichTextEditor
                    value={f.answer}
                    onChange={(val) => onFaqChange(idx, { answer: val })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
