"use client";
import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";

declare global {
  interface Window {
    __lastFocusedInputId?: string;
    __lastFocusedCaret?: number | null;
  }
}
import Image from "next/image";
import { useParams } from "next/navigation";
import { getPartner, updatePartner } from "@/actions/partnerActions";
import type { PartnerType } from "@/types/PartnerType";
import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { z } from "zod";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false }
);

// Validation schema per section
const contactSchema = z.object({
  person: z.string().min(2, "Mind. 2 Zeichen"),
  email: z.string().email("Ungültige E-Mail"),
  phone: z.string().optional().or(z.literal("")),
});
const companySchema = z.object({
  name: z.string().min(2, "Mind. 2 Zeichen"),
  street: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
});
const infosSchema = z.object({
  website: z.string().url("Ungültige URL").optional().or(z.literal("")),
  logoPath: z.string().optional(),
});
const metaSchema = z.object({
  companyBenefits: z.string().optional().or(z.literal("")),
  shortDescription: z
    .string()
    .max(300, "Max 300 Zeichen")
    .optional()
    .or(z.literal("")),
});

type ContactForm = z.infer<typeof contactSchema>;
type CompanyForm = z.infer<typeof companySchema>;
type InfosForm = z.infer<typeof infosSchema>;
type MetaForm = z.infer<typeof metaSchema>;

const MAX_LOGO_SIZE = 3 * 1024 * 1024; // 3MB

interface SiteInfoBlock {
  id: string; // stable id to prevent remounts on edit
  headline: string;
  text: string;
  image?: string;
}

interface State {
  loading: boolean;
  saving: boolean;
  error?: string;
  partner?: PartnerType & { id: string };
  contact: ContactForm;
  company: CompanyForm;
  infos: InfosForm;
  meta: MetaForm;
  logoPreview?: string;
  siteInfos: SiteInfoBlock[];
  // marker sobald initial hydration aus partner erfolgt ist
  hydrated?: boolean;
}

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as Crypto & { randomUUID(): string }).randomUUID()
    : Math.random().toString(36).slice(2, 10);

const initialState: State = {
  loading: true,
  saving: false,
  contact: { person: "", email: "", phone: "" },
  company: { name: "", street: "", zip: "", city: "" },
  infos: { website: "", logoPath: undefined },
  meta: {
    companyBenefits: "",
    shortDescription: "",
  },
  siteInfos: [{ id: genId(), headline: "", text: "", image: undefined }],
};

// Stable input components outside of render to respect hook rules
interface StableInputProps {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  id?: string;
}
const StableInput: React.FC<StableInputProps> = ({ value, onChange, type = "text", className, placeholder, id }) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const focusedRef = useRef(false);
  const lastPropRef = useRef(value);
  const caretRef = useRef<number | null>(null);
  // sync only when not focused
  useEffect(() => {
    if (!focusedRef.current && value !== lastPropRef.current && ref.current) {
      ref.current.value = value;
      lastPropRef.current = value;
    }
  }, [value]);
  return (
    <input
      ref={ref}
      id={id}
      type={type}
      className={className}
      defaultValue={value}
      placeholder={placeholder}
      onFocus={(e) => { 
        focusedRef.current = true; 
        caretRef.current = e.currentTarget.selectionStart ?? null;
        window.__lastFocusedInputId = id; 
        window.__lastFocusedCaret = caretRef.current; 
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const v = e.currentTarget.value;
        lastPropRef.current = v;
        onChange(v);
      }}
      onChange={(e) => {
        const v = e.target.value;
        lastPropRef.current = v;
        try { caretRef.current = e.currentTarget.selectionStart ?? null; window.__lastFocusedCaret = caretRef.current; } catch {}
        onChange(v);
      }}
    />
  );
};

// Wrapper to see if unmount/remount happens (focus loss suspect)
const FormInput: React.FC<StableInputProps> = (props) => {
  const mountRef = useRef(0);
  useEffect(() => {
    mountRef.current += 1;
    console.debug('[FormInput mount]', props.id, 'count', mountRef.current);
    return () => {
      console.debug('[FormInput unmount]', props.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <StableInput {...props} />;
};

interface StableTextAreaProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}
const StableTextArea: React.FC<StableTextAreaProps> = ({ value, onChange, className, placeholder, rows }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const focusedRef = useRef(false);
  const lastPropRef = useRef(value);
  useEffect(() => {
    if (!focusedRef.current && value !== lastPropRef.current && ref.current) {
      ref.current.value = value;
      lastPropRef.current = value;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      defaultValue={value}
      rows={rows}
      placeholder={placeholder}
      onFocus={() => { focusedRef.current = true; }}
      onBlur={(e) => {
        focusedRef.current = false;
        const v = e.currentTarget.value;
        lastPropRef.current = v;
        onChange(v);
      }}
      onChange={(e) => {
        const v = e.target.value;
        lastPropRef.current = v;
        onChange(v);
      }}
    />
  );
};

export default function PartnerSettingsPage() {
  const params = useParams();
  const userId = params?.userid as string;
  const [state, setState] = useState<State>(initialState);
  const touchedRef = useRef<{ [k: string]: boolean }>({});
  const editingRef = useRef(false); // true sobald Nutzer etwas eingegeben hat
  const [tab, setTab] = useState<
    "contact" | "company" | "infos" | "meta" | "siteInfos"
  >("contact");
  const MAX_SITE_INFOS = 4;
  const MAX_SECTION_IMG = 3 * 1024 * 1024; // 3MB
  // Potential future use for dirty indicators
  // const [touched, setTouched] = useState<Record<string, boolean>>({});

  const loadedRef = useRef(false);
  const pendingPartnerRef = useRef<PartnerType & { id: string } | null>(null);
  useLayoutEffect(() => {
    if (!editingRef.current) return; // only restore while actively editing
    const lastId = window.__lastFocusedInputId;
    if (!lastId) return;
    const el = document.getElementById(lastId) as HTMLInputElement | null;
    if (el && el !== document.activeElement) {
      el.focus();
      const caret = window.__lastFocusedCaret;
      try {
        if (caret != null) el.setSelectionRange(caret, caret);
      } catch {}
    }
  });
  const load = useCallback(async () => {
    // Verhindere unbeabsichtigtes Überschreiben während Speicherung oder erneutem Mount.
    if (!userId) return;
    console.debug('[Partnerseite] load start (loadedRef=', loadedRef.current, 'editingRef=', editingRef.current, ')');
    setState((s) => ({ ...s, loading: !loadedRef.current, error: undefined }));
    try {
      const p = await getPartner(userId);
      if (!p) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Partner nicht gefunden",
        }));
        return;
      }
      if (editingRef.current) {
        console.debug('[Partnerseite] abort load apply because user is editing');
        loadedRef.current = true;
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      pendingPartnerRef.current = p;
      loadedRef.current = true;
      // Wir hydratisieren die Felder im nächsten Frame um Focus-Verlust zu minimieren
      requestAnimationFrame(() => {
        if (!pendingPartnerRef.current) return;
        if (editingRef.current) return; // User hat inzwischen gestartet
        const partnerData = pendingPartnerRef.current;
        setState((s) => {
          if (s.hydrated) return { ...s, loading: false };
          const existingByHeadline = new Map(
            s.siteInfos.map((b) => [
              b.headline + "::" + b.text.slice(0, 20),
              b.id,
            ])
          );
          const incoming = (
            partnerData.siteInfos && partnerData.siteInfos.length > 0
              ? partnerData.siteInfos
              : [{ headline: "", text: "", image: undefined }]
          )
            .slice(0, MAX_SITE_INFOS)
            .map((si: { headline?: string; text?: string; image?: string }) => {
              const key = (si.headline || "") + "::" + (si.text || "").slice(0, 20);
              const stableId = existingByHeadline.get(key) || genId();
              return {
                id: stableId,
                headline: si.headline || "",
                text: si.text || "",
                image: si.image,
              };
            });
          console.debug('[Partnerseite] hydration apply');
          return {
            ...s,
            loading: false,
            partner: partnerData,
            contact: {
              person: touchedRef.current["contact.person"]
                ? s.contact.person
                : partnerData.contact.person,
              email: touchedRef.current["contact.email"]
                ? s.contact.email
                : partnerData.contact.email,
              phone: touchedRef.current["contact.phone"]
                ? s.contact.phone
                : partnerData.contact.phone,
            },
            company: {
              name: touchedRef.current["company.name"]
                ? s.company.name
                : partnerData.company.name,
              street: touchedRef.current["company.street"]
                ? s.company.street
                : partnerData.company.street || "",
              zip: touchedRef.current["company.zip"]
                ? s.company.zip
                : partnerData.company.zip || "",
              city: touchedRef.current["company.city"]
                ? s.company.city
                : partnerData.company.city || "",
            },
            infos: {
              website: touchedRef.current["infos.website"]
                ? s.infos.website
                : partnerData.infos.website || "",
              logoPath: partnerData.infos.logoPath,
            },
            meta: {
              category: partnerData.category || "",
              companyBenefits: touchedRef.current["meta.companyBenefits"]
                ? s.meta.companyBenefits
                : partnerData.companyBenefits || "",
              shortDescription: touchedRef.current["meta.shortDescription"]
                ? s.meta.shortDescription
                : partnerData.shortDescription || "",
              active: partnerData.active,
              priority: partnerData.priority || 100,
            },
            logoPreview: partnerData.infos.logoPath,
            siteInfos: incoming,
            hydrated: true,
          };
        });
      });
      console.debug('[Partnerseite] load scheduled hydration');
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Fehler beim Laden" }));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleField(
    section: "contact" | "company" | "infos" | "meta",
    field: string,
    value: string | number | boolean
  ) {
    editingRef.current = true; // User tippt -> keine weiteren overwrites vom load
    touchedRef.current[`${section}.${field}`] = true;
    setState((s) => {
      if (section === "contact")
        return { ...s, contact: { ...s.contact, [field]: value } };
      if (section === "company")
        return { ...s, company: { ...s.company, [field]: value } };
      if (section === "infos")
        return { ...s, infos: { ...s.infos, [field]: value } };
      return { ...s, meta: { ...s.meta, [field]: value } };
    });
  }

  function markEditingSiteInfos() {
    if (!editingRef.current) {
      console.debug('[Partnerseite] editing started (siteInfos)');
      editingRef.current = true;
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setState((s) => ({ ...s, error: "Logo zu groß (max 3MB)" }));
      return;
    }
    const storageRef = ref(
      storage,
      `partner-logos/${userId}-${Date.now()}-${file.name}`
    );
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setState((s) => ({
        ...s,
        infos: { ...s.infos, logoPath: url },
        logoPreview: url,
        error: undefined,
      }));
    } catch {
      setState((s) => ({ ...s, error: "Upload fehlgeschlagen" }));
    }
  }

  function validateCurrentTab(): string[] {
    try {
      if (tab === "contact") contactSchema.parse(state.contact);
      if (tab === "company") companySchema.parse(state.company);
      if (tab === "infos") infosSchema.parse(state.infos);
      if (tab === "meta") metaSchema.parse(state.meta);
      return [];
    } catch (err) {
      const zErr = err as { issues?: { message: string }[] };
      if (zErr.issues) return zErr.issues.map((i) => i.message);
      return ["Unbekannter Fehler"];
    }
  }

  async function saveAll() {
    // Validate all schemas
    try {
      contactSchema.parse(state.contact);
      companySchema.parse(state.company);
      infosSchema.parse(state.infos);
      metaSchema.parse(state.meta);
    } catch {
      alert("Bitte Eingaben prüfen");
      return;
    }
    setState((s) => ({ ...s, saving: true, error: undefined }));
    try {
      await updatePartner(userId, {
        contact: { ...state.contact },
        company: { ...state.company },
        infos: {
          website: state.infos.website || "",
          logoPath: state.infos.logoPath,
        },
        companyBenefits: state.meta.companyBenefits || "",
        shortDescription: state.meta.shortDescription || undefined,
        // @ts-expect-error: siteInfos not yet in UpdatePartnerInput type (extending domain model)
        siteInfos: state.siteInfos
          .filter((si) => si.headline.trim())
          .map((si) => ({ ...si })),
      });
      // Nach Speichern neu laden, aber IDs soweit möglich stabil halten
      await load();
    } catch {
      setState((s) => ({ ...s, error: "Speichern fehlgeschlagen" }));
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  }

  const tabs: { key: typeof tab; label: string; description: string }[] = [
    {
      key: "contact",
      label: "Kontakt",
      description: "Ansprechpartner & Erreichbarkeit",
    },
    { key: "company", label: "Firma", description: "Firmendaten & Adresse" },
    { key: "infos", label: "Infos", description: "Website & Logo" },
    {
      key: "meta",
      label: "Meta",
      description: " Vorteile, Kurztext",
    },
    {
      key: "siteInfos",
      label: "Seiten Blöcke",
      description: "Inhaltsabschnitte (max 4)",
    },
  ];

  if (state.loading) return <div className='p-8'>Lade…</div>;
  if (state.error) return <div className='p-8 text-red-600'>{state.error}</div>;

  function InputRow(props: { label: string; children: React.ReactNode }) {
    return (
      <label className='block mb-4'>
        <span className='block text-sm font-medium text-gray-700 mb-1'>
          {props.label}
        </span>
        {props.children}
      </label>
    );
  }

  const currentErrors = validateCurrentTab();

  // Stable input components: keep internal value, only notify parent
  // (StableInput / StableTextArea defined above)

  return (
    <div className='max-w-5xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Partner Einstellungen</h1>
      <div className='flex flex-wrap gap-2 mb-8 border-b pb-2'>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t text-sm font-medium border  ${
              t.key === tab ? "bg-white border-gray-300 border-b-white" : ""
            } ${
              t.key !== tab
                ? "bg-gray-100 hover:bg-gray-200 border-transparent"
                : ""
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className='text-sm text-gray-600 mb-6'>
        {tabs.find((t) => t.key === tab)?.description}
      </p>

      {tab === "contact" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Ansprechpartner'>
            <FormInput
              id='contact-person'
              value={state.contact.person}
              onChange={(v) => handleField("contact", "person", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='E-Mail'>
            <FormInput
              id='contact-email'
              value={state.contact.email}
              onChange={(v) => handleField("contact", "email", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Telefon'>
            <FormInput
              id='contact-phone'
              value={state.contact.phone || ""}
              onChange={(v) => handleField("contact", "phone", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
        </div>
      )}
      {tab === "siteInfos" && (
        <div className='space-y-8'>
          {state.siteInfos.map((block, idx) => {
            const headlineId = `siteInfos-${block.id}-headline`;
            // rich text id removed (unused)
            return (
              <div
                key={block.id}
                className='border rounded p-4 bg-white shadow-sm'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold text-sm'>Block {idx + 1}</h3>
                  {idx > 0 && (
                    <button
                      type='button'
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          siteInfos: s.siteInfos.filter(
                            (b) => b.id !== block.id
                          ),
                        }))
                      }
                      className='text-xs text-red-600 hover:underline'>
                      Entfernen
                    </button>
                  )}
                </div>
                <InputRow label='Headline'>
                  <FormInput
                    id={headlineId}
                    value={block.headline || ""}
                    onChange={(v) =>
                      setState((s) => {
                        markEditingSiteInfos();
                        return {
                          ...s,
                          siteInfos: s.siteInfos.map((b) =>
                            b.id === block.id ? { ...b, headline: v } : b
                          ),
                        };
                      })
                    }
                    className='w-full border rounded px-3 py-2'
                  />
                </InputRow>
                <div className='mb-4'>
                  <span className='block text-sm font-medium text-gray-700 mb-1'>
                    Text
                  </span>
                  <RichTextEditor
                    field={{
                      value: block.text,
                      onChange: (val: string) =>
                        setState((s) => {
                          markEditingSiteInfos();
                          return {
                            ...s,
                            siteInfos: s.siteInfos.map((b) =>
                              b.id === block.id ? { ...b, text: val } : b
                            ),
                          };
                        }),
                    }}
                    defaultValue={block.text}
                  />
                </div>
                <div className='mb-2'>
                  <span className='block text-sm font-medium text-gray-700 mb-1'>
                    Bild (optional, max 3MB)
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_SECTION_IMG) {
                        setState((s) => ({
                          ...s,
                          error: "Bild zu groß (max 3MB)",
                        }));
                        return;
                      }
                      try {
                        const storageRef = ref(
                          storage,
                          `partner-sections/${userId}-${
                            block.id
                          }-${Date.now()}-${file.name}`
                        );
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);
                        setState((s) => ({
                          ...s,
                          siteInfos: s.siteInfos.map((b) =>
                            b.id === block.id ? { ...b, image: url } : b
                          ),
                          error: undefined,
                        }));
                      } catch {
                        setState((s) => ({
                          ...s,
                          error: "Upload fehlgeschlagen",
                        }));
                      }
                    }}
                  />
                  {block.image && (
                    <div className='mt-2'>
                      <Image
                        src={block.image}
                        alt={`Block ${idx + 1} Bild`}
                        width={160}
                        height={90}
                        className='object-cover rounded border'
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {state.siteInfos.length < MAX_SITE_INFOS &&
            state.siteInfos[state.siteInfos.length - 1].headline.trim() && (
              <button
                type='button'
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    siteInfos: [
                      ...s.siteInfos,
                      { id: genId(), headline: "", text: "", image: undefined },
                    ],
                  }))
                }
                className='px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm'>
                Weiteren Block hinzufügen
              </button>
            )}
          {state.siteInfos.length >= MAX_SITE_INFOS && (
            <p className='text-xs text-gray-500'>Maximale Anzahl erreicht.</p>
          )}
        </div>
      )}
      {tab === "company" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Firmenname'>
            <FormInput
              id='company-name'
              value={state.company.name}
              onChange={(v) => handleField("company", "name", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Straße'>
            <FormInput
              id='company-street'
              value={state.company.street || ""}
              onChange={(v) => handleField("company", "street", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='PLZ'>
            <FormInput
              id='company-zip'
              value={state.company.zip || ""}
              onChange={(v) => handleField("company", "zip", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Stadt'>
            <FormInput
              id='company-city'
              value={state.company.city || ""}
              onChange={(v) => handleField("company", "city", v)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
        </div>
      )}
      {tab === "infos" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Website'>
            <FormInput
              id='infos-website'
              value={state.infos.website || ""}
              onChange={(v) => handleField("infos", "website", v)}
              className='w-full border rounded px-3 py-2'
              placeholder='https://'
            />
          </InputRow>
          <div>
            <InputRow label='Logo (max 3MB)'>
              <input type='file' accept='image/*' onChange={handleLogoChange} />
            </InputRow>
            {state.logoPreview && (
              <div className='mt-2'>
                <Image
                  src={state.logoPreview}
                  alt='Logo Preview'
                  width={96}
                  height={96}
                  className='h-24 w-24 object-contain border rounded bg-white'
                />
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "meta" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Vorteile / Benefits'>
            <StableTextArea
              value={state.meta.companyBenefits || ""}
              onChange={(v) => handleField("meta", "companyBenefits", v)}
              className='w-full border rounded px-3 py-2 min-h-[90px]'
            />
          </InputRow>
          <InputRow label='Kurzbeschreibung (max 300)'>
            <StableTextArea
              value={state.meta.shortDescription || ""}
              onChange={(v) => handleField("meta", "shortDescription", v)}
              className='w-full border rounded px-3 py-2 min-h-[90px]'
            />
          </InputRow>
        </div>
      )}

      <div className='mt-8 flex flex-wrap items-center gap-4'>
        <button
          onClick={() => saveAll()}
          disabled={state.saving || currentErrors.length > 0}
          className='px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'>
          {state.saving ? "Speichert…" : "Speichern"}
        </button>
        {currentErrors.length > 0 && (
          <ul className='text-sm text-red-600 list-disc ml-4'>
            {currentErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <span className='text-xs text-gray-500 ml-auto'>ID: {userId}</span>
      </div>
    </div>
  );
}
