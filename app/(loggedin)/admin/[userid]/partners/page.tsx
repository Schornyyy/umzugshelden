"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  listPartners,
  removePartner,
  savePartner,
  migratePartnerProfilesToCatalog,
} from "@/actions/partnerActions";
import { PartnerType } from "@/types/PartnerType";

const emptyForm: Partial<PartnerType> = {
  name: "",
  logo: "",
  benefit: "",
  link: "",
  category: "",
  priority: 100,
  active: true,
  description: "",
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PartnerType>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listPartners();
      setPartners(data);
    } catch {
      setError("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const migrate = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await migratePartnerProfilesToCatalog();
      setSuccess(
        `Migration abgeschlossen: ${res.created} erstellt, ${res.skipped} übersprungen, ${res.errors} Fehler.`
      );
      await load();
    } catch {
      setError("Migration fehlgeschlagen");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name || "",
        logo: form.logo || "",
        benefit: form.benefit || "",
        link: form.link,
        category: form.category,
        active: form.active ?? true,
        priority: form.priority ?? 100,
        description: form.description,
        tags: form.tags || [],
      };

      const result = await savePartner(payload);
      setSuccess(result.created ? "Partner erstellt" : "Partner aktualisiert");
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler";
      setError(message);
    }
  };

  const edit = (p: PartnerType) => {
    setEditingId(p.id);
    setForm(p);
  };

  const del = async (id: string) => {
    if (!confirm("Partner wirklich löschen?")) return;
    await removePartner(id);
    await load();
  };

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Partner Verwaltung</h1>
      <div className='grid lg:grid-cols-3 gap-8 items-start'>
        <form
          onSubmit={submit}
          className='space-y-4 bg-white p-5 rounded-xl border shadow-sm lg:col-span-1'>
          <h2 className='font-semibold text-lg'>
            {editingId ? "Partner bearbeiten" : "Neuer Partner"}
          </h2>
          {error && <div className='text-red-600 text-sm'>{error}</div>}
          {success && <div className='text-green-600 text-sm'>{success}</div>}
          <div>
            <label className='block text-xs font-medium mb-1'>Name*</label>
            <input
              className='w-full border rounded px-2 py-1 text-sm'
              value={form.name || ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Logo URL*</label>
            <input
              className='w-full border rounded px-2 py-1 text-sm'
              value={form.logo || ""}
              onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>
              Vorteil / Benefit*
            </label>
            <textarea
              className='w-full border rounded px-2 py-1 text-sm'
              rows={3}
              value={form.benefit || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, benefit: e.target.value }))
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium mb-1'>
                Kategorie
              </label>
              <input
                className='w-full border rounded px-2 py-1 text-sm'
                value={form.category || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>
                Priorität
              </label>
              <input
                type='number'
                className='w-full border rounded px-2 py-1 text-sm'
                value={form.priority ?? 100}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Link</label>
            <input
              className='w-full border rounded px-2 py-1 text-sm'
              value={form.link || ""}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={form.active ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            <span className='text-xs'>Aktiv</span>
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>
              Beschreibung
            </label>
            <textarea
              className='w-full border rounded px-2 py-1 text-sm'
              rows={2}
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className='pt-2 flex gap-2'>
            <button
              type='submit'
              className='px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium'>
              {editingId ? "Speichern" : "Anlegen"}
            </button>
            {editingId && (
              <button
                type='button'
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className='px-4 py-2 rounded bg-slate-200 text-slate-700 text-sm'>
                Abbrechen
              </button>
            )}
          </div>
        </form>
        <div className='lg:col-span-2'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-semibold text-lg'>Partner Liste</h2>
            <div className='flex gap-2'>
              <button
                onClick={load}
                className='text-xs px-3 py-1 rounded border bg-white hover:bg-slate-50'>
                Neu laden
              </button>
              <button
                onClick={migrate}
                className='text-xs px-3 py-1 rounded border bg-white hover:bg-slate-50'>
                Profile migrieren
              </button>
            </div>
          </div>
          {loading && <p className='text-sm text-slate-500'>Lade...</p>}
          {!loading && partners.length === 0 && (
            <p className='text-sm text-slate-500'>
              Noch keine Partner hinterlegt.
            </p>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'>
            {partners.map((p) => (
              <div
                key={p.id}
                className='border rounded-lg p-4 bg-white flex flex-col shadow-sm'>
                <div className='flex items-center gap-3 mb-3'>
                  {p.logo && (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={40}
                      height={40}
                      className='h-10 w-10 object-contain rounded bg-slate-50 border'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-sm truncate'>{p.name}</h3>
                    <p className='text-[10px] uppercase tracking-wide text-slate-400 font-medium'>
                      {p.category || "–"}
                    </p>
                    {p.contactPerson && (
                      <p className='text-[11px] text-slate-500 truncate'>
                        Ansprechpartner: {p.contactPerson}
                      </p>
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[11px] text-blue-600 hover:underline truncate block'>
                        {p.website}
                      </a>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      p.active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                    {p.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <p className='text-xs text-slate-600 line-clamp-4 mb-3 whitespace-pre-wrap'>
                  {p.benefit}
                </p>
                <div className='mt-auto flex flex-row flex-wrap gap-2 gap-y-2 pt-2'>
                  {typeof p.clicks === "number" && (
                    <span className='text-[10px] px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600'>
                      {p.clicks} Klick{p.clicks === 1 ? "" : "s"}
                    </span>
                  )}
                  <button
                    onClick={() => edit(p)}
                    className='text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300'>
                    Bearbeiten
                  </button>
                  <a
                    href={`./partners/${p.id}`}
                    className='text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700'>
                    Dashboard
                  </a>
                  <button
                    onClick={() => del(p.id)}
                    className='text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700'>
                    Löschen
                  </button>
                  {p.link && (
                    <a
                      href={`/api/partner-click/${p.id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700'>
                      Öffnen
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
