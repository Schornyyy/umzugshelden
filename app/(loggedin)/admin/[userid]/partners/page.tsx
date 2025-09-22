"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { listPartners } from "@/actions/partnerActions";
import { PartnerType } from "@/types/PartnerType";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerType[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listPartners();
      setPartners(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Partner Verwaltung</h1>
      <div className='grid lg:grid-cols-3 gap-8 items-start'>
        <div className='lg:col-span-2'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-semibold text-lg'>Partner Liste</h2>
            <div className='flex gap-2'>
              <button
                onClick={load}
                className='text-xs px-3 py-1 rounded border bg-white hover:bg-slate-50'>
                Neu laden
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
                  {p.infos.logoPath && (
                    <Image
                      src={p.infos.logoPath}
                      alt={p.company.name}
                      width={40}
                      height={40}
                      className='h-10 w-10 object-contain rounded bg-slate-50 border'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-sm truncate'>
                      {p.company.name}
                    </h3>
                    <p className='text-[10px] uppercase tracking-wide text-slate-400 font-medium'>
                      {p.category || "–"}
                    </p>
                    {p.contact.person && (
                      <p className='text-[11px] text-slate-500 truncate'>
                        Ansprechpartner: {p.contact.person}
                      </p>
                    )}
                    {p.infos.website && (
                      <a
                        href={p.infos.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[11px] text-blue-600 hover:underline truncate block'>
                        {p.infos.website}
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
                  {p.shortDescription}
                </p>
                <div className='mt-auto flex flex-row flex-wrap gap-2 gap-y-2 pt-2'>
                  <a
                    href={`./partners/${p.id}`}
                    className='text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700'>
                    Dashboard
                  </a>
                  {p.infos.website && (
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
