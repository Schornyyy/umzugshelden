"use client";
import React from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  faqs: FaqItem[];
  onChange: (index: number, patch: Partial<FaqItem>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function CityFaqTab({ faqs, onChange, onAdd, onRemove }: Props) {
  return (
    <div className='space-y-8'>
      {faqs.map((f, i) => (
        <div
          key={i}
          className='border rounded-md p-4 bg-white shadow-sm relative'>
          <div className='flex items-start gap-4 flex-col md:flex-row'>
            <label className='flex-1 block'>
              <span className='block text-xs font-semibold text-gray-600 mb-1'>
                Frage
              </span>
              <input
                value={f.question}
                onChange={(e) => onChange(i, { question: e.target.value })}
                className='w-full border rounded px-3 py-2 text-sm'
                placeholder='Wie lange dauert ...?'
              />
            </label>
            <label className='flex-1 block'>
              <span className='block text-xs font-semibold text-gray-600 mb-1'>
                Antwort
              </span>
              <textarea
                value={f.answer}
                onChange={(e) => onChange(i, { answer: e.target.value })}
                className='w-full border rounded px-3 py-2 text-sm min-h-[80px]'
                placeholder='In der Regel ...'
              />
            </label>
          </div>
          {faqs.length > 1 && (
            <button
              type='button'
              onClick={() => onRemove(i)}
              className='absolute top-2 right-2 text-xs text-red-600 hover:underline'>
              Entfernen
            </button>
          )}
        </div>
      ))}
      <div>
        <button
          type='button'
          onClick={onAdd}
          className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm'>
          Weitere Frage hinzufügen
        </button>
      </div>
    </div>
  );
}
