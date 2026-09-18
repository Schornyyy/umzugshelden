"use client";

import {
  Box,
  Car,
  Home,
  PackagePlus,
  Palette,
  Plus,
  Paintbrush,
  Trash2,
  Warehouse,
  Wrench,
} from "lucide-react";
import type {
  MoveComplexity,
  PlanningDetails,
  ServiceKey,
} from "./OfferPlanner";
import type { CalculatedMaterial, MaterialCatalogItem } from "./materialCatalog";
import { calculatePaintingAreas } from "./paintingAreaCalculation";
import {
  calculatePaintColorAreas,
  paintSurfaceConditionOptions,
  summarizePaintColorAreas,
  type PaintColorPlan,
} from "./paintColorPlanning";

type ServiceConfiguratorProps = {
  service: ServiceKey;
  planning: PlanningDetails;
  kilometers: number;
  recommendedBoxes: number;
  calculatedMaterials: CalculatedMaterial[];
  materialCatalog: MaterialCatalogItem[];
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
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: string;
  disabled?: boolean;
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
          disabled={disabled}
          onChange={(event) => onChange(toNumber(event.target.value))}
          className='h-11 w-full rounded-md border border-slate-200 bg-white px-3 pr-14 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'
        />
        {suffix && <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>{suffix}</span>}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      <div className='mt-4 max-w-sm'>
        <NumberField label='Geplante Fahrten' value={planning.moveTrips} onChange={(value) => onPlanningChange("moveTrips", Math.max(1, value))} suffix='Fahrten' />
      </div>
      <details className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Angaben zu Zugang und Aufwand</summary>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <TextField label='Etage Auszug' value={planning.oldFloor} onChange={(value) => onPlanningChange("oldFloor", value)} placeholder='z. B. 3. OG' />
          <TextField label='Etage Einzug' value={planning.newFloor} onChange={(value) => onPlanningChange("newFloor", value)} placeholder='z. B. EG' />
          <NumberField label='Trageweg Auszug' value={planning.oldCarryDistanceM} onChange={(value) => onPlanningChange("oldCarryDistanceM", value)} suffix='m' />
          <NumberField label='Trageweg Einzug' value={planning.newCarryDistanceM} onChange={(value) => onPlanningChange("newCarryDistanceM", value)} suffix='m' />
          <NumberField label='Etagen Auszug' value={planning.oldFloorLevel} onChange={(value) => onPlanningChange("oldFloorLevel", value)} suffix='OG' />
          <NumberField label='Etagen Einzug' value={planning.newFloorLevel} onChange={(value) => onPlanningChange("newFloorLevel", value)} suffix='OG' />
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
        </div>
      </details>
    </div>
  );
}

function ClearanceServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Trash2} title='Entrümpelung kalkulieren' description='Volumen, Sondermüll, Container, Zugänglichkeit und Wertanrechnung werden getrennt berücksichtigt – mit oder ohne Entsorgung.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 max-w-sm'>
        <NumberField label='Entsorgungsvolumen (Sperrmüll)' value={planning.disposalVolumeM3} onChange={(value) => onPlanningChange("disposalVolumeM3", value)} suffix='m³' step='0.1' />
      </div>
      <div className='mt-4 max-w-md'>
        <ToggleField label='Entsorgung durch uns (inkl. Gebühren)' checked={planning.clearanceDisposalIncluded} onChange={(value) => onPlanningChange("clearanceDisposalIncluded", value)} />
      </div>
      <details className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Angaben zu Entsorgung und Aufwand</summary>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <TextField label='Etage / Bereich' value={planning.oldFloor} onChange={(value) => onPlanningChange("oldFloor", value)} placeholder='z. B. Keller und 2. OG' />
          <NumberField label='Sondermüll / Problemstoffe' value={planning.clearanceHazardousVolumeM3} onChange={(value) => onPlanningChange("clearanceHazardousVolumeM3", value)} suffix='m³' step='0.1' />
          <NumberField label='Container inkl. Stellung' value={planning.clearanceContainerCount} onChange={(value) => onPlanningChange("clearanceContainerCount", value)} suffix='Stk.' />
          <NumberField label='Schwere Gegenstände' value={planning.clearanceHeavyItems} onChange={(value) => onPlanningChange("clearanceHeavyItems", value)} suffix='Stk.' />
          <NumberField label='Wertanrechnung' value={planning.clearanceCredit} onChange={(value) => onPlanningChange("clearanceCredit", value)} suffix='EUR' step='0.01' />
        </div>
        <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
        <div className='mt-4 grid gap-2 sm:grid-cols-2'>
          <ToggleField label='Besenreine Übergabe' checked={planning.clearanceBroomClean} onChange={(value) => onPlanningChange("clearanceBroomClean", value)} />
          <ToggleField label='Aufzug vorhanden' checked={planning.oldElevator} onChange={(value) => onPlanningChange("oldElevator", value)} />
          <ToggleField label='Halteverbotszone nötig' checked={planning.parkingRequired} onChange={(value) => onPlanningChange("parkingRequired", value)} />
        </div>
      </details>
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

const materialQuantityFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

const paintColorPresets = [
  "#f8fafc",
  "#e2e8f0",
  "#f5e6d3",
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#fee2e2",
  "#1e293b",
];

function PaintingServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const {
    planning,
    kilometers,
    onPlanningChange,
    onKilometersChange,
    calculatedMaterials,
    materialCatalog,
  } = props;
  const areaEstimate = calculatePaintingAreas({
    livingAreaM2: planning.livingAreaM2,
    roomCount: planning.paintingRoomCount,
    roomHeightM: planning.roomHeightM,
    openingDeductionPercent: planning.openingDeductionPercent,
    roofSlopeType: planning.roofSlopeType,
    slopedRoomCount: planning.slopedRoomCount,
    kneeWallHeightM: planning.kneeWallHeightM,
    roofPitchDegrees: planning.roofPitchDegrees,
  });
  const wallpaperAreaM2 = planning.wallpaperEnabled
    ? planning.wallpaperAreaMode === "allWalls"
      ? planning.paintAreaM2
      : planning.wallpaperAreaM2
    : 0;
  const paintedWallAreaM2 = Math.max(
    0,
    planning.paintAreaM2 -
      (planning.wallpaperEnabled && !planning.paintWallpaper
        ? wallpaperAreaM2
        : 0)
  );
  const totalPaintAreaM2 = paintedWallAreaM2 + planning.ceilingAreaM2;
  const calculatedPaintColors = calculatePaintColorAreas(
    planning.paintColors,
    totalPaintAreaM2
  );
  const paintAreaSummary = summarizePaintColorAreas(
    calculatedPaintColors,
    totalPaintAreaM2
  );
  const wallPaintMaterials = materialCatalog.filter(
    (item) =>
      item.enabled &&
      item.service === "painting" &&
      item.materialType === "wallPaint"
  );
  const materialRequirements = calculatedMaterials.filter(
    (item) => item.service === "painting"
  );
  const wallpaperMaterial = materialRequirements.find(
    (item) => item.calculationBasis === "wallpaperAreaM2"
  );

  type AreaInputKey =
    | "livingAreaM2"
    | "paintingRoomCount"
    | "roomHeightM"
    | "openingDeductionPercent"
    | "roofSlopeType"
    | "slopedRoomCount"
    | "kneeWallHeightM"
    | "roofPitchDegrees";

  function applyAreaEstimate(nextPlanning: PlanningDetails) {
    const nextEstimate = calculatePaintingAreas({
      livingAreaM2: nextPlanning.livingAreaM2,
      roomCount: nextPlanning.paintingRoomCount,
      roomHeightM: nextPlanning.roomHeightM,
      openingDeductionPercent: nextPlanning.openingDeductionPercent,
      roofSlopeType: nextPlanning.roofSlopeType,
      slopedRoomCount: nextPlanning.slopedRoomCount,
      kneeWallHeightM: nextPlanning.kneeWallHeightM,
      roofPitchDegrees: nextPlanning.roofPitchDegrees,
    });
    onPlanningChange("paintAreaM2", nextEstimate.wallAreaM2);
    onPlanningChange("ceilingAreaM2", nextEstimate.ceilingAreaM2);
  }

  function updateAreaInput<Key extends AreaInputKey>(
    key: Key,
    value: PlanningDetails[Key]
  ) {
    const nextPlanning = { ...planning, [key]: value };
    onPlanningChange(key, value);
    if (planning.paintAreaAutoCalculate) applyAreaEstimate(nextPlanning);
  }

  function updateRoofSlopeType(value: PlanningDetails["roofSlopeType"]) {
    const slopedRoomCount =
      value === "none" ? 0 : Math.max(1, planning.slopedRoomCount);
    const nextPlanning = {
      ...planning,
      roofSlopeType: value,
      slopedRoomCount,
    };
    onPlanningChange("roofSlopeType", value);
    onPlanningChange("slopedRoomCount", slopedRoomCount);
    if (planning.paintAreaAutoCalculate) applyAreaEstimate(nextPlanning);
  }

  function toggleAutomaticArea(checked: boolean) {
    onPlanningChange("paintAreaAutoCalculate", checked);
    if (checked) applyAreaEstimate(planning);
  }

  function updatePaintColor(id: string, patch: Partial<PaintColorPlan>) {
    const effectiveAreas = new Map(
      calculatedPaintColors.map((color) => [color.id, color.effectiveAreaM2])
    );
    onPlanningChange(
      "paintColors",
      planning.paintColors.map((color) => {
        if (color.id === id) return { ...color, ...patch };
        if (patch.areaMode === "remaining" && color.areaMode === "remaining") {
          return {
            ...color,
            areaMode: "custom",
            areaM2: effectiveAreas.get(color.id) ?? color.areaM2,
          };
        }
        return color;
      })
    );
  }

  function addPaintColor() {
    const colorIndex = planning.paintColors.length;
    onPlanningChange("paintColors", [
      ...planning.paintColors,
      {
        id: crypto.randomUUID(),
        name: `Farbe ${colorIndex + 1}`,
        hexColor: paintColorPresets[colorIndex % paintColorPresets.length],
        areaMode: "custom",
        areaM2: 0,
        coats: Math.max(1, planning.paintCoats),
        materialId: wallPaintMaterials[0]?.id ?? "",
      },
    ]);
  }

  function removePaintColor(id: string) {
    if (planning.paintColors.length <= 1) return;
    const removedColor = planning.paintColors.find((color) => color.id === id);
    const nextColors = planning.paintColors.filter((color) => color.id !== id);
    if (
      removedColor?.areaMode === "remaining" &&
      !nextColors.some((color) => color.areaMode === "remaining")
    ) {
      nextColors[0] = { ...nextColors[0], areaMode: "remaining" };
    }
    onPlanningChange("paintColors", nextColors);
  }

  return (
    <div>
      <ServiceHeader icon={Paintbrush} title='Anstricharbeiten kalkulieren' description='Flächen, Anstriche, Spachtel- und Ausbesserungsarbeiten sowie die komplette Materialplanung mit Preisen – nur die Personalkosten laufen über die Konditionen.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <div className='mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
          <div>
            <p className='text-sm font-semibold text-slate-950'>Flächen automatisch ermitteln</p>
            <p className='mt-1 text-sm text-slate-600'>Aus Wohnfläche, Raumhöhe und Raumform werden Wand- und Deckenfläche geschätzt.</p>
          </div>
          <ToggleField label='Automatik' checked={planning.paintAreaAutoCalculate} onChange={toggleAutomaticArea} />
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <NumberField label='Wohnfläche' value={planning.livingAreaM2} onChange={(value) => updateAreaInput("livingAreaM2", value)} suffix='m²' step='0.5' />
          <NumberField label='Anzahl Räume' value={planning.paintingRoomCount} onChange={(value) => updateAreaInput("paintingRoomCount", Math.max(1, Math.round(value)))} suffix='Räume' />
          <NumberField label='Raumhöhe' value={planning.roomHeightM} onChange={(value) => updateAreaInput("roomHeightM", value)} suffix='m' step='0.05' />
          <NumberField label='Abzug Fenster & Türen' value={planning.openingDeductionPercent} onChange={(value) => updateAreaInput("openingDeductionPercent", Math.min(100, value))} suffix='%' step='1' />
          <SelectField
            label='Dachschrägen'
            value={planning.roofSlopeType}
            onChange={(value) => updateRoofSlopeType(value as PlanningDetails["roofSlopeType"])}
            options={[
              { value: "none", label: "Keine Schrägen" },
              { value: "single", label: "Einseitige Schräge" },
              { value: "double", label: "Zweiseitige Schrägen" },
            ]}
          />
          {planning.roofSlopeType !== "none" && <>
            <NumberField label='Schrägen in Räumen' value={planning.slopedRoomCount} onChange={(value) => updateAreaInput("slopedRoomCount", Math.min(planning.paintingRoomCount, Math.round(value)))} suffix='Räume' />
            <NumberField label='Kniestock / Schräge ab' value={planning.kneeWallHeightM} onChange={(value) => updateAreaInput("kneeWallHeightM", value)} suffix='m' step='0.1' />
            <NumberField label='Dachneigung' value={planning.roofPitchDegrees} onChange={(value) => updateAreaInput("roofPitchDegrees", value)} suffix='Grad' step='1' />
          </>}
        </div>
        <p className='mt-2 text-xs leading-5 text-slate-500'>Schätzwert: Die Räume werden für die Umfangsberechnung näherungsweise als gleich große, quadratische Räume angenommen. Fenster und Türen werden prozentual von der Wandfläche abgezogen.</p>
        <div className='mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-blue-200 bg-blue-50 text-center'>
          <div className='px-2 py-3'><span className='block text-xs text-slate-600'>Wandfläche</span><strong className='mt-1 block text-base text-slate-950'>{planning.paintAreaM2.toFixed(1)} m²</strong></div>
          <div className='border-x border-blue-200 px-2 py-3'><span className='block text-xs text-slate-600'>Deckenfläche</span><strong className='mt-1 block text-base text-slate-950'>{planning.ceilingAreaM2.toFixed(1)} m²</strong></div>
          <div className='px-2 py-3'><span className='block text-xs text-slate-600'>davon Schrägen</span><strong className='mt-1 block text-base text-slate-950'>{areaEstimate.roofSlopeAreaM2.toFixed(1)} m²</strong></div>
        </div>
      </div>
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <p className='mb-3 text-sm font-semibold text-slate-950'>Flächen & Arbeiten</p>
        <details className='rounded-md border border-slate-200 bg-slate-50 p-4'>
          <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Flächen korrigieren und Zusatzarbeiten</summary>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <NumberField label='Wandfläche' value={planning.paintAreaM2} onChange={(value) => onPlanningChange("paintAreaM2", value)} suffix='m²' step='0.5' disabled={planning.paintAreaAutoCalculate} />
            <NumberField label='Deckenfläche' value={planning.ceilingAreaM2} onChange={(value) => onPlanningChange("ceilingAreaM2", value)} suffix='m²' step='0.5' disabled={planning.paintAreaAutoCalculate} />
            <NumberField label='Ausbesserungsarbeiten' value={planning.repairAreaM2} onChange={(value) => onPlanningChange("repairAreaM2", value)} suffix='m²' step='0.5' />
            <NumberField label='Spachtelarbeiten' value={planning.plasterAreaM2} onChange={(value) => onPlanningChange("plasterAreaM2", value)} suffix='m²' step='0.5' />
          </div>
        </details>
      </div>
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <div className='mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
          <div className='flex items-start gap-3'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100'>
              <Palette size={17} />
            </span>
            <div>
              <p className='text-sm font-semibold text-slate-950'>Farben planen</p>
              <p className='mt-1 text-sm leading-5 text-slate-600'>
                Jede Farbe wird separat berechnet und auf volle Gebinde aufgerundet.
                Eine Farbe kann die verbleibende Fläche automatisch übernehmen.
              </p>
            </div>
          </div>
          <button type='button' onClick={addPaintColor} className='flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700'>
            <Plus size={16} /> Farbe hinzufügen
          </button>
        </div>

        <div className='mb-4 grid gap-4 sm:grid-cols-2'>
          <SelectField
            label='Untergrund'
            value={planning.paintSurfaceCondition}
            onChange={(value) => onPlanningChange("paintSurfaceCondition", value as PlanningDetails["paintSurfaceCondition"])}
            options={paintSurfaceConditionOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <NumberField label='Materialreserve' value={planning.paintReservePercent} onChange={(value) => onPlanningChange("paintReservePercent", Math.min(50, value))} suffix='%' step='1' />
        </div>

        {wallPaintMaterials.length === 0 && (
          <p className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
            In der Material-Preisliste fehlt eine aktive Position der Materialart „Wand- und Deckenfarbe“.
          </p>
        )}

        <div className='space-y-3'>
          {calculatedPaintColors.map((color) => {
            const calculatedMaterial = materialRequirements.find(
              (item) => item.id === `paint-color:${color.id}`
            );
            return (
              <div key={color.id} className='rounded-md border border-slate-200 bg-slate-50/70 p-3'>
                <div className='grid gap-3 lg:grid-cols-[52px_minmax(130px,1fr)_minmax(180px,1.4fr)_150px_120px_110px_40px] lg:items-end'>
                  <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                    Farbe
                    <input type='color' value={color.hexColor} onChange={(event) => updatePaintColor(color.id, { hexColor: event.target.value })} title={`Farbton ${color.name}`} className='h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white p-1' />
                  </label>
                  <TextField label='Bezeichnung' value={color.name} onChange={(value) => updatePaintColor(color.id, { name: value })} placeholder='z. B. Weiß, Akzent Blau' />
                  <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
                    Produkt aus Preisliste
                    <select value={color.materialId || wallPaintMaterials[0]?.id || ""} onChange={(event) => updatePaintColor(color.id, { materialId: event.target.value })} className='h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'>
                      {wallPaintMaterials.length === 0 && <option value=''>Keine Wandfarbe vorhanden</option>}
                      {wallPaintMaterials.map((item) => <option key={item.id} value={item.id}>{item.name} · {currencyFormatter.format(item.netPrice)}/{item.packageLabel}</option>)}
                    </select>
                  </label>
                  <SelectField label='Flächenzuordnung' value={color.areaMode} onChange={(value) => updatePaintColor(color.id, { areaMode: value as PaintColorPlan["areaMode"] })} options={[{ value: "remaining", label: "Rest automatisch" }, { value: "custom", label: "Feste Fläche" }]} />
                  {color.areaMode === "remaining" ? (
                    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
                      Fläche
                      <span className='flex h-11 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 font-semibold tabular-nums text-emerald-900'>{color.effectiveAreaM2.toFixed(1)} m²</span>
                    </label>
                  ) : (
                    <NumberField label='Fläche' value={color.areaM2} onChange={(value) => updatePaintColor(color.id, { areaM2: value })} suffix='m²' step='0.5' />
                  )}
                  <NumberField label='Anstriche' value={color.coats} onChange={(value) => updatePaintColor(color.id, { coats: Math.max(1, Math.round(value)) })} suffix='x' />
                  <button type='button' title='Farbe entfernen' onClick={() => removePaintColor(color.id)} disabled={planning.paintColors.length <= 1} className='flex h-10 w-10 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30'><Trash2 size={16} /></button>
                </div>
                <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs'>
                  <span className='text-slate-600'>{color.effectiveAreaM2.toFixed(1)} m² × {color.coats} Anstrich(e) = {color.coatedAreaM2.toFixed(1)} m² Anstrichfläche</span>
                  <strong className='text-slate-950'>{calculatedMaterial ? `${materialQuantityFormatter.format(calculatedMaterial.requiredAmount)} ${calculatedMaterial.unit} · ${calculatedMaterial.packageQuantity} × ${calculatedMaterial.packageLabel} · ${currencyFormatter.format(calculatedMaterial.netTotal)} netto` : "Materialprodukt auswählen"}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-blue-200 bg-blue-50 text-center'>
          <div className='px-2 py-3'><span className='block text-xs text-slate-600'>Zu streichen</span><strong className='mt-1 block text-base text-slate-950'>{totalPaintAreaM2.toFixed(1)} m²</strong></div>
          <div className='border-x border-blue-200 px-2 py-3'><span className='block text-xs text-slate-600'>Farben zugeordnet</span><strong className='mt-1 block text-base text-slate-950'>{paintAreaSummary.plannedAreaM2.toFixed(1)} m²</strong></div>
          <div className='px-2 py-3'><span className='block text-xs text-slate-600'>Anstrichfläche</span><strong className='mt-1 block text-base text-slate-950'>{calculatedPaintColors.reduce((total, item) => total + item.coatedAreaM2, 0).toFixed(1)} m²</strong></div>
        </div>
        {paintAreaSummary.unplannedAreaM2 > 0 && <p className='mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900'>{paintAreaSummary.unplannedAreaM2.toFixed(1)} m² sind noch keiner Farbe zugeordnet. Stelle eine Farbe auf „Rest automatisch“.</p>}
        {paintAreaSummary.overplannedAreaM2 > 0 && <p className='mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800'>Die Farbflächen überschreiten die zu streichende Fläche um {paintAreaSummary.overplannedAreaM2.toFixed(1)} m². Bitte die festen Flächen korrigieren.</p>}
      </div>
      <div className='mt-5 border-t border-slate-200 pt-4'>
        <div className='mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
          <div>
            <p className='text-sm font-semibold text-slate-950'>Tapetenarbeiten</p>
            <p className='mt-1 text-sm text-slate-600'>Fläche, Verschnitt, Rollenbedarf, Material und Arbeitszeit werden automatisch berücksichtigt.</p>
          </div>
          <ToggleField label='Tapete einplanen' checked={planning.wallpaperEnabled} onChange={(value) => onPlanningChange("wallpaperEnabled", value)} />
        </div>
        {planning.wallpaperEnabled && (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <SelectField
                label='Zu tapezierende Fläche'
                value={planning.wallpaperAreaMode}
                onChange={(value) => onPlanningChange("wallpaperAreaMode", value as PlanningDetails["wallpaperAreaMode"])}
                options={[
                  { value: "allWalls", label: "Gesamte Wandfläche" },
                  { value: "custom", label: "Teilfläche angeben" },
                ]}
              />
              {planning.wallpaperAreaMode === "custom" && <NumberField label='Tapetenfläche' value={planning.wallpaperAreaM2} onChange={(value) => onPlanningChange("wallpaperAreaM2", value)} suffix='m²' step='0.5' />}
              <NumberField label='Verschnitt' value={planning.wallpaperWastePercent} onChange={(value) => onPlanningChange("wallpaperWastePercent", Math.min(100, value))} suffix='%' step='1' />
            </div>
            <div className='mt-4 grid gap-2 sm:grid-cols-2'>
              <ToggleField label='Alte Tapete entfernen' checked={planning.removeOldWallpaper} onChange={(value) => onPlanningChange("removeOldWallpaper", value)} />
              <ToggleField label='Neue Tapete anschließend streichen' checked={planning.paintWallpaper} onChange={(value) => onPlanningChange("paintWallpaper", value)} />
            </div>
            <div className='mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm'>
              <span className='text-emerald-900'>{wallpaperAreaM2.toFixed(1)} m² Tapetenfläche inklusive {planning.wallpaperWastePercent}% Verschnitt</span>
              <strong className='text-base tabular-nums text-emerald-950'>{wallpaperMaterial?.packageQuantity ?? 0} × {wallpaperMaterial?.packageLabel ?? "Gebinde"} · {currencyFormatter.format(wallpaperMaterial?.netTotal ?? 0)} netto</strong>
            </div>
          </>
        )}
      </div>
      {materialRequirements.length > 0 && (
        <div className='mt-5 border-t border-slate-200 pt-4'>
          <div className='mb-3 flex items-start gap-3'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'>
              <Box size={17} />
            </span>
            <div>
              <p className='text-sm font-semibold text-slate-950'>Automatischer Materialbedarf</p>
              <p className='mt-1 text-sm leading-5 text-slate-600'>
                Mit 10 % Reserve. Die Schutzfläche entspricht der Deckenfläche;
                ohne Deckenangabe werden 25 % der Wandfläche angesetzt.
              </p>
            </div>
          </div>
          <div className='overflow-hidden rounded-md border border-slate-200'>
            <div className='hidden grid-cols-[minmax(0,1fr)_100px_120px_110px] gap-3 bg-slate-50 px-3 py-2 text-[11px] font-medium uppercase text-slate-500 sm:grid'>
              <span>Material</span>
              <span>Bedarf</span>
              <span>Einkaufen</span>
              <span>Netto</span>
            </div>
            <div className='divide-y divide-slate-200'>
              {materialRequirements.map((item) => (
                <div key={item.id} className='grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_100px_120px_110px] sm:items-center sm:gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-slate-950'>{item.name}</p>
                    <p className='mt-0.5 text-xs text-slate-500'>Automatisch aus den Angebotsdaten berechnet</p>
                  </div>
                  <p className='text-sm tabular-nums text-slate-700'>
                    <span className='mr-1 text-xs text-slate-500 sm:hidden'>Bedarf:</span>
                    {materialQuantityFormatter.format(item.requiredAmount)} {item.unit}
                  </p>
                  <p className='text-sm font-semibold tabular-nums text-slate-950'>
                    <span className='mr-1 text-xs font-normal text-slate-500 sm:hidden'>Einkaufen:</span>
                    {item.packageQuantity} × {item.packageLabel}
                  </p>
                  <p className='text-sm font-semibold tabular-nums text-slate-950'>{currencyFormatter.format(item.netTotal)} netto</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FurnitureServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Wrench} title='Möbelmontage kalkulieren' description='Stückzahl, Demontagezeit, Komplexität und Anfahrt ergeben den voraussichtlichen Aufwand.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 max-w-sm'><NumberField label='Möbelteile zur Montage' value={planning.furniturePieces} onChange={(value) => onPlanningChange("furniturePieces", value)} suffix='Teile' /></div>
      <details className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Angaben zur Montage</summary>
        <div className='mt-4'><NumberField label='Zusätzliche Demontage' value={planning.dismantlingHours} onChange={(value) => onPlanningChange("dismantlingHours", value)} suffix='Std.' step='0.25' /></div>
        <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
      </details>
    </div>
  );
}

function PackingServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const {
    planning,
    kilometers,
    recommendedBoxes,
    onPlanningChange,
    onKilometersChange,
  } = props;
  return (
    <div>
      <ServiceHeader icon={PackagePlus} title='Ein- und Auspackservice kalkulieren' description='Kartons, Auspackumfang, empfindliche Gegenstände und Anfahrt werden einzeln angesetzt.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 max-w-sm'><NumberField label='Kartons einpacken (0 = automatisch)' value={planning.movingBoxes} onChange={(value) => onPlanningChange("movingBoxes", value)} suffix='Stk.' /></div>
      {planning.movingBoxes === 0 && recommendedBoxes > 0 && (
        <p className='mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900'>Automatisch angesetzt: <strong>{recommendedBoxes} Kartons</strong> aus dem erfassten Umzugsvolumen.</p>
      )}
      <details className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Angaben zum Packservice</summary>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'><NumberField label='Kartons auspacken' value={planning.unpackingBoxes} onChange={(value) => onPlanningChange("unpackingBoxes", value)} suffix='Stk.' /><NumberField label='Empfindliche Gegenstände' value={planning.fragileItemCount} onChange={(value) => onPlanningChange("fragileItemCount", value)} suffix='Stk.' /></div>
      </details>
    </div>
  );
}

function StorageServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Warehouse} title='Einlagerung kalkulieren' description='Lagervolumen, Dauer, Abholung, Fahrten und Zugänglichkeit bilden eine transparente Monats- und Transportkalkulation.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'><NumberField label='Lagervolumen' value={planning.storageVolumeM3} onChange={(value) => onPlanningChange("storageVolumeM3", value)} suffix='m³' step='0.1' /><NumberField label='Lagerdauer' value={planning.storageMonths} onChange={(value) => onPlanningChange("storageMonths", Math.max(1, value))} suffix='Monate' /></div>
      <details className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Angaben zur Einlagerung</summary>
        <div className='mt-4'><NumberField label='Transportfahrten' value={planning.moveTrips} onChange={(value) => onPlanningChange("moveTrips", Math.max(1, value))} suffix='Fahrten' /></div>
        <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
      </details>
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