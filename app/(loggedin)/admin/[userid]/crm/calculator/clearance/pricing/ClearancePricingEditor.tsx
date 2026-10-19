"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/config/firebase";
import {
  defaultOfferPricingSettings,
  normalizeOfferPricingSettings,
  type EmployeeVolumeRule,
  type FixedSurchargeRule,
  type OfferPricingSettings,
  type VehiclePricingItem,
} from "@/lib/offerPricingSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ArrowLeft,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_COLLECTION = "offer_calculators_umzugshelden";

type ClearanceRates = {
  employeeHourlyRate: number;
  kilometerRate: number;
  planningFee: number;
  surchargePercent: number;
  vatPercent: number;
  disposalRatePerM3: number;
  hazardousDisposalRatePerM3: number;
  containerRate: number;
  parkingPermitRate: number;
};

const defaultClearanceRates: ClearanceRates = {
  employeeHourlyRate: 42,
  kilometerRate: 0.75,
  planningFee: 45,
  surchargePercent: 15,
  vatPercent: 19,
  disposalRatePerM3: 65,
  hazardousDisposalRatePerM3: 180,
  containerRate: 250,
  parkingPermitRate: 120,
};

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function NumberField({
  label,
  value,
  suffix,
  step = 0.01,
  description,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step?: number;
  description?: string;
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
          onChange={(event) => onChange(numericValue(event.target.value))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 pr-20 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
          {suffix}
        </span>
      </div>
      {description && (
        <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function ThresholdField({
  value,
  suffix,
  onChange,
}: {
  value: number | null;
  suffix: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        value={value ?? ""}
        placeholder="unbegrenzt"
        onChange={(event) =>
          onChange(
            event.target.value === "" ? null : numericValue(event.target.value),
          )
        }
        className="h-10 w-full rounded-md border border-slate-300 px-3 pr-14 text-sm outline-none focus:border-blue-500"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
        {suffix}
      </span>
    </div>
  );
}

export default function ClearancePricingEditor() {
  const { companyData } = useCompanyData();
  const [settings, setSettings] = useState<OfferPricingSettings>(() =>
    normalizeOfferPricingSettings(defaultOfferPricingSettings),
  );
  const [rates, setRates] = useState<ClearanceRates>(defaultClearanceRates);
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
        if (!active) return;
        setStoredRates(rawRates);
        setRates({
          employeeHourlyRate: rateValue(rawRates.employeeHourlyRate, 42),
          kilometerRate: rateValue(rawRates.kilometerRate, 0.75),
          planningFee: rateValue(rawRates.planningFee, 45),
          surchargePercent: rateValue(rawRates.surchargePercent, 15),
          vatPercent: rateValue(rawRates.vatPercent, 19),
          disposalRatePerM3: rateValue(rawRates.disposalRatePerM3, 65),
          hazardousDisposalRatePerM3: rateValue(
            rawRates.hazardousDisposalRatePerM3,
            180,
          ),
          containerRate: rateValue(rawRates.containerRate, 250),
          parkingPermitRate: rateValue(rawRates.parkingPermitRate, 120),
        });
        setSettings(normalizeOfferPricingSettings(data?.pricingSettings));
      } catch (error) {
        console.error("Entrümpelungspreise konnten nicht geladen werden.", error);
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

  function rateValue(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : fallback;
  }

  function updateRate(key: keyof ClearanceRates, value: number) {
    setRates((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function updateClearance(
    key: keyof OfferPricingSettings["clearance"],
    value: number | EmployeeVolumeRule[],
  ) {
    setSettings((current) => ({
      ...current,
      clearance: { ...current.clearance, [key]: value },
    }));
    setStatus("idle");
  }

  function updateEmployeeRule(id: string, patch: Partial<EmployeeVolumeRule>) {
    updateClearance(
      "employeeRules",
      settings.clearance.employeeRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule,
      ),
    );
  }

  function updateSurchargeRule(
    key: "floorSurchargeRules" | "carryDistanceSurchargeRules",
    id: string,
    patch: Partial<FixedSurchargeRule>,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule,
      ),
    }));
    setStatus("idle");
  }

  function updateVehicle(id: string, patch: Partial<VehiclePricingItem>) {
    setSettings((current) => ({
      ...current,
      vehicleCatalog: current.vehicleCatalog.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ...patch } : vehicle,
      ),
    }));
    setStatus("idle");
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
      console.error("Entrümpelungspreise konnten nicht gespeichert werden.", error);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Entrümpelungspreise werden geladen ...
      </div>
    );
  }

  return (
    <main className="space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href={`/admin/${companyData?.id}/crm/calculator/clearance`}>
              <ArrowLeft /> Zum Entrümpelungs-Kalkulator
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Entrümpelung
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Entrümpelungspreise &amp; Berechnungsregeln
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Diese Werte steuern direkt Personal, Zeitaufwand, Fahrzeuge,
            Entsorgungskosten, Mindestpreis und Verhandlungspreis im
            Entrümpelungs-Kalkulator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && (
            <span className="text-sm font-medium text-emerald-700">Gespeichert</span>
          )}
          {status === "error" && (
            <span className="text-sm font-medium text-red-700">
              Speichern fehlgeschlagen
            </span>
          )}
          <Button onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            Alle Preise speichern
          </Button>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Grundpreise</h2>
        <p className="mt-1 text-sm text-slate-500">
          Direkte Kosten und Aufschläge des Angebots.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Mitarbeiter-Stundensatz" value={rates.employeeHourlyRate} suffix="€/Std." onChange={(value) => updateRate("employeeHourlyRate", value)} />
          <NumberField label="Fahrtkosten" value={rates.kilometerRate} suffix="€/km" onChange={(value) => updateRate("kilometerRate", value)} />
          <NumberField label="Planungs- & Auftragspauschale" value={rates.planningFee} suffix="€" onChange={(value) => updateRate("planningFee", value)} />
          <NumberField label="Verhandlungsaufschlag" value={rates.surchargePercent} suffix="%" step={0.1} onChange={(value) => updateRate("surchargePercent", value)} />
          <NumberField label="Mehrwertsteuer" value={rates.vatPercent} suffix="%" step={0.1} onChange={(value) => updateRate("vatPercent", value)} />
          <NumberField label="Halteverbotszone" value={rates.parkingPermitRate} suffix="€" onChange={(value) => updateRate("parkingPermitRate", value)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Entsorgung</h2>
        <p className="mt-1 text-sm text-slate-500">
          Preise werden mit den im Auftrag erfassten Mengen multipliziert.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField label="Sperrmüll / normales Räumgut" value={rates.disposalRatePerM3} suffix="€/m³" onChange={(value) => updateRate("disposalRatePerM3", value)} />
          <NumberField label="Sondermüll / Problemstoffe" value={rates.hazardousDisposalRatePerM3} suffix="€/m³" onChange={(value) => updateRate("hazardousDisposalRatePerM3", value)} />
          <NumberField label="Container inklusive Stellung" value={rates.containerRate} suffix="€/Stk." onChange={(value) => updateRate("containerRate", value)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Arbeitszeit-Formel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Grundaufwand wird mit Zugänglichkeit und Schwierigkeitsgrad multipliziert.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Mindestarbeitszeit" value={settings.clearance.minimumLaborHours} suffix="Std." step={0.25} onChange={(value) => updateClearance("minimumLaborHours", value)} />
          <NumberField label="Arbeitszeit je m³ Räumgut" value={settings.clearance.laborHoursPerM3} suffix="Std./m³" step={0.01} onChange={(value) => updateClearance("laborHoursPerM3", value)} />
          <NumberField label="Zusätzliche Arbeitszeit je m³ Sondermüll" value={settings.clearance.hazardousLaborHoursPerM3} suffix="Std./m³" step={0.01} onChange={(value) => updateClearance("hazardousLaborHoursPerM3", value)} />
          <NumberField label="Arbeitszeit je schwerem Gegenstand" value={settings.clearance.heavyItemLaborHours} suffix="Std./Stk." step={0.25} onChange={(value) => updateClearance("heavyItemLaborHours", value)} />
          <NumberField label="Mindestzeit besenrein" value={settings.clearance.broomCleanMinimumHours} suffix="Std." step={0.25} onChange={(value) => updateClearance("broomCleanMinimumHours", value)} />
          <NumberField label="Besenreine Zeit je m³" value={settings.clearance.broomCleanHoursPerM3} suffix="Std./m³" step={0.01} onChange={(value) => updateClearance("broomCleanHoursPerM3", value)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Zugänglichkeit &amp; Aufwand</h2>
        <p className="mt-1 text-sm text-slate-500">
          Faktoren werden auf den berechneten Grundzeitaufwand angewendet.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Faktor einfache Bedingungen" value={settings.clearance.easyComplexityFactor} suffix="Faktor" step={0.01} onChange={(value) => updateClearance("easyComplexityFactor", value)} />
          <NumberField label="Faktor normale Bedingungen" value={settings.clearance.standardComplexityFactor} suffix="Faktor" step={0.01} onChange={(value) => updateClearance("standardComplexityFactor", value)} />
          <NumberField label="Faktor schwierige Bedingungen" value={settings.clearance.difficultComplexityFactor} suffix="Faktor" step={0.01} onChange={(value) => updateClearance("difficultComplexityFactor", value)} />
          <NumberField label="Etagenfaktor ohne Aufzug" value={settings.clearance.floorFactorWithoutElevator} suffix="je Etage" step={0.005} description="0,08 entspricht 8 % zusätzlicher Zeit je Etage." onChange={(value) => updateClearance("floorFactorWithoutElevator", value)} />
          <NumberField label="Etagenfaktor mit Aufzug" value={settings.clearance.floorFactorWithElevator} suffix="je Etage" step={0.005} description="0,025 entspricht 2,5 % zusätzlicher Zeit je Etage." onChange={(value) => updateClearance("floorFactorWithElevator", value)} />
          <NumberField label="Trageweg-Faktor je 100 m" value={settings.clearance.carryDistanceFactorPer100M} suffix="Faktor" step={0.05} onChange={(value) => updateClearance("carryDistanceFactorPer100M", value)} />
          <NumberField label="Maximaler Trageweg-Zeitfaktor" value={settings.clearance.maximumCarryDistanceFactor} suffix="Faktor" step={0.05} description="0,5 begrenzt den Zeitaufschlag auf maximal 50 %." onChange={(value) => updateClearance("maximumCarryDistanceFactor", value)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Teamgröße nach Räumungsvolumen</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ein leeres Volumenfeld gilt für alle höheren Mengen.
        </p>
        <div className="mt-4 space-y-2">
          {settings.clearance.employeeRules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
              <ThresholdField value={rule.upToVolumeM3} suffix="m³" onChange={(value) => updateEmployeeRule(rule.id, { upToVolumeM3: value })} />
              <NumberField label="" value={rule.employees} suffix="Mitarbeiter" step={1} onChange={(value) => updateEmployeeRule(rule.id, { employees: Math.max(1, Math.round(value)) })} />
              <Button type="button" variant="ghost" size="icon" title="Staffel entfernen" onClick={() => updateClearance("employeeRules", settings.clearance.employeeRules.filter((candidate) => candidate.id !== rule.id))}><Trash2 className="text-red-600" /></Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => updateClearance("employeeRules", [...settings.clearance.employeeRules, { id: crypto.randomUUID(), upToVolumeM3: null, employees: 2 }])}><Plus /> Staffel hinzufügen</Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {([
          ["floorSurchargeRules", "Feste Etagenzuschläge", "Etage"],
          ["carryDistanceSurchargeRules", "Feste Tragewegzuschläge", "m"],
        ] as const).map(([key, title, suffix]) => (
          <section key={key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Wird zusätzlich zum zeitabhängigen Aufwand auf den Mindestpreis gerechnet.
            </p>
            <div className="mt-4 space-y-2">
              {settings[key].map((rule) => (
                <div key={rule.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                  <ThresholdField value={rule.upToValue} suffix={suffix} onChange={(value) => updateSurchargeRule(key, rule.id, { upToValue: value })} />
                  <NumberField label="" value={rule.amount} suffix="€" onChange={(value) => updateSurchargeRule(key, rule.id, { amount: value })} />
                  <Button type="button" variant="ghost" size="icon" title="Zuschlag entfernen" onClick={() => setSettings((current) => ({ ...current, [key]: current[key].filter((candidate) => candidate.id !== rule.id) }))}><Trash2 className="text-red-600" /></Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setSettings((current) => ({ ...current, [key]: [...current[key], { id: crypto.randomUUID(), upToValue: null, amount: 0 }] }))}><Plus /> Staffel hinzufügen</Button>
            {key === "floorSurchargeRules" && (
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={settings.waiveFloorSurchargeWithElevator} onChange={(event) => setSettings((current) => ({ ...current, waiveFloorSurchargeWithElevator: event.target.checked }))} />
                Bei vorhandenem Aufzug keinen festen Etagenzuschlag berechnen
              </label>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Fahrzeuge</h2>
        <p className="mt-1 text-sm text-slate-500">
          Der Kalkulator kombiniert die Fahrzeuge automatisch passend zum Volumen.
        </p>
        <div className="mt-4 space-y-3">
          {settings.vehicleCatalog.map((vehicle) => (
            <div key={vehicle.id} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[minmax(160px,1fr)_160px_160px_40px]">
              <input value={vehicle.name} onChange={(event) => updateVehicle(vehicle.id, { name: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              <NumberField label="" value={vehicle.capacityM3} suffix="m³" step={0.1} onChange={(value) => updateVehicle(vehicle.id, { capacityM3: value })} />
              <NumberField label="" value={vehicle.dailyRate} suffix="€/Tag" onChange={(value) => updateVehicle(vehicle.id, { dailyRate: value })} />
              <Button type="button" variant="ghost" size="icon" title="Fahrzeug entfernen" onClick={() => setSettings((current) => ({ ...current, vehicleCatalog: current.vehicleCatalog.filter((candidate) => candidate.id !== vehicle.id) }))}><Trash2 className="text-red-600" /></Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setSettings((current) => ({ ...current, vehicleCatalog: [...current.vehicleCatalog, { id: crypto.randomUUID(), name: "Neues Fahrzeug", capacityM3: 10, dailyRate: 100 }] }))}><Plus /> Fahrzeug hinzufügen</Button>
      </section>
    </main>
  );
}
