"use client";

import { Button } from "@/components/ui/button";
import { auth, database } from "@/config/firebase";
import {
  defaultOfferPricingSettings,
  normalizeOfferPricingSettings,
  type EmployeeVolumeRule,
  type FixedSurchargeRule,
  type FurnitureCatalogItem,
  type OfferPricingSettings,
} from "@/lib/offerPricingSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  LoaderCircle,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_COLLECTION = "offer_calculators_umzugshelden";

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function ThresholdInput({
  value,
  onChange,
  suffix,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  suffix: string;
}) {
  return (
    <div className='relative'>
      <input
        type='number'
        min='0'
        value={value ?? ""}
        placeholder='offen'
        onChange={(event) =>
          onChange(event.target.value === "" ? null : numberValue(event.target.value))
        }
        className='h-10 w-full rounded-md border border-slate-300 px-3 pr-12 text-sm outline-none focus:border-blue-500'
      />
      <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>
        {suffix}
      </span>
    </div>
  );
}

export default function PricingSettingsEditor() {
  const { companyData } = useCompanyData();
  const [settings, setSettings] = useState<OfferPricingSettings>(() =>
    normalizeOfferPricingSettings(defaultOfferPricingSettings)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [search, setSearch] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function load(companyId: string) {
      try {
        const snapshot = await getDoc(
          doc(database, STORAGE_COLLECTION, companyId)
        );
        if (active) {
          setSettings(normalizeOfferPricingSettings(snapshot.data()?.pricingSettings));
        }
      } catch (error) {
        console.error("Preisberechnung konnte nicht geladen werden.", error);
        if (active) setStatus("error");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load(ownerId);
    return () => {
      active = false;
    };
  }, [companyData?.id]);

  const visibleFurniture = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("de-DE");
    if (!needle) return settings.furnitureCatalog;
    return settings.furnitureCatalog.filter((item) =>
      `${item.name} ${item.category}`.toLocaleLowerCase("de-DE").includes(needle)
    );
  }, [search, settings.furnitureCatalog]);

  function updateEmployeeRule(
    id: string,
    patch: Partial<EmployeeVolumeRule>
  ) {
    setSettings((current) => ({
      ...current,
      employeeRules: current.employeeRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule
      ),
    }));
    setStatus("idle");
  }

  function updateSurchargeRule(
    key: "floorSurchargeRules" | "carryDistanceSurchargeRules",
    id: string,
    patch: Partial<FixedSurchargeRule>
  ) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule
      ),
    }));
    setStatus("idle");
  }

  function removeRule(
    key:
      | "employeeRules"
      | "floorSurchargeRules"
      | "carryDistanceSurchargeRules",
    id: string
  ) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].filter((rule) => rule.id !== id),
    }));
    setStatus("idle");
  }

  function updateFurniture(
    id: string,
    patch: Partial<FurnitureCatalogItem>
  ) {
    setSettings((current) => ({
      ...current,
      furnitureCatalog: current.furnitureCatalog.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
    setStatus("idle");
  }

  function addFurniture(items: FurnitureCatalogItem[]) {
    setSettings((current) => {
      const existingNames = new Set(
        current.furnitureCatalog.map((item) =>
          item.name.trim().toLocaleLowerCase("de-DE")
        )
      );
      return {
        ...current,
        furnitureCatalog: [
          ...current.furnitureCatalog,
          ...items.filter(
            (item) =>
              !existingNames.has(item.name.trim().toLocaleLowerCase("de-DE"))
          ),
        ],
      };
    });
    setStatus("idle");
  }

  async function generateFurniture() {
    const description = aiDescription.trim();
    if (!description) return;
    setIsGenerating(true);
    setAiError("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Die Anmeldung ist abgelaufen.");
      const response = await fetch("/api/admin/furniture-catalog", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(result.items)) {
        throw new Error(result.error || "Die Möbelstücke konnten nicht erzeugt werden.");
      }
      addFurniture(result.items);
      setAiDescription("");
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Die Möbelstücke konnten nicht erzeugt werden."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function save() {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    setIsSaving(true);
    setStatus("idle");
    try {
      await setDoc(
        doc(database, STORAGE_COLLECTION, ownerId),
        { ownerId, pricingSettings: settings, updatedAt: Date.now() },
        { merge: true }
      );
      setStatus("saved");
    } catch (error) {
      console.error("Preisberechnung konnte nicht gespeichert werden.", error);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500'>
        <LoaderCircle className='animate-spin' size={18} />
        Preisberechnung wird geladen ...
      </div>
    );
  }

  return (
    <main className='space-y-6 pb-8'>
      <header className='flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
            Kalkulator
          </p>
          <h1 className='mt-2 text-2xl font-bold text-slate-950'>
            Preisberechnung
          </h1>
          <p className='mt-2 max-w-3xl text-sm text-slate-600'>
            Zentrale Vorgaben für Personal, Etagen, Tragewege und den Möbelkatalog.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {status === "saved" && <span className='text-sm text-emerald-700'>Gespeichert</span>}
          {status === "error" && <span className='text-sm text-red-700'>Speichern fehlgeschlagen</span>}
          <Button onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <LoaderCircle className='animate-spin' /> : <Save />}
            Speichern
          </Button>
        </div>
      </header>

      <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
        <h2 className='font-semibold text-slate-950'>Mitarbeiter nach Umzugsvolumen</h2>
        <p className='mt-1 text-sm text-slate-500'>Die passende Staffel wird im Kalkulator verbindlich übernommen.</p>
        <div className='mt-4 space-y-2'>
          {settings.employeeRules.map((rule) => (
            <div key={rule.id} className='grid grid-cols-[1fr_1fr_40px] gap-2'>
              <ThresholdInput
                value={rule.upToVolumeM3}
                suffix='m³'
                onChange={(value) => updateEmployeeRule(rule.id, { upToVolumeM3: value })}
              />
              <div className='relative'>
                <input type='number' min='1' value={rule.employees} onChange={(event) => updateEmployeeRule(rule.id, { employees: Math.max(1, Math.round(numberValue(event.target.value))) })} className='h-10 w-full rounded-md border border-slate-300 px-3 pr-20 text-sm outline-none focus:border-blue-500' />
                <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>Mitarbeiter</span>
              </div>
              <Button variant='ghost' size='icon' title='Staffel entfernen' onClick={() => removeRule("employeeRules", rule.id)}><Trash2 className='text-red-600' /></Button>
            </div>
          ))}
        </div>
        <Button variant='outline' size='sm' className='mt-3' onClick={() => setSettings((current) => ({ ...current, employeeRules: [...current.employeeRules, { id: crypto.randomUUID(), upToVolumeM3: null, employees: 2 }] }))}><Plus /> Staffel hinzufügen</Button>
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        {([
          ["floorSurchargeRules", "Etagenzuschläge", "Etage", "Etage"],
          ["carryDistanceSurchargeRules", "Tragewegzuschläge", "Meter", "m"],
        ] as const).map(([key, title, thresholdLabel, suffix]) => (
          <section key={key} className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <h2 className='font-semibold text-slate-950'>{title}</h2>
            <p className='mt-1 text-sm text-slate-500'>Bis einschließlich {thresholdLabel}; ein leeres Feld gilt für alle höheren Werte.</p>
            <div className='mt-4 space-y-2'>
              {settings[key].map((rule) => (
                <div key={rule.id} className='grid grid-cols-[1fr_1fr_40px] gap-2'>
                  <ThresholdInput value={rule.upToValue} suffix={suffix} onChange={(value) => updateSurchargeRule(key, rule.id, { upToValue: value })} />
                  <div className='relative'>
                    <input type='number' min='0' step='0.01' value={rule.amount} onChange={(event) => updateSurchargeRule(key, rule.id, { amount: numberValue(event.target.value) })} className='h-10 w-full rounded-md border border-slate-300 px-3 pr-10 text-sm outline-none focus:border-blue-500' />
                    <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>€</span>
                  </div>
                  <Button variant='ghost' size='icon' title='Staffel entfernen' onClick={() => removeRule(key, rule.id)}><Trash2 className='text-red-600' /></Button>
                </div>
              ))}
            </div>
            <Button variant='outline' size='sm' className='mt-3' onClick={() => setSettings((current) => ({ ...current, [key]: [...current[key], { id: crypto.randomUUID(), upToValue: null, amount: 0 }] }))}><Plus /> Staffel hinzufügen</Button>
            {key === "floorSurchargeRules" && (
              <label className='mt-4 flex items-center gap-2 text-sm text-slate-700'>
                <input type='checkbox' checked={settings.waiveFloorSurchargeWithElevator} onChange={(event) => setSettings((current) => ({ ...current, waiveFloorSurchargeWithElevator: event.target.checked }))} />
                Bei vorhandenem Aufzug keinen Etagenzuschlag berechnen
              </label>
            )}
          </section>
        ))}
      </div>

      <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
        <h2 className='font-semibold text-slate-950'>Möbelkatalog</h2>
        <p className='mt-1 text-sm text-slate-500'>Diese Liste steht anschließend bei der Inventarerfassung zur Auswahl.</p>
        <div className='mt-4 rounded-md border border-violet-200 bg-violet-50 p-4'>
          <div className='flex items-center gap-2 font-medium text-violet-950'><Sparkles size={17} /> Möbel mit Gemini ergänzen</div>
          <p className='mt-1 text-sm text-violet-800'>Mehrere Möbelstücke mit Komma trennen. Gemini ermittelt Kategorie und Transportvolumen für jeden Eintrag.</p>
          <textarea value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} rows={3} placeholder='Beispiel: Ecksofa, Sideboard, Doppelbett, Waschmaschine' className='mt-3 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500' />
          <div className='mt-2 flex items-center justify-between gap-3'>
            <span className='text-sm text-red-700'>{aiError}</span>
            <Button variant='outline' onClick={() => void generateFurniture()} disabled={isGenerating || !aiDescription.trim()}>
              {isGenerating ? <LoaderCircle className='animate-spin' /> : <Sparkles />}
              Generieren
            </Button>
          </div>
        </div>
        <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative max-w-md flex-1'>
            <Search className='absolute left-3 top-2.5 text-slate-400' size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Möbel suchen ...' className='h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500' />
          </div>
          <Button variant='outline' onClick={() => addFurniture([{ id: crypto.randomUUID(), name: "Neues Möbelstück", category: "Sonstiges", volumeM3: 0.5 }])}><Plus /> Manuell hinzufügen</Button>
        </div>
        <div className='mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1'>
          {visibleFurniture.map((item) => (
            <div key={item.id} className='grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[minmax(180px,1fr)_180px_120px_40px]'>
              <input value={item.name} onChange={(event) => updateFurniture(item.id, { name: event.target.value })} className='h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500' />
              <input value={item.category} onChange={(event) => updateFurniture(item.id, { category: event.target.value })} className='h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500' />
              <div className='relative'>
                <input type='number' min='0.001' step='0.01' value={item.volumeM3} onChange={(event) => updateFurniture(item.id, { volumeM3: numberValue(event.target.value) })} className='h-10 w-full rounded-md border border-slate-300 px-3 pr-10 text-sm outline-none focus:border-blue-500' />
                <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>m³</span>
              </div>
              <Button variant='ghost' size='icon' title='Möbelstück entfernen' onClick={() => setSettings((current) => ({ ...current, furnitureCatalog: current.furnitureCatalog.filter((candidate) => candidate.id !== item.id) }))}><Trash2 className='text-red-600' /></Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
