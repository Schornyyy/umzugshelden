"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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

// Schemas reused
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
  category: z.string().optional().or(z.literal("")),
  companyBenefits: z.string().optional().or(z.literal("")),
  shortDescription: z
    .string()
    .max(300, "Max 300 Zeichen")
    .optional()
    .or(z.literal("")),
  active: z.boolean(),
  priority: z.number().int().min(0).max(100000),
});

type ContactForm = z.infer<typeof contactSchema>;
type CompanyForm = z.infer<typeof companySchema>;
type InfosForm = z.infer<typeof infosSchema>;
type MetaForm = z.infer<typeof metaSchema>;

const MAX_LOGO_SIZE = 3 * 1024 * 1024;

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
  siteInfos: { headline: string; text: string; image?: string }[];
  stats?: {
    clicks?: number;
    websiteClicks?: number;
    emailClicks?: number;
    phoneClicks?: number;
    views?: number;
    daysActive: number;
    avgPerDay: number;
  };
}

const initialState: State = {
  loading: true,
  saving: false,
  contact: { person: "", email: "", phone: "" },
  company: { name: "", street: "", zip: "", city: "" },
  infos: { website: "", logoPath: undefined },
  meta: {
    category: "",
    companyBenefits: "",
    shortDescription: "",
    active: true,
    priority: 100,
  },
  siteInfos: [{ headline: "", text: "", image: undefined }],
};

export function AdminPartnerEditor({ partnerId }: { partnerId: string }) {
  const [state, setState] = useState<State>(initialState);
  const [tab, setTab] = useState<
    "contact" | "company" | "infos" | "meta" | "siteInfos" | "stats"
  >("contact");
  const MAX_SITE_INFOS = 4;
  const MAX_SECTION_IMG = 3 * 1024 * 1024;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const p = partnerId ? await getPartner(partnerId) : null;
      if (p) {
        type PartnerMetrics = {
          clicks?: number;
          websiteClicks?: number;
          emailClicks?: number;
          phoneClicks?: number;
          views?: number;
        };
        const pm = p as PartnerType & PartnerMetrics;
        setState((s) => ({
          ...s,
          loading: false,
          partner: p,
          contact: {
            person: p.contact.person,
            email: p.contact.email,
            phone: p.contact.phone,
          },
          company: {
            name: p.company.name,
            street: p.company.street || "",
            zip: p.company.zip || "",
            city: p.company.city || "",
          },
          infos: { website: p.infos.website || "", logoPath: p.infos.logoPath },
          meta: {
            category: p.category || "",
            companyBenefits: p.companyBenefits || "",
            shortDescription: p.shortDescription || "",
            active: p.active,
            priority: p.priority || 100,
          },
          logoPreview: p.infos.logoPath,
          siteInfos: (p.siteInfos && p.siteInfos.length > 0
            ? p.siteInfos
            : [{ headline: "", text: "", image: undefined }]
          ).slice(0, MAX_SITE_INFOS),
          stats: (() => {
            const created = p.createdAt || Date.now();
            const daysActive = Math.max(
              1,
              Math.round((Date.now() - created) / 86400000)
            );
            const clicks = pm.clicks;
            return {
              clicks,
              websiteClicks: pm.websiteClicks,
              emailClicks: pm.emailClicks,
              phoneClicks: pm.phoneClicks,
              views: pm.views,
              daysActive,
              avgPerDay: clicks ? clicks / daysActive : 0,
            };
          })(),
        }));
      } else {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Partner nicht gefunden",
        }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Fehler beim Laden" }));
    }
  }, [partnerId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleField(
    section: "contact" | "company" | "infos" | "meta",
    field: string,
    value: string | number | boolean
  ) {
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

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setState((s) => ({ ...s, error: "Logo zu groß (max 3MB)" }));
      return;
    }
    const storageRef = ref(
      storage,
      `partner-logos/${partnerId}-${Date.now()}-${file.name}`
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
      await updatePartner(partnerId, {
        contact: { ...state.contact },
        company: { ...state.company },
        infos: {
          website: state.infos.website || "",
          logoPath: state.infos.logoPath,
        },
        companyBenefits: state.meta.companyBenefits || "",
        shortDescription: state.meta.shortDescription || undefined,
        category: state.meta.category || undefined,
        active: state.meta.active,
        priority: state.meta.priority,
        // @ts-expect-error siteInfos not yet in UpdatePartnerInput type
        siteInfos: state.siteInfos
          .filter((si) => si.headline.trim())
          .map((si) => ({ ...si })),
      });
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
      description: "Kategorie, Vorteile, Kurztext",
    },
    {
      key: "siteInfos",
      label: "Seiten Blöcke",
      description: "Inhaltsabschnitte (max 4)",
    },
    { key: "stats", label: "Stats", description: "Statistiken & Performance" },
  ];

  if (state.loading) return <div className='p-6 text-sm'>Lade…</div>;
  if (state.error)
    return <div className='p-6 text-sm text-red-600'>{state.error}</div>;

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

  return (
    <div className='bg-white p-6 rounded-xl border shadow-sm'>
      <h2 className='text-xl font-semibold mb-4'>Partner bearbeiten (Admin)</h2>
      <div className='flex flex-wrap gap-2 mb-6 border-b pb-2'>
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
      <p className='text-xs text-gray-600 mb-4'>
        {tabs.find((t) => t.key === tab)?.description}
      </p>

      {tab === "contact" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Ansprechpartner'>
            <input
              value={state.contact.person}
              onChange={(e) => handleField("contact", "person", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='E-Mail'>
            <input
              value={state.contact.email}
              onChange={(e) => handleField("contact", "email", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Telefon'>
            <input
              value={state.contact.phone}
              onChange={(e) => handleField("contact", "phone", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
        </div>
      )}

      {tab === "siteInfos" && (
        <div className='space-y-8'>
          {state.siteInfos.map((block, idx) => (
            <div key={idx} className='border rounded p-4 bg-gray-50'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold text-sm'>Block {idx + 1}</h3>
                {idx > 0 && (
                  <button
                    type='button'
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        siteInfos: s.siteInfos.filter((_, i) => i !== idx),
                      }))
                    }
                    className='text-xs text-red-600 hover:underline'>
                    Entfernen
                  </button>
                )}
              </div>
              <InputRow label='Headline'>
                <input
                  value={block.headline}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      siteInfos: s.siteInfos.map((b, i) =>
                        i === idx ? { ...b, headline: e.target.value } : b
                      ),
                    }))
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
                      setState((s) => ({
                        ...s,
                        siteInfos: s.siteInfos.map((b, i) =>
                          i === idx ? { ...b, text: val } : b
                        ),
                      })),
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
                        `partner-sections/${partnerId}-${idx}-${Date.now()}-${
                          file.name
                        }`
                      );
                      await uploadBytes(storageRef, file);
                      const url = await getDownloadURL(storageRef);
                      setState((s) => ({
                        ...s,
                        siteInfos: s.siteInfos.map((b, i) =>
                          i === idx ? { ...b, image: url } : b
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
          ))}
          {state.siteInfos.length < MAX_SITE_INFOS &&
            state.siteInfos[state.siteInfos.length - 1].headline.trim() && (
              <button
                type='button'
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    siteInfos: [
                      ...s.siteInfos,
                      { headline: "", text: "", image: undefined },
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
            <input
              value={state.company.name}
              onChange={(e) => handleField("company", "name", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Straße'>
            <input
              value={state.company.street}
              onChange={(e) => handleField("company", "street", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='PLZ'>
            <input
              value={state.company.zip}
              onChange={(e) => handleField("company", "zip", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Stadt'>
            <input
              value={state.company.city}
              onChange={(e) => handleField("company", "city", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
        </div>
      )}

      {tab === "infos" && (
        <div className='grid md:grid-cols-2 gap-6'>
          <InputRow label='Website'>
            <input
              value={state.infos.website || ""}
              onChange={(e) => handleField("infos", "website", e.target.value)}
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
          <InputRow label='Kategorie'>
            <input
              value={state.meta.category}
              onChange={(e) => handleField("meta", "category", e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </InputRow>
          <InputRow label='Vorteile / Benefits'>
            <textarea
              value={state.meta.companyBenefits}
              onChange={(e) =>
                handleField("meta", "companyBenefits", e.target.value)
              }
              className='w-full border rounded px-3 py-2 min-h-[90px]'
            />
          </InputRow>
          <InputRow label='Kurzbeschreibung (max 300)'>
            <textarea
              value={state.meta.shortDescription}
              onChange={(e) =>
                handleField("meta", "shortDescription", e.target.value)
              }
              className='w-full border rounded px-3 py-2 min-h-[90px]'
            />
          </InputRow>
          <div className='flex items-center gap-4'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <input
                type='checkbox'
                checked={state.meta.active}
                onChange={(e) =>
                  handleField("meta", "active", e.target.checked)
                }
              />{" "}
              Aktiv
            </label>
            <label className='flex items-center gap-2 text-sm font-medium'>
              Priorität
              <input
                type='number'
                value={state.meta.priority}
                onChange={(e) =>
                  handleField("meta", "priority", Number(e.target.value))
                }
                className='w-24 border rounded px-2 py-1'
              />
            </label>
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className='grid md:grid-cols-3 gap-6'>
          {state.stats ? (
            <>
              {[
                {
                  label: "Gesamt Klicks",
                  value: state.stats.clicks ?? 0,
                },
                {
                  label: "Website-Klicks",
                  value: state.stats.websiteClicks ?? 0,
                },
                {
                  label: "E-Mail-Klicks",
                  value: state.stats.emailClicks ?? 0,
                },
                {
                  label: "Telefon-Klicks",
                  value: state.stats.phoneClicks ?? 0,
                },
                {
                  label: "Seitenaufrufe",
                  value: state.stats.views ?? 0,
                },
                {
                  label: "Ø Klicks / Tag",
                  value: state.stats.avgPerDay.toFixed(2),
                },
                {
                  label: "Tage aktiv",
                  value: state.stats.daysActive,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className='p-4 rounded-lg border bg-gray-50 shadow-sm'>
                  <div className='text-xs uppercase tracking-wide text-gray-500 mb-2'>
                    {card.label}
                  </div>
                  <div className='text-xl font-semibold'>{card.value}</div>
                </div>
              ))}
            </>
          ) : (
            <p className='text-sm text-gray-500'>
              Keine Statistiken vorhanden.
            </p>
          )}
        </div>
      )}

      <div className='mt-8 flex flex-wrap items-center gap-4'>
        <button
          onClick={() => saveAll()}
          disabled={state.saving || currentErrors.length > 0}
          className='px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
          {state.saving ? "Speichert…" : "Speichern"}
        </button>
        {currentErrors.length > 0 && (
          <ul className='text-sm text-red-600 list-disc ml-4'>
            {currentErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <span className='text-xs text-gray-500 ml-auto'>ID: {partnerId}</span>
      </div>
    </div>
  );
}
