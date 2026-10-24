"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/config/firebase";
import {
  defaultOfferPricingSettings,
  normalizeOfferPricingSettings,
  type OfferPricingSettings,
  type PackingBoxRule,
  type PackingEmployeeRule,
} from "@/lib/offerPricingSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft, LoaderCircle, PackageCheck, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_COLLECTION = "offer_calculators_umzugshelden";

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function NumberSetting({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(numberValue(event.target.value))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 pr-20 text-sm outline-none focus:border-blue-500"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
          {suffix}
        </span>
      </div>
    </label>
  );
}

export default function PackingPricingEditor() {
  const { companyData } = useCompanyData();
  const [settings, setSettings] = useState<OfferPricingSettings>(() =>
    normalizeOfferPricingSettings(defaultOfferPricingSettings)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function load(companyId: string) {
      try {
        const snapshot = await getDoc(doc(database, STORAGE_COLLECTION, companyId));
        if (active) {
          setSettings(normalizeOfferPricingSettings(snapshot.data()?.pricingSettings));
        }
      } catch (error) {
        console.error("Packservice-Preise konnten nicht geladen werden.", error);
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

  function updatePacking(patch: Partial<OfferPricingSettings["packing"]>) {
    setSettings((current) => ({
      ...current,
      packing: { ...current.packing, ...patch },
    }));
    setStatus("idle");
  }

  function updateBoxRule(id: string, patch: Partial<PackingBoxRule>) {
    updatePacking({
      boxRules: settings.packing.boxRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule
      ),
    });
  }

  function updateEmployeeRule(id: string, patch: Partial<PackingEmployeeRule>) {
    updatePacking({
      employeeRules: settings.packing.employeeRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule
      ),
    });
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
      console.error("Packservice-Preise konnten nicht gespeichert werden.", error);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Packservice-Preise werden geladen ...
      </div>
    );
  }

  const packing = settings.packing;

  return (
    <main className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3 text-slate-600">
            <Link href={`/admin/${companyData?.id}/crm/calculator/packing`}>
              <ArrowLeft /> Zum Packservice-Kalkulator
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Kalkulator
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Ein-/Auspackservice-Preise
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Kartonbedarf, Personalstaffeln und Zeitansätze zentral festlegen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-sm text-emerald-700">Gespeichert</span>}
          {status === "error" && <span className="text-sm text-red-700">Speichern fehlgeschlagen</span>}
          <Button onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            Speichern
          </Button>
        </div>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Kartons nach Wohnfläche</h2>
        <p className="mt-1 text-sm text-slate-500">
          Leeres Bis-Feld = offene letzte Staffel. Inventar, Personen und Räume können einen höheren Bedarf ergeben.
        </p>
        <div className="mt-4 space-y-2">
          {packing.boxRules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
              <input
                type="number"
                min="0"
                value={rule.upToAreaM2 ?? ""}
                placeholder="offen"
                onChange={(event) =>
                  updateBoxRule(rule.id, {
                    upToAreaM2: event.target.value === "" ? null : numberValue(event.target.value),
                  })
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                aria-label="Wohnfläche bis Quadratmeter"
              />
              <input
                type="number"
                min="0"
                value={rule.boxes}
                onChange={(event) => updateBoxRule(rule.id, { boxes: Math.round(numberValue(event.target.value)) })}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                aria-label="Anzahl Kartons"
              />
              <Button
                variant="ghost"
                size="icon"
                title="Staffel entfernen"
                onClick={() => updatePacking({ boxRules: packing.boxRules.filter((item) => item.id !== rule.id) })}>
                <Trash2 className="text-red-600" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => updatePacking({ boxRules: [...packing.boxRules, { id: crypto.randomUUID(), upToAreaM2: null, boxes: 0 }] })}>
          <Plus /> Staffel hinzufügen
        </Button>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Mitarbeiter nach Kartonmenge</h2>
        <div className="mt-4 space-y-2">
          {packing.employeeRules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
              <input
                type="number"
                min="0"
                value={rule.upToBoxes ?? ""}
                placeholder="offen"
                onChange={(event) =>
                  updateEmployeeRule(rule.id, {
                    upToBoxes: event.target.value === "" ? null : numberValue(event.target.value),
                  })
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                aria-label="Kartonmenge bis"
              />
              <input
                type="number"
                min="1"
                value={rule.employees}
                onChange={(event) => updateEmployeeRule(rule.id, { employees: Math.max(1, Math.round(numberValue(event.target.value))) })}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                aria-label="Anzahl Mitarbeiter"
              />
              <Button
                variant="ghost"
                size="icon"
                title="Staffel entfernen"
                onClick={() => updatePacking({ employeeRules: packing.employeeRules.filter((item) => item.id !== rule.id) })}>
                <Trash2 className="text-red-600" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => updatePacking({ employeeRules: [...packing.employeeRules, { id: crypto.randomUUID(), upToBoxes: null, employees: 1 }] })}>
          <Plus /> Staffel hinzufügen
        </Button>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Bedarfs- und Zeitansätze</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberSetting label="Kartons je Person" value={packing.boxesPerPerson} suffix="Stk." onChange={(value) => updatePacking({ boxesPerPerson: value })} />
          <NumberSetting label="Kartons je Raum" value={packing.boxesPerRoom} suffix="Stk." onChange={(value) => updatePacking({ boxesPerRoom: value })} />
          <NumberSetting label="Kartons je Inventarvolumen" value={packing.boxesPerVolumeM3} suffix="Stk./m³" onChange={(value) => updatePacking({ boxesPerVolumeM3: value })} />
          <NumberSetting label="Mindestarbeitszeit" value={packing.minimumLaborHours} suffix="Std." onChange={(value) => updatePacking({ minimumLaborHours: value })} />
          <NumberSetting label="Einpacken je Karton" value={packing.packingMinutesPerBox} suffix="Min." onChange={(value) => updatePacking({ packingMinutesPerBox: value })} />
          <NumberSetting label="Auspacken je Karton" value={packing.unpackingMinutesPerBox} suffix="Min." onChange={(value) => updatePacking({ unpackingMinutesPerBox: value })} />
          <NumberSetting label="Empfindlicher Gegenstand" value={packing.fragileMinutesPerItem} suffix="Min." onChange={(value) => updatePacking({ fragileMinutesPerItem: value })} />
        </div>
      </section>

      <section className="flex flex-col justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-blue-950">Material und Einkaufspreise</h2>
          <p className="mt-1 text-sm text-blue-800">
            Kartons, Packpapier, Folie und Packband inklusive Bedarf je Karton pflegen.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/${companyData?.id}/material-preisliste`}>
            <PackageCheck /> Material-Preisliste
          </Link>
        </Button>
      </section>
    </main>
  );
}
