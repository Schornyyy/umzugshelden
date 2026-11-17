"use client";

import MediathekDialog from "@/components/utils/MediathekDialog";
import { X } from "lucide-react";
import Image from "next/image";

type SingleProps = {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultipleProps = {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

type Props = (SingleProps | MultipleProps) & {
  label: string;
  hint?: string;
  previewSize?: "sm" | "lg";
};

function toList(selection: string | string[]) {
  return (Array.isArray(selection) ? selection : [selection]).filter(Boolean);
}

/** Bildauswahl aus der Mediathek mit Vorschau – einzeln (Thumbnail) oder mehrere (Galerie). */
export default function ImagePickerField(props: Props) {
  const images = props.multiple ? props.value : props.value ? [props.value] : [];
  const previewClass =
    props.previewSize === "lg" && !props.multiple
      ? "relative aspect-[16/10] w-full max-w-md overflow-hidden rounded-lg border bg-slate-100"
      : "relative h-20 w-20 overflow-hidden rounded-md border bg-slate-100";

  function select(selection: string | string[]) {
    const selected = toList(selection);
    if (props.multiple) props.onChange([...new Set([...props.value, ...selected])]);
    else if (selected[0]) props.onChange(selected[0]);
  }

  function remove(url: string) {
    if (props.multiple) props.onChange(props.value.filter((entry) => entry !== url));
    else props.onChange("");
  }

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-sm font-medium text-slate-800'>{props.label}</span>
        <MediathekDialog
          btnName={props.multiple ? "Bilder hinzufügen" : images.length ? "Ändern" : "Aus Mediathek wählen"}
          onSelect={select}
        />
      </div>
      {props.hint && <p className='text-xs text-slate-500'>{props.hint}</p>}
      {images.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {images.map((url) => (
            <div key={url} className={`group ${previewClass}`}>
              <Image src={url} alt='' fill className='object-cover' sizes='(max-width: 768px) 100vw, 448px' />
              <button
                type='button'
                onClick={() => remove(url)}
                aria-label='Bild entfernen'
                className='absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow opacity-90 hover:opacity-100'>
                <X className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
