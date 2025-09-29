"use client";
import React, { useOptimistic, useTransition } from "react";
import type { BlogSubcategory } from "@/types/blog/BlogSubcategory";
import {
  deleteBlogSubcategory,
  listBlogSubcategories,
} from "@/actions/blogSubcategoryActions";
import Image from "next/image";
import { useCompanyData } from "@/provider/CompanyDataProvider";

interface Props {
  initialItems: BlogSubcategory[];
}

export default function SubcategoryClient({ initialItems }: Props) {
  const { companyData } = useCompanyData();

  const [isPending, startTransition] = useTransition();
  const [optimisticItems, mutate] = useOptimistic<
    BlogSubcategory[],
    { type: "delete"; id: string }
  >(initialItems, (state, action) => {
    if (action.type === "delete")
      return state.filter((i) => i.id !== action.id);
    return state;
  });

  async function handleDelete(id: string) {
    mutate({ type: "delete", id });
    try {
      await deleteBlogSubcategory(id);
      startTransition(async () => {
        await listBlogSubcategories(); // warm cache; optimistic state already updated
      });
    } catch (e) {
      // TODO: optionally show toast + refetch
      console.error(e);
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <span>{optimisticItems.length} Unterkategorien</span>
        {isPending && <span className='animate-pulse'>Aktualisiere…</span>}
      </div>
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {optimisticItems.map((item) => (
          <li key={item.id} className='border rounded p-4 flex flex-col gap-3'>
            <div className='flex items-center gap-3'>
              {item.thumbnailUrl && (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.name}
                  width={48}
                  height={48}
                  className='w-12 h-12 object-cover rounded'
                />
              )}
              <div className='min-w-0'>
                <p className='font-medium truncate'>{item.name}</p>
                <p className='text-xs text-gray-500 truncate'>{item.slug}</p>
              </div>
            </div>
            <div className='flex justify-between items-center text-xs gap-3'>
              <div className='flex gap-3'>
                <a
                  href={`/blog/${item.slug}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:underline'>
                  Ansehen
                </a>
                <a
                  href={`/admin/${companyData!.id}/blog/${item.slug}`}
                  className='text-green-700 hover:underline'
                  title='Bearbeiten'>
                  Bearbeiten
                </a>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className='text-red-600 hover:underline'>
                Löschen
              </button>
            </div>
          </li>
        ))}
        {optimisticItems.length === 0 && (
          <li className='text-sm text-gray-500'>
            Keine Unterkategorien vorhanden.
          </li>
        )}
      </ul>
    </div>
  );
}
