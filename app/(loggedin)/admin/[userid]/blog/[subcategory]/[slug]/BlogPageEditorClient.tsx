"use client";
import React, { useState, useCallback } from "react";
import type {
  BlogPage,
  BlogPageSection,
  BlogPageFAQEntry,
} from "@/types/blog/BlogPage";
import { createBlogPage, updateBlogPage } from "@/actions/blogPageActions";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MediathekDialog from "@/components/utils/MediathekDialog";
import Image from "next/image";
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

type TabKey = "meta" | "sections" | "faq";

const emptySection = (): BlogPageSection => ({ titel: "", text: "" });
const emptyFaq = (): BlogPageFAQEntry => ({ question: "", answer: "" });

export default function BlogPageEditorClient({
  initialData,
  subcategorySlug,
  mainCategory,
}: EditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("meta");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [sections, setSections] = useState<BlogPageSection[]>(
    initialData?.sections || []
  );
  const [faq, setFaq] = useState<BlogPageFAQEntry[]>(initialData?.faq || []);

  const onAddSection = () => setSections((s) => [...s, emptySection()]);
  const onRemoveSection = (idx: number) =>
    setSections((s) => s.filter((_, i) => i !== idx));
  const onSectionChange = (idx: number, patch: Partial<BlogPageSection>) => {
    setSections((s) =>
      s.map((sec, i) => (i === idx ? { ...sec, ...patch } : sec))
    );
  };

  const onAddFaq = () => setFaq((f) => [...f, emptyFaq()]);
  const onRemoveFaq = (idx: number) =>
    setFaq((f) => f.filter((_, i) => i !== idx));
  const onFaqChange = (idx: number, patch: Partial<BlogPageFAQEntry>) => {
    setFaq((f) => f.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (initialData) {
        await updateBlogPage(initialData.id, {
          titel,
          description,
          thumbnailUrl,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          meta_description: metaDescription || undefined,
          sections,
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
          sections,
          faq,
          visible,
        });
      }
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
    sections,
    faq,
    visible,
    subcategorySlug,
    mainCategory,
    router,
  ]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4 border-b pb-2'>
        <button
          className={activeTab === "meta" ? "font-semibold" : "text-gray-600"}
          onClick={() => setActiveTab("meta")}>
          Meta
        </button>
        <button
          className={
            activeTab === "sections" ? "font-semibold" : "text-gray-600"
          }
          onClick={() => setActiveTab("sections")}>
          Sections
        </button>
        <button
          className={activeTab === "faq" ? "font-semibold" : "text-gray-600"}
          onClick={() => setActiveTab("faq")}>
          FAQ
        </button>
        <div className='ml-auto flex gap-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />{" "}
            Sichtbar
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-4 py-1 rounded bg-blue-600 text-white disabled:opacity-50'>
            {saving ? "Speichere..." : "Speichern"}
          </button>
        </div>
      </div>
      {error && <div className='text-red-600 text-sm'>{error}</div>}

      {activeTab === "meta" && (
        <div className='space-y-4'>
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

      {activeTab === "sections" && (
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <h3 className='font-semibold'>Sections ({sections.length})</h3>
            <button
              onClick={onAddSection}
              className='text-sm px-3 py-1 bg-green-600 text-white rounded'>
              Section hinzufügen
            </button>
          </div>
          <div className='space-y-8'>
            {sections.map((s, idx) => (
              <div key={idx} className='border rounded p-4 space-y-3 relative'>
                <div className='absolute top-2 right-2'>
                  <button
                    onClick={() => onRemoveSection(idx)}
                    className='text-xs text-red-600'>
                    Entfernen
                  </button>
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Titel
                  </label>
                  <input
                    value={s.titel}
                    onChange={(e) =>
                      onSectionChange(idx, { titel: e.target.value })
                    }
                    className='w-full border rounded px-2 py-1'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='block text-xs font-medium'>Bild</label>
                  <div className='flex items-center gap-2'>
                    <MediathekDialog
                      btnName={s.image ? "Ändern" : "Bild wählen"}
                      onSelect={(u) => {
                        if (typeof u === "string")
                          onSectionChange(idx, { image: u });
                        else if (Array.isArray(u) && u.length)
                          onSectionChange(idx, { image: u[0] });
                      }}
                    />
                    {s.image && (
                      <button
                        type='button'
                        className='text-[10px] text-red-600'
                        onClick={() =>
                          onSectionChange(idx, { image: undefined })
                        }>
                        Entfernen
                      </button>
                    )}
                  </div>
                  {s.image && (
                    <div className='relative w-20 h-20 border rounded overflow-hidden'>
                      <Image
                        src={s.image}
                        alt={s.titel || "Section"}
                        fill
                        className='object-cover'
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Link (optional)
                  </label>
                  <input
                    value={s.link || ""}
                    onChange={(e) =>
                      onSectionChange(idx, {
                        link: e.target.value || undefined,
                      })
                    }
                    className='w-full border rounded px-2 py-1'
                    placeholder='https://...'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Text (Rich)
                  </label>
                  <SimpleRichTextEditor
                    value={s.text}
                    onChange={(val) => onSectionChange(idx, { text: val })}
                  />
                </div>
              </div>
            ))}
          </div>
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
