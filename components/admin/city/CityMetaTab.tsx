"use client";
import React from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  async () => {
    const mod = await import("@/components/RichTextEditor");
    return mod.SimpleRichTextEditor;
  },
  { ssr: false }
);

interface Props {
  titleValue: string;
  descriptionValue: string;
  onChange: (patch: { title?: string; description?: string }) => void;
}

export function CityMetaTab({ titleValue, descriptionValue, onChange }: Props) {
  return (
    <div className='space-y-6'>
      <div>
        <label className='block'>
          <span className='block text-xs font-semibold text-gray-600 mb-1'>
            Seitentitel (optional Override)
          </span>
          <input
            value={titleValue}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder='Individueller Titel'
            className='w-full border rounded px-3 py-2 text-sm'
          />
        </label>
      </div>
      <div>
        <span className='block text-xs font-semibold text-gray-600 mb-1'>
          Beschreibung (Rich Text)
        </span>
        <div className='border rounded'>
          <RichTextEditor
            value={descriptionValue}
            onChange={(val: string) => onChange({ description: val })}
          />
        </div>
        <p className='text-[11px] text-gray-500 mt-2'>
          Wenn leer: Fallback auf generisch generierten SEO-Text.
        </p>
      </div>
    </div>
  );
}
