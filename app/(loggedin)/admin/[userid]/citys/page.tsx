"use client";
import React, { useMemo, useState } from "react";
import { cities } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";
import { redirectUser } from "@/actions/userActions";
import { useCompanyData } from "@/provider/CompanyDataProvider";

const PAGE_SIZE = 24;

export default function AdminCitiesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); // 1-based
  const { companyData } = useCompanyData();

  // Normalize search once
  const normalizedSearch = search.trim().toLowerCase();

  // Laufzeit-Dedupe (falls Build-Time Set nicht alle Fälle abdeckt oder Liste mehrfach importiert wurde)
  const uniqueCities = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of cities) {
      const key = c.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(c.trim());
      }
    }
    return out;
  }, []);

  const filtered = useMemo(() => {
    if (!normalizedSearch) return uniqueCities;
    return uniqueCities.filter((c) =>
      c.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch, uniqueCities]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function goto(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // Scroll to top of list for better UX
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Reset to first page on new search
  React.useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  return (
    <div className='max-w-5xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Städte Übersicht</h1>
      <div className='mb-6'>
        <label
          className='block text-sm font-medium text-gray-700 mb-1'
          htmlFor='city-search'>
          Stadt suchen
        </label>
        <input
          id='city-search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Name eingeben...'
          className='w-full border rounded px-3 py-2'
        />
        <p className='text-xs text-gray-500 mt-1'>
          {filtered.length} Treffer · Gesamt eindeutig: {uniqueCities.length}
        </p>
      </div>

      <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8'>
        {visible.map((c, i) => {
          const slug = slugify(c);
          return (
            <div
              key={slug + "-" + (start + i)}
              className='border rounded p-3 bg-white shadow-sm text-sm flex items-center justify-between gap-2'>
              <span className='truncate' title={c}>
                {c}
              </span>
              <button
                className='text-xs text-blue-600 hover:underline'
                onClick={() => {
                  redirectUser(`/admin/${companyData?.id}/citys/${slug}`);
                }}>
                Öffnen
              </button>
              <button
                className='text-[10px] text-gray-500 hover:text-gray-700'
                title='Slug kopieren'
                onClick={() => {
                  navigator.clipboard?.writeText(slug).catch(() => {});
                }}>
                {slug}
              </button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className='col-span-full text-sm text-gray-500'>
            Keine Städte gefunden.
          </div>
        )}
      </div>

      <Pagination page={clampedPage} totalPages={totalPages} onChange={goto} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const windowSize = 5; // show up to 5 numbered buttons
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  const pages = [] as number[];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className='px-3 py-1 text-sm border rounded disabled:opacity-40'>
        Zurück
      </button>
      {start > 1 && (
        <>
          <button
            onClick={() => onChange(1)}
            className={`px-3 py-1 text-sm border rounded ${
              page === 1 ? "bg-gray-200 font-semibold" : ""
            }`}>
            1
          </button>
          {start > 2 && <span className='px-1'>…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 text-sm border rounded ${
            p === page ? "bg-gray-200 font-semibold" : ""
          }`}>
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className='px-1'>…</span>}
          <button
            onClick={() => onChange(totalPages)}
            className={`px-3 py-1 text-sm border rounded ${
              page === totalPages ? "bg-gray-200 font-semibold" : ""
            }`}>
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className='px-3 py-1 text-sm border rounded disabled:opacity-40'>
        Weiter
      </button>
      <span className='ml-auto text-xs text-gray-500'>
        Seite {page} / {totalPages}
      </span>
    </div>
  );
}
