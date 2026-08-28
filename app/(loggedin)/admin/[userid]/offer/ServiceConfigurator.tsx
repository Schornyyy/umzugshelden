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
  PlanningDetails,
  ServiceKey,
} from "./OfferPlanner";

type ServiceConfiguratorProps = {
  service: ServiceKey;
  planning: PlanningDetails;
  kilometers: number;
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
}: Omit<ServiceConfiguratorProps, "service"> & { destination?: boolean }) {
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
      <ServiceHeader icon={Trash2} title='Entrümpelung kalkulieren' description='Volumen, Zugänglichkeit, schwere Gegenstände, Entsorgung und Wertanrechnung werden getrennt berücksichtigt.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <TextField label='Etage / Bereich' value={planning.oldFloor} onChange={(value) => onPlanningChange("oldFloor", value)} placeholder='z. B. Keller und 2. OG' />
        <NumberField label='Entsorgungsvolumen' value={planning.disposalVolumeM3} onChange={(value) => onPlanningChange("disposalVolumeM3", value)} suffix='m³' step='0.1' />
        <NumberField label='Schwere Gegenstände' value={planning.clearanceHeavyItems} onChange={(value) => onPlanningChange("clearanceHeavyItems", value)} suffix='Stk.' />
        <NumberField label='Wertanrechnung' value={planning.clearanceCredit} onChange={(value) => onPlanningChange("clearanceCredit", value)} suffix='EUR' step='0.01' />
      </div>
      <ComplexitySelector value={planning.moveComplexity} onChange={(value) => onPlanningChange("moveComplexity", value)} />
      <div className='mt-4 grid gap-2 sm:grid-cols-2'><ToggleField label='Aufzug vorhanden' checked={planning.oldElevator} onChange={(value) => onPlanningChange("oldElevator", value)} /><ToggleField label='Halteverbotszone nötig' checked={planning.parkingRequired} onChange={(value) => onPlanningChange("parkingRequired", value)} /></div>
    </div>
  );
}

function PaintingServiceCalculator(props: Omit<ServiceConfiguratorProps, "service">) {
  const { planning, kilometers, onPlanningChange, onKilometersChange } = props;
  return (
    <div>
      <ServiceHeader icon={Paintbrush} title='Malerarbeiten kalkulieren' description='Wand- und Deckenflächen, Anstriche, Ausbesserungen und Anfahrt werden separat berechnet.' />
      <AddressFields planning={planning} kilometers={kilometers} onPlanningChange={onPlanningChange} onKilometersChange={onKilometersChange} destination={false} />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <NumberField label='Wandfläche' value={planning.paintAreaM2} onChange={(value) => onPlanningChange("paintAreaM2", value)} suffix='m²' step='0.5' />
        <NumberField label='Deckenfläche' value={planning.ceilingAreaM2} onChange={(value) => onPlanningChange("ceilingAreaM2", value)} suffix='m²' step='0.5' />
        <NumberField label='Anstriche' value={planning.paintCoats} onChange={(value) => onPlanningChange("paintCoats", Math.max(1, value))} suffix='x' />
        <NumberField label='Ausbesserungsfläche' value={planning.repairAreaM2} onChange={(value) => onPlanningChange("repairAreaM2", value)} suffix='m²' step='0.5' />
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