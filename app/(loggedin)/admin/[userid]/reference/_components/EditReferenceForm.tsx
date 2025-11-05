"use client";
import React, { useState } from "react";
import type { Reference } from "@/types/ReferencType";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MediathekDialog from "@/components/utils/MediathekDialog";
import Image from "next/image";

type Props = {
  initialData: Reference & { id: string };
  // server actions passed from parent server component
  saveAction?: (
    data: Partial<Reference> | Record<string, unknown>
  ) => Promise<void>;
  deleteAction?: () => Promise<void>;
};

export default function EditReferenceForm({
  initialData,
  saveAction,
  deleteAction,
}: Props) {
  const [form, setForm] = useState<Omit<Reference, "id">>({
    comanyName: initialData.comanyName || "",
    website: initialData.website || "",
    companyBranch: initialData.companyBranch || "",
    logoUrl: initialData.logoUrl || "",
    thumbnailUrl: initialData.thumbnailUrl || "",
    description: initialData.description || "",
    public: !!initialData.public,
    sections:
      initialData.sections && initialData.sections.length
        ? initialData.sections
        : [{ title: "", link: "", imagePath: "", text: "" }],
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onSelectLogo(url: string | string[] | undefined) {
    if (!url) return;
    const u = Array.isArray(url) ? url[0] : url;
    setForm((s) => ({ ...s, logoUrl: u }));
  }

  function onSelectThumb(url: string | string[] | undefined) {
    if (!url) return;
    const u = Array.isArray(url) ? url[0] : url;
    setForm((s) => ({ ...s, thumbnailUrl: u }));
  }

  function isSectionComplete(sec: {
    title?: string;
    text?: string;
    imagePath?: string;
  }) {
    return !!(
      sec &&
      sec.title &&
      sec.title.trim() &&
      sec.text &&
      sec.text.trim() &&
      sec.imagePath &&
      sec.imagePath.trim()
    );
  }

  // whenever the last section becomes complete, append a new empty section
  React.useEffect(() => {
    const secs = form.sections || [];
    if (!secs.length) return;
    const last = secs[secs.length - 1];
    if (isSectionComplete(last)) {
      // only append if there's no trailing empty section
      const hasEmpty = secs.some((s) => !isSectionComplete(s));
      if (!hasEmpty) {
        setForm((s) => ({
          ...s,
          sections: [
            ...(s.sections || []),
            { title: "", link: "", imagePath: "", text: "" },
          ],
        }));
      }
    }
  }, [form.sections]);

  function updateSection(
    index: number,
    patch: Partial<NonNullable<Reference["sections"]>[number]>
  ) {
    setForm((s) => {
      const secs = (s.sections || []).slice();
      secs[index] = {
        ...(secs[index] || { title: "", link: "", imagePath: "", text: "" }),
        ...patch,
      };
      return { ...s, sections: secs };
    });
  }

  function removeSection(index: number) {
    setForm((s) => {
      const secs = (s.sections || []).slice();
      secs.splice(index, 1);
      // ensure at least one empty section exists
      if (secs.length === 0)
        secs.push({ title: "", link: "", imagePath: "", text: "" });
      return { ...s, sections: secs };
    });
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setMsg(null);
    if (!form.comanyName) return setErr("Firmenname ist erforderlich");
    setLoading(true);
    try {
      if (saveAction) {
        await saveAction(form);
      } else {
        const res = await fetch(`/api/references/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setMsg("Änderungen gespeichert");
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Referenz wirklich löschen? Dies kann nicht rückgängig gemacht werden."
      )
    )
      return;
    setLoading(true);
    try {
      if (deleteAction) {
        await deleteAction();
      } else {
        const res = await fetch(`/api/references/${initialData.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setMsg("Referenz gelöscht");
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <div className='space-y-3'>
        <div>
          <label className='text-xs'>Logo</label>
          <div className='flex items-center gap-2'>
            <MediathekDialog
              btnName={form.logoUrl ? "Logo ändern" : "Logo wählen"}
              onSelect={onSelectLogo}
            />
            {form.logoUrl && (
              <div className='flex items-center gap-2'>
                <Image
                  src={form.logoUrl}
                  alt='Logo Vorschau'
                  width={150}
                  height={150}
                  className='h-12 w-auto object-contain border rounded'
                />
                <a
                  href={form.logoUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-xs underline'>
                  Vollbild
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className='text-xs'>Thumbnail</label>
          <div className='flex items-center gap-2'>
            <MediathekDialog
              btnName={
                form.thumbnailUrl ? "Thumbnail ändern" : "Thumbnail wählen"
              }
              onSelect={onSelectThumb}
            />
            {form.thumbnailUrl && (
              <div className='flex items-center gap-2'>
                <Image
                  src={form.thumbnailUrl}
                  alt='Thumbnail Vorschau'
                  className='h-16 w-auto object-cover border rounded'
                  width={150}
                  height={150}
                />
                <a
                  href={form.thumbnailUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-xs underline'>
                  Vollbild
                </a>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <input
            id='public'
            type='checkbox'
            checked={form.public}
            onChange={(e) =>
              setForm({ ...form, public: e.currentTarget.checked })
            }
          />
          <label htmlFor='public' className='text-xs'>
            Veröffentlichen
          </label>
        </div>

        <div className='mt-4'>
          <h3 className='text-sm font-semibold mb-2'>Sektionen</h3>
          <div className='space-y-3'>
            {(form.sections || []).map((sec, idx) => (
              <div key={idx} className='border rounded p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='text-xs font-medium'>Sektion {idx + 1}</div>
                  <div>
                    <button
                      type='button'
                      onClick={() => removeSection(idx)}
                      className='text-xs text-red-600'>
                      Löschen
                    </button>
                  </div>
                </div>
                <label className='text-xs'>Titel</label>
                <Input
                  value={sec.title}
                  onChange={(e) =>
                    updateSection(idx, { title: e.currentTarget.value })
                  }
                />
                <label className='text-xs'>Link (optional)</label>
                <Input
                  value={sec.link || ""}
                  onChange={(e) =>
                    updateSection(idx, { link: e.currentTarget.value })
                  }
                />
                <label className='text-xs'>Bild</label>
                <div className='flex items-center gap-2 mb-2'>
                  <MediathekDialog
                    btnName={sec.imagePath ? "Bild ändern" : "Bild wählen"}
                    onSelect={(u) => {
                      const url = Array.isArray(u) ? u[0] : u;
                      updateSection(idx, { imagePath: url || "" });
                    }}
                  />
                  {sec.imagePath && (
                    <div className='flex items-center gap-2'>
                      <Image
                        src={sec.imagePath}
                        alt={`Sektion ${idx + 1} Bild`}
                        width={150}
                        height={150}
                        className='h-20 w-auto object-cover border rounded'
                      />
                      <a
                        href={sec.imagePath}
                        target='_blank'
                        rel='noreferrer'
                        className='text-xs underline'>
                        Vollbild
                      </a>
                    </div>
                  )}
                </div>
                <label className='text-xs'>Text</label>
                <textarea
                  value={sec.text}
                  onChange={(e) =>
                    updateSection(idx, { text: e.currentTarget.value })
                  }
                  className='w-full p-2 border rounded min-h-[80px]'
                />
              </div>
            ))}
          </div>

          {err && <div className='text-sm text-red-600 mt-2'>{err}</div>}
          {msg && <div className='text-sm text-green-600 mt-2'>{msg}</div>}

          <div className='flex gap-2 mt-3'>
            <Button
              type='submit'
              className='bg-primary text-white'
              disabled={loading}>
              {loading ? "Speichere..." : "Speichern"}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleDelete}
              disabled={loading}>
              Löschen
            </Button>
          </div>
        </div>
      </div>
      <div className='space-y-3'>
        <label className='text-xs'>Firmenname</label>
        <Input
          value={form.comanyName}
          onChange={(e) =>
            setForm({ ...form, comanyName: e.currentTarget.value })
          }
        />

        <label className='text-xs'>Website</label>
        <Input
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.currentTarget.value })}
        />

        <label className='text-xs'>Branche</label>
        <Input
          value={form.companyBranch}
          onChange={(e) =>
            setForm({ ...form, companyBranch: e.currentTarget.value })
          }
        />

        <label className='text-xs'>Beschreibung</label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.currentTarget.value })
          }
          className='w-full min-h-[120px] p-2 border rounded'
        />
      </div>
    </form>
  );
}
