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
import type { CityPageSection } from "@/types/city/CityPageSection";
import { CityAdminTabs } from "@/components/admin/city/CityAdminTabs";
import { CityFaqTab } from "@/components/admin/city/CityFaqTab";
import { CitySectionsTab } from "@/components/admin/city/CitySectionsTab";
import { CityMetaTab } from "@/components/admin/city/CityMetaTab";
import { useCompanyData } from "@/provider/CompanyDataProvider";

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
  sections: CityPageSection[];
  title: string;
  description: string;
}
const initialState: State = {
  loading: true,
  saving: false,
  faqs: [{ question: "", answer: "" }],
  sections: [{ titel: "", text: "", image: undefined }],
  title: "",
  description: "",
};

export default function CityFaqEditorPage() {
  const params = useParams();
  const citySlugParam = params?.cityname as string; // folder param name
  const slug = decodeURIComponent(citySlugParam || "");
  const cityReadable = deslugify(slug);
  const [state, setState] = useState<State>(initialState);
  const { companyData } = useCompanyData();

  // Load or create city page doc using slug as deterministic ID
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        let cp = await getCityPage(slug, companyData ? companyData.id : "");
        if (!cp) {
          const id = await createCityPage(
            {
              id: slug,
              city: cityReadable,
              faq: [],
            },
            companyData ? companyData.id : ""
          );
          cp = {
            id,
            city: cityReadable,
            faq: [],
            ownerId: companyData ? companyData.id : "",
          };
        }
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          cityPage: cp,
          faqs: cp.faq.length
            ? cp.faq.map((f: { question: string; answer: string }) => ({
                ...f,
              }))
            : [{ question: "", answer: "" }],
          sections: cp.sections?.length
            ? cp.sections.map((sec) => ({ ...sec }))
            : [{ titel: "", text: "", image: undefined }],
          title: cp.title || "",
          description: cp.description || "",
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
  }, [slug, cityReadable, companyData]);

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

  // --- Sections Logic ---
  function updateSection(index: number, patch: Partial<CityPageSection>) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec, i) =>
        i === index ? { ...sec, ...patch } : sec
      ),
    }));
  }

  function addSection() {
    setState((s) => ({
      ...s,
      sections:
        s.sections.length < 3
          ? [...s.sections, { titel: "", text: "", image: undefined }]
          : s.sections,
    }));
  }

  function removeSection(index: number) {
    setState((s) => ({
      ...s,
      sections: s.sections.filter((_, i) => i !== index),
    }));
  }

  async function save() {
    if (!state.cityPage) return;
    // Filter out empty entries (both fields blank)
    const cleaned = state.faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question || f.answer);
    const cleanedSections = state.sections
      .map((sec) => ({
        titel: sec.titel.trim(),
        text: sec.text.trim(),
        image: sec.image || undefined,
        link: sec.link && sec.link.trim() ? sec.link.trim() : undefined,
      }))
      .filter((sec) => sec.titel && sec.text)
      .slice(0, 3)
      .map((sec) => {
        const cleaned: CityPageSection = {
          titel: sec.titel,
          text: sec.text,
          ...(sec.image ? { image: sec.image } : {}),
          ...(sec.link ? { link: sec.link } : {}),
        };
        return cleaned;
      });
    setState((s) => ({ ...s, saving: true, error: undefined }));
    try {
      await updateCityPage(
        state.cityPage.id,
        {
          faq: cleaned,
          sections: cleanedSections,
          title: state.title.trim() || undefined,
          description: state.description.trim() || undefined,
        },
        companyData ? companyData.id : ""
      );
      setState((s) => ({
        ...s,
        saving: false,
        cityPage: {
          ...s.cityPage!,
          faq: cleaned,
          sections: cleanedSections,
          title: state.title.trim() || undefined,
          description: state.description.trim() || undefined,
        },
        faqs: cleaned.length ? cleaned : [{ question: "", answer: "" }],
        sections: cleanedSections.length
          ? cleanedSections
          : [{ titel: "", text: "", image: undefined }],
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
    <div className='max-w-5xl mx-auto p-6'>
      <div className='flex items-start gap-4 flex-wrap mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>
            Stadtseite bearbeiten: {cityReadable}
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            FAQ, Sektionen & Meta Daten verwalten.
          </p>
        </div>
        {state.cityPage && (
          <span className='text-xs text-gray-500 ml-auto mt-1'>
            ID: {state.cityPage.id}
          </span>
        )}
      </div>
      <CityAdminTabs
        tabs={[
          {
            id: "faq",
            label: "FAQ",
            content: (
              <CityFaqTab
                faqs={state.faqs}
                onChange={(i, patch) => {
                  const entries = Object.entries(patch) as [
                    keyof EditableFaq,
                    string
                  ][];
                  if (entries.length) {
                    const [key, val] = entries[0];
                    updateFaq(i, key, val);
                  }
                }}
                onAdd={addFaq}
                onRemove={removeFaq}
              />
            ),
          },
          {
            id: "sections",
            label: "Sektionen",
            content: (
              <CitySectionsTab
                sections={state.sections}
                onChange={updateSection}
                onAdd={addSection}
                onRemove={removeSection}
              />
            ),
          },
          {
            id: "meta",
            label: "Meta / SEO",
            content: (
              <CityMetaTab
                titleValue={state.title}
                descriptionValue={state.description}
                onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
              />
            ),
          },
        ]}
      />
      <div className='mt-8 flex flex-wrap gap-4 items-center border-t pt-6'>
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
        <span className='text-xs text-gray-500'>
          Änderungen wirken nach kurzer Cache-Aktualisierung.
        </span>
      </div>
    </div>
  );
}
