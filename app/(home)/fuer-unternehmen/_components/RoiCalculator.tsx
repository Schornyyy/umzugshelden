"use client";
import React, { useState } from "react";

const format = (v: number) => v.toLocaleString("de-DE");

export default function RoiCalculator() {
  const [avg, setAvg] = useState(2500);
  const [additional, setAdditional] = useState(4);
  const result = avg * additional;
  return (
    <div className='rounded-xl border bg-white p-6 shadow-sm'>
      <h3 className='font-semibold text-lg mb-4'>Potenzial-Rechner</h3>
      <p className='text-sm text-slate-600 mb-4'>
        Schätze, welchen zusätzlichen Monatsumsatz Sie mit nur wenigen neuen
        Aufträgen erreichen könnten.
      </p>
      <div className='space-y-6'>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>
            Ø Auftragswert (EUR)
          </label>
          <input
            aria-label='Ø Auftragswert'
            type='range'
            min={300}
            max={10000}
            value={avg}
            step={100}
            className='w-full'
            onChange={(e) => setAvg(Number(e.target.value))}
          />
          <div className='text-sm mt-1'>
            <span>{format(avg)}</span> €
          </div>
        </div>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>
            Zusätzliche Aufträge / Monat
          </label>
          <input
            aria-label='Zusätzliche Aufträge pro Monat'
            type='number'
            min={1}
            max={30}
            value={additional}
            className='w-full rounded border px-2 py-1 text-sm'
            onChange={(e) => setAdditional(Number(e.target.value))}
          />
        </div>
        <div className='p-3 bg-green-50 rounded border border-green-200'>
          <p className='text-xs font-medium text-green-700 mb-1'>
            Monatliches Zusatzpotenzial
          </p>
          <p className='text-2xl font-bold text-green-700'>
            <span>{format(result)}</span> €
          </p>
          <p className='text-[10px] text-slate-500 mt-1'>
            Unverbindliche Beispielrechnung – reale Werte variieren.
          </p>
        </div>
      </div>
    </div>
  );
}
