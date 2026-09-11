"use client";

import {
  Box,
  Car,
  Home,
  PackagePlus,
  Paintbrush,
  Trash2,
  Warehouse,
  Wrench,
} from "lucide-react";
import type {
  MoveComplexity,
  PaintingRates,
  PaintMaterialLine,
  PlanningDetails,
  ServiceKey,
} from "./OfferPlanner";
import { paintMaterialPerM2Price } from "./OfferPlanner";

type ServiceConfiguratorProps = {
  service: ServiceKey;
  planning: PlanningDetails;
  kilometers: number;
  paintingRates: PaintingRates;
  onPaintingRateChange: <Key extends keyof PaintingRates>(
    key: Key,
    value: PaintingRates[Key]
  ) => void;
  onPlanningChange: <Key extends keyof PlanningDetails>(
    key: Key,
    value: PlanningDetails[Key]
  ) => void;
  onKilometersChange: (value: number) => void;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
      {label}
      <div className='relative'>
        <input
          type='number'
          min='0'
          step={step}
          value={value}
          onChange={(event) => onChange(toNumber(event.target.value))}
          className='h-11 w-full rounded-md border border-slate-200 bg-white px-3 pr-14 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        />
        {suffix && <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>{suffix}</span>}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className='h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className='flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700'>
      <input type='checkbox' checked={checked} onChange={(event) => onChange(event.target.checked)} className='h-4 w-4 accent-blue-600' />
      {label}
    </label>
  );
}

function ServiceHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Car;
  title: string;
  description: string;
}) {
  return (
    <div className='mb-5 flex items-start gap-3 border-b border-slate-200 pb-4'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white'><Icon size={19} /></span>
      <div><h3 className='text-base font-semibold text-slate-950'>{title}</h3><p className='mt-1 text-sm leading-5 text-slate-600'>{description}</p></div>
    </div>
  );
}

function AddressFields({
  planning,
  kilometers,
  onPlanningChange,
  onKilometersChange,
  destination = true,
}: Pick<
  ServiceConfiguratorProps,
  "planning" | "kilometers" | "onPlanningChange" | "onKilometersChange"
> & { destination?: boolean }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <TextField label={destination ? "Auszugsadresse / Einsatzort" : "Einsatzort"} value={planning.oldAddress} onChange={(value) => onPlanningChange("oldAddress", value)} placeholder='Straße, PLZ Ort' />
      {destination && <TextField label='Einzugsadresse / Zielort' value={planning.newAddress} onChange={(value) => onPlanningChange("newAddress", value)} placeholder='Straße, PLZ Ort' />}
      <NumberField label='Fahrtstrecke gesamt' value={kilometers} onChange={onKilometersChange} suffix='km' step='0.1' />
      <NumberField label='Trageweg / Laufweg' value={planning.carryDistanceM} onChange={(value) => onPlanningChange("carryDistanceM", value)} suffix='m' />
    </div>
  );
}

function ComplexitySelector({
  value,
  onChange,
}: {
  value: MoveComplexity;
  onChange: (value: MoveComplexity) => void;
}) {
  return (
    <div className='mt-4'>
      <p className='mb-2 text-sm font-medium text-slate-700'>Zugänglichkeit und Aufwand</p>
      <div className='grid grid-cols-3 gap-2'>
        {([
          ["easy", "Einfach", "Kurze Wege, ebenerdig"],
          ["standard", "Normal", "Übliche Bedingungen"],
          ["difficult", "Schwierig", "Eng, schwer oder viele Etagen"],
        ] as const).map(([option, label, description]) => (
          <button key={option} type='button' onClick={() => onChange(option)} className={`min-h-20 rounded-md border p-2 text-left ${value === option ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-blue-300"}`}>
            <span className='block text-sm font-semibold text-slate-950'>{label}</span><span className='mt-1 block text-[11px] leading-4 text-slate-500'>{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MoveServiceCalculator(props: Omit<ServiceConfiguratorProps, "service"> & { senior: boolean }) {
  const { planning, kilometers, onPlanningChange, onKilometersChange, senior } = props;
  return (
    <div>
      <ServiceHeader icon={senior ? Home : Car} title={senior ? "Seniorenumzug kalkulieren" : "Umzug kalkulieren"} description='Adressen, Zugänge, Inventar, Fahrten und Zusatzaufwand bestimmen Personal und Fahrzeuge.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <TextField label='Etage Auszug' value={planning.oldFloor} onChange={(value) => onPlanningChange("oldFloor", value)} placeholder='z. B. 3. OG' />
        <TextField label='Etage Einzug' value={planning.newFloor} onChange={(value) => onPlanningChange("newFloor", value)} placeholder='z. B. EG' />
        <NumberField label='Trageweg Auszug' value={planning.oldCarryDistanceM} onChange={(value) => onPlanningChange("oldCarryDistanceM", value)} suffix='m' />
        <NumberField label='Trageweg Einzug' value={planning.newCarryDistanceM} onChange={(value) => onPlanningChange("newCarryDistanceM", value)} suffix='m' />
        <NumberField label='Etagen Auszug' value={planning.oldFloorLevel} onChange={(value) => onPlanningChange("oldFloorLevel", value)} suffix='OG' />
        <NumberField label='Etagen Einzug' value={planning.newFloorLevel} onChange={(value) => onPlanningChange("newFloorLevel", value)} suffix='OG' />
        <NumberField label='Geplante Fahrten' value={planning.moveTrips} onChange={(value) => onPlanningChange("moveTrips", Math.max(1, value))} suffix='Fahrten' />
        <NumberField label='Wunsch-Teamgröße' value={planning.moveCrewPreference} onChange={(value) => onPlanningChange("moveCrewPreference", value)} suffix='Pers.' />
        <NumberField label='Demontage / Montage' value={planning.dismantlingHours} onChange={(value) => onPlanningChange("dismantlingHours", value)} suffix='Std.' step='0.25' />
        <NumberField label='Spezialgegenstände' value={planning.specialItemCount} onChange={(value) => onPlanningChange("specialItemCount", value)} suffix='Stk.' />
        <NumberField label='Zeitpuffer' value={planning.moveBufferHours} onChange={(value) => onPlanningChange("moveBufferHours", value)} suffix='Std.' step='0.25' />
        {senior && <NumberField label='Betreuung / Organisation' value={planning.careHours} onChange={(value) => onPlanningChange("careHours", value)} suffix='Std.' step='0.25' />}
      </div>
      <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        <ToggleField label='Aufzug am Auszug' checked={planning.oldElevator} onChange={(value) => onPlanningChange("oldElevator", value)} />
        <ToggleField label='Aufzug am Einzug' checked={planning.newElevator} onChange={(value) => onPlanningChange("newElevator", value)} />
        <ToggleField label='Möbellift erforderlich' checked={planning.furnitureLiftRequired} onChange={(value) => onPlanningChange("furnitureLiftRequired", value)} />
        <ToggleField label='Halteverbotszone nötig' checked={planning.parkingRequired} onChange={(value) => onPlanningChange("parkingRequired", value)} />
        <ToggleField label='Einpackservice nötig' checked={planning.packingRequired} onChange={(value) => onPlanningChange("packingRequired", value)} />
      </div>
    </div>
  );
}

function ClearanceServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Trash2} title='Entrümpelung kalkulieren' description='Volumen, Sondermüll, Container, Zugänglichkeit und Wertanrechnung werden getrennt berücksichtigt – mit oder ohne Entsorgung.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <TextField label='Etage / Bereich' value={planning.oldFloor} onChange={(value) => onPlanningChange("oldFloor", value)} placeholder='z. B. Keller und 2. OG' />
        <NumberField label='Entsorgungsvolumen (Sperrmüll)' value={planning.disposalVolumeM3} onChange={(value) => onPlanningChange("disposalVolumeM3", value)} suffix='m³' step='0.1' />
        <NumberField label='Sondermüll / Problemstoffe' value={planning.clearanceHazardousVolumeM3} onChange={(value) => onPlanningChange("clearanceHazardousVolumeM3", value)} suffix='m³' step='0.1' />
        <NumberField label='Container inkl. Stellung' value={planning.clearanceContainerCount} onChange={(value) => onPlanningChange("clearanceContainerCount", value)} suffix='Stk.' />
        <NumberField label='Schwere Gegenstände' value={planning.clearanceHeavyItems} onChange={(value) => onPlanningChange("clearanceHeavyItems", value)} suffix='Stk.' />
        <NumberField label='Wertanrechnung' value={planning.clearanceCredit} onChange={(value) => onPlanningChange("clearanceCredit", value)} suffix='EUR' step='0.01' />
      </div>
      <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        <ToggleField label='Entsorgung durch uns (inkl. Gebühren)' checked={planning.clearanceDisposalIncluded} onChange={(value) => onPlanningChange("clearanceDisposalIncluded", value)} />
        <ToggleField label='Besenreine Übergabe' checked={planning.clearanceBroomClean} onChange={(value) => onPlanningChange("clearanceBroomClean", value)} />
        <ToggleField label='Aufzug vorhanden' checked={planning.oldElevator} onChange={(value) => onPlanningChange("oldElevator", value)} />
        <ToggleField label='Halteverbotszone nötig' checked={planning.parkingRequired} onChange={(value) => onPlanningChange("parkingRequired", value)} />
      </div>
      {!planning.clearanceDisposalIncluded && (
        <p className='mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
          Ohne Entsorgung werden nur Arbeitszeit, Anfahrt und ggf. Container berechnet – die Entsorgungsgebühren je m³ entfallen.
        </p>
      )}
    </div>
  );
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const commonPaintMaterials = [
  { name: "Wandfarbe weiß (12,5 l)", unitPrice: 45, liters: 12.5, coverageM2PerLiter: 7 },
  { name: "Grundierung / Tiefengrund (10 l)", unitPrice: 25, liters: 10, coverageM2PerLiter: 10 },
  { name: "Spachtelmasse (25 kg)", unitPrice: 18, liters: 0, coverageM2PerLiter: 0 },
  { name: "Abdeckvlies (50 m²)", unitPrice: 22, liters: 0, coverageM2PerLiter: 0 },
  { name: "Malerkrepp / Abklebeband", unitPrice: 6, liters: 0, coverageM2PerLiter: 0 },
  { name: "Rollen & Pinsel-Set", unitPrice: 15, liters: 0, coverageM2PerLiter: 0 },
];

function PaintingServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const {
    planning,
    kilometers,
    onPlanningChange,
    onKilometersChange,
    paintingRates,
    onPaintingRateChange,
  } = props;
  const paintArea =
    (planning.paintAreaM2 + planning.ceilingAreaM2) *
    Math.max(1, planning.paintCoats);
  const plasterRepairArea = planning.repairAreaM2 + planning.plasterAreaM2;
  const areaMaterialCost =
    paintArea * paintingRates.paintMaterialPerM2 +
    plasterRepairArea * paintingRates.plasterMaterialPerM2;
  const ratePerM2FromList = planning.paintMaterials.reduce(
    (total, item) => total + paintMaterialPerM2Price(item),
    0
  );
  const materialListCost = planning.paintMaterials.reduce(
    (total, item) =>
      paintMaterialPerM2Price(item) > 0
        ? total
        : total + item.quantity * item.unitPrice,
    0
  );

  function applyMaterials(next: PaintMaterialLine[]) {
    onPlanningChange("paintMaterials", next);
    const rate = next.reduce(
      (total, item) => total + paintMaterialPerM2Price(item),
      0
    );
    if (rate > 0) {
      onPaintingRateChange("paintMaterialPerM2", Math.round(rate * 100) / 100);
    }
  }

  function addMaterial(item?: {
    name: string;
    unitPrice: number;
    liters: number;
    coverageM2PerLiter: number;
  }) {
    applyMaterials([
      ...planning.paintMaterials,
      {
        id: crypto.randomUUID(),
        name: item?.name ?? "Material",
        quantity: 1,
        unitPrice: item?.unitPrice ?? 0,
        liters: item?.liters ?? 0,
        coverageM2PerLiter: item?.coverageM2PerLiter ?? 0,
      },
    ]);
  }

  function updateMaterial(id: string, patch: Partial<PaintMaterialLine>) {
    applyMaterials(
      planning.paintMaterials.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function removeMaterial(id: string) {
    applyMaterials(planning.paintMaterials.filter((item) => item.id !== id));
  }

  return (
    <div>
      <ServiceHeader icon={Paintbrush} title='Malerarbeiten kalkulieren' description='Flächen, Anstriche, Spachtel- und Ausbesserungsarbeiten sowie die komplette Materialplanung mit Preisen – nur die Personalkosten laufen über die Konditionen.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <p className='mb-3 text-sm font-semibold text-slate-950'>Flächen & Arbeiten</p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <NumberField label='Wandfläche' value={planning.paintAreaM2} onChange={(value) => onPlanningChange("paintAreaM2", value)} suffix='m²' step='0.5' />
          <NumberField label='Deckenfläche' value={planning.ceilingAreaM2} onChange={(value) => onPlanningChange("ceilingAreaM2", value)} suffix='m²' step='0.5' />
          <NumberField label='Anstriche' value={planning.paintCoats} onChange={(value) => onPlanningChange("paintCoats", Math.max(1, value))} suffix='x' />
          <NumberField label='Ausbesserungsarbeiten' value={planning.repairAreaM2} onChange={(value) => onPlanningChange("repairAreaM2", value)} suffix='m²' step='0.5' />
          <NumberField label='Spachtelarbeiten' value={planning.plasterAreaM2} onChange={(value) => onPlanningChange("plasterAreaM2", value)} suffix='m²' step='0.5' />
        </div>
      </div>
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <p className='mb-1 text-sm font-semibold text-slate-950'>Materialpreise je m²</p>
        <p className='mb-3 text-sm text-slate-600'>Der Farbpreis je m² wird automatisch aus der Materialliste berechnet, sobald dort Gebinde mit Liter- und Ergiebigkeitsangabe eingetragen sind – er lässt sich hier auch manuell übersteuern.</p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <NumberField label='Farbe & Material je m² und Anstrich' value={paintingRates.paintMaterialPerM2} onChange={(value) => onPaintingRateChange("paintMaterialPerM2", value)} suffix='EUR' step='0.01' />
          <NumberField label='Spachtel-/Ausbesserungsmaterial je m²' value={paintingRates.plasterMaterialPerM2} onChange={(value) => onPaintingRateChange("plasterMaterialPerM2", value)} suffix='EUR' step='0.01' />
        </div>
      </div>
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <div className='mb-1 flex items-center justify-between gap-2'>
          <p className='text-sm font-semibold text-slate-950'>Materialliste</p>
          <button type='button' onClick={() => addMaterial()} className='flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700'>
            <PackagePlus size={15} /> Material
          </button>
        </div>
        <p className='mb-3 text-sm text-slate-600'>Gebinde mit Liter- und Ergiebigkeitsangabe (m²/l) fließen automatisch als Preis je m² in die Flächenberechnung ein. Material ohne Literangabe wird pauschal mit Menge × Einzelpreis übernommen.</p>
        <div className='mb-1 hidden grid-cols-[minmax(0,1fr)_56px_64px_64px_96px_36px] gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:grid'>
          <span>Material</span><span>Menge</span><span>Liter</span><span>m²/l</span><span>Preis</span><span />
        </div>
        <div className='space-y-2'>
          {planning.paintMaterials.map((item) => {
            const perM2 = paintMaterialPerM2Price(item);
            return (
              <div key={item.id}>
                <div className='grid grid-cols-[minmax(0,1fr)_44px_52px_52px_84px_32px] gap-1.5 sm:grid-cols-[minmax(0,1fr)_56px_64px_64px_96px_36px] sm:gap-2'>
                  <input value={item.name} onChange={(event) => updateMaterial(item.id, { name: event.target.value })} aria-label='Material' className='h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-blue-500' />
                  <input type='number' min='0' value={item.quantity} onChange={(event) => updateMaterial(item.id, { quantity: toNumber(event.target.value) })} aria-label='Menge' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-blue-500' />
                  <input type='number' min='0' step='0.5' value={item.liters} onChange={(event) => updateMaterial(item.id, { liters: toNumber(event.target.value) })} aria-label='Gebindegröße in Litern' title='Gebindegröße in Litern' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-blue-500' />
                  <input type='number' min='0' step='0.5' value={item.coverageM2PerLiter} onChange={(event) => updateMaterial(item.id, { coverageM2PerLiter: toNumber(event.target.value) })} aria-label='Ergiebigkeit in m² pro Liter' title='Ergiebigkeit in m² pro Liter' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-blue-500' />
                  <div className='relative'>
                    <input type='number' min='0' step='0.01' value={item.unitPrice} onChange={(event) => updateMaterial(item.id, { unitPrice: toNumber(event.target.value) })} aria-label='Preis je Gebinde' className='h-9 w-full rounded-md border border-slate-300 px-2 pr-9 text-sm outline-none focus:border-blue-500' />
                    <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>EUR</span>
                  </div>
                  <button type='button' title='Material entfernen' onClick={() => removeMaterial(item.id)} className='flex h-9 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 sm:w-9'><Trash2 size={16} /></button>
                </div>
                {perM2 > 0 && (
                  <p className='mt-1 text-xs text-emerald-700'>
                    {item.liters} l × {item.coverageM2PerLiter} m²/l = {(item.liters * item.coverageM2PerLiter).toFixed(0)} m² Reichweite → {currencyFormatter.format(perM2)}/m² (automatisch übernommen)
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <span className='text-xs text-slate-500'>Schnell hinzufügen:</span>
          {commonPaintMaterials.map((item) => (
            <button key={item.name} type='button' onClick={() => addMaterial(item)} className='rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-blue-400 hover:text-blue-700'>{item.name}</button>
          ))}
        </div>
        <div className='mt-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm'>
          {ratePerM2FromList > 0 && (
            <div className='flex items-center justify-between gap-4'><span className='text-slate-600'>Farbpreis aus Materialliste</span><strong className='tabular-nums text-slate-950'>{currencyFormatter.format(ratePerM2FromList)}/m²</strong></div>
          )}
          <div className='flex items-center justify-between gap-4'><span className='text-slate-600'>Material aus Flächen ({paintArea.toFixed(1)} m² Anstrich + {plasterRepairArea.toFixed(1)} m² Spachtel/Ausbesserung)</span><strong className='tabular-nums text-slate-950'>{currencyFormatter.format(areaMaterialCost)}</strong></div>
          <div className='flex items-center justify-between gap-4'><span className='text-slate-600'>Materialliste (Pauschalmaterial ohne Literangabe)</span><strong className='tabular-nums text-slate-950'>{currencyFormatter.format(materialListCost)}</strong></div>
          <div className='flex items-center justify-between gap-4 border-t border-slate-200 pt-2'><span className='font-medium text-slate-700'>Material gesamt (ohne Personal)</span><strong className='tabular-nums text-slate-950'>{currencyFormatter.format(areaMaterialCost + materialListCost)}</strong></div>
        </div>
      </div>
    </div>
  );
}

function FurnitureServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Wrench} title='Möbelmontage kalkulieren' description='Stückzahl, Demontagezeit, Komplexität und Anfahrt ergeben den voraussichtlichen Aufwand.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'><NumberField label='Möbelteile zur Montage' value={planning.furniturePieces} onChange={(value) => onPlanningChange("furniturePieces", value)} suffix='Teile' /><NumberField label='Zusätzliche Demontage' value={planning.dismantlingHours} onChange={(value) => onPlanningChange("dismantlingHours", value)} suffix='Std.' step='0.25' /></div>
      <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
    </div>
  );
}

function PackingServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={PackagePlus} title='Ein- und Auspackservice kalkulieren' description='Kartons, Auspackumfang, empfindliche Gegenstände und Anfahrt werden einzeln angesetzt.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'><NumberField label='Kartons einpacken' value={planning.movingBoxes} onChange={(value) => onPlanningChange("movingBoxes", value)} suffix='Stk.' /><NumberField label='Kartons auspacken' value={planning.unpackingBoxes} onChange={(value) => onPlanningChange("unpackingBoxes", value)} suffix='Stk.' /><NumberField label='Empfindliche Gegenstände' value={planning.fragileItemCount} onChange={(value) => onPlanningChange("fragileItemCount", value)} suffix='Stk.' /></div>
    </div>
  );
}

function StorageServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Warehouse} title='Einlagerung kalkulieren' description='Lagervolumen, Dauer, Abholung, Fahrten und Zugänglichkeit bilden eine transparente Monats- und Transportkalkulation.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'><NumberField label='Lagervolumen' value={planning.storageVolumeM3} onChange={(value) => onPlanningChange("storageVolumeM3", value)} suffix='m³' step='0.1' /><NumberField label='Lagerdauer' value={planning.storageMonths} onChange={(value) => onPlanningChange("storageMonths", Math.max(1, value))} suffix='Monate' /><NumberField label='Transportfahrten' value={planning.moveTrips} onChange={(value) => onPlanningChange("moveTrips", Math.max(1, value))} suffix='Fahrten' /></div>
      <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
    </div>
  );
}

export default function ServiceConfigurator({ service, ...props }: ServiceConfiguratorProps) {
  const calculators: Record<ServiceKey, React.ReactNode> = {
    move: <MoveServiceCalculator {...props} senior={false} />,
    seniorMove: <MoveServiceCalculator {...props} senior />,
    clearance: <ClearanceServiceCalculator {...props} />,
    painting: <PaintingServiceCalculator {...props} />,
    furnitureAssembly: <FurnitureServiceCalculator {...props} />,
    packing: <PackingServiceCalculator {...props} />,
    storage: <StorageServiceCalculator {...props} />,
  };

  return calculators[service] ?? <div className='flex items-center gap-2 text-sm text-slate-500'><Box size={16} /> Dienstleistung auswählen</div>;
}