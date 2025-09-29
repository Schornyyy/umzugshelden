"use client";
import React, { useState, useTransition } from "react";
import Link from "next/link";

interface PageDataItem {
  id: string;
  slug: string;
  titel: string;
  description: string;
  thumbnailUrl?: string;
  visible: boolean;
  createdAt: number;
}
interface PageData {
  items: PageDataItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function BlogPagesListClient({
  initial,
  subcategorySlug,
}: {
  initial: PageData;
  subcategorySlug: string;
}) {
  const [data, setData] = useState<PageData>(initial);
  const [isPending, startTransition] = useTransition();

  async function load(page: number) {
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/blog/subcategory/${subcategorySlug}/pages?page=${page}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    });
  }

  return (
    <div className='border rounded p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium text-sm'>Vorhandene Beiträge</h3>
        <span className='text-xs text-slate-500'>{data.total} gesamt</span>
      </div>
      {data.items.length === 0 && (
        <p className='text-xs text-slate-500'>Noch keine Beiträge.</p>
      )}
      {data.items.length > 0 && (
        <ul className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {data.items.map((item) => (
            <li key={item.id} className='border rounded p-3 space-y-2 bg-white'>
              <div className='flex items-start justify-between gap-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-semibold line-clamp-2'>
                    {item.titel}
                  </p>
                  <p className='text-[10px] text-slate-500'>
                    {new Date(item.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
                {item.visible ? (
                  <span className='text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded'>
                    live
                  </span>
                ) : (
                  <span className='text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded'>
                    draft
                  </span>
                )}
              </div>
              <p className='text-xs text-slate-600 line-clamp-3 min-h-[48px]'>
                {item.description}
              </p>
              <div className='flex justify-end'>
                <Link
                  href={`./${subcategorySlug}/${item.slug}`}
                  className='text-xs text-blue-600 hover:underline'>
                  Bearbeiten
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 pt-2 flex-wrap'>
          <button
            disabled={data.page === 1 || isPending}
            onClick={() => load(data.page - 1)}
            className='text-xs px-2 py-1 border rounded disabled:opacity-40'>
            Prev
          </button>
          {Array.from({ length: data.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => load(i + 1)}
              disabled={isPending}
              className={`text-xs px-2 py-1 border rounded ${
                data.page === i + 1
                  ? "bg-blue-600 text-white border-blue-600"
                  : ""
              }`}>
              {i + 1}
            </button>
          ))}
          <button
            disabled={data.page === data.totalPages || isPending}
            onClick={() => load(data.page + 1)}
            className='text-xs px-2 py-1 border rounded disabled:opacity-40'>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
