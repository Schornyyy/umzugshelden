"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/config/firebase";
import {
  defaultOfferPricingSettings,
  normalizeOfferPricingSettings,
  type FurnitureAssemblyCatalogItem,
  type FurnitureAssemblyCalculationSettings,
  type OfferPricingSettings,
} from "@/lib/offerPricingSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_COLLECTION = "offer_calculators_umzugshelden";

type FurnitureAssemblyRates = {
  employeeHourlyRate: number;
  kilometerRate: number;
  planningFee: number;
  surchargePercent: number;
  vatPercent: number;
};

const defaultRates: FurnitureAssemblyRates = {
  employeeHourlyRate: 42,
  kilometerRate: 0.75,
  planningFee: 45,
  surchargePercent: 15,
  vatPercent: 19,
};

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function NumberField({
  label,
  value,
  suffix,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <div className="relative mt-1.5">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(numberValue(event.target.value))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 pr-20 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
          {suffix}
        </span>
      </div>
    </label>
  );
}

export default function FurnitureAssemblyPricingEditor() {
  const { companyData } = useCompanyData();
  const [settings, setSettings] = useState<OfferPricingSettings>(() =>
    normalizeOfferPricingSettings(defaultOfferPricingSettings),
  );
  const [rates, setRates] = useState(defaultRates);
  const [storedRates, setStoredRates] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function load(companyId: string) {
      try {
        const snapshot = await getDoc(
          doc(database, STORAGE_COLLECTION, companyId),
        );
        const data = snapshot.data();
        const rawRates =
          data?.rates && typeof data.rates === "object"
            ? (data.rates as Record<string, unknown>)
            : {};
        const rate = (key: keyof FurnitureAssemblyRates) =>
          typeof rawRates[key] === "number" &&
          Number.isFinite(rawRates[key]) &&
          rawRates[key] >= 0
            ? rawRates[key]
            : defaultRates[key];
        if (!active) return;
        setStoredRates(rawRates);
        setRates({
          employeeHourlyRate: rate("employeeHourlyRate"),
          kilometerRate: rate("kilometerRate"),
          planningFee: rate("planningFee"),
          surchargePercent: rate("surchargePercent"),
          vatPercent: rate("vatPercent"),
        });
        setSettings(normalizeOfferPricingSettings(data?.pricingSettings));
      } catch (error) {
        console.error("Möbelmontagepreise konnten nicht geladen werden.", error);
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

  function updateRate(key: keyof FurnitureAssemblyRates, value: number) {
    setRates((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function updateAssemblySetting(
    key: keyof FurnitureAssemblyCalculationSettings,
    value: number | FurnitureAssemblyCatalogItem[],
  ) {
    setSettings((current) => ({
      ...current,
      furnitureAssembly: {
        ...current.furnitureAssembly,
        [key]: value,
      },
    }));
    setStatus("idle");
  }

  function updateCatalogItem(
    id: string,
    patch: Partial<FurnitureAssemblyCatalogItem>,
  ) {
    updateAssemblySetting(
      "catalog",
      settings.furnitureAssembly.catalog.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  }

  async function save() {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    setIsSaving(true);
    setStatus("idle");
    try {
      await setDoc(
        doc(database, STORAGE_COLLECTION, ownerId),
        {
          ownerId,
          rates: { ...storedRates, ...rates },
          pricingSettings: settings,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setStoredRates((current) => ({ ...current, ...rates }));
      setStatus("saved");
    } catch (error) {
      console.error("Möbelmontagepreise konnten nicht gespeichert werden.", error);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Möbelmontagepreise werden geladen ...
      </div>
    );
  }

  const assembly = settings.furnitureAssembly;

  return (
    <main className="space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Möbelmontage
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Preisstruktur einstellen
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Arbeitskosten, Mindestaufwand und konkrete Zeiten für Auf- und
            Abbau werden zentral gepflegt und im Kalkulator automatisch
            kombiniert.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && (
            <span className="text-sm text-emerald-700">Gespeichert</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-700">Speichern fehlgeschlagen</span>
          )}
          <Button onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            Speichern
          </Button>
        </div>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Grundkonditionen</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <NumberField label="Mitarbeiter-Stundensatz" value={rates.employeeHourlyRate} suffix="€/Std." onChange={(value) => updateRate("employeeHourlyRate", value)} />
          <NumberField label="Kilometerpreis" value={rates.kilometerRate} suffix="€/km" onChange={(value) => updateRate("kilometerRate", value)} />
          <NumberField label="Planungspauschale" value={rates.planningFee} suffix="€" onChange={(value) => updateRate("planningFee", value)} />
          <NumberField label="Gemeinkosten / Aufschlag" value={rates.surchargePercent} suffix="%" onChange={(value) => updateRate("surchargePercent", value)} />
          <NumberField label="Mehrwertsteuer" value={rates.vatPercent} suffix="%" onChange={(value) => updateRate("vatPercent", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Berechnungsregeln</h2>
        <p className="mt-1 text-sm text-slate-500">
          Der Mindestaufwand greift erst, sobald mindestens eine Leistung
          erfasst wurde.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Mindestaufwand" value={assembly.minimumLaborHours} suffix="Std." step={0.25} onChange={(value) => updateAssemblySetting("minimumLaborHours", value)} />
          <NumberField label="Mindestbesetzung" value={assembly.minimumEmployees} suffix="Personen" step={1} onChange={(value) => updateAssemblySetting("minimumEmployees", Math.max(1, Math.round(value)))} />
          <NumberField label="Ab Aufwand mit 2 Personen" value={assembly.twoPersonThresholdMinutes} suffix="Min." step={15} onChange={(value) => updateAssemblySetting("twoPersonThresholdMinutes", value)} />
          <NumberField label="Faktor einfach" value={assembly.easyComplexityFactor} suffix="×" step={0.05} onChange={(value) => updateAssemblySetting("easyComplexityFactor", value)} />
          <NumberField label="Faktor normal" value={assembly.standardComplexityFactor} suffix="×" step={0.05} onChange={(value) => updateAssemblySetting("standardComplexityFactor", value)} />
          <NumberField label="Faktor schwierig" value={assembly.difficultComplexityFactor} suffix="×" step={0.05} onChange={(value) => updateAssemblySetting("difficultComplexityFactor", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-semibold text-slate-950">Leistungskatalog</h2>
            <p className="mt-1 text-sm text-slate-500">
              Zeiten sind Personenminuten; Material wird je Auf- oder
              Abbauvorgang berechnet.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              updateAssemblySetting("catalog", [
                ...assembly.catalog,
                {
                  id: crypto.randomUUID(),
                  name: "Neues Möbelstück",
                  category: "Sonstiges",
                  assemblyMinutes: 30,
                  dismantlingMinutes: 20,
                  materialCost: 0,
                },
              ])
            }>
            <Plus /> Leistung hinzufügen
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {assembly.catalog.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-md border border-slate-200 p-3 lg:grid-cols-[minmax(180px,1fr)_160px_130px_130px_130px_40px]">
              <input value={item.name} aria-label="Leistung" onChange={(event) => updateCatalogItem(item.id, { name: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              <input value={item.category} aria-label="Kategorie" onChange={(event) => updateCatalogItem(item.id, { category: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              <NumberField label="Aufbau" value={item.assemblyMinutes} suffix="Min." step={5} onChange={(value) => updateCatalogItem(item.id, { assemblyMinutes: value })} />
              <NumberField label="Abbau" value={item.dismantlingMinutes} suffix="Min." step={5} onChange={(value) => updateCatalogItem(item.id, { dismantlingMinutes: value })} />
              <NumberField label="Material" value={item.materialCost} suffix="€" onChange={(value) => updateCatalogItem(item.id, { materialCost: value })} />
              <Button variant="ghost" size="icon" title="Leistung entfernen" onClick={() => updateAssemblySetting("catalog", assembly.catalog.filter((candidate) => candidate.id !== item.id))}>
                <Trash2 className="text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
