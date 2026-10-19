"use client";

import { Boxes, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";

export default function AblaufVergleich() {
  const [progress, setProgress] = useState(50);

  return (
    <div>
      <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl sm:h-96">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 px-6 text-center">
          <Boxes size={72} className="text-slate-500" />
          <p className="mt-4 font-sans text-2xl font-bold text-slate-700">
            Volle Räume
          </p>
          <p className="mt-2 max-w-xs text-sm text-slate-600">
            Möbel, Hausrat und zu entsorgende Gegenstände
          </p>
        </div>
        <div
          className="absolute inset-y-0 left-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 to-white px-6 text-center"
          style={{ width: `${progress}%` }}>
          <div className="min-w-[320px] sm:min-w-[500px]">
            <Sparkles size={72} className="mx-auto text-primary" />
            <p className="mt-4 font-sans text-2xl font-bold text-navy">
              Besenrein
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-600">
              Geräumt, sortiert und sauber zur Übergabe
            </p>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-1 bg-white shadow-xl"
          style={{ left: `calc(${progress}% - 2px)` }}>
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg">
            ↔
          </span>
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy shadow">
          Nachher
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white shadow">
          Vorher
        </span>
      </div>
      <label className="mt-5 block text-sm font-semibold text-slate-700">
        Veränderung ansehen
        <input
          type="range"
          min="10"
          max="90"
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="mt-2 w-full accent-primary"
          aria-label="Vorher-Nachher-Darstellung verschieben"
        />
      </label>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
        <CheckCircle2 size={14} className="text-emerald-600" />
        Schematische Darstellung unseres Leistungsziels
      </p>
    </div>
  );
}
