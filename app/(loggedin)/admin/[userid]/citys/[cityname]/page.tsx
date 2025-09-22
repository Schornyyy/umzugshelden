"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getCityPage,
  createCityPage,
  updateCityPage,
} from "@/actions/cityActions/customerCityAction";
import { deslugify } from "@/utils/slugify";
import type { CityPage } from "@/types/city/CityPage";

interface EditableFaq {
  question: string;
  answer: string;
}

interface State {
  loading: boolean;
  saving: boolean;
  error?: string;
  cityPage?: CityPage;
  faqs: EditableFaq[];
}

const initialState: State = {
  loading: true,
  saving: false,
  faqs: [{ question: "", answer: "" }],
};

export default function CityFaqEditorPage() {
  const params = useParams();
  const citySlugParam = params?.cityname as string; // folder param name
  const slug = decodeURIComponent(citySlugParam || "");
  const cityReadable = deslugify(slug);
  const [state, setState] = useState<State>(initialState);

  // Load or create city page doc using slug as deterministic ID
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        let cp = await getCityPage(slug);
        if (!cp) {
          // create with deterministic id = slug, store original human form in city field
          const id = await createCityPage({
            id: slug,
            city: cityReadable,
            faq: [],
          });
          cp = { id, city: cityReadable, faq: [] };
        }
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          cityPage: cp,
          faqs:
            cp.faq.length > 0
              ? cp.faq.map((f: { question: string; answer: string }) => ({
                  ...f,
                }))
              : [{ question: "", answer: "" }],
        }));
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: "Fehler beim Laden" }));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, cityReadable]);

  function updateFaq(index: number, field: keyof EditableFaq, value: string) {
    setState((s) => ({
      ...s,
      faqs: s.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  }

  function addFaq() {
    setState((s) => ({
      ...s,
      faqs: [...s.faqs, { question: "", answer: "" }],
    }));
  }

  function removeFaq(index: number) {
    setState((s) => ({ ...s, faqs: s.faqs.filter((_, i) => i !== index) }));
  }

  async function save() {
    if (!state.cityPage) return;
    // Filter out empty entries (both fields blank)
    const cleaned = state.faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question || f.answer);
    setState((s) => ({ ...s, saving: true, error: undefined }));
    try {
      await updateCityPage(state.cityPage.id, { faq: cleaned });
      setState((s) => ({
        ...s,
        saving: false,
        cityPage: { ...s.cityPage!, faq: cleaned },
        faqs: cleaned.length ? cleaned : [{ question: "", answer: "" }],
      }));
    } catch {
      setState((s) => ({
        ...s,
        saving: false,
        error: "Speichern fehlgeschlagen",
      }));
    }
  }

  if (!slug) return <div className='p-6 text-red-600'>Ungültige Stadt</div>;
  if (state.loading) return <div className='p-6'>Lädt…</div>;
  if (state.error) return <div className='p-6 text-red-600'>{state.error}</div>;

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>FAQ für {cityReadable}</h1>
      <p className='text-sm text-gray-600 mb-8'>
        Lege Fragen & Antworten an. Leerzeilen werden beim Speichern ignoriert.
      </p>

      <div className='space-y-8'>
        {state.faqs.map((f, i) => (
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
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
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
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  className='w-full border rounded px-3 py-2 text-sm min-h-[80px]'
                  placeholder='In der Regel ...'
                />
              </label>
            </div>
            {state.faqs.length > 1 && (
              <button
                type='button'
                onClick={() => removeFaq(i)}
                className='absolute top-2 right-2 text-xs text-red-600 hover:underline'>
                Entfernen
              </button>
            )}
          </div>
        ))}
      </div>

      <div className='mt-8 flex flex-wrap gap-4 items-center'>
        <button
          type='button'
          onClick={addFaq}
          className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm'>
          Weitere Frage hinzufügen
        </button>
        <button
          type='button'
          disabled={state.saving}
          onClick={save}
          className='px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'>
          {state.saving ? "Speichert…" : "Speichern"}
        </button>
        {state.error && (
          <span className='text-xs text-red-600'>{state.error}</span>
        )}
        {state.cityPage && (
          <span className='text-xs text-gray-500 ml-auto'>
            ID: {state.cityPage.id}
          </span>
        )}
      </div>
    </div>
  );
}
