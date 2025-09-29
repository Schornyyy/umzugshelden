"use client";
import React from "react";
import type { CityPageSection } from "@/types/city/CityPageSection";
import dynamic from "next/dynamic";
import Image from "next/image";
import MediathekDialog from "@/components/utils/MediathekDialog";

const RichTextEditor = dynamic(
  async () => {
    const mod = await import("@/components/RichTextEditor");
    return mod.SimpleRichTextEditor;
  },
  { ssr: false }
);

interface Props {
  sections: CityPageSection[];
  onChange: (index: number, patch: Partial<CityPageSection>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function CitySectionsTab({
  sections,
  onChange,
  onAdd,
  onRemove,
}: Props) {
  function canAddSection() {
    if (sections.length >= 3) return false;
    const last = sections[sections.length - 1];
    return !!(last && last.titel.trim() && last.text.trim());
  }
  return (
    <div>
      <div className='space-y-8'>
        {sections.map((sec, i) => {
          const filled = sec.titel.trim() && sec.text.trim();
          return (
            <div
              key={i}
              className='border rounded-md p-4 bg-white shadow-sm relative'>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <label className='flex-1 block'>
                    <span className='block text-xs font-semibold text-gray-600 mb-1'>
                      Titel
                    </span>
                    <input
                      value={sec.titel}
                      onChange={(e) => onChange(i, { titel: e.target.value })}
                      className='w-full border rounded px-3 py-2 text-sm'
                      placeholder='Sektion Titel'
                    />
                  </label>
                  <div className='w-full md:w-56'>
                    <span className='block text-xs font-semibold text-gray-600 mb-1'>
                      Bild
                    </span>
                    {sec.image ? (
                      <div className='flex flex-col gap-2'>
                        <div className='relative w-full h-32 rounded border overflow-hidden'>
                          <Image
                            src={sec.image}
                            alt={sec.titel || "Bild"}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <div className='flex gap-2'>
                          <button
                            type='button'
                            onClick={() => onChange(i, { image: undefined })}
                            className='text-xs px-2 py-1 border rounded hover:bg-gray-100'>
                            Entfernen
                          </button>
                          <MediathekDialog
                            btnName='Wechseln'
                            onSelect={(url) =>
                              onChange(i, {
                                image: Array.isArray(url) ? url[0] : url,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <MediathekDialog
                        btnName='Bild wählen'
                        onSelect={(url) =>
                          onChange(i, {
                            image: Array.isArray(url) ? url[0] : url,
                          })
                        }
                      />
                    )}
                  </div>
                </div>
                <div>
                  <span className='block text-xs font-semibold text-gray-600 mb-1'>
                    Text (Rich Text)
                  </span>
                  <div className='border rounded'>
                    <RichTextEditor
                      value={sec.text}
                      onChange={(val: string) => onChange(i, { text: val })}
                    />
                  </div>
                </div>
                <div className='flex gap-2 items-center'>
                  <label className='flex-1 block'>
                    <span className='block text-xs font-semibold text-gray-600 mb-1'>
                      Optionaler Link
                    </span>
                    <input
                      value={sec.link || ""}
                      onChange={(e) => onChange(i, { link: e.target.value })}
                      placeholder='https://...'
                      className='w-full border rounded px-3 py-2 text-sm'
                    />
                  </label>
                  {sections.length > 1 && (
                    <button
                      type='button'
                      onClick={() => onRemove(i)}
                      className='self-start mt-6 text-xs text-red-600 hover:underline'>
                      Sektion entfernen
                    </button>
                  )}
                </div>
                <div className='absolute top-2 right-2'>
                  <span
                    className={`text-[10px] px-2 py-1 rounded ${
                      filled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                    {filled ? "Vollständig" : "Unvollständig"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className='mt-4'>
        <button
          type='button'
          onClick={onAdd}
          disabled={!canAddSection()}
          className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm disabled:opacity-50'>
          Weitere Sektion hinzufügen
        </button>
        <span className='ml-3 text-xs text-gray-500'>Max. 3 Sektionen</span>
      </div>
    </div>
  );
}
