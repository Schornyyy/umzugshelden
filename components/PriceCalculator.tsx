"use client";
import React, { useState, useMemo } from 'react';

interface PriceCalculatorProps {
  serviceName: string;
  cityName: string;
}

// Base price matrix (per m²) in EUR for different complexity + material tiers.
// These are heuristic ranges – can later be externalized to CMS/DB.
const BASE_PRICE_MATRIX: Record<string, { simple: [number, number]; standard: [number, number]; komplex: [number, number] }> = {
  basic: { simple: [40, 55], standard: [55, 75], komplex: [70, 95] },
  standard: { simple: [55, 70], standard: [70, 95], komplex: [90, 125] },
  premium: { simple: [75, 95], standard: [95, 135], komplex: [130, 175] }
};

function clampArea(v: number) { return Math.min(5000, Math.max(1, v || 0)); }

export default function PriceCalculator({ serviceName, cityName }: PriceCalculatorProps) {
  const [area, setArea] = useState<number>(50);
  const [material, setMaterial] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [complexity, setComplexity] = useState<'simple' | 'standard' | 'komplex'>('standard');

  const result = useMemo(() => {
    const base = BASE_PRICE_MATRIX[material][complexity];
    const a = clampArea(area);
    // Non-linear scaling: larger Flächen häufig leichter pro m² -> leichte Degression.
    const scale = a > 250 ? 0.92 : a > 120 ? 0.95 : 1;
    const min = Math.round(base[0] * a * scale);
    const max = Math.round(base[1] * a * scale * 1.08); // small buffer
    return { min, max, unitFrom: base[0], unitTo: base[1], scaled: scale !== 1 };
  }, [area, material, complexity]);

  return (
    <div className='space-y-5' data-component='price-calculator'>
      <div className='grid sm:grid-cols-3 gap-4'>
        <div className='flex flex-col'>
            <label className='text-xs font-semibold tracking-wide text-gray-600 mb-1'>Fläche (m²)</label>
            <input
              type='number'
              min={1}
              max={5000}
              value={area}
              onChange={e => setArea(clampArea(parseInt(e.target.value,10)))}
              className='border rounded px-3 py-2 text-sm'
              data-cta='calc-area'
            />
        </div>
        <div className='flex flex-col'>
            <label className='text-xs font-semibold tracking-wide text-gray-600 mb-1'>Materialniveau</label>
            <select
              value={material}
              onChange={e => setMaterial(e.target.value as 'basic' | 'standard' | 'premium')}
              className='border rounded px-3 py-2 text-sm'
              data-cta='calc-material'
            >
              <option value='basic'>Basis</option>
              <option value='standard'>Standard</option>
              <option value='premium'>Premium</option>
            </select>
        </div>
        <div className='flex flex-col'>
            <label className='text-xs font-semibold tracking-wide text-gray-600 mb-1'>Komplexität</label>
            <select
              value={complexity}
              onChange={e => setComplexity(e.target.value as 'simple' | 'standard' | 'komplex')}
              className='border rounded px-3 py-2 text-sm'
              data-cta='calc-complexity'
            >
              <option value='simple'>Einfach</option>
              <option value='standard'>Standard</option>
              <option value='komplex'>Komplex</option>
            </select>
        </div>
      </div>
      <div className='p-5 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-wide font-semibold text-green-700 mb-1'>Kalkulierte Spanne</p>
          <p className='text-2xl font-bold text-gray-900'>{result.min.toLocaleString('de-DE')}€ – {result.max.toLocaleString('de-DE')}€</p>
          <p className='text-[11px] text-gray-500 mt-1'>Ø Einheitspreise: {result.unitFrom}–{result.unitTo}€ / m² {result.scaled && '(Skalierung angewendet)'} · Unverbindliche Orientierung für {serviceName} in {cityName}</p>
        </div>
        <div className='flex flex-col items-start gap-2'>
          <a href='#preis-anfrage-form' className='inline-block bg-green-600 text-white font-semibold text-sm px-5 py-3 rounded-md shadow hover:bg-green-700 transition' data-cta='calc-to-form'>Verbindliche Angebote anfordern</a>
          <button onClick={()=>{ setArea(50); setMaterial('standard'); setComplexity('standard'); }} className='text-xs text-gray-500 hover:text-gray-700 underline' data-cta='calc-reset'>Zurücksetzen</button>
        </div>
      </div>
      <p className='text-[11px] text-gray-500'>Hinweis: Regionale Marktsituation, Zugang, Untergrundaufbau, Entsorgung & Sonderleistungen (Drainage, Fundament, Spezialmaterial) können Abweichungen erzeugen.</p>
    </div>
  );
}
