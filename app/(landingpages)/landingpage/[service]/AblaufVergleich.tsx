"use client";

import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function AblaufVergleich({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  function showPreviousImage() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 sm:aspect-[16/10]">
        <Image
          src={images[activeIndex]}
          alt={`Ausgangssituation vor der Entrümpelung, Projekt ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 896px"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white shadow">
          <Images size={15} />
          Projekt {activeIndex + 1} von {images.length}
        </span>
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Vorheriges Projektbild anzeigen"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg transition hover:bg-white">
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Nächstes Projektbild anzeigen"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg transition hover:bg-white">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      {hasMultipleImages && (
        <div className="flex items-center justify-center gap-2 px-4 py-4">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Projektbild ${index + 1} anzeigen`}
              aria-current={index === activeIndex}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
