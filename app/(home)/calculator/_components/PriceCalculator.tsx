"use client";
import React, { useState, useMemo, useEffect } from "react";
import { getGalbauServices } from "@/statics/Lists";

// ---- Types ----
interface ServiceConfig {
  id: string;
  name: string;
  unit: string; // m², lfm, stück etc.
  baseLaborRate: number; // € per unit (netto)
  materialCost: number; // € per unit (netto)
  materialOptional?: boolean; // If true, can toggle material provided by client
  minQuantity?: number;
  complexityFactors: Array<{
    id: string;
    label: string;
    factor: number;
    description?: string;
  }>;
  equipmentFactor?: number; // additional factor for equipment usage (multiplicative)
  wasteDisposalPerUnit?: number; // € per unit for disposal
  marginPercent: number; // gross margin / overhead percent applied after base calc
  notes?: string;
}

interface ServiceInputState {
  quantity: number | "";
  complexity: string; // complexity id
  materialProvided: boolean; // client already has materials
  difficultAccess: boolean; // increases labor
  includeWaste: boolean; // disposal cost
}

interface CalculatedLine {
  serviceId: string;
  name: string;
  quantity: number;
  unit: string;
  labor: number;
  material: number;
  equipment: number;
  waste: number;
  subtotal: number; // before margin
  margin: number;
  total: number;
  low: number;
  high: number;
  breakdown: Record<string, number>;
}

// ---- Service Configuration ----
// Simplified baseline values (illustrative only). Real values should be validated with market data.
const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    id: "pflasterarbeiten",
    name: "Pflasterarbeiten",
    unit: "m²",
    baseLaborRate: 22,
    materialCost: 28,
    materialOptional: true,
    complexityFactors: [
      { id: "standard", label: "Standard", factor: 1 },
      { id: "verbund", label: "Aufwendiges Muster / Verbund", factor: 1.15 },
      { id: "naturstein", label: "Naturstein", factor: 1.35 },
    ],
    equipmentFactor: 1.05,
    wasteDisposalPerUnit: 2.5,
    marginPercent: 18,
    notes: "Inkl. Unterbau-Anlage angenommen. Ohne Bordsteine.",
  },
  {
    id: "rollrasen",
    name: "Rasen- & Rollrasenverlegung",
    unit: "m²",
    baseLaborRate: 9,
    materialCost: 6.5,
    materialOptional: true,
    complexityFactors: [
      { id: "standard", label: "Ebene Fläche", factor: 1 },
      { id: "geformt", label: "Viele Kanten / Formen", factor: 1.1 },
      { id: "hang", label: "Hanglage", factor: 1.25 },
    ],
    equipmentFactor: 1,
    wasteDisposalPerUnit: 1,
    marginPercent: 15,
  },
  {
    id: "heckenschnitt",
    name: "Baum- und Gehölzpflege / Heckenschnitt",
    unit: "lfm",
    baseLaborRate: 4.5,
    materialCost: 0,
    complexityFactors: [
      { id: "niedrig", label: "Bis 2m Höhe", factor: 1 },
      { id: "mittel", label: "2–4m Höhe", factor: 1.4 },
      { id: "hoch", label: "Über 4m Höhe", factor: 1.9 },
    ],
    equipmentFactor: 1.1,
    wasteDisposalPerUnit: 1.2,
    marginPercent: 20,
  },
  {
    id: "bewässerung",
    name: "Bewässerungsanlagen",
    unit: "m²",
    baseLaborRate: 7,
    materialCost: 9,
    materialOptional: false,
    complexityFactors: [
      { id: "standard", label: "Standard", factor: 1 },
      { id: "segmentiert", label: "Segmentiert / mehrere Zonen", factor: 1.2 },
      { id: "smart", label: "Smart / Sensorik", factor: 1.35 },
    ],
    equipmentFactor: 1.05,
    wasteDisposalPerUnit: 0.5,
    marginPercent: 22,
  },
  {
    id: "terrassenbau",
    name: "Terrassenbau",
    unit: "m²",
    baseLaborRate: 30,
    materialCost: 35,
    materialOptional: true,
    complexityFactors: [
      { id: "standard", label: "Standard (Holz/WPC)", factor: 1 },
      { id: "premium", label: "Premium (Hardwood/Keramik)", factor: 1.25 },
      { id: "sonder", label: "Sonderkonstruktion", factor: 1.45 },
    ],
    equipmentFactor: 1.08,
    wasteDisposalPerUnit: 3,
    marginPercent: 20,
  },
  {
    id: "zaunbau",
    name: "Zaun- und Sichtschutzbau",
    unit: "lfm",
    baseLaborRate: 18,
    materialCost: 22,
    materialOptional: true,
    complexityFactors: [
      { id: "standard", label: "Standard Metall/Holz", factor: 1 },
      { id: "massiv", label: "Massiv / Stein", factor: 1.4 },
      { id: "hang", label: "Hanglage / schwieriger Boden", factor: 1.25 },
    ],
    equipmentFactor: 1.05,
    wasteDisposalPerUnit: 1.5,
    marginPercent: 19,
  },
];

// Map additional services from list to generic fallback config if not explicitly defined
const allServiceNames = getGalbauServices();
const existingIds = new Set(SERVICE_CONFIGS.map((s) => s.name));
allServiceNames.forEach((name) => {
  if (!existingIds.has(name)) {
    SERVICE_CONFIGS.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      unit: "m²",
      baseLaborRate: 18,
      materialCost: 12,
      materialOptional: true,
      complexityFactors: [
        { id: "standard", label: "Standard", factor: 1 },
        { id: "komplex", label: "Komplex", factor: 1.25 },
      ],
      equipmentFactor: 1.03,
      wasteDisposalPerUnit: 1.2,
      marginPercent: 18,
      notes:
        "Schätzung (Allgemein). Konkrete Preise variieren nach Region & Ausführung.",
    });
  }
});

const STORAGE_KEY = "price-calculator-v1";

interface StoredState {
  selections: Record<string, ServiceInputState>;
  selectedServiceIds: string[];
  regionFactor: number;
  includeVat: boolean;
}

const defaultState: StoredState = {
  selections: {},
  selectedServiceIds: ["pflasterarbeiten"],
  regionFactor: 1,
  includeVat: true,
};

const numberFormat = (v: number) =>
  v.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

const PriceCalculator: React.FC = () => {
  const [state, setState] = useState<StoredState>(defaultState);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        // Normalize selections to guarantee controlled inputs
        const normalizedSelections: Record<string, ServiceInputState> = {};
        Object.entries(parsed.selections || {}).forEach(([k, v]) => {
          const cfg = SERVICE_CONFIGS.find((s) => s.id === k);
          if (!cfg) return;
          normalizedSelections[k] = {
            quantity:
              typeof v.quantity === "number" && !isNaN(v.quantity)
                ? v.quantity
                : "",
            complexity: v.complexity || cfg.complexityFactors[0].id,
            materialProvided: !!v.materialProvided,
            difficultAccess: !!v.difficultAccess,
            includeWaste: v.includeWaste === false ? false : true,
          };
        });
        setState({
          ...defaultState,
          ...parsed,
          selections: normalizedSelections,
          regionFactor:
            typeof parsed.regionFactor === "number" ? parsed.regionFactor : 1,
          includeVat: parsed.includeVat !== false,
        });
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const updateServiceInput = (
    serviceId: string,
    patch: Partial<ServiceInputState>
  ) => {
    setState((prev) => {
      const current = prev.selections[serviceId] || {
        quantity: "",
        complexity:
          SERVICE_CONFIGS.find((s) => s.id === serviceId)?.complexityFactors[0]
            .id || "standard",
        materialProvided: false,
        difficultAccess: false,
        includeWaste: true,
      };
      return {
        ...prev,
        selections: {
          ...prev.selections,
          [serviceId]: { ...current, ...patch },
        },
      };
    });
  };

  const toggleService = (id: string) => {
    setState((prev) => {
      const exists = prev.selectedServiceIds.includes(id);
      return {
        ...prev,
        selectedServiceIds: exists
          ? prev.selectedServiceIds.filter((s) => s !== id)
          : [...prev.selectedServiceIds, id],
      };
    });
  };

  const calculations = useMemo<CalculatedLine[]>(() => {
    return state.selectedServiceIds.map((serviceId) => {
      const cfg = SERVICE_CONFIGS.find((s) => s.id === serviceId)!;
      const input = state.selections[serviceId] || {
        quantity: "",
        complexity: cfg.complexityFactors[0].id,
        materialProvided: false,
        difficultAccess: false,
        includeWaste: true,
      };
      const quantity =
        typeof input.quantity === "number" && input.quantity > 0
          ? input.quantity
          : 0;
      const complexity =
        cfg.complexityFactors.find((c) => c.id === input.complexity) ||
        cfg.complexityFactors[0];
      const laborBase =
        quantity *
        cfg.baseLaborRate *
        complexity.factor *
        (input.difficultAccess ? 1.15 : 1);
      const material =
        quantity *
        (cfg.materialOptional && input.materialProvided ? 0 : cfg.materialCost);
      const equipment = laborBase * ((cfg.equipmentFactor || 1) - 1);
      const waste = input.includeWaste
        ? quantity * (cfg.wasteDisposalPerUnit || 0)
        : 0;
      const subtotal = laborBase + material + equipment + waste;
      const margin = subtotal * (cfg.marginPercent / 100); // hidden from end-user input now
      const total = subtotal + margin;
      // Provide a +/- range (5-15%) scaled by complexity factor
      const varianceLow = 0.08 * complexity.factor;
      const varianceHigh = 0.15 * complexity.factor;
      const low = total * (1 - varianceLow) * state.regionFactor;
      const high = total * (1 + varianceHigh) * state.regionFactor;
      return {
        serviceId,
        name: cfg.name,
        quantity,
        unit: cfg.unit,
        labor: laborBase * state.regionFactor,
        material: material * state.regionFactor,
        equipment: equipment * state.regionFactor,
        waste: waste * state.regionFactor,
        subtotal: subtotal * state.regionFactor,
        margin: margin * state.regionFactor,
        total: total * state.regionFactor,
        low,
        high,
        breakdown: {
          Arbeit: laborBase * state.regionFactor,
          Material: material * state.regionFactor,
          Geräte: equipment * state.regionFactor,
          Entsorgung: waste * state.regionFactor,
          "Unternehmensanteil & Organisation": margin * state.regionFactor,
        },
      };
    });
  }, [state]);

  const grand = calculations.reduce(
    (acc, c) => {
      acc.total += c.total;
      acc.low += c.low;
      acc.high += c.high;
      acc.subtotal += c.subtotal;
      return acc;
    },
    { total: 0, low: 0, high: 0, subtotal: 0 }
  );

  return (
    <div className='max-w-7xl mx-auto py-12 px-4'>
      <div className='mb-10 text-center'>
        <h1 className='text-3xl md:text-4xl font-bold mb-3'>
          Kostenrechner für Garten- & Landschaftsbau Projekte
        </h1>
        <p className='text-slate-600 max-w-3xl mx-auto'>
          Planen Sie Ihr Budget: Wählen Sie Leistungen, Mengen &
          Rahmenbedingungen und erhalten Sie eine unverbindliche
          Preisbandbreite. Alle Werte sind Schätzungen – das finale Angebot
          eines Fachbetriebs kann abweichen.
        </p>
      </div>

      {/* Service Selection */}
      <details className='mb-8 bg-white border rounded-lg p-5 group open:shadow-md'>
        <summary className='cursor-pointer font-semibold text-slate-800 flex items-center justify-between'>
          Leistungen auswählen{" "}
          <span className='text-xs text-slate-400 font-normal'>
            (Zum <span className='group-open:hidden'>Öffnen</span>
            <span className='hidden group-open:inline'>Schließen</span>)
          </span>
        </summary>
        <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 max-h-[320px] overflow-y-auto pr-1'>
          {SERVICE_CONFIGS.map((cfg) => {
            const active = state.selectedServiceIds.includes(cfg.id);
            return (
              <button
                type='button'
                key={cfg.id}
                onClick={() => toggleService(cfg.id)}
                className={`text-left text-xs rounded border px-3 py-2 transition relative ${
                  active
                    ? "bg-green-600 text-white border-green-600 shadow"
                    : "bg-white hover:bg-green-50 border-slate-300"
                }`}>
                <span className='font-semibold block mb-1'>{cfg.name}</span>
                <span className='block opacity-70'>
                  Basis Arbeit: {cfg.baseLaborRate}€/ {cfg.unit}
                </span>
                <span className='block opacity-70'>
                  Material: {cfg.materialCost}€/{cfg.unit}
                </span>
                {cfg.notes && (
                  <span className='mt-1 block italic opacity-60 line-clamp-2'>
                    {cfg.notes}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </details>

      {/* Global Modifiers (consumer focus) */}
      <div className='grid md:grid-cols-3 gap-6 mb-10'>
        <div className='bg-white border rounded-lg p-5'>
          <label className='block text-sm font-medium mb-2'>
            Preisniveau Region{" "}
            <span className='font-normal'>(0.85 – 1.25)</span>
          </label>
          <input
            type='range'
            min={0.85}
            max={1.25}
            step={0.01}
            value={state.regionFactor}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                regionFactor: parseFloat(e.target.value),
              }))
            }
            className='w-full'
          />
          <div className='text-xs text-slate-600 mt-1'>
            Aktuell: {state.regionFactor.toFixed(2)} • 1.00 = Durchschnitt
          </div>
        </div>
        <div className='bg-white border rounded-lg p-5 flex flex-col justify-between'>
          <div>
            <p className='block text-sm font-medium mb-2'>
              Mehrwertsteuer anzeigen
            </p>
            <label className='inline-flex items-center gap-2 text-xs'>
              <input
                type='checkbox'
                checked={state.includeVat}
                onChange={(e) =>
                  setState((s) => ({ ...s, includeVat: e.target.checked }))
                }
              />
              Preise inkl. 19% MwSt.
            </label>
          </div>
          <p className='text-[10px] text-slate-500 mt-3'>
            Bei Unternehmen oft netto relevant – für private Auftraggeber
            brutto.
          </p>
        </div>
        <div className='bg-white border rounded-lg p-5'>
          <p className='text-sm font-medium mb-2'>Hinweis</p>
          <p className='text-xs text-slate-600'>
            Unverbindliche Richtwerte. Objektbesichtigung, Boden, Zugang,
            Qualitätsanspruch & Materialvarianten beeinflussen den Endpreis.
          </p>
        </div>
      </div>

      {/* Inputs & Results */}
      <div className='space-y-10'>
        {state.selectedServiceIds.map((serviceId) => {
          const cfg = SERVICE_CONFIGS.find((s) => s.id === serviceId)!;
          const input = state.selections[serviceId] || {
            quantity: "",
            complexity: cfg.complexityFactors[0].id,
            materialProvided: false,
            difficultAccess: false,
            includeWaste: true,
          };
          const calc = calculations.find((c) => c.serviceId === serviceId)!;
          return (
            <div
              key={serviceId}
              className='bg-white border rounded-xl p-6 shadow-sm'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
                <h2 className='font-semibold text-lg'>{cfg.name}</h2>
                <button
                  type='button'
                  onClick={() => toggleService(serviceId)}
                  className='text-xs text-red-500 hover:underline'>
                  Entfernen
                </button>
              </div>
              <div className='grid md:grid-cols-5 gap-4'>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Menge ({cfg.unit})
                  </label>
                  <input
                    type='number'
                    min={0}
                    value={input.quantity === "" ? "" : input.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateServiceInput(serviceId, {
                        quantity:
                          val === ""
                            ? ""
                            : isNaN(parseFloat(val))
                            ? ""
                            : parseFloat(val),
                      });
                    }}
                    className='w-full border rounded px-2 py-1 text-sm'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Komplexität
                  </label>
                  <select
                    value={input.complexity}
                    onChange={(e) =>
                      updateServiceInput(serviceId, {
                        complexity: e.target.value,
                      })
                    }
                    className='w-full border rounded px-2 py-1 text-sm'>
                    {cfg.complexityFactors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {cfg.materialOptional && (
                  <div className='flex items-start gap-2 pt-5'>
                    <input
                      id={serviceId + "-mat"}
                      type='checkbox'
                      checked={input.materialProvided}
                      onChange={(e) =>
                        updateServiceInput(serviceId, {
                          materialProvided: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor={serviceId + "-mat"} className='text-xs'>
                      Material vorhanden
                    </label>
                  </div>
                )}
                <div className='flex items-start gap-2 pt-5'>
                  <input
                    id={serviceId + "-acc"}
                    type='checkbox'
                    checked={input.difficultAccess}
                    onChange={(e) =>
                      updateServiceInput(serviceId, {
                        difficultAccess: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor={serviceId + "-acc"} className='text-xs'>
                    Schwer zugänglich
                  </label>
                </div>
                <div className='flex items-start gap-2 pt-5'>
                  <input
                    id={serviceId + "-waste"}
                    type='checkbox'
                    checked={input.includeWaste}
                    onChange={(e) =>
                      updateServiceInput(serviceId, {
                        includeWaste: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor={serviceId + "-waste"} className='text-xs'>
                    Entsorgung einrechnen
                  </label>
                </div>
              </div>
              <div className='mt-5 grid md:grid-cols-4 gap-4 text-xs'>
                <div className='bg-slate-50 rounded p-3'>
                  <div className='font-semibold mb-1'>Arbeit</div>
                  <div>{numberFormat(calc.labor)}</div>
                </div>
                <div className='bg-slate-50 rounded p-3'>
                  <div className='font-semibold mb-1'>Material</div>
                  <div>{numberFormat(calc.material)}</div>
                </div>
                <div className='bg-slate-50 rounded p-3'>
                  <div className='font-semibold mb-1'>Geräte</div>
                  <div>{numberFormat(calc.equipment)}</div>
                </div>
                <div className='bg-slate-50 rounded p-3'>
                  <div className='font-semibold mb-1'>Entsorgung</div>
                  <div>{numberFormat(calc.waste)}</div>
                </div>
              </div>
              <div className='mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='text-sm'>
                  Schätzung: <strong>{numberFormat(calc.low)}</strong> –{" "}
                  <strong>{numberFormat(calc.high)}</strong> (Bandbreite)
                </div>
                <div className='text-[11px] text-slate-500'>
                  Alle internen Kalkulationsanteile enthalten • Regionfaktor{" "}
                  {state.regionFactor.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className='mt-12 bg-green-50 border border-green-200 rounded-xl p-6'>
        <h2 className='font-semibold text-lg mb-2'>Gesamte Preisbandbreite</h2>
        <p className='text-sm mb-4'>
          Aggregierte Schätzung für alle ausgewählten Leistungen
          {state.includeVat ? " (inkl. 19% MwSt.)" : " (netto)"}:
        </p>
        {(() => {
          const low = state.includeVat ? grand.low * 1.19 : grand.low;
          const high = state.includeVat ? grand.high * 1.19 : grand.high;
          return (
            <div className='text-xl font-bold'>
              {numberFormat(low)} – {numberFormat(high)}
            </div>
          );
        })()}
        <p className='text-xs text-slate-600 mt-3'>
          Diese Kalkulation ersetzt kein verbindliches Angebot. Fordern Sie für
          genaue Preise mehrere Vergleichsangebote an.
        </p>
        <div className='mt-4'>
          <a
            href='/auftrag-erstellen'
            className='inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-3 rounded-lg shadow'>
            Kostenlos Auftrag anlegen & Angebote erhalten
          </a>
        </div>
      </div>

      <div className='mt-8 text-center text-[10px] text-slate-400'>
        Letzte Aktualisierung der Kalkulationslogik: {new Date().getFullYear()}{" "}
        • Version 1.1 • Alle Angaben ohne Gewähr
      </div>
    </div>
  );
};

export default PriceCalculator;
