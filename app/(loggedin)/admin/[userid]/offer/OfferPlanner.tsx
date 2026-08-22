"use client";

import { Button } from "@/components/ui/button";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { database } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calculator,
  Car,
  Check,
  ClipboardList,
  Clock3,
  Euro,
  Home,
  ImagePlus,
  LoaderCircle,
  MapPin,
  PackagePlus,
  Paintbrush,
  Printer,
  Save,
  Trash2,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

type PlanningStep = "order" | "site" | "inventory" | "price" | "finish";

type ServiceKey =
  | "move"
  | "seniorMove"
  | "clearance"
  | "painting"
  | "furnitureAssembly"
  | "packing"
  | "storage";

type MoveComplexity = "easy" | "standard" | "difficult";

type Rates = {
  employeeHourlyRate: number;
  vehicleDailyRate: number;
  kilometerRate: number;
  planningFee: number;
  surchargePercent: number;
  vatPercent: number;
  paintMaterialPerM2: number;
  paintLaborHoursPerM2: number;
  furnitureAssemblyMinutesPerPiece: number;
  disposalRatePerM3: number;
  storageRatePerM3Month: number;
  packingBoxRate: number;
  packingMinutesPerBox: number;
  furnitureLiftDailyRate: number;
  parkingPermitRate: number;
};

type ServiceLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  volumeM3: number;
};

type Room = {
  id: string;
  name: string;
  items: InventoryItem[];
};

type VehicleSelection = {
  vehicleId: string;
  quantity: number;
};

type PlanningDetails = {
  serviceTypes: ServiceKey[];
  date: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  oldAddress: string;
  newAddress: string;
  oldFloor: string;
  newFloor: string;
  oldElevator: boolean;
  newElevator: boolean;
  carryDistanceM: number;
  oldCarryDistanceM: number;
  newCarryDistanceM: number;
  oldFloorLevel: number;
  newFloorLevel: number;
  moveComplexity: MoveComplexity;
  moveCrewPreference: number;
  moveTrips: number;
  dismantlingHours: number;
  specialItemCount: number;
  moveBufferHours: number;
  furnitureLiftRequired: boolean;
  parkingRequired: boolean;
  packingRequired: boolean;
  paintAreaM2: number;
  paintCoats: number;
  repairAreaM2: number;
  furniturePieces: number;
  movingBoxes: number;
  storageVolumeM3: number;
  storageMonths: number;
  disposalVolumeM3: number;
  vehicleSelections: VehicleSelection[];
  notes: string;
  rooms: Room[];
  extraServices: ServiceLine[];
  photoUrls: string[];
};

type Calculation = {
  title: string;
  customer: string;
  employees: number;
  hoursPerEmployee: number;
  kilometers: number;
  vehicleDays: number;
  materialCost: number;
  disposalCost: number;
  storageCost: number;
  logisticsCost: number;
  otherCost: number;
  autoEstimate: boolean;
  planning: PlanningDetails;
};

type SavedCalculation = Calculation & {
  id: string;
  createdAt: number;
  rates: Rates;
};

type CalculatorData = {
  rates: Rates;
  calculation: Calculation;
  savedCalculations: SavedCalculation[];
};

const storageCollection = "offer_calculators_umzugshelden";

const serviceOptions: Array<{
  id: ServiceKey;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  { id: "move", label: "Umzug", description: "Volumen, Personal und Fahrzeuge", icon: Car },
  { id: "seniorMove", label: "Seniorenumzug", description: "Mehr Zeit fuer Betreuung und Sorgfalt", icon: Home },
  { id: "clearance", label: "Entruempelung", description: "Volumen, Personal und Entsorgung", icon: Trash2 },
  { id: "painting", label: "Malerarbeiten", description: "Flaeche, Anstriche und Material", icon: Paintbrush },
  { id: "furnitureAssembly", label: "Moebelmontage", description: "Moebelteile und Montagezeit", icon: Wrench },
  { id: "packing", label: "Einpackservice", description: "Kartons, Material und Zeit", icon: PackagePlus },
  { id: "storage", label: "Einlagerung", description: "Volumen, Dauer und Transport", icon: Warehouse },
];

const vehicleOptions = [
  { id: "transporter", name: "Transporter", capacityM3: 12, dailyRate: 79 },
  { id: "truck-3-5t", name: "3,5-t Koffer", capacityM3: 20, dailyRate: 95 },
  { id: "truck-7-5t", name: "7,5-t LKW", capacityM3: 35, dailyRate: 165 },
  { id: "truck-12t", name: "12-t LKW", capacityM3: 50, dailyRate: 235 },
] as const;

const planningSteps: Array<{
  id: PlanningStep;
  label: string;
  shortLabel: string;
  icon: typeof ClipboardList;
}> = [
  { id: "order", label: "Auftrag", shortLabel: "1", icon: ClipboardList },
  { id: "site", label: "Vor Ort", shortLabel: "2", icon: MapPin },
  { id: "inventory", label: "Inventar", shortLabel: "3", icon: Box },
  { id: "price", label: "Angebot", shortLabel: "4", icon: Euro },
  { id: "finish", label: "Abschluss", shortLabel: "5", icon: Check },
];

const commonInventoryItems = [
  { name: "Sofa", volumeM3: 1.8 },
  { name: "Bett", volumeM3: 1.4 },
  { name: "Kleiderschrank", volumeM3: 2.2 },
  { name: "Waschmaschine", volumeM3: 0.4 },
  { name: "Umzugskarton", volumeM3: 0.08 },
];

const defaultRates: Rates = {
  employeeHourlyRate: 42,
  vehicleDailyRate: 95,
  kilometerRate: 0.75,
  planningFee: 45,
  surchargePercent: 15,
  vatPercent: 19,
  paintMaterialPerM2: 4.5,
  paintLaborHoursPerM2: 0.12,
  furnitureAssemblyMinutesPerPiece: 30,
  disposalRatePerM3: 65,
  storageRatePerM3Month: 8,
  packingBoxRate: 2.5,
  packingMinutesPerBox: 5,
  furnitureLiftDailyRate: 280,
  parkingPermitRate: 120,
};

const legacyServiceMap: Record<string, ServiceKey> = {
  Umzug: "move",
  Seniorenumzug: "seniorMove",
  Entruempelung: "clearance",
  Malerarbeiten: "painting",
  Moebelmontage: "furnitureAssembly",
  Einpackservice: "packing",
  Einlagerung: "storage",
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function createPlanning(): PlanningDetails {
  return {
    serviceTypes: [],
    date: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    oldAddress: "",
    newAddress: "",
    oldFloor: "",
    newFloor: "",
    oldElevator: false,
    newElevator: false,
    carryDistanceM: 0,
    oldCarryDistanceM: 0,
    newCarryDistanceM: 0,
    oldFloorLevel: 0,
    newFloorLevel: 0,
    moveComplexity: "standard",
    moveCrewPreference: 0,
    moveTrips: 1,
    dismantlingHours: 0,
    specialItemCount: 0,
    moveBufferHours: 0,
    furnitureLiftRequired: false,
    parkingRequired: false,
    packingRequired: false,
    paintAreaM2: 0,
    paintCoats: 2,
    repairAreaM2: 0,
    furniturePieces: 0,
    movingBoxes: 0,
    storageVolumeM3: 0,
    storageMonths: 1,
    disposalVolumeM3: 0,
    vehicleSelections: [],
    notes: "",
    rooms: [
      {
        id: crypto.randomUUID(),
        name: "Wohnzimmer",
        items: [],
      },
    ],
    extraServices: [],
    photoUrls: [],
  };
}

function createCalculation(): Calculation {
  return {
    title: "Neues Angebot",
    customer: "",
    employees: 2,
    hoursPerEmployee: 4,
    kilometers: 30,
    vehicleDays: 1,
    materialCost: 0,
    disposalCost: 0,
    storageCost: 0,
    logisticsCost: 0,
    otherCost: 0,
    autoEstimate: true,
    planning: createPlanning(),
  };
}

function normalizeServiceTypes(serviceTypes: unknown): ServiceKey[] {
  if (!Array.isArray(serviceTypes)) return [];

  const serviceIds = new Set(serviceOptions.map((service) => service.id));
  return serviceTypes.flatMap((service) => {
    if (typeof service !== "string") return [];
    if (serviceIds.has(service as ServiceKey)) return [service as ServiceKey];
    return legacyServiceMap[service] ? [legacyServiceMap[service]] : [];
  });
}

function normalizePlanning(planning?: Partial<PlanningDetails>): PlanningDetails {
  const fallback = createPlanning();
  return {
    ...fallback,
    ...planning,
    serviceTypes: normalizeServiceTypes(planning?.serviceTypes),
    rooms: planning?.rooms ?? fallback.rooms,
    extraServices: planning?.extraServices ?? [],
    photoUrls: planning?.photoUrls ?? [],
    vehicleSelections: planning?.vehicleSelections ?? [],
  };
}

function normalizeCalculation(calculation?: Partial<Calculation>): Calculation {
  const fallback = createCalculation();
  return {
    ...fallback,
    ...calculation,
    planning: normalizePlanning(calculation?.planning),
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function calculateVolume(rooms: Room[]) {
  return rooms.reduce(
    (total, room) =>
      total +
      room.items.reduce(
        (roomTotal, item) => roomTotal + item.quantity * item.volumeM3,
        0
      ),
    0
  );
}

function calculateExtraServices(extraServices: ServiceLine[]) {
  return extraServices.reduce(
    (total, service) => total + service.quantity * service.unitPrice,
    0
  );
}

function calculateRecommendedVehicles(requiredVolumeM3: number): VehicleSelection[] {
  if (requiredVolumeM3 <= 0) return [];

  const selectedVehicles: VehicleSelection[] = [];
  let remainingVolume = requiredVolumeM3;

  while (remainingVolume > 0.01) {
    const vehicle = vehicleOptions.find(
      (option) => option.capacityM3 >= remainingVolume
    ) ?? vehicleOptions[vehicleOptions.length - 1];
    const existing = selectedVehicles.find(
      (selection) => selection.vehicleId === vehicle.id
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      selectedVehicles.push({ vehicleId: vehicle.id, quantity: 1 });
    }
    remainingVolume -= vehicle.capacityM3;
  }

  return selectedVehicles;
}

function calculateVehicleCost(
  selections: VehicleSelection[],
  vehicleDays: number
) {
  return selections.reduce((total, selection) => {
    const vehicle = vehicleOptions.find(
      (option) => option.id === selection.vehicleId
    );
    return total + (vehicle?.dailyRate ?? 0) * selection.quantity * vehicleDays;
  }, 0);
}

type ServiceRecommendation = {
  employees: number;
  hoursPerEmployee: number;
  vehicleDays: number;
  vehicleSelections: VehicleSelection[];
  materialCost: number;
  disposalCost: number;
  storageCost: number;
  logisticsCost: number;
  boxes: number;
  explanations: string[];
};

function calculateServiceRecommendation(
  calculation: Calculation,
  rates: Rates,
  volume: number
): ServiceRecommendation {
  const { planning } = calculation;
  const hasService = planning.serviceTypes.length > 0;
  const selectedServices = new Set(planning.serviceTypes);
  const needsMovingVehicle =
    selectedServices.has("move") ||
    selectedServices.has("seniorMove") ||
    selectedServices.has("clearance") ||
    selectedServices.has("storage");
  const totalCarryDistance =
    planning.oldCarryDistanceM + planning.newCarryDistanceM ||
    planning.carryDistanceM;
  const complexityFactor =
    planning.moveComplexity === "easy"
      ? 0.85
      : planning.moveComplexity === "difficult"
        ? 1.25
        : 1;
  const floorFactor =
    planning.oldFloorLevel *
      (planning.furnitureLiftRequired ? 0.015 : planning.oldElevator ? 0.025 : 0.08) +
    planning.newFloorLevel *
      (planning.furnitureLiftRequired ? 0.015 : planning.newElevator ? 0.025 : 0.08);
  const accessFactor =
    complexityFactor * (1 + floorFactor + Math.min(totalCarryDistance / 100, 0.5));
  const explanations: string[] = [];
  let labourHours = 0;
  let employees = 1;
  let requiredVehicleVolume = 0;
  let materialCost = 0;
  let disposalCost = 0;
  let storageCost = 0;
  let logisticsCost = 0;
  let boxes = planning.movingBoxes;

  if (selectedServices.has("move") || selectedServices.has("seniorMove")) {
    const seniorFactor = selectedServices.has("seniorMove") ? 1.2 : 1;
    const moveTrips = Math.max(1, planning.moveTrips);
    const moveLabourHours = Math.max(
      4,
      volume * 0.55 * accessFactor * seniorFactor +
        planning.dismantlingHours +
        planning.specialItemCount * 0.75 +
        planning.moveBufferHours +
        (moveTrips - 1) * 1.5
    );
    labourHours += moveLabourHours;
    const volumeBasedCrew = volume > 35 ? 4 : volume > 15 ? 3 : 2;
    employees = Math.max(
      employees,
      volumeBasedCrew,
      planning.moveCrewPreference
    );
    requiredVehicleVolume = Math.max(requiredVehicleVolume, volume / moveTrips);
    logisticsCost += planning.furnitureLiftRequired
      ? rates.furnitureLiftDailyRate * Math.ceil(moveTrips / 2)
      : 0;
    logisticsCost += planning.parkingRequired ? rates.parkingPermitRate : 0;
    explanations.push(
      `${volume.toFixed(1)} m3, ${moveTrips} Fahrt(en), ${totalCarryDistance} m Gesamttrageweg`
    );
    if (planning.dismantlingHours > 0) {
      explanations.push(`${planning.dismantlingHours} Std. Demontage/Montage`);
    }
    if (planning.specialItemCount > 0) {
      explanations.push(`${planning.specialItemCount} Spezialgegenstand/-gegenstaende`);
    }
  }

  if (selectedServices.has("clearance")) {
    const clearanceVolume = planning.disposalVolumeM3 || volume;
    labourHours += Math.max(3, clearanceVolume * 0.45 * accessFactor);
    employees = Math.max(employees, clearanceVolume > 20 ? 3 : 2);
    requiredVehicleVolume = Math.max(requiredVehicleVolume, clearanceVolume);
    disposalCost += clearanceVolume * rates.disposalRatePerM3;
    explanations.push(
      `${clearanceVolume.toFixed(1)} m3 Entsorgungsvolumen`
    );
  }

  if (selectedServices.has("painting")) {
    const paintArea = planning.paintAreaM2 * Math.max(1, planning.paintCoats);
    labourHours +=
      paintArea * rates.paintLaborHoursPerM2 + planning.repairAreaM2 * 0.35;
    employees = Math.max(employees, paintArea > 100 ? 2 : 1);
    materialCost += paintArea * rates.paintMaterialPerM2 + planning.repairAreaM2 * 2;
    explanations.push(
      `${planning.paintAreaM2.toFixed(0)} m2 Flaeche mit ${planning.paintCoats} Anstrich(en)`
    );
  }

  if (selectedServices.has("furnitureAssembly")) {
    labourHours +=
      (planning.furniturePieces * rates.furnitureAssemblyMinutesPerPiece) / 60;
    employees = Math.max(employees, planning.furniturePieces > 8 ? 2 : 1);
    explanations.push(`${planning.furniturePieces} Moebelteile zur Montage`);
  }

  if (selectedServices.has("packing")) {
    boxes = planning.movingBoxes || Math.ceil(volume * 10);
    labourHours += (boxes * rates.packingMinutesPerBox) / 60;
    materialCost += boxes * rates.packingBoxRate;
    employees = Math.max(employees, boxes > 40 ? 2 : 1);
    explanations.push(`${boxes} Kartons fuer den Einpackservice`);
  }

  if (selectedServices.has("storage")) {
    const storageVolume = planning.storageVolumeM3 || volume;
    labourHours += Math.max(1, storageVolume * 0.15);
    requiredVehicleVolume = Math.max(requiredVehicleVolume, storageVolume);
    storageCost +=
      storageVolume *
      Math.max(1, planning.storageMonths) *
      rates.storageRatePerM3Month;
    explanations.push(
      `${storageVolume.toFixed(1)} m3 Einlagerung fuer ${Math.max(1, planning.storageMonths)} Monat(e)`
    );
  }

  const vehicleDays =
    needsMovingVehicle && requiredVehicleVolume > 0
      ? Math.max(1, Math.ceil(Math.max(1, planning.moveTrips) / 2))
      : 0;
  const roundedEmployees = hasService ? employees : 0;
  const hoursPerEmployee =
    roundedEmployees > 0
      ? Math.max(1, Math.ceil((labourHours / roundedEmployees) * 4) / 4)
      : 0;

  return {
    employees: roundedEmployees,
    hoursPerEmployee,
    vehicleDays,
    vehicleSelections: calculateRecommendedVehicles(requiredVehicleVolume),
    materialCost: Math.round(materialCost * 100) / 100,
    disposalCost: Math.round(disposalCost * 100) / 100,
    storageCost: Math.round(storageCost * 100) / 100,
    logisticsCost: Math.round(logisticsCost * 100) / 100,
    boxes,
    explanations,
  };
}

function calculatePricing(calculation: Calculation, rates: Rates) {
  const vehicleCost = calculateVehicleCost(
    calculation.planning.vehicleSelections,
    calculation.vehicleDays
  );
  const directCost =
    calculation.employees *
      calculation.hoursPerEmployee *
      rates.employeeHourlyRate +
    vehicleCost +
    calculation.kilometers * rates.kilometerRate +
    rates.planningFee +
    calculation.materialCost +
    calculation.disposalCost +
    calculation.storageCost +
    calculation.logisticsCost +
    calculation.otherCost +
    calculateExtraServices(calculation.planning.extraServices);
  const surcharge = directCost * (rates.surchargePercent / 100);
  const netTotal = directCost + surcharge;
  const vat = netTotal * (rates.vatPercent / 100);
  return {
    employeeCost:
      calculation.employees * calculation.hoursPerEmployee * rates.employeeHourlyRate,
    vehicleCost,
    mileageCost: calculation.kilometers * rates.kilometerRate,
    extraServiceCost: calculateExtraServices(calculation.planning.extraServices),
    directCost,
    surcharge,
    netTotal,
    vat,
    grossTotal: netTotal + vat,
  };
}

function calculateGrossTotal(calculation: Calculation, rates: Rates) {
  return calculatePricing(calculation, rates).grossTotal;
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
          className='h-11 w-full rounded-md border border-slate-200 bg-white px-3 pr-14 text-slate-950 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
        />
        {suffix && (
          <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "date";
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className='h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-slate-950 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
    </label>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Calculator;
  title: string;
  description: string;
}) {
  return (
    <div className='mb-6 flex items-start gap-3'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100'>
        <Icon size={18} />
      </span>
      <div>
        <h2 className='text-base font-semibold text-slate-950'>{title}</h2>
        <p className='mt-0.5 text-sm text-slate-600'>{description}</p>
      </div>
    </div>
  );
}

function escapePrintHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function OfferPlanner() {
  const { companyData } = useCompanyData();
  const [rates, setRates] = useState<Rates>(defaultRates);
  const [calculation, setCalculation] = useState<Calculation>(() =>
    createCalculation()
  );
  const [savedCalculations, setSavedCalculations] = useState<
    SavedCalculation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [printError, setPrintError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<PlanningStep>("order");

  useEffect(() => {
    const companyId = companyData?.id;
    if (!companyId) return;
    const calculatorRef = doc(database, storageCollection, companyId);
    let active = true;

    async function loadCalculator() {
      try {
        const snapshot = await getDoc(calculatorRef);
        const data = snapshot.data() as Partial<CalculatorData> | undefined;
        if (active && data) {
          setRates({ ...defaultRates, ...data.rates });
          setCalculation(normalizeCalculation(data.calculation));
          setSavedCalculations(
            (data.savedCalculations ?? []).map((saved) => ({
              ...normalizeCalculation(saved),
              id: saved.id,
              createdAt: saved.createdAt,
              rates: { ...defaultRates, ...saved.rates },
            }))
          );
        }
      } catch {
        if (active) setStatus("error");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCalculator();
    return () => {
      active = false;
    };
  }, [companyData?.id]);

  const volume = calculateVolume(calculation.planning.rooms);
  const recommendation = calculateServiceRecommendation(
    calculation,
    rates,
    volume
  );

  useEffect(() => {
    if (!calculation.autoEstimate) return;

    setCalculation((current) => {
      const vehiclesMatch =
        current.planning.vehicleSelections.length ===
          recommendation.vehicleSelections.length &&
        current.planning.vehicleSelections.every(
          (selection, index) =>
            selection.vehicleId ===
              recommendation.vehicleSelections[index]?.vehicleId &&
            selection.quantity === recommendation.vehicleSelections[index]?.quantity
        );
      const valuesMatch =
        current.employees === recommendation.employees &&
        current.hoursPerEmployee === recommendation.hoursPerEmployee &&
        current.vehicleDays === recommendation.vehicleDays &&
        current.materialCost === recommendation.materialCost &&
        current.disposalCost === recommendation.disposalCost &&
        current.storageCost === recommendation.storageCost &&
        current.logisticsCost === recommendation.logisticsCost;

      if (valuesMatch && vehiclesMatch) return current;

      return {
        ...current,
        employees: recommendation.employees,
        hoursPerEmployee: recommendation.hoursPerEmployee,
        vehicleDays: recommendation.vehicleDays,
        materialCost: recommendation.materialCost,
        disposalCost: recommendation.disposalCost,
        storageCost: recommendation.storageCost,
        logisticsCost: recommendation.logisticsCost,
        planning: {
          ...current.planning,
          vehicleSelections: recommendation.vehicleSelections,
        },
      };
    });
  }, [calculation.autoEstimate, recommendation]);

  const {
    employeeCost,
    vehicleCost,
    mileageCost,
    extraServiceCost,
    surcharge,
    netTotal,
    vat,
    grossTotal,
  } = calculatePricing(calculation, rates);
  const selectedServices = new Set(calculation.planning.serviceTypes);
  const usesMoveInventory =
    selectedServices.has("move") || selectedServices.has("seniorMove");
  const needsVehicle =
    usesMoveInventory ||
    selectedServices.has("clearance") ||
    selectedServices.has("storage");
  const currentStepIndex = planningSteps.findIndex(
    (step) => step.id === activeStep
  );
  const completedSteps = {
    order: Boolean(
      calculation.title.trim() &&
        (calculation.customer.trim() || calculation.planning.contactName.trim()) &&
        calculation.planning.serviceTypes.length
    ),
    site: Boolean(
      calculation.planning.oldAddress.trim() ||
        calculation.planning.newAddress.trim() ||
        calculation.planning.carryDistanceM
    ),
    inventory: Boolean(
      (usesMoveInventory && volume > 0) ||
        calculation.planning.paintAreaM2 > 0 ||
        calculation.planning.disposalVolumeM3 > 0 ||
        calculation.planning.furniturePieces > 0 ||
        calculation.planning.movingBoxes > 0 ||
        calculation.planning.storageVolumeM3 > 0 ||
        calculation.planning.photoUrls.length > 0
    ),
    price: calculation.employees > 0 && calculation.hoursPerEmployee > 0,
    finish: savedCalculations.length > 0,
  };
  const completeStepCount = Object.values(completedSteps).filter(Boolean).length;

  function updateRate<Key extends keyof Rates>(key: Key, value: Rates[Key]) {
    setRates((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function updateCalculation<Key extends keyof Calculation>(
    key: Key,
    value: Calculation[Key]
  ) {
    setCalculation((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function updateManualCalculation<
    Key extends
      | "employees"
      | "hoursPerEmployee"
      | "vehicleDays"
      | "materialCost"
      | "disposalCost"
      | "storageCost"
      | "logisticsCost"
      | "otherCost"
  >(key: Key, value: Calculation[Key]) {
    setCalculation((current) => ({
      ...current,
      autoEstimate: false,
      [key]: value,
    }));
    setStatus("idle");
  }

  function enableAutomaticEstimate() {
    setCalculation((current) => ({ ...current, autoEstimate: true }));
    setStatus("idle");
  }

  function updatePlanning<Key extends keyof PlanningDetails>(
    key: Key,
    value: PlanningDetails[Key]
  ) {
    setCalculation((current) => ({
      ...current,
      planning: { ...current.planning, [key]: value },
    }));
    setStatus("idle");
  }

  async function persist(
    nextSavedCalculations: SavedCalculation[] = savedCalculations
  ) {
    const companyId = companyData?.id;
    if (!companyId) return false;
    setIsSaving(true);
    setStatus("idle");
    try {
      await setDoc(
        doc(database, storageCollection, companyId),
        {
          ownerId: companyId,
          rates,
          calculation,
          savedCalculations: nextSavedCalculations,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      setSavedCalculations(nextSavedCalculations);
      setStatus("saved");
      return true;
    } catch {
      setStatus("error");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCalculation() {
    const savedCalculation: SavedCalculation = {
      ...calculation,
      planning: {
        ...calculation.planning,
        rooms: calculation.planning.rooms.map((room) => ({
          ...room,
          items: [...room.items],
        })),
        extraServices: [...calculation.planning.extraServices],
        photoUrls: [...calculation.planning.photoUrls],
      },
      rates: { ...rates },
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await persist([savedCalculation, ...savedCalculations]);
  }

  function loadCalculation(savedCalculation: SavedCalculation) {
    setCalculation(normalizeCalculation(savedCalculation));
    setRates({ ...defaultRates, ...savedCalculation.rates });
    setStatus("idle");
  }

  async function deleteCalculation(id: string) {
    await persist(savedCalculations.filter((item) => item.id !== id));
  }

  function addRoom() {
    updatePlanning("rooms", [
      ...calculation.planning.rooms,
      { id: crypto.randomUUID(), name: "Neuer Raum", items: [] },
    ]);
  }

  function updateRoom(roomId: string, patch: Partial<Room>) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId ? { ...room, ...patch } : room
      )
    );
  }

  function removeRoom(roomId: string) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.filter((room) => room.id !== roomId)
    );
  }

  function addInventoryItem(roomId: string) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: [
                ...room.items,
                {
                  id: crypto.randomUUID(),
                  name: "Möbelstück",
                  quantity: 1,
                  volumeM3: 0.5,
                },
              ],
            }
          : room
      )
    );
  }

  function addCommonInventoryItem(
    roomId: string,
    item: { name: string; volumeM3: number }
  ) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: [
                ...room.items,
                { id: crypto.randomUUID(), quantity: 1, ...item },
              ],
            }
          : room
      )
    );
  }

  function goToNextStep() {
    const nextStep = planningSteps[currentStepIndex + 1];
    if (nextStep) setActiveStep(nextStep.id);
  }

  function goToPreviousStep() {
    const previousStep = planningSteps[currentStepIndex - 1];
    if (previousStep) setActiveStep(previousStep.id);
  }

  function updateInventoryItem(
    roomId: string,
    itemId: string,
    patch: Partial<InventoryItem>
  ) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: room.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              ),
            }
          : room
      )
    );
  }

  function removeInventoryItem(roomId: string, itemId: string) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId
          ? { ...room, items: room.items.filter((item) => item.id !== itemId) }
          : room
      )
    );
  }

  function addExtraService() {
    updatePlanning("extraServices", [
      ...calculation.planning.extraServices,
      { id: crypto.randomUUID(), name: "Zusatzleistung", quantity: 1, unitPrice: 0 },
    ]);
  }

  function updateExtraService(id: string, patch: Partial<ServiceLine>) {
    updatePlanning(
      "extraServices",
      calculation.planning.extraServices.map((service) =>
        service.id === id ? { ...service, ...patch } : service
      )
    );
  }

  function removeExtraService(id: string) {
    updatePlanning(
      "extraServices",
      calculation.planning.extraServices.filter((service) => service.id !== id)
    );
  }

  function updateVehicleSelection(vehicleId: string, quantity: number) {
    setCalculation((current) => {
      const existing = current.planning.vehicleSelections.find(
        (selection) => selection.vehicleId === vehicleId
      );
      const vehicleSelections =
        quantity <= 0
          ? current.planning.vehicleSelections.filter(
              (selection) => selection.vehicleId !== vehicleId
            )
          : existing
            ? current.planning.vehicleSelections.map((selection) =>
                selection.vehicleId === vehicleId
                  ? { ...selection, quantity }
                  : selection
              )
            : [
                ...current.planning.vehicleSelections,
                { vehicleId, quantity },
              ];

      return {
        ...current,
        autoEstimate: false,
        planning: { ...current.planning, vehicleSelections },
      };
    });
    setStatus("idle");
  }

  function toggleService(service: ServiceKey) {
    const selected = calculation.planning.serviceTypes.includes(service);
    updatePlanning(
      "serviceTypes",
      selected
        ? calculation.planning.serviceTypes.filter((item) => item !== service)
        : [...calculation.planning.serviceTypes, service]
    );
  }

  function printCustomerDocument() {
    setPrintError(null);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrintError(
        "Das Druckfenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben."
      );
      return;
    }
    const roomsHtml = calculation.planning.rooms
      .filter((room) => room.items.length > 0)
      .map(
        (room) => `
          <section class="room">
            <h3>${escapePrintHtml(room.name || "Raum")}</h3>
            <table><thead><tr><th>Gegenstand</th><th>Menge</th><th>Volumen</th></tr></thead>
            <tbody>${room.items
              .map(
                (item) => `<tr><td>${escapePrintHtml(item.name || "Gegenstand")}</td><td>${item.quantity}</td><td>${(item.quantity * item.volumeM3).toFixed(2)} m³</td></tr>`
              )
              .join("")}</tbody></table>
          </section>`
      )
      .join("");
    const photosHtml = calculation.planning.photoUrls
      .map(
        (url, index) =>
          `<img src="${escapePrintHtml(url)}" alt="Objektfoto ${index + 1}" />`
      )
      .join("");
    printWindow.document.write(`<!doctype html>
      <html lang="de"><head><title>${escapePrintHtml(calculation.title || "Angebot")}</title>
      <style>
        @page { margin: 14mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #17315c; font-family: "Poppins", Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; }
        .document { max-width: 190mm; margin: 0 auto; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 0 0 18px; border-bottom: 4px solid #E87722; }
        .logo { width: 144px; height: auto; object-fit: contain; }
        .document-type { margin: 0; color: #E87722; font-size: 9pt; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; }
        h1 { margin: 4px 0 0; color: #0D2650; font-size: 27pt; line-height: 1.12; }
        .meta { margin-top: 5px; color: #62728c; font-size: 9pt; }
        .offer-number { min-width: 142px; padding: 11px 13px; border: 1px solid #dbe1ea; color: #52647f; font-size: 9pt; text-align: right; }
        .offer-number strong { display: block; color: #0D2650; font-size: 11pt; }
        .intro { margin: 22px 0; color: #52647f; font-size: 11pt; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .card { border: 1px solid #dbe1ea; border-radius: 4px; padding: 15px; break-inside: avoid; }
        .card-label { margin: 0 0 8px; color: #E87722; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
        .card-title { margin: 0 0 5px; color: #0D2650; font-size: 13pt; }
        .muted { color: #62728c; }
        h2 { display: flex; align-items: center; gap: 9px; margin: 29px 0 12px; color: #0D2650; font-size: 15pt; }
        h2::before { width: 5px; height: 20px; background: #E87722; content: ""; }
        h3 { margin: 0 0 8px; color: #0D2650; font-size: 11pt; }
        .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { border-radius: 99px; background: #fff1e6; color: #b85211; padding: 4px 9px; font-size: 8.5pt; font-weight: 600; }
        .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
        .fact { border-top: 2px solid #f2f4f7; padding: 10px 2px 0; }
        .fact span { display: block; color: #62728c; font-size: 8.5pt; }
        .fact strong { display: block; margin-top: 2px; color: #0D2650; font-size: 11pt; }
        .volume { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-radius: 4px; background: #0D2650; color: #fff; padding: 15px 17px; }
        .volume span { color: #d6e0ef; font-size: 9pt; }
        .volume strong { color: #fff; font-size: 19pt; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 2px solid #E87722; color: #0D2650; font-size: 8.5pt; text-align: left; text-transform: uppercase; letter-spacing: 0.4px; }
        th, td { padding: 8px 7px; }
        td { border-bottom: 1px solid #e8edf3; }
        th:last-child, td:last-child, th:nth-child(2), td:nth-child(2) { text-align: right; }
        .room { margin-bottom: 17px; break-inside: avoid; }
        .price-panel { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px; border-radius: 5px; background: #0D2650; color: #fff; padding: 20px 22px; break-inside: avoid; }
        .price-panel p { margin: 0; color: #d6e0ef; }
        .price-panel strong { display: block; margin-top: 4px; color: #fff; font-size: 24pt; line-height: 1; }
        .price-details { text-align: right; font-size: 9pt; color: #d6e0ef; }
        .price-details b { display: block; color: #fff; font-size: 11pt; }
        .note { border-left: 4px solid #E87722; background: #fff8f2; padding: 13px 15px; white-space: normal; }
        .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
        .photos img { width: 100%; height: 150px; border-radius: 3px; object-fit: cover; }
        .footer { display: flex; justify-content: space-between; margin-top: 32px; border-top: 1px solid #dbe1ea; padding-top: 12px; color: #62728c; font-size: 8.5pt; }
        @media print { .document { max-width: none; } .header, .card, .price-panel, .volume { break-inside: avoid; } }
      </style>
      </head><body><main class="document">
      <header class="header">
        <div><img class="logo" src="${window.location.origin}/images/Umzugshelden.png" alt="Umzugshelden" /><p class="document-type">Persönliche Angebotsübersicht</p><h1>${escapePrintHtml(calculation.title || "Ihr Angebot")}</h1><p class="meta">Erstellt am ${new Date().toLocaleDateString("de-DE")}</p></div>
        <div class="offer-number">Angebot für<strong>${escapePrintHtml(calculation.customer || calculation.planning.contactName || "Ihr Projekt")}</strong></div>
      </header>
      <p class="intro">Vielen Dank für Ihr Vertrauen. Diese Übersicht fasst die besprochenen Leistungen und die Planung für Ihren Auftrag transparent zusammen.</p>
      <section class="grid">
        <div class="card"><p class="card-label">Ihre Kontaktdaten</p><h2 class="card-title">${escapePrintHtml(calculation.customer || calculation.planning.contactName || "Kunde")}</h2><div class="muted">${escapePrintHtml(calculation.planning.contactPhone || "Telefon noch offen")}<br>${escapePrintHtml(calculation.planning.contactEmail || "E-Mail noch offen")}</div></div>
        <div class="card"><p class="card-label">Geplante Leistungen</p><div class="tag-list">${calculation.planning.serviceTypes.map((service) => `<span class="tag">${escapePrintHtml(serviceOptions.find((option) => option.id === service)?.label || service)}</span>`).join("") || "<span class=\"muted\">Noch nicht festgelegt</span>"}</div><p class="muted" style="margin:14px 0 0"><strong>Wunschtermin:</strong> ${escapePrintHtml(calculation.planning.date || "Noch offen")}</p></div>
      </section>
      <h2>Planung vor Ort</h2><section class="grid"><div class="card"><p class="card-label">Auszug / Einsatzort</p><h3>${escapePrintHtml(calculation.planning.oldAddress || "Adresse noch offen")}</h3><div class="muted">Etage: ${escapePrintHtml(calculation.planning.oldFloor || "-")}<br>Aufzug: ${calculation.planning.oldElevator ? "vorhanden" : "nicht vorhanden"}</div></div><div class="card"><p class="card-label">Einzug / Zielort</p><h3>${escapePrintHtml(calculation.planning.newAddress || "Adresse noch offen")}</h3><div class="muted">Etage: ${escapePrintHtml(calculation.planning.newFloor || "-")}<br>Aufzug: ${calculation.planning.newElevator ? "vorhanden" : "nicht vorhanden"}</div></div></section>
      <section class="facts"><div class="fact"><span>Trageweg</span><strong>${calculation.planning.carryDistanceM} m</strong></div><div class="fact"><span>Halteverbotszone</span><strong>${calculation.planning.parkingRequired ? "Erforderlich" : "Nicht erforderlich"}</strong></div><div class="fact"><span>Einpackservice</span><strong>${calculation.planning.packingRequired ? "Vorgesehen" : "Nicht vorgesehen"}</strong></div></section>
      <h2>Volumen & Inventar</h2><div class="volume"><span>Geschätztes Umzugsvolumen</span><strong>${volume.toFixed(2)} m³</strong></div>${roomsHtml || "<p class=\"muted\">Für diesen Auftrag wurde noch kein Inventar erfasst.</p>"}
      <h2>Ihr Angebot</h2><section class="price-panel"><div><p>Angebotspreis inklusive ${rates.vatPercent}% Mehrwertsteuer</p><strong>${formatCurrency(grossTotal)}</strong></div><div class="price-details">Netto<b>${formatCurrency(netTotal)}</b></div></section>
      ${calculation.planning.notes ? `<h2>Wichtige Hinweise</h2><div class="note">${escapePrintHtml(calculation.planning.notes).replaceAll("\n", "<br>")}</div>` : ""}
      ${photosHtml ? `<h2>Objektfotos</h2><section class="photos">${photosHtml}</section>` : ""}
      <footer class="footer"><span>Umzugshelden · Zuverlässig geplant. Entspannt umgezogen.</span><span>Alle Angaben vorbehaltlich der finalen Auftragsbestätigung.</span></footer>
      </main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  if (isLoading) {
    return <div className='flex min-h-64 items-center justify-center gap-2 text-slate-600'><LoaderCircle className='animate-spin' size={18} /> Planer wird geladen ...</div>;
  }

  return (
    <main className='mx-auto w-full max-w-[1440px] pb-28 xl:pb-12'>
      <header className='mb-6 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end'>
        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>Angebote & Vor-Ort-Aufnahme</p>
          <h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>Dienstleistungs-Planer</h1>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>Aufnahme, Ressourcenplanung und Angebot in einem durchgaengigen Ablauf.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          {status === "saved" && <span className='flex items-center gap-1.5 text-sm font-medium text-emerald-700'><Check size={16} /> Gespeichert</span>}
          {status === "error" && <span className='text-sm font-medium text-red-600'>Speichern fehlgeschlagen</span>}
          <Button variant='outline' className='flex-1 sm:flex-none' onClick={printCustomerDocument}><Printer /> Drucken</Button>
          <Button className='flex-1 sm:flex-none' onClick={() => void persist()} disabled={isSaving}>{isSaving ? <LoaderCircle className='animate-spin' /> : <Save />} Entwurf speichern</Button>
        </div>
      </header>
      {printError && (
        <div className='mb-6 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
          <span>{printError}</span>
          <Button type='button' variant='ghost' size='sm' onClick={() => setPrintError(null)}>
            Schließen
          </Button>
        </div>
      )}

      <section className='mb-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm' aria-label='Planungsschritte'>
        <div className='mb-3 flex items-center justify-between gap-4'>
          <p className='text-sm font-medium text-slate-700'>
            Vor-Ort-Aufnahme: {completeStepCount} von 5 Bereichen vorbereitet
          </p>
          <span className='text-sm text-slate-500'>
            Schritt {currentStepIndex + 1} von {planningSteps.length}
          </span>
        </div>
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {planningSteps.map((step) => {
            const Icon = step.icon;
            const active = step.id === activeStep;
            const completed = completedSteps[step.id];
            return (
              <button
                key={step.id}
                type='button'
                onClick={() => setActiveStep(step.id)}
                className={`flex min-w-32 shrink-0 items-center gap-2 rounded-md border px-3 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${active ? "bg-white/20" : completed ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>
                  {completed && !active ? <Check size={14} /> : step.shortLabel}
                </span>
                <Icon size={16} />
                {step.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-6'>
          {activeStep === "order" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={ClipboardList} title='Auftrag & Kunde' description='Die Eckdaten sind auf der Kundenansicht und in der gespeicherten Planung sichtbar.' />
            <div className='mb-6 border-b border-slate-200 pb-5'>
              <p className='mb-1 text-sm font-semibold text-slate-950'>1. Dienstleistung waehlen</p>
              <p className='mb-3 text-sm text-slate-600'>Die Auswahl bestimmt Aufnahme, Aufwand und die automatische Preisempfehlung.</p>
              <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
                {serviceOptions.map((service) => {
                  const checked = selectedServices.has(service.id);
                  const Icon = service.icon;
                  return <button key={service.id} type='button' onClick={() => toggleService(service.id)} aria-pressed={checked} className={`group flex min-h-28 items-start gap-3 rounded-md border p-3 text-left transition ${checked ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition ${checked ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"}`}><Icon size={19} /></span>
                    <span><span className='block text-sm font-semibold text-slate-950'>{service.label}</span>
                    <span className='mt-1 block text-xs leading-5 text-slate-600'>{service.description}</span></span>
                  </button>;
                })}
              </div>
            </div>
            {selectedServices.size === 0 ? <p className='rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600'>Waehle mindestens eine Dienstleistung, um die passende Aufnahme und Angebotslogik zu starten.</p> : <div className='grid gap-4 sm:grid-cols-2'>
              <TextField label='Angebotsbezeichnung' value={calculation.title} onChange={(value) => updateCalculation("title", value)} placeholder='z. B. Umzug Familie Mustermann' />
              <TextField label='Kunde / Projekt' value={calculation.customer} onChange={(value) => updateCalculation("customer", value)} placeholder='Name oder Firma' />
              <TextField label='Ansprechpartner' value={calculation.planning.contactName} onChange={(value) => updatePlanning("contactName", value)} placeholder='Vor- und Nachname' />
              <TextField label='Telefon' value={calculation.planning.contactPhone} onChange={(value) => updatePlanning("contactPhone", value)} placeholder='Telefonnummer' />
              <TextField label='E-Mail' type='email' value={calculation.planning.contactEmail} onChange={(value) => updatePlanning("contactEmail", value)} placeholder='name@beispiel.de' />
              <TextField label='Wunschtermin' type='date' value={calculation.planning.date} onChange={(value) => updatePlanning("date", value)} />
            </div>}
          </section>}

          {activeStep === "site" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={MapPin} title='Objekt, Zugänge & Laufwege' description='Erfasst die Informationen, die Personalbedarf und Aufwand beim Einsatz bestimmen.' />
            <div className='grid gap-4 sm:grid-cols-2'>
              <TextField label='Auszugsadresse / Einsatzort' value={calculation.planning.oldAddress} onChange={(value) => updatePlanning("oldAddress", value)} placeholder='Straße, PLZ Ort' />
              <TextField label='Einzugsadresse / Zielort' value={calculation.planning.newAddress} onChange={(value) => updatePlanning("newAddress", value)} placeholder='Straße, PLZ Ort' />
              <TextField label='Etage Auszug' value={calculation.planning.oldFloor} onChange={(value) => updatePlanning("oldFloor", value)} placeholder='z. B. 3. OG' />
              <TextField label='Etage Einzug' value={calculation.planning.newFloor} onChange={(value) => updatePlanning("newFloor", value)} placeholder='z. B. EG' />
              <NumberField label='Laufweg / Trageweg' value={calculation.planning.carryDistanceM} onChange={(value) => updatePlanning("carryDistanceM", value)} suffix='m' />
              <NumberField label='Fahrtstrecke gesamt' value={calculation.kilometers} onChange={(value) => updateCalculation("kilometers", value)} suffix='km' step='0.1' />
            </div>
            {usesMoveInventory && <div className='mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4'>
              <div className='mb-4 flex items-start gap-3'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white'><Car size={19} /></span>
                <div><p className='text-sm font-semibold text-slate-950'>Umzugs-Check</p><p className='mt-0.5 text-sm text-slate-600'>Diese Angaben machen Personal, Fahrzeuge und Zeitplanung deutlich genauer.</p></div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <NumberField label='Trageweg Auszug' value={calculation.planning.oldCarryDistanceM} onChange={(value) => updatePlanning("oldCarryDistanceM", value)} suffix='m' />
                <NumberField label='Trageweg Einzug' value={calculation.planning.newCarryDistanceM} onChange={(value) => updatePlanning("newCarryDistanceM", value)} suffix='m' />
                <NumberField label='Etagen Auszug' value={calculation.planning.oldFloorLevel} onChange={(value) => updatePlanning("oldFloorLevel", value)} suffix='OG' />
                <NumberField label='Etagen Einzug' value={calculation.planning.newFloorLevel} onChange={(value) => updatePlanning("newFloorLevel", value)} suffix='OG' />
                <NumberField label='Geplante Fahrten' value={calculation.planning.moveTrips} onChange={(value) => updatePlanning("moveTrips", Math.max(1, value))} suffix='Fahrten' />
                <NumberField label='Wunsch-Teamgroesse' value={calculation.planning.moveCrewPreference} onChange={(value) => updatePlanning("moveCrewPreference", value)} suffix='Pers.' />
                <NumberField label='Demontage / Montage' value={calculation.planning.dismantlingHours} onChange={(value) => updatePlanning("dismantlingHours", value)} suffix='Std.' step='0.25' />
                <NumberField label='Spezialgegenstaende' value={calculation.planning.specialItemCount} onChange={(value) => updatePlanning("specialItemCount", value)} suffix='Stk.' />
              </div>
              <div className='mt-4'>
                <p className='mb-2 text-sm font-medium text-slate-700'>Aufwand vor Ort</p>
                <div className='grid grid-cols-3 gap-2'>
                  {([
                    ["easy", "Einfach", "Kurze Wege, guter Zugang"],
                    ["standard", "Normal", "Typischer Wohnungsumzug"],
                    ["difficult", "Anspruchsvoll", "Enge Wege oder viele Etagen"],
                  ] as const).map(([value, label, description]) => <button key={value} type='button' onClick={() => updatePlanning("moveComplexity", value)} aria-pressed={calculation.planning.moveComplexity === value} className={`min-h-20 rounded-md border p-2 text-left transition ${calculation.planning.moveComplexity === value ? "border-blue-500 bg-white ring-1 ring-blue-200" : "border-blue-100 bg-white/70 hover:border-blue-300"}`}><span className='block text-sm font-semibold text-slate-950'>{label}</span><span className='mt-1 block text-[11px] leading-4 text-slate-600'>{description}</span></button>)}
                </div>
              </div>
              <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                <label className='flex min-h-12 items-center gap-3 rounded-md border border-blue-100 bg-white px-3 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.furnitureLiftRequired} onChange={(event) => updatePlanning("furnitureLiftRequired", event.target.checked)} className='h-4 w-4 accent-primary' />Moebellift erforderlich</label>
                <NumberField label='Zeitpuffer' value={calculation.planning.moveBufferHours} onChange={(value) => updatePlanning("moveBufferHours", value)} suffix='Std.' step='0.25' />
              </div>
            </div>}
            {selectedServices.size > 0 && <div className='mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2'>
              {selectedServices.has("painting") && <>
                <NumberField label='Zu streichende Flaeche' value={calculation.planning.paintAreaM2} onChange={(value) => updatePlanning("paintAreaM2", value)} suffix='m2' step='0.5' />
                <NumberField label='Anstriche' value={calculation.planning.paintCoats} onChange={(value) => updatePlanning("paintCoats", value)} suffix='x' />
                <NumberField label='Ausbesserungsflaeche' value={calculation.planning.repairAreaM2} onChange={(value) => updatePlanning("repairAreaM2", value)} suffix='m2' step='0.5' />
              </>}
              {selectedServices.has("clearance") && <NumberField label='Entsorgungsvolumen' value={calculation.planning.disposalVolumeM3} onChange={(value) => updatePlanning("disposalVolumeM3", value)} suffix='m3' step='0.1' />}
              {selectedServices.has("furnitureAssembly") && <NumberField label='Moebelteile zur Montage' value={calculation.planning.furniturePieces} onChange={(value) => updatePlanning("furniturePieces", value)} suffix='Teile' />}
              {selectedServices.has("packing") && <NumberField label='Kartons (falls bekannt)' value={calculation.planning.movingBoxes} onChange={(value) => updatePlanning("movingBoxes", value)} suffix='Stk.' />}
              {selectedServices.has("storage") && <>
                <NumberField label='Einlagerungsvolumen' value={calculation.planning.storageVolumeM3} onChange={(value) => updatePlanning("storageVolumeM3", value)} suffix='m3' step='0.1' />
                <NumberField label='Einlagerungsdauer' value={calculation.planning.storageMonths} onChange={(value) => updatePlanning("storageMonths", value)} suffix='Monate' />
              </>}
            </div>}
            <div className='mt-5 grid gap-2 border-t border-slate-200 pt-5 sm:grid-cols-2'>
              <label className='flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.oldElevator} onChange={(event) => updatePlanning("oldElevator", event.target.checked)} className='h-4 w-4 accent-primary' />Aufzug am Auszug</label>
              <label className='flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.newElevator} onChange={(event) => updatePlanning("newElevator", event.target.checked)} className='h-4 w-4 accent-primary' />Aufzug am Einzug</label>
              <label className='flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.parkingRequired} onChange={(event) => updatePlanning("parkingRequired", event.target.checked)} className='h-4 w-4 accent-primary' />Halteverbotszone nötig</label>
              <label className='flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.packingRequired} onChange={(event) => updatePlanning("packingRequired", event.target.checked)} className='h-4 w-4 accent-primary' />Einpackservice nötig</label>
            </div>
          </section>}

          {activeStep === "inventory" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Box} title='Volumen berechnen' description='Lege Räume und Gegenstände an. Menge mal Einzelvolumen ergibt das Gesamtvolumen für Fahrzeug und Personal.' />
            <div className='mb-5 flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-950'>
              <span className='text-sm font-medium'>Erfasstes Umzugsvolumen</span><strong className='text-2xl'>{volume.toFixed(2)} m³</strong>
            </div>
            <div className='space-y-4'>
              {calculation.planning.rooms.map((room) => <div key={room.id} className='rounded-md border border-slate-200 bg-slate-50/60 p-3 sm:p-4'>
                <div className='mb-3 flex items-center gap-2'>
                  <input value={room.name} onChange={(event) => updateRoom(room.id, { name: event.target.value })} className='h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20' />
                  <Button type='button' variant='ghost' size='icon' title='Raum entfernen' onClick={() => removeRoom(room.id)} disabled={calculation.planning.rooms.length === 1}><Trash2 className='text-red-600' /></Button>
                </div>
                <div className='space-y-2'>
                  {room.items.map((item) => <div key={item.id} className='grid grid-cols-[minmax(0,1fr)_54px_80px_36px] gap-1.5 sm:grid-cols-[minmax(0,1fr)_72px_100px_36px] sm:gap-2'>
                    <input value={item.name} onChange={(event) => updateInventoryItem(room.id, item.id, { name: event.target.value })} aria-label='Gegenstand' className='h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' />
                    <input type='number' min='0' value={item.quantity} onChange={(event) => updateInventoryItem(room.id, item.id, { quantity: toNumber(event.target.value) })} aria-label='Menge' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' />
                    <div className='relative'><input type='number' min='0' step='0.01' value={item.volumeM3} onChange={(event) => updateInventoryItem(room.id, item.id, { volumeM3: toNumber(event.target.value) })} aria-label='Volumen in Kubikmeter' className='h-9 w-full rounded-md border border-slate-300 px-2 pr-8 text-sm outline-none focus:border-primary' /><span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>m³</span></div>
                    <Button type='button' variant='ghost' size='icon' title='Gegenstand entfernen' onClick={() => removeInventoryItem(room.id, item.id)}><Trash2 className='text-red-600' /></Button>
                  </div>)}
                </div>
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <Button type='button' variant='outline' size='sm' onClick={() => addInventoryItem(room.id)}><PackagePlus /> Gegenstand</Button>
                  <span className='text-xs text-slate-500'>Schnell hinzufügen:</span>
                  {commonInventoryItems.map((item) => <button key={item.name} type='button' onClick={() => addCommonInventoryItem(room.id, item)} className='rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary'>{item.name}</button>)}
                </div>
              </div>)}
            </div>
            <Button type='button' variant='outline' className='mt-4' onClick={addRoom}><Home /> Raum hinzufügen</Button>
          </section>}

          {activeStep === "inventory" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={ImagePlus} title='Objektfotos' description='Wähle vorhandene Bilder oder lade direkt bei der Vor-Ort-Aufnahme neue Fotos in die Mediathek.' />
            <MediathekDialog btnName='Fotos auswählen oder hochladen' multiSelect onSelect={(urls) => updatePlanning("photoUrls", Array.isArray(urls) ? urls : [urls])} />
            {calculation.planning.photoUrls.length > 0 && <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {calculation.planning.photoUrls.map((url) => <div key={url} className='relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-100'><img src={url} alt='Objektaufnahme' className='h-full w-full object-cover' /><Button type='button' variant='destructive' size='icon' title='Foto entfernen' onClick={() => updatePlanning("photoUrls", calculation.planning.photoUrls.filter((photoUrl) => photoUrl !== url))} className='absolute right-2 top-2 h-8 w-8'><Trash2 size={15} /></Button></div>)}
            </div>}
          </section>}

          {activeStep === "price" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Euro} title='Konditionen & Angebot' description='Standardwerte und auftragsspezifische Kosten fließen direkt in den Angebotspreis ein.' />
            <div className='mb-5 rounded-md border border-blue-200 bg-blue-50 p-4'>
              <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
                <div>
                  <p className='text-sm font-semibold text-slate-950'>Automatische Empfehlung</p>
                  <p className='mt-1 text-sm text-slate-600'>{calculation.autoEstimate ? "Die Angebotswerte werden bei jeder Aufnahmeaenderung aktualisiert." : "Manuelle Werte sind aktiv und werden nicht automatisch ueberschrieben."}</p>
                </div>
                <Button type='button' variant={calculation.autoEstimate ? 'outline' : 'default'} size='sm' onClick={enableAutomaticEstimate} disabled={calculation.autoEstimate}>Automatik {calculation.autoEstimate ? 'aktiv' : 'uebernehmen'}</Button>
              </div>
              {recommendation.explanations.length > 0 && <ul className='mt-3 space-y-1 text-xs text-slate-600'>{recommendation.explanations.map((explanation) => <li key={explanation}>- {explanation}</li>)}</ul>}
              <div className='mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
                <div><p className='text-xs text-slate-500'>Personal</p><p className='mt-1 font-semibold text-slate-950'>{recommendation.employees} Pers.</p></div>
                <div><p className='text-xs text-slate-500'>Dauer je Pers.</p><p className='mt-1 font-semibold text-slate-950'>{recommendation.hoursPerEmployee} Std.</p></div>
                <div><p className='text-xs text-slate-500'>Kartons</p><p className='mt-1 font-semibold text-slate-950'>{recommendation.boxes}</p></div>
                <div><p className='text-xs text-slate-500'>Fahrzeuge</p><p className='mt-1 font-semibold text-slate-950'>{recommendation.vehicleSelections.reduce((total, selection) => total + selection.quantity, 0)}</p></div>
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <NumberField label='Mitarbeiter-Stundensatz' value={rates.employeeHourlyRate} onChange={(value) => updateRate("employeeHourlyRate", value)} suffix='EUR / Std.' step='0.01' />
              <NumberField label='Fahrtkosten pro Kilometer' value={rates.kilometerRate} onChange={(value) => updateRate("kilometerRate", value)} suffix='EUR / km' step='0.01' />
              <NumberField label='Planungs- & Auftragspauschale' value={rates.planningFee} onChange={(value) => updateRate("planningFee", value)} suffix='EUR' step='0.01' />
              <NumberField label='Aufschlag / Gewinnmarge' value={rates.surchargePercent} onChange={(value) => updateRate("surchargePercent", value)} suffix='%' step='0.1' />
              <NumberField label='Mehrwertsteuer' value={rates.vatPercent} onChange={(value) => updateRate("vatPercent", value)} suffix='%' step='0.1' />
              <NumberField label='Mitarbeiter' value={calculation.employees} onChange={(value) => updateManualCalculation("employees", value)} suffix='Personen' />
              <NumberField label='Stunden je Mitarbeiter' value={calculation.hoursPerEmployee} onChange={(value) => updateManualCalculation("hoursPerEmployee", value)} suffix='Std.' step='0.25' />
              {needsVehicle && <NumberField label='Fahrzeugtage' value={calculation.vehicleDays} onChange={(value) => updateManualCalculation("vehicleDays", value)} suffix='Tage' step='0.5' />}
              {usesMoveInventory && <NumberField label='Logistik (Lift / Zone)' value={calculation.logisticsCost} onChange={(value) => updateManualCalculation("logisticsCost", value)} suffix='EUR' step='0.01' />}
              {(selectedServices.has("painting") || selectedServices.has("packing")) && <NumberField label='Materialkosten' value={calculation.materialCost} onChange={(value) => updateManualCalculation("materialCost", value)} suffix='EUR' step='0.01' />}
              {selectedServices.has("clearance") && <NumberField label='Entsorgung' value={calculation.disposalCost} onChange={(value) => updateManualCalculation("disposalCost", value)} suffix='EUR' step='0.01' />}
              {selectedServices.has("storage") && <NumberField label='Einlagerung' value={calculation.storageCost} onChange={(value) => updateManualCalculation("storageCost", value)} suffix='EUR' step='0.01' />}
              <NumberField label='Weitere Kosten' value={calculation.otherCost} onChange={(value) => updateManualCalculation("otherCost", value)} suffix='EUR' step='0.01' />
            </div>
            {needsVehicle && <div className='mt-5 border-t border-slate-200 pt-5'>
              <p className='text-sm font-semibold text-slate-950'>Fahrzeugplanung</p>
              <p className='mt-1 text-sm text-slate-600'>Die Automatik waehlt nach dem erfassten Volumen. Eine Mengenanpassung schaltet auf manuelle Planung.</p>
              <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                {vehicleOptions.map((vehicle) => {
                  const selection = calculation.planning.vehicleSelections.find((item) => item.vehicleId === vehicle.id);
                  return <NumberField key={vehicle.id} label={`${vehicle.name} (${vehicle.capacityM3} m3, ${formatCurrency(vehicle.dailyRate)}/Tag)`} value={selection?.quantity ?? 0} onChange={(value) => updateVehicleSelection(vehicle.id, value)} suffix='Stk.' />;
                })}
              </div>
            </div>}
            <details className='mt-5 rounded-md border border-slate-200 bg-slate-50 p-4'>
              <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Berechnungsbasis anpassen</summary>
              <p className='mt-2 text-sm text-slate-600'>Diese Werte gelten fuer die aktuelle Planung und werden in der Automatik sofort beruecksichtigt.</p>
              <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                {selectedServices.has("painting") && <>
                  <NumberField label='Material je m2 und Anstrich' value={rates.paintMaterialPerM2} onChange={(value) => updateRate("paintMaterialPerM2", value)} suffix='EUR' step='0.01' />
                  <NumberField label='Arbeitszeit je m2 und Anstrich' value={rates.paintLaborHoursPerM2} onChange={(value) => updateRate("paintLaborHoursPerM2", value)} suffix='Std.' step='0.01' />
                </>}
                {selectedServices.has("clearance") && <NumberField label='Entsorgung je m3' value={rates.disposalRatePerM3} onChange={(value) => updateRate("disposalRatePerM3", value)} suffix='EUR' step='0.01' />}
                {selectedServices.has("furnitureAssembly") && <NumberField label='Montagezeit je Moebelteil' value={rates.furnitureAssemblyMinutesPerPiece} onChange={(value) => updateRate("furnitureAssemblyMinutesPerPiece", value)} suffix='Min.' step='1' />}
                {selectedServices.has("packing") && <>
                  <NumberField label='Kartonpreis' value={rates.packingBoxRate} onChange={(value) => updateRate("packingBoxRate", value)} suffix='EUR' step='0.01' />
                  <NumberField label='Einpackzeit je Karton' value={rates.packingMinutesPerBox} onChange={(value) => updateRate("packingMinutesPerBox", value)} suffix='Min.' step='1' />
                </>}
                {selectedServices.has("storage") && <NumberField label='Einlagerung je m3 und Monat' value={rates.storageRatePerM3Month} onChange={(value) => updateRate("storageRatePerM3Month", value)} suffix='EUR' step='0.01' />}
                {usesMoveInventory && <>
                  <NumberField label='Moebellift pro Tag' value={rates.furnitureLiftDailyRate} onChange={(value) => updateRate("furnitureLiftDailyRate", value)} suffix='EUR' step='0.01' />
                  <NumberField label='Halteverbotszone' value={rates.parkingPermitRate} onChange={(value) => updateRate("parkingPermitRate", value)} suffix='EUR' step='0.01' />
                </>}
              </div>
            </details>
            <div className='mt-5 border-t border-slate-200 pt-5'>
              <div className='mb-3 flex items-center justify-between'><p className='text-sm font-medium text-slate-700'>Zusatzleistungen</p><Button type='button' variant='outline' size='sm' onClick={addExtraService}><PackagePlus /> Zusatzleistung</Button></div>
              <div className='space-y-2'>{calculation.planning.extraServices.map((service) => <div key={service.id} className='grid grid-cols-[minmax(0,1fr)_72px_120px_36px] gap-2'><input value={service.name} onChange={(event) => updateExtraService(service.id, { name: event.target.value })} aria-label='Zusatzleistung' className='h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' /><input type='number' min='0' value={service.quantity} onChange={(event) => updateExtraService(service.id, { quantity: toNumber(event.target.value) })} aria-label='Menge' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' /><div className='relative'><input type='number' min='0' step='0.01' value={service.unitPrice} onChange={(event) => updateExtraService(service.id, { unitPrice: toNumber(event.target.value) })} aria-label='Einzelpreis' className='h-9 w-full rounded-md border border-slate-300 px-2 pr-9 text-sm outline-none focus:border-primary' /><span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>EUR</span></div><Button type='button' variant='ghost' size='icon' title='Zusatzleistung entfernen' onClick={() => removeExtraService(service.id)}><Trash2 className='text-red-600' /></Button></div>)}</div>
            </div>
          </section>}

          {activeStep === "price" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Clock3} title='Hinweise zur Ausführung' description='Diese Informationen werden in der Kundenansicht mit ausgegeben.' />
            <textarea value={calculation.planning.notes} onChange={(event) => updatePlanning("notes", event.target.value)} rows={5} placeholder='Besondere Möbel, enge Treppenhäuser, Terminabsprachen oder weitere Hinweise ...' className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20' />
            <div className='mt-5 flex justify-end'><Button onClick={() => void saveCalculation()} disabled={isSaving}><Save /> Planung & Angebot speichern</Button></div>
          </section>}

          {activeStep === "finish" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Save} title='Gespeicherte Planungen' description='Jede gespeicherte Planung enthält Inventar, Fotos und die ursprünglichen Konditionen.' />
            {savedCalculations.length === 0 ? <p className='py-6 text-center text-sm text-slate-500'>Noch keine Planung gespeichert.</p> : <div className='divide-y divide-slate-200'>{savedCalculations.map((item) => <div key={item.id} className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'><button type='button' onClick={() => loadCalculation(item)} className='min-w-0 text-left'><p className='truncate font-medium text-slate-950'>{item.title || "Unbenannte Planung"}</p><p className='mt-1 text-sm text-slate-600'>{item.customer || item.planning.contactName || "Ohne Kundenzuordnung"} · {new Date(item.createdAt).toLocaleDateString("de-DE")} · {calculateVolume(item.planning.rooms).toFixed(2)} m³</p></button><div className='flex shrink-0 items-center gap-3'><span className='font-semibold text-slate-950'>{formatCurrency(calculateGrossTotal(item, item.rates))}</span><Button variant='ghost' size='icon' title='Planung löschen' onClick={() => void deleteCalculation(item.id)} disabled={isSaving}><Trash2 className='text-red-600' /></Button></div></div>)}</div>}
          </section>}
          <div className='flex items-center justify-between gap-3 border-t border-slate-200 pt-5'>
            <Button type='button' variant='outline' onClick={goToPreviousStep} disabled={currentStepIndex === 0}>
              <ArrowLeft /> Zurück
            </Button>
            {activeStep === "finish" ? (
              <Button onClick={() => void saveCalculation()} disabled={isSaving}>
                {isSaving ? <LoaderCircle className='animate-spin' /> : <Save />} Planung speichern
              </Button>
            ) : (
              <Button type='button' className='min-h-11' onClick={goToNextStep}>
                Weiter zu {planningSteps[currentStepIndex + 1]?.label} <ArrowRight />
              </Button>
            )}
          </div>
        </div>

        <aside className='sticky top-6 hidden rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-xl xl:block'>
          <p className='text-sm font-medium text-slate-300'>Voraussichtlicher Angebotspreis</p>
          <p className='mt-2 text-4xl font-bold'>{formatCurrency(grossTotal)}</p>
          <p className='mt-1 text-sm text-slate-400'>inkl. {rates.vatPercent}% MwSt.</p>
          <div className='mt-6 grid grid-cols-2 gap-3 border-y border-white/15 py-5'><div><p className='text-xs text-slate-400'>Volumen</p><p className='mt-1 text-xl font-semibold'>{volume.toFixed(2)} m³</p></div><div><p className='text-xs text-slate-400'>Laufweg</p><p className='mt-1 text-xl font-semibold'>{calculation.planning.carryDistanceM} m</p></div></div>
          <div className='mt-5 space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><Users size={15} /> Personal</span><span>{formatCurrency(employeeCost)}</span></div>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><Car size={15} /> Fahrt & Fahrzeug</span><span>{formatCurrency(mileageCost + vehicleCost)}</span></div>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><PackagePlus size={15} /> Zusatzleistungen</span><span>{formatCurrency(extraServiceCost)}</span></div>
            {calculation.logisticsCost > 0 && <div className='flex items-center justify-between gap-3 text-slate-300'><span>Lift & Halteverbotszone</span><span>{formatCurrency(calculation.logisticsCost)}</span></div>}
            {calculation.storageCost > 0 && <div className='flex items-center justify-between gap-3 text-slate-300'><span>Einlagerung</span><span>{formatCurrency(calculation.storageCost)}</span></div>}
            <div className='flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-slate-300'><span>Pauschale & Extras</span><span>{formatCurrency(rates.planningFee + calculation.materialCost + calculation.disposalCost + calculation.otherCost)}</span></div>
            <div className='flex justify-between gap-4 text-slate-300'><span>Aufschlag</span><span>{formatCurrency(surcharge)}</span></div>
            <div className='flex justify-between gap-4 text-slate-300'><span>Netto</span><span>{formatCurrency(netTotal)}</span></div>
            <div className='flex justify-between gap-4 border-t border-white/15 pt-3 font-medium text-white'><span>MwSt.</span><span>{formatCurrency(vat)}</span></div>
          </div>
        </aside>
      </div>
      <div className='fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-xl xl:hidden'>
        <div className='min-w-0'>
          <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400'>Aktuelles Angebot</p>
          <p className='truncate text-xl font-bold'>{formatCurrency(grossTotal)}</p>
        </div>
        <Button type='button' size='sm' className='shrink-0 bg-blue-600 px-3 text-white hover:bg-blue-500' onClick={() => setActiveStep("price")}>
          <Euro /> Angebot
        </Button>
      </div>
    </main>
  );
}