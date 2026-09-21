"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { database } from "@/config/firebase";
import {
  createOfferScopeItems,
  DEFAULT_OFFER_PAYMENT_TERMS,
  OFFER_ISSUER,
} from "@/lib/crmOfferDocument";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { CrmCustomer } from "@/types/Crm";
import type { AssistantOfferDraft } from "@/types/OfferAssistant";
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
  PackageCheck,
  PackagePlus,
  Paintbrush,
  Printer,
  Save,
  Trash2,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import OfferAssistant from "./OfferAssistant";
import ServiceConfigurator from "./ServiceConfigurator";
import {
  calculateMaterials,
  calculatePackagedMaterial,
  defaultMaterialCatalog,
  normalizeMaterialCatalog,
  sumMaterialNetTotal,
  type CalculatedMaterial,
  type MaterialCatalogItem,
} from "./materialCatalog";
import {
  calculatePaintColorAreas,
  calculatePaintLiters,
  type PaintColorPlan,
  type PaintSurfaceCondition,
} from "./paintColorPlanning";
import type { RoofSlopeType } from "./paintingAreaCalculation";

type PlanningStep = "order" | "site" | "inventory" | "price" | "finish";

type OfferTab = "conditions" | "calculation";

type CostEstimatePrintOptions = {
  siteDetails: boolean;
  calculationDetails: boolean;
  packingList: boolean;
  notes: boolean;
  photos: boolean;
};

const defaultCostEstimatePrintOptions: CostEstimatePrintOptions = {
  siteDetails: true,
  calculationDetails: true,
  packingList: true,
  notes: true,
  photos: false,
};

export type ServiceKey =
  | "move"
  | "seniorMove"
  | "clearance"
  | "painting"
  | "furnitureAssembly"
  | "packing"
  | "storage";

export type MoveComplexity = "easy" | "standard" | "difficult";

type Rates = {
  employeeHourlyRate: number;
  vehicleDailyRate: number;
  kilometerRate: number;
  planningFee: number;
  surchargePercent: number;
  vatPercent: number;
  paintMaterialPerM2: number;
  paintLaborHoursPerM2: number;
  wallpaperLaborHoursPerM2: number;
  wallpaperRemovalHoursPerM2: number;
  plasterMaterialPerM2: number;
  plasterLaborHoursPerM2: number;
  furnitureAssemblyMinutesPerPiece: number;
  disposalRatePerM3: number;
  hazardousDisposalRatePerM3: number;
  containerRate: number;
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

export type PaintingRates = Pick<
  Rates,
  "paintMaterialPerM2" | "plasterMaterialPerM2"
>;

export type PaintMaterialLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  liters: number;
  coverageM2PerLiter: number;
};

// Gebinde mit Liter- und Ergiebigkeitsangabe fließen als EUR/m² in den Flächenpreis ein statt als Pauschale.
export function paintMaterialPerM2Price(item: PaintMaterialLine) {
  return item.liters > 0 && item.coverageM2PerLiter > 0
    ? item.unitPrice / (item.liters * item.coverageM2PerLiter)
    : 0;
}

export type OfferPackage = {
  id: string;
  name: string;
  services: ServiceKey[];
  discountPercent: number;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  volumeM3: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
};

type InventoryItemDraft = {
  name: string;
  quantity: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  volumeM3: string;
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

export type PlanningDetails = {
  serviceTypes: ServiceKey[];
  scopeDescription: string;
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
  careHours: number;
  furnitureLiftRequired: boolean;
  parkingRequired: boolean;
  packingRequired: boolean;
  livingAreaM2: number;
  paintingRoomCount: number;
  roomHeightM: number;
  openingDeductionPercent: number;
  paintAreaAutoCalculate: boolean;
  roofSlopeType: RoofSlopeType;
  slopedRoomCount: number;
  kneeWallHeightM: number;
  roofPitchDegrees: number;
  paintAreaM2: number;
  ceilingAreaM2: number;
  paintCoats: number;
  paintSurfaceCondition: PaintSurfaceCondition;
  paintReservePercent: number;
  paintColors: PaintColorPlan[];
  repairAreaM2: number;
  plasterAreaM2: number;
  wallpaperEnabled: boolean;
  wallpaperAreaMode: "allWalls" | "custom";
  wallpaperAreaM2: number;
  wallpaperRollWidthM: number;
  wallpaperRollLengthM: number;
  wallpaperWastePercent: number;
  wallpaperRollPrice: number;
  removeOldWallpaper: boolean;
  paintWallpaper: boolean;
  paintMaterials: PaintMaterialLine[];
  furniturePieces: number;
  movingBoxes: number;
  unpackingBoxes: number;
  fragileItemCount: number;
  storageVolumeM3: number;
  storageMonths: number;
  disposalVolumeM3: number;
  clearanceHeavyItems: number;
  clearanceCredit: number;
  clearanceDisposalIncluded: boolean;
  clearanceHazardousVolumeM3: number;
  clearanceContainerCount: number;
  clearanceBroomClean: boolean;
  vehicleSelections: VehicleSelection[];
  notes: string;
  rooms: Room[];
  extraServices: ServiceLine[];
  photoUrls: string[];
};

type Calculation = {
  customerId?: string;
  title: string;
  customer: string;
  customerAddress: string;
  offerNumber: string;
  validUntil: string;
  paymentTerms: string;
  employees: number;
  hoursPerEmployee: number;
  kilometers: number;
  vehicleDays: number;
  materialCost: number;
  disposalCost: number;
  storageCost: number;
  logisticsCost: number;
  otherCost: number;
  discountPercent: number;
  packageName?: string;
  positionLabels: Record<string, string>;
  autoEstimate: boolean;
  planning: PlanningDetails;
};

type SavedCalculation = Calculation & {
  id: string;
  createdAt: number;
  grossTotal?: number;
  rates: Rates;
};

type CalculatorData = {
  rates: Rates;
  calculation: Calculation;
  savedCalculations: SavedCalculation[];
  packages: OfferPackage[];
  materialCatalog: MaterialCatalogItem[];
};

const storageCollection = "offer_calculators_umzugshelden";
const crmCollection = "crm_customers_umzugshelden";

const serviceOptions: Array<{
  id: ServiceKey;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  { id: "move", label: "Umzug", description: "Volumen, Personal und Fahrzeuge", icon: Car },
  { id: "seniorMove", label: "Seniorenumzug", description: "Mehr Zeit fuer Betreuung und Sorgfalt", icon: Home },
  { id: "clearance", label: "Entruempelung", description: "Volumen, Personal und Entsorgung", icon: Trash2 },
  { id: "painting", label: "Anstricharbeiten", description: "Flaeche, Anstriche und Material", icon: Paintbrush },
  { id: "furnitureAssembly", label: "Moebelmontage", description: "Moebelteile und Montagezeit", icon: Wrench },
  { id: "packing", label: "Einpackservice", description: "Kartons, Material und Zeit", icon: PackagePlus },
  { id: "storage", label: "Einlagerung", description: "Volumen, Dauer und Transport", icon: Warehouse },
];

const vehicleOptions = [
  { id: "transporter", name: "Sprinter", capacityM3: 12, dailyRate: 120 },
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

const emptyInventoryItemDraft: InventoryItemDraft = {
  name: "",
  quantity: "1",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  volumeM3: "",
};

const defaultRates: Rates = {
  employeeHourlyRate: 42,
  vehicleDailyRate: 95,
  kilometerRate: 0.75,
  planningFee: 45,
  surchargePercent: 15,
  vatPercent: 19,
  paintMaterialPerM2: 4.5,
  paintLaborHoursPerM2: 0.12,
  wallpaperLaborHoursPerM2: 0.18,
  wallpaperRemovalHoursPerM2: 0.08,
  plasterMaterialPerM2: 3.5,
  plasterLaborHoursPerM2: 0.35,
  furnitureAssemblyMinutesPerPiece: 30,
  disposalRatePerM3: 65,
  hazardousDisposalRatePerM3: 180,
  containerRate: 250,
  storageRatePerM3Month: 8,
  packingBoxRate: 2.5,
  packingMinutesPerBox: 5,
  furnitureLiftDailyRate: 280,
  parkingPermitRate: 120,
};

const defaultPackages: OfferPackage[] = [
  {
    id: "komplett",
    name: "Rundum-Sorglos-Paket",
    services: ["move", "packing", "furnitureAssembly"],
    discountPercent: 10,
  },
  {
    id: "umzug-entruempelung",
    name: "Umzug + Entrümpelung",
    services: ["move", "clearance"],
    discountPercent: 8,
  },
  {
    id: "senioren-komplett",
    name: "Senioren-Komplettpaket",
    services: ["seniorMove", "packing", "furnitureAssembly"],
    discountPercent: 10,
  },
];

const legacyServiceMap: Record<string, ServiceKey> = {
  Umzug: "move",
  Seniorenumzug: "seniorMove",
  Entruempelung: "clearance",
  Malerarbeiten: "painting",
  Anstricharbeiten: "painting",
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
    scopeDescription: "",
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
    careHours: 0,
    furnitureLiftRequired: false,
    parkingRequired: false,
    packingRequired: false,
    livingAreaM2: 0,
    paintingRoomCount: 1,
    roomHeightM: 2.5,
    openingDeductionPercent: 10,
    paintAreaAutoCalculate: true,
    roofSlopeType: "none",
    slopedRoomCount: 0,
    kneeWallHeightM: 1,
    roofPitchDegrees: 35,
    paintAreaM2: 0,
    ceilingAreaM2: 0,
    paintCoats: 2,
    paintSurfaceCondition: "normal",
    paintReservePercent: 10,
    paintColors: [
      {
        id: crypto.randomUUID(),
        name: "Weiß",
        hexColor: "#f8fafc",
        areaMode: "remaining",
        areaM2: 0,
        coats: 2,
        materialId: "paint",
      },
    ],
    repairAreaM2: 0,
    plasterAreaM2: 0,
    wallpaperEnabled: false,
    wallpaperAreaMode: "allWalls",
    wallpaperAreaM2: 0,
    wallpaperRollWidthM: 0.53,
    wallpaperRollLengthM: 10.05,
    wallpaperWastePercent: 10,
    wallpaperRollPrice: 25,
    removeOldWallpaper: false,
    paintWallpaper: true,
    paintMaterials: [],
    furniturePieces: 0,
    movingBoxes: 0,
    unpackingBoxes: 0,
    fragileItemCount: 0,
    storageVolumeM3: 0,
    storageMonths: 1,
    disposalVolumeM3: 0,
    clearanceHeavyItems: 0,
    clearanceCredit: 0,
    clearanceDisposalIncluded: true,
    clearanceHazardousVolumeM3: 0,
    clearanceContainerCount: 0,
    clearanceBroomClean: false,
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

function dateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function createOfferNumber() {
  const date = new Date();
  const datePart = dateInputValue(date).replaceAll("-", "");
  return `ANG-${datePart}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function createCalculation(): Calculation {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 14);

  return {
    title: "Neues Angebot",
    customer: "",
    customerAddress: "",
    offerNumber: createOfferNumber(),
    validUntil: dateInputValue(validUntil),
    paymentTerms: DEFAULT_OFFER_PAYMENT_TERMS,
    employees: 2,
    hoursPerEmployee: 4,
    kilometers: 30,
    vehicleDays: 1,
    materialCost: 0,
    disposalCost: 0,
    storageCost: 0,
    logisticsCost: 0,
    otherCost: 0,
    discountPercent: 0,
    positionLabels: {},
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
  const surfaceConditions = new Set<PaintSurfaceCondition>([
    "smooth",
    "normal",
    "absorbent",
  ]);
  return {
    ...fallback,
    ...planning,
    serviceTypes: normalizeServiceTypes(planning?.serviceTypes),
    rooms: planning?.rooms ?? fallback.rooms,
    extraServices: planning?.extraServices ?? [],
    paintSurfaceCondition: surfaceConditions.has(
      planning?.paintSurfaceCondition as PaintSurfaceCondition
    )
      ? (planning?.paintSurfaceCondition as PaintSurfaceCondition)
      : fallback.paintSurfaceCondition,
    paintReservePercent: Math.min(
      50,
      Math.max(0, planning?.paintReservePercent ?? fallback.paintReservePercent)
    ),
    paintColors:
      planning?.paintColors?.length
        ? planning.paintColors.map((color, index) => ({
            id: color.id || crypto.randomUUID(),
            name: color.name || `Farbe ${index + 1}`,
            hexColor: /^#[0-9a-f]{6}$/i.test(color.hexColor)
              ? color.hexColor
              : "#f8fafc",
            areaMode: color.areaMode === "custom" ? "custom" : "remaining",
            areaM2: Math.max(0, color.areaM2 ?? 0),
            coats: Math.max(1, Math.round(color.coats ?? planning.paintCoats ?? 2)),
            materialId: color.materialId ?? "paint",
          }))
        : fallback.paintColors.map((color) => ({
            ...color,
            coats: Math.max(1, Math.round(planning?.paintCoats ?? color.coats)),
          })),
    paintMaterials: (planning?.paintMaterials ?? []).map((item) => ({
      ...item,
      liters: item.liters ?? 0,
      coverageM2PerLiter: item.coverageM2PerLiter ?? 0,
    })),
    photoUrls: planning?.photoUrls ?? [],
    vehicleSelections: planning?.vehicleSelections ?? [],
  };
}

function normalizeCalculation(calculation?: Partial<Calculation>): Calculation {
  const fallback = createCalculation();
  return {
    ...fallback,
    ...calculation,
    positionLabels: calculation?.positionLabels ?? {},
    planning: normalizePlanning(calculation?.planning),
  };
}

function sanitizeFirestoreValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      item === undefined ? [] : [sanitizeFirestoreValue(item)]
    ) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, nestedValue]) =>
        nestedValue === undefined
          ? []
          : [[key, sanitizeFirestoreValue(nestedValue)]]
      )
    ) as T;
  }

  return value;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function toOptionalNumber(value: string) {
  return value.trim() === "" ? undefined : toNumber(value);
}

function calculateDimensionVolumeM3(
  item: Pick<InventoryItem, "lengthCm" | "widthCm" | "heightCm">
) {
  const { lengthCm, widthCm, heightCm } = item;
  if (!lengthCm || !widthCm || !heightCm) return null;
  return (lengthCm * widthCm * heightCm) / 1_000_000;
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

type ServiceCostShare = {
  service: ServiceKey;
  labourHours: number;
  materialCost: number;
  disposalCost: number;
  storageCost: number;
  logisticsCost: number;
};

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
  materials: CalculatedMaterial[];
  explanations: string[];
  serviceShares: ServiceCostShare[];
};

function calculateServiceRecommendation(
  calculation: Calculation,
  rates: Rates,
  volume: number,
  materialCatalog: MaterialCatalogItem[]
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
  const serviceShares: ServiceCostShare[] = [];
  let labourHours = 0;
  let employees = 1;
  let requiredVehicleVolume = 0;
  let materialCost = 0;
  let disposalCost = 0;
  let storageCost = 0;
  let logisticsCost = 0;
  let boxes = planning.movingBoxes;
  const materials: CalculatedMaterial[] = [];

  if (selectedServices.has("move") || selectedServices.has("seniorMove")) {
    const seniorFactor = selectedServices.has("seniorMove") ? 1.2 : 1;
    const moveTrips = Math.max(1, planning.moveTrips);
    const moveLabourHours = Math.max(
      4,
      volume * 0.55 * accessFactor * seniorFactor +
        planning.dismantlingHours +
        planning.specialItemCount * 0.75 +
        planning.moveBufferHours +
        planning.careHours +
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
    const moveLogistics =
      (planning.furnitureLiftRequired
        ? rates.furnitureLiftDailyRate * Math.ceil(moveTrips / 2)
        : 0) + (planning.parkingRequired ? rates.parkingPermitRate : 0);
    logisticsCost += moveLogistics;
    serviceShares.push({
      service: selectedServices.has("seniorMove") ? "seniorMove" : "move",
      labourHours: moveLabourHours,
      materialCost: 0,
      disposalCost: 0,
      storageCost: 0,
      logisticsCost: moveLogistics,
    });
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
    const totalClearanceVolume =
      clearanceVolume + planning.clearanceHazardousVolumeM3;
    let clearanceHours = Math.max(
      3,
      totalClearanceVolume * 0.45 * accessFactor +
        planning.clearanceHeavyItems * 0.75
    );
    if (planning.clearanceBroomClean) {
      clearanceHours += Math.max(1, totalClearanceVolume * 0.06);
    }
    labourHours += clearanceHours;
    employees = Math.max(employees, totalClearanceVolume > 20 ? 3 : 2);
    if (planning.clearanceDisposalIncluded) {
      requiredVehicleVolume = Math.max(requiredVehicleVolume, totalClearanceVolume);
    }
    let clearanceDisposal =
      planning.clearanceContainerCount * rates.containerRate;
    if (planning.clearanceDisposalIncluded) {
      clearanceDisposal +=
        clearanceVolume * rates.disposalRatePerM3 +
        planning.clearanceHazardousVolumeM3 * rates.hazardousDisposalRatePerM3;
    }
    const clearanceDisposalCost = Math.max(
      0,
      clearanceDisposal - planning.clearanceCredit
    );
    disposalCost += clearanceDisposalCost;
    const clearanceLogistics = planning.parkingRequired
      ? rates.parkingPermitRate
      : 0;
    logisticsCost += clearanceLogistics;
    serviceShares.push({
      service: "clearance",
      labourHours: clearanceHours,
      materialCost: 0,
      disposalCost: clearanceDisposalCost,
      storageCost: 0,
      logisticsCost: clearanceLogistics,
    });
    explanations.push(
      planning.clearanceDisposalIncluded
        ? `${clearanceVolume.toFixed(1)} m3 Entsorgungsvolumen`
        : `${totalClearanceVolume.toFixed(1)} m3 Entruempelung ohne Entsorgung (nur Arbeitszeit)`
    );
    if (planning.clearanceDisposalIncluded && planning.clearanceHazardousVolumeM3 > 0) {
      explanations.push(
        `${planning.clearanceHazardousVolumeM3.toFixed(1)} m3 Sondermuell / Problemstoffe`
      );
    }
    if (planning.clearanceContainerCount > 0) {
      explanations.push(`${planning.clearanceContainerCount} Container inkl. Stellung`);
    }
    if (planning.clearanceBroomClean) {
      explanations.push("Besenreine Uebergabe eingeplant");
    }
    if (planning.clearanceCredit > 0) {
      explanations.push(`${formatCurrency(planning.clearanceCredit)} Wertanrechnung`);
    }
  }

  if (selectedServices.has("painting")) {
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
    const paintArea = calculatedPaintColors.reduce(
      (total, color) => total + color.coatedAreaM2,
      0
    );
    const plasterRepairArea = planning.repairAreaM2 + planning.plasterAreaM2;
    const wallpaperHours =
      wallpaperAreaM2 * rates.wallpaperLaborHoursPerM2 +
      (planning.removeOldWallpaper
        ? wallpaperAreaM2 * rates.wallpaperRemovalHoursPerM2
        : 0);
    const paintingHours =
      paintArea * rates.paintLaborHoursPerM2 +
      plasterRepairArea * rates.plasterLaborHoursPerM2 +
      wallpaperHours;
    labourHours += paintingHours;
    employees = Math.max(
      employees,
      paintArea + wallpaperAreaM2 > 100 ? 2 : 1
    );
    const wallPaintMaterials = materialCatalog.filter(
      (item) =>
        item.enabled &&
        item.service === "painting" &&
        item.materialType === "wallPaint"
    );
    const colorMaterials = calculatedPaintColors.flatMap((color) => {
      const material =
        wallPaintMaterials.find((item) => item.id === color.materialId) ??
        wallPaintMaterials[0];
      if (!material || color.coatedAreaM2 <= 0) return [];

      const packagedMaterial = calculatePackagedMaterial(
        material,
        calculatePaintLiters(
          color.coatedAreaM2,
          planning.paintSurfaceCondition,
          planning.paintReservePercent
        ),
        {
          id: `paint-color:${color.id}`,
          name: `${material.name} · ${color.name}`,
          basisAmount: color.coatedAreaM2,
        }
      );
      return packagedMaterial ? [packagedMaterial] : [];
    });
    const automaticPaintingMaterials = calculateMaterials(
      materialCatalog.filter((item) => item.materialType !== "wallPaint"),
      {
        coatedAreaM2: paintArea,
        surfaceAreaM2: paintedWallAreaM2 + planning.ceilingAreaM2,
        protectionAreaM2:
          planning.ceilingAreaM2 > 0
            ? planning.ceilingAreaM2
            : paintedWallAreaM2 * 0.25,
        repairAreaM2: plasterRepairArea,
        wallpaperAreaM2:
          wallpaperAreaM2 *
          (1 + Math.min(100, planning.wallpaperWastePercent) / 100),
        packingBoxCount: 0,
        fixed: 1,
      },
      "painting"
    );
    const paintingMaterials = [
      ...colorMaterials,
      ...automaticPaintingMaterials,
    ];
    const paintingMaterial = sumMaterialNetTotal(paintingMaterials);
    materials.push(...paintingMaterials);
    materialCost += paintingMaterial;
    serviceShares.push({
      service: "painting",
      labourHours: paintingHours,
      materialCost: paintingMaterial,
      disposalCost: 0,
      storageCost: 0,
      logisticsCost: 0,
    });
    explanations.push(
      `${planning.paintAreaM2.toFixed(0)} m2 Wand und ${planning.ceilingAreaM2.toFixed(0)} m2 Decke, ${calculatedPaintColors.length} Farbton/Farbtöne`
    );
    if (wallpaperAreaM2 > 0) {
      const wallpaperPackages = paintingMaterials
        .filter((item) => item.calculationBasis === "wallpaperAreaM2")
        .reduce((total, item) => total + item.packageQuantity, 0);
      explanations.push(
        `${wallpaperAreaM2.toFixed(1)} m2 Tapete, ${wallpaperPackages} Gebinde laut Preisliste${planning.removeOldWallpaper ? ", inklusive Alt-Tapete entfernen" : ""}`
      );
    }
    if (plasterRepairArea > 0) {
      explanations.push(
        `${plasterRepairArea.toFixed(1)} m2 Spachtel- und Ausbesserungsarbeiten`
      );
    }
  }

  if (selectedServices.has("furnitureAssembly")) {
    const assemblyFactor =
      planning.moveComplexity === "easy"
        ? 0.85
        : planning.moveComplexity === "difficult"
          ? 1.35
          : 1;
    const assemblyHours =
      (planning.furniturePieces * rates.furnitureAssemblyMinutesPerPiece * assemblyFactor) /
        60 +
      planning.dismantlingHours;
    labourHours += assemblyHours;
    employees = Math.max(employees, planning.furniturePieces > 8 ? 2 : 1);
    serviceShares.push({
      service: "furnitureAssembly",
      labourHours: assemblyHours,
      materialCost: 0,
      disposalCost: 0,
      storageCost: 0,
      logisticsCost: 0,
    });
    explanations.push(`${planning.furniturePieces} Moebelteile zur Montage`);
  }

  if (selectedServices.has("packing")) {
    boxes = planning.movingBoxes || Math.ceil(volume * 10);
    const packingHours =
      ((boxes + planning.unpackingBoxes) * rates.packingMinutesPerBox +
        planning.fragileItemCount * 5) /
      60;
    labourHours += packingHours;
    const packingMaterials = calculateMaterials(
      materialCatalog,
      {
        coatedAreaM2: 0,
        surfaceAreaM2: 0,
        protectionAreaM2: 0,
        repairAreaM2: 0,
        wallpaperAreaM2: 0,
        packingBoxCount: boxes,
        fixed: 1,
      },
      "packing"
    );
    const packingMaterial = sumMaterialNetTotal(packingMaterials);
    materials.push(...packingMaterials);
    materialCost += packingMaterial;
    employees = Math.max(employees, boxes > 40 ? 2 : 1);
    serviceShares.push({
      service: "packing",
      labourHours: packingHours,
      materialCost: packingMaterial,
      disposalCost: 0,
      storageCost: 0,
      logisticsCost: 0,
    });
    explanations.push(`${boxes} Kartons fuer den Einpackservice`);
  }

  if (selectedServices.has("storage")) {
    const storageVolume = planning.storageVolumeM3 || volume;
    const storageHours = Math.max(
      1,
      storageVolume * 0.15 * accessFactor + (Math.max(1, planning.moveTrips) - 1)
    );
    labourHours += storageHours;
    requiredVehicleVolume = Math.max(requiredVehicleVolume, storageVolume);
    const storageMonthlyCost =
      storageVolume *
      Math.max(1, planning.storageMonths) *
      rates.storageRatePerM3Month;
    storageCost += storageMonthlyCost;
    serviceShares.push({
      service: "storage",
      labourHours: storageHours,
      materialCost: 0,
      disposalCost: 0,
      storageCost: storageMonthlyCost,
      logisticsCost: 0,
    });
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
    materials,
    explanations,
    serviceShares,
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
  const subtotal = directCost + surcharge;
  const discountPercent = Math.min(
    100,
    Math.max(0, calculation.discountPercent ?? 0)
  );
  const discount = subtotal * (discountPercent / 100);
  const netTotal = subtotal - discount;
  const vat = netTotal * (rates.vatPercent / 100);
  return {
    employeeCost:
      calculation.employees * calculation.hoursPerEmployee * rates.employeeHourlyRate,
    vehicleCost,
    mileageCost: calculation.kilometers * rates.kilometerRate,
    extraServiceCost: calculateExtraServices(calculation.planning.extraServices),
    directCost,
    surcharge,
    discount,
    discountPercent,
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

type CalculationRow = {
  id: string;
  label: string;
  formula: string;
  value: number;
};

function getCalculationRows(
  calculation: Calculation,
  rates: Rates,
  materialCatalog: MaterialCatalogItem[]
): CalculationRow[] {
  const pricing = calculatePricing(calculation, rates);
  const volume = calculateVolume(calculation.planning.rooms);
  const recommendation = calculateServiceRecommendation(
    calculation,
    rates,
    volume,
    materialCatalog
  );
  const positionLabels = calculation.positionLabels ?? {};
  const resolveLabel = (id: string, fallback: string) =>
    positionLabels[id] ?? fallback;
  const useServiceRows =
    calculation.autoEstimate && recommendation.serviceShares.length > 0;
  const totalLabourHours = recommendation.serviceShares.reduce(
    (total, share) => total + share.labourHours,
    0
  );
  const shareTotals = recommendation.serviceShares.reduce(
    (totals, share) => ({
      material: totals.material + share.materialCost,
      disposal: totals.disposal + share.disposalCost,
      storage: totals.storage + share.storageCost,
      logistics: totals.logistics + share.logisticsCost,
    }),
    { material: 0, disposal: 0, storage: 0, logistics: 0 }
  );
  const serviceRows: CalculationRow[] = recommendation.serviceShares.map(
    (share) => {
      const personalPart =
        totalLabourHours > 0
          ? pricing.employeeCost * (share.labourHours / totalLabourHours)
          : 0;
      const materialPart =
        shareTotals.material > 0
          ? calculation.materialCost * (share.materialCost / shareTotals.material)
          : 0;
      const disposalPart =
        shareTotals.disposal > 0
          ? calculation.disposalCost * (share.disposalCost / shareTotals.disposal)
          : 0;
      const storagePart =
        shareTotals.storage > 0
          ? calculation.storageCost * (share.storageCost / shareTotals.storage)
          : 0;
      const logisticsPart =
        shareTotals.logistics > 0
          ? calculation.logisticsCost *
            (share.logisticsCost / shareTotals.logistics)
          : 0;
      const id = `service:${share.service}`;
      return {
        id,
        label: resolveLabel(
          id,
          serviceOptions.find((option) => option.id === share.service)?.label ??
            share.service
        ),
        formula: [
          `${share.labourHours.toFixed(1)} Std. Arbeitszeit (${formatCurrency(personalPart)})`,
          ...(materialPart > 0 ? [`Material ${formatCurrency(materialPart)}`] : []),
          ...(disposalPart > 0 ? [`Entsorgung ${formatCurrency(disposalPart)}`] : []),
          ...(storagePart > 0 ? [`Lagerkosten ${formatCurrency(storagePart)}`] : []),
          ...(logisticsPart > 0
            ? [`Lift/Halteverbotszone ${formatCurrency(logisticsPart)}`]
            : []),
        ].join(" + "),
        value:
          personalPart + materialPart + disposalPart + storagePart + logisticsPart,
      };
    }
  );
  const materialFormula = calculation.autoEstimate
    ? recommendation.materials.length > 0
      ? recommendation.materials
          .map(
            (item) =>
              `${item.packageQuantity} × ${item.packageLabel} ${item.name} (${formatCurrency(item.netTotal)} netto)`
          )
          .join(" + ")
      : "Kein Materialbedarf"
    : "Manuell festgelegter Betrag";
  const clearanceVolume = calculation.planning.disposalVolumeM3 || volume;
  const storageVolume = calculation.planning.storageVolumeM3 || volume;
  const disposalParts = [
    ...(calculation.planning.clearanceDisposalIncluded
      ? [
          `${clearanceVolume} m³ × ${formatCurrency(rates.disposalRatePerM3)}`,
          ...(calculation.planning.clearanceHazardousVolumeM3 > 0
            ? [`${calculation.planning.clearanceHazardousVolumeM3} m³ Sondermüll × ${formatCurrency(rates.hazardousDisposalRatePerM3)}`]
            : []),
        ]
      : []),
    ...(calculation.planning.clearanceContainerCount > 0
      ? [`${calculation.planning.clearanceContainerCount} Container × ${formatCurrency(rates.containerRate)}`]
      : []),
  ].join(" + ");
  const disposalFormula = calculation.autoEstimate
    ? `${disposalParts || "Ohne Entsorgung"}${calculation.planning.clearanceCredit > 0 ? ` - ${formatCurrency(calculation.planning.clearanceCredit)} Wertanrechnung` : ""}`
    : "Manuell festgelegter Betrag";
  const logisticsFormula = calculation.autoEstimate
    ? [
        ...(calculation.planning.furnitureLiftRequired
          ? [`${Math.ceil(Math.max(1, calculation.planning.moveTrips) / 2)} Tag(e) Möbellift × ${formatCurrency(rates.furnitureLiftDailyRate)}`]
          : []),
        ...(calculation.planning.parkingRequired
          ? [`Halteverbotszone ${formatCurrency(rates.parkingPermitRate)}`]
          : []),
      ].join(" + ")
    : "Manuell festgelegter Betrag";

  return [
    ...(useServiceRows
      ? serviceRows
      : [
          {
            id: "personal",
            label: resolveLabel("personal", "Personal"),
            formula: `${calculation.employees} Mitarbeiter × ${calculation.hoursPerEmployee} Std. × ${formatCurrency(rates.employeeHourlyRate)}`,
            value: pricing.employeeCost,
          },
        ]),
    ...calculation.planning.vehicleSelections.flatMap((selection) => {
      const vehicle = vehicleOptions.find(
        (option) => option.id === selection.vehicleId
      );
      if (!vehicle) return [];
      return [{
        id: `vehicle:${vehicle.id}`,
        label: resolveLabel(`vehicle:${vehicle.id}`, vehicle.name),
        formula: `${selection.quantity} Fahrzeug(e) × ${calculation.vehicleDays} Tag(e) × ${formatCurrency(vehicle.dailyRate)}`,
        value: selection.quantity * calculation.vehicleDays * vehicle.dailyRate,
      }];
    }),
    {
      id: "mileage",
      label: resolveLabel("mileage", "Fahrtstrecke"),
      formula: `${calculation.kilometers} km × ${formatCurrency(rates.kilometerRate)}`,
      value: pricing.mileageCost,
    },
    {
      id: "planningFee",
      label: resolveLabel("planningFee", "Planungs- & Auftragspauschale"),
      formula: "Festbetrag",
      value: rates.planningFee,
    },
    ...(!useServiceRows && calculation.materialCost > 0
      ? [{ id: "material", label: resolveLabel("material", "Material"), formula: materialFormula, value: calculation.materialCost }]
      : []),
    ...(!useServiceRows && calculation.disposalCost > 0
      ? [{ id: "disposal", label: resolveLabel("disposal", "Entsorgung"), formula: disposalFormula, value: calculation.disposalCost }]
      : []),
    ...(!useServiceRows && calculation.storageCost > 0
      ? [{ id: "storage", label: resolveLabel("storage", "Einlagerung"), formula: calculation.autoEstimate ? `${storageVolume} m³ × ${Math.max(1, calculation.planning.storageMonths)} Monat(e) × ${formatCurrency(rates.storageRatePerM3Month)}` : "Manuell festgelegter Betrag", value: calculation.storageCost }]
      : []),
    ...(!useServiceRows && calculation.logisticsCost > 0
      ? [{ id: "logistics", label: resolveLabel("logistics", "Lift & Halteverbotszone"), formula: logisticsFormula, value: calculation.logisticsCost }]
      : []),
    ...(calculation.otherCost > 0
      ? [{ id: "other", label: resolveLabel("other", "Weitere Kosten"), formula: "Manueller Betrag", value: calculation.otherCost }]
      : []),
    ...calculation.planning.extraServices.map((service) => ({
      id: `extra:${service.id}`,
      label: service.name || "Zusatzleistung",
      formula: `${service.quantity} × ${formatCurrency(service.unitPrice)}`,
      value: service.quantity * service.unitPrice,
    })),
  ];
}

function CalculationBreakdown({
  calculation,
  rates,
  materialCatalog,
  onPrint,
  onRenamePosition,
}: {
  calculation: Calculation;
  rates: Rates;
  materialCatalog: MaterialCatalogItem[];
  onPrint: () => void;
  onRenamePosition: (id: string, label: string) => void;
}) {
  const pricing = calculatePricing(calculation, rates);
  const recommendation = calculateServiceRecommendation(
    calculation,
    rates,
    calculateVolume(calculation.planning.rooms),
    materialCatalog
  );
  const calculationRows = getCalculationRows(
    calculation,
    rates,
    materialCatalog
  );

  return (
    <div className='space-y-5'>
      <div className='flex flex-col justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center'>
        <div>
          <p className='text-sm font-semibold text-slate-950'>Live-Kalkulation</p>
          <p className='mt-1 text-sm text-slate-600'>
            Jede Änderung an Konditionen, Personal, Fahrzeugen oder Zusatzleistungen
            wird hier sofort eingerechnet. Positionsnamen lassen sich direkt
            bearbeiten und erscheinen so auch im gedruckten Angebot.
          </p>
        </div>
        <Button type='button' variant='outline' className='shrink-0 bg-white' onClick={onPrint}>
          <Printer /> Kostenvoranschlag drucken
        </Button>
      </div>

      {recommendation.materials.length > 0 && (
        <div className='overflow-hidden rounded-md border border-emerald-200'>
          <div className='flex items-center justify-between gap-4 bg-emerald-50 px-4 py-3'>
            <div>
              <p className='text-sm font-semibold text-emerald-950'>Materialbedarf aus Preisliste</p>
              <p className='mt-0.5 text-xs text-emerald-800'>Volle Gebinde und Nettopreise</p>
            </div>
            <strong className='tabular-nums text-emerald-950'>{formatCurrency(sumMaterialNetTotal(recommendation.materials))} netto</strong>
          </div>
          <div className='divide-y divide-emerald-100'>
            {recommendation.materials.map((item) => (
              <div key={item.id} className='grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-sm'>
                <div>
                  <p className='font-medium text-slate-950'>{item.name}</p>
                  <p className='mt-0.5 text-xs text-slate-500'>{item.requiredAmount} {item.unit} Bedarf · {item.packageQuantity} × {item.packageLabel}</p>
                </div>
                <span className='font-semibold tabular-nums text-slate-950'>{formatCurrency(item.netTotal)} netto</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='overflow-hidden rounded-md border border-slate-200'>
        <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500'>
          <span>Position und Rechnung</span>
          <span>Betrag</span>
        </div>
        <div className='divide-y divide-slate-200'>
          {calculationRows.map((row) => (
            <div key={row.id} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3'>
              <div className='min-w-0'>
                <input
                  value={row.label}
                  onChange={(event) => onRenamePosition(row.id, event.target.value)}
                  aria-label='Positionsname'
                  className='-mx-1 w-full max-w-sm rounded border border-transparent bg-transparent px-1 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-primary focus:bg-white'
                />
                <p className='mt-0.5 text-xs text-slate-500'>{row.formula}</p>
              </div>
              <span className='text-sm font-semibold tabular-nums text-slate-950'>
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='ml-auto w-full max-w-lg space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-center justify-between gap-4 text-sm'>
          <span className='text-slate-600'>Direkte Kosten</span>
          <strong className='tabular-nums text-slate-950'>{formatCurrency(pricing.directCost)}</strong>
        </div>
        <div className='flex items-start justify-between gap-4 text-sm'>
          <span className='text-slate-600'>Aufschlag ({rates.surchargePercent}% von {formatCurrency(pricing.directCost)})</span>
          <strong className='shrink-0 tabular-nums text-slate-950'>{formatCurrency(pricing.surcharge)}</strong>
        </div>
        {pricing.discount > 0 && (
          <div className='flex items-start justify-between gap-4 text-sm'>
            <span className='text-slate-600'>Kombi-Rabatt ({pricing.discountPercent}%)</span>
            <strong className='shrink-0 tabular-nums text-emerald-700'>-{formatCurrency(pricing.discount)}</strong>
          </div>
        )}
        <div className='flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-sm'>
          <span className='font-medium text-slate-700'>Nettosumme</span>
          <strong className='tabular-nums text-slate-950'>{formatCurrency(pricing.netTotal)}</strong>
        </div>
        <div className='flex items-start justify-between gap-4 text-sm'>
          <span className='text-slate-600'>MwSt. ({rates.vatPercent}% von {formatCurrency(pricing.netTotal)})</span>
          <strong className='shrink-0 tabular-nums text-slate-950'>{formatCurrency(pricing.vat)}</strong>
        </div>
        <div className='flex items-center justify-between gap-4 border-t border-slate-300 pt-3'>
          <span className='font-semibold text-slate-950'>Angebotspreis brutto</span>
          <strong className='text-xl tabular-nums text-slate-950'>{formatCurrency(pricing.grossTotal)}</strong>
        </div>
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
  const searchParams = useSearchParams();
  const requestedCustomerId = searchParams.get("customerId");
  const requestedOfferId = searchParams.get("offerId");
  const [rates, setRates] = useState<Rates>(defaultRates);
  const [calculation, setCalculation] = useState<Calculation>(() =>
    createCalculation()
  );
  const [savedCalculations, setSavedCalculations] = useState<
    SavedCalculation[]
  >([]);
  const [packages, setPackages] = useState<OfferPackage[]>(defaultPackages);
  const [materialCatalog, setMaterialCatalog] = useState<MaterialCatalogItem[]>(
    () => defaultMaterialCatalog.map((item) => ({ ...item }))
  );
  const [newPackageName, setNewPackageName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [printError, setPrintError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<PlanningStep>("order");
  const [offerTab, setOfferTab] = useState<OfferTab>("conditions");
  const [activeServiceTab, setActiveServiceTab] = useState<ServiceKey | null>(null);
  const [isCostEstimateDialogOpen, setIsCostEstimateDialogOpen] = useState(false);
  const [customInventoryRoomId, setCustomInventoryRoomId] = useState<string | null>(null);
  const [inventoryItemDraft, setInventoryItemDraft] = useState<InventoryItemDraft>(emptyInventoryItemDraft);
  const [costEstimatePrintOptions, setCostEstimatePrintOptions] =
    useState<CostEstimatePrintOptions>(defaultCostEstimatePrintOptions);

  const draftDimensions = {
    lengthCm: toOptionalNumber(inventoryItemDraft.lengthCm),
    widthCm: toOptionalNumber(inventoryItemDraft.widthCm),
    heightCm: toOptionalNumber(inventoryItemDraft.heightCm),
  };
  const draftDimensionVolumeM3 = calculateDimensionVolumeM3(draftDimensions);
  const hasAnyDraftDimension = [
    inventoryItemDraft.lengthCm,
    inventoryItemDraft.widthCm,
    inventoryItemDraft.heightCm,
  ].some((value) => value.trim() !== "");
  const draftVolumeM3 =
    draftDimensionVolumeM3 ?? toNumber(inventoryItemDraft.volumeM3);
  const canAddInventoryItem =
    customInventoryRoomId !== null &&
    inventoryItemDraft.name.trim() !== "" &&
    toNumber(inventoryItemDraft.quantity) > 0 &&
    draftVolumeM3 > 0 &&
    (!hasAnyDraftDimension || draftDimensionVolumeM3 !== null);

  useEffect(() => {
    const companyId = companyData?.id;
    if (!companyId) return;
    const calculatorRef = doc(database, storageCollection, companyId);
    let active = true;

    async function loadCalculator() {
      try {
        const snapshot = await getDoc(calculatorRef);
        const data = snapshot.data() as Partial<CalculatorData> | undefined;
        const loadedMaterialCatalog = normalizeMaterialCatalog(
          data?.materialCatalog
        );
        const loadedSavedCalculations = (data?.savedCalculations ?? []).map(
          (saved) => {
            const normalized = normalizeCalculation(saved);
            const savedRates = { ...defaultRates, ...saved.rates };

            return {
              ...normalized,
              id: saved.id,
              createdAt: saved.createdAt,
              grossTotal:
                saved.grossTotal ?? calculateGrossTotal(normalized, savedRates),
              rates: savedRates,
            };
          }
        );
        const requestedOffer = loadedSavedCalculations.find(
          (saved) =>
            saved.id === requestedOfferId &&
            (!requestedCustomerId || saved.customerId === requestedCustomerId)
        );
        let nextCalculation = requestedOffer
          ? normalizeCalculation(requestedOffer)
          : requestedCustomerId
            ? createCalculation()
            : normalizeCalculation(data?.calculation);

        if (requestedCustomerId) {
          const customerSnapshot = await getDoc(
            doc(database, crmCollection, requestedCustomerId)
          );
          const customer = customerSnapshot.data() as CrmCustomer | undefined;
          if (customer && customer.ownerId === companyId) {
            const customerAddress = [
              customer.street,
              `${customer.postalCode} ${customer.city}`.trim(),
            ].filter(Boolean).join(", ");
            nextCalculation = {
              ...nextCalculation,
              customerId: customer.id,
              customer: nextCalculation.customer || customer.company || customer.name,
              customerAddress:
                nextCalculation.customerAddress || customerAddress,
              title: requestedOffer
                ? nextCalculation.title
                : `Angebot ${customer.company || customer.name}`,
              planning: {
                ...nextCalculation.planning,
                contactName: nextCalculation.planning.contactName || customer.name,
                contactPhone: nextCalculation.planning.contactPhone || customer.phone,
                contactEmail: nextCalculation.planning.contactEmail || customer.email,
                oldAddress: nextCalculation.planning.oldAddress || customerAddress,
              },
            };
          }
        }

        if (active) {
          setRates({
            ...defaultRates,
            ...(requestedOffer?.rates ?? data?.rates),
          });
          setCalculation(nextCalculation);
          setSavedCalculations(loadedSavedCalculations);
          setMaterialCatalog(loadedMaterialCatalog);
          if (data?.packages?.length) setPackages(data.packages);
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
  }, [companyData?.id, requestedCustomerId, requestedOfferId]);

  const volume = calculateVolume(calculation.planning.rooms);
  const recommendation = calculateServiceRecommendation(
    calculation,
    rates,
    volume,
    materialCatalog
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
    discount,
    netTotal,
    vat,
    grossTotal,
  } = calculatePricing(calculation, rates);
  const selectedServices = new Set(calculation.planning.serviceTypes);
  const activeSiteService =
    activeServiceTab && calculation.planning.serviceTypes.includes(activeServiceTab)
      ? activeServiceTab
      : calculation.planning.serviceTypes[0];
  const usesMoveInventory =
    selectedServices.has("move") || selectedServices.has("seniorMove");
  const needsVehicle =
    usesMoveInventory ||
    selectedServices.has("clearance") ||
    selectedServices.has("storage");
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
  const availablePlanningSteps = usesMoveInventory
    ? planningSteps
    : planningSteps.filter((step) => step.id !== "inventory");
  type NavStep = {
    key: string;
    stepId: PlanningStep;
    service?: ServiceKey;
    label: string;
    icon: typeof ClipboardList;
    completed: boolean;
  };
  const navSteps: NavStep[] = availablePlanningSteps.flatMap((step): NavStep[] => {
    if (step.id !== "site" || calculation.planning.serviceTypes.length === 0) {
      return [{
        key: step.id,
        stepId: step.id,
        label: step.label,
        icon: step.icon,
        completed: completedSteps[step.id],
      }];
    }
    return calculation.planning.serviceTypes.map((service) => {
      const option = serviceOptions.find((item) => item.id === service);
      return {
        key: `site:${service}`,
        stepId: "site" as PlanningStep,
        service,
        label: option?.label ?? service,
        icon: option?.icon ?? MapPin,
        completed: completedSteps.site,
      };
    });
  });
  const activeNavIndex = navSteps.findIndex((step) =>
    step.service
      ? activeStep === "site" && step.service === activeSiteService
      : step.stepId === activeStep
  );
  const completeStepCount = navSteps.filter((step) => step.completed).length;

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

  function updateCustomerName(value: string) {
    setCalculation((current) => {
      const usesAutomaticTitle =
        !current.title.trim() ||
        current.title === "Neues Angebot" ||
        current.title === `Angebot ${current.customer}`;

      return {
        ...current,
        customer: value,
        title: usesAutomaticTitle
          ? value.trim()
            ? `Angebot ${value.trim()}`
            : "Neues Angebot"
          : current.title,
      };
    });
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

  function openCalculatedOffer() {
    enableAutomaticEstimate();
    setOfferTab("calculation");
    setActiveStep("price");
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
    nextSavedCalculations: SavedCalculation[] = savedCalculations,
    nextPackages: OfferPackage[] = packages,
    nextMaterialCatalog: MaterialCatalogItem[] = materialCatalog
  ) {
    const companyId = companyData?.id;
    if (!companyId) return false;
    setIsSaving(true);
    setStatus("idle");
    try {
      await setDoc(
        doc(database, storageCollection, companyId),
        sanitizeFirestoreValue({
          ownerId: companyId,
          rates,
          calculation,
          savedCalculations: nextSavedCalculations,
          packages: nextPackages,
          materialCatalog: nextMaterialCatalog,
          updatedAt: Date.now(),
        }),
        { merge: true }
      );
      setSavedCalculations(nextSavedCalculations);
      setPackages(nextPackages);
      setMaterialCatalog(nextMaterialCatalog);
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
        paintMaterials: [...calculation.planning.paintMaterials],
        photoUrls: [...calculation.planning.photoUrls],
      },
      rates: { ...rates },
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      grossTotal: calculateGrossTotal(calculation, rates),
    };
    await persist([savedCalculation, ...savedCalculations]);
  }

  function loadCalculation(savedCalculation: SavedCalculation) {
    setCalculation((current) => {
      const loaded = normalizeCalculation(savedCalculation);
      if (!requestedCustomerId) return loaded;

      return {
        ...loaded,
        customerId: requestedCustomerId,
        customer: current.customer,
        planning: {
          ...loaded.planning,
          contactName: current.planning.contactName,
          contactPhone: current.planning.contactPhone,
          contactEmail: current.planning.contactEmail,
          oldAddress: current.planning.oldAddress,
        },
      };
    });
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

  function openInventoryItemDialog(roomId: string) {
    setInventoryItemDraft(emptyInventoryItemDraft);
    setCustomInventoryRoomId(roomId);
  }

  function addInventoryItem() {
    if (!canAddInventoryItem || !customInventoryRoomId) return;
    const inventoryItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: inventoryItemDraft.name.trim(),
      quantity: toNumber(inventoryItemDraft.quantity),
      volumeM3: draftVolumeM3,
      ...(draftDimensionVolumeM3 !== null ? draftDimensions : {}),
    };

    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === customInventoryRoomId
          ? {
              ...room,
              items: [...room.items, inventoryItem],
            }
          : room
      )
    );
    setCustomInventoryRoomId(null);
    setInventoryItemDraft(emptyInventoryItemDraft);
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

  function goToNavStep(step: NavStep) {
    setActiveStep(step.stepId);
    if (step.service) setActiveServiceTab(step.service);
  }

  function goToNextStep() {
    const nextStep = navSteps[activeNavIndex + 1];
    if (nextStep) goToNavStep(nextStep);
  }

  function goToPreviousStep() {
    const previousStep = navSteps[activeNavIndex - 1];
    if (previousStep) goToNavStep(previousStep);
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

  function updateInventoryDimension(
    roomId: string,
    itemId: string,
    key: "lengthCm" | "widthCm" | "heightCm",
    value: number | undefined
  ) {
    updatePlanning(
      "rooms",
      calculation.planning.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: room.items.map((item) => {
                if (item.id !== itemId) return item;
                const nextItem = { ...item, [key]: value };
                const calculatedVolumeM3 = calculateDimensionVolumeM3(nextItem);
                return calculatedVolumeM3 === null
                  ? nextItem
                  : { ...nextItem, volumeM3: calculatedVolumeM3 };
              }),
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

  function renamePosition(id: string, label: string) {
    if (id.startsWith("extra:")) {
      updateExtraService(id.slice("extra:".length), { name: label });
      return;
    }
    setCalculation((current) => ({
      ...current,
      positionLabels: { ...current.positionLabels, [id]: label },
    }));
    setStatus("idle");
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
    setCalculation((current) => {
      const selected = current.planning.serviceTypes.includes(service);
      const serviceTypes = selected
        ? current.planning.serviceTypes.filter((item) => item !== service)
        : [...current.planning.serviceTypes, service];
      return {
        ...current,
        packageName: undefined,
        planning: { ...current.planning, serviceTypes },
      };
    });
    setStatus("idle");
  }

  function applyPackage(offerPackage: OfferPackage) {
    setCalculation((current) => ({
      ...current,
      discountPercent: offerPackage.discountPercent,
      packageName: offerPackage.name,
      planning: {
        ...current.planning,
        serviceTypes: [...offerPackage.services],
      },
    }));
    setStatus("idle");
  }

  function saveCurrentSelectionAsPackage() {
    const name = newPackageName.trim();
    if (!name || calculation.planning.serviceTypes.length === 0) return;
    setPackages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        services: [...calculation.planning.serviceTypes],
        discountPercent: calculation.discountPercent,
      },
    ]);
    setNewPackageName("");
    setStatus("idle");
  }

  function updatePackage(id: string, patch: Partial<OfferPackage>) {
    setPackages((current) =>
      current.map((offerPackage) =>
        offerPackage.id === id ? { ...offerPackage, ...patch } : offerPackage
      )
    );
    setStatus("idle");
  }

  function removePackage(id: string) {
    setPackages((current) =>
      current.filter((offerPackage) => offerPackage.id !== id)
    );
    setStatus("idle");
  }

  function applyAssistantDraft(draft: AssistantOfferDraft) {
    setCalculation((current) => {
      const planning = { ...current.planning };
      const assign = <Key extends keyof PlanningDetails>(
        key: Key,
        value: PlanningDetails[Key] | undefined | null
      ) => {
        if (value === undefined || value === null) return;
        if (typeof value === "string" && value.trim() === "") return;
        planning[key] = value;
      };

      const services = normalizeServiceTypes(draft.services ?? []);
      if (services.length) planning.serviceTypes = services;
      assign("contactName", draft.contactName);
      assign("contactPhone", draft.contactPhone);
      assign("contactEmail", draft.contactEmail);
      assign("date", draft.date);
      assign("oldAddress", draft.oldAddress);
      assign("newAddress", draft.newAddress);
      assign("oldFloor", draft.oldFloor);
      assign("newFloor", draft.newFloor);
      assign("oldFloorLevel", draft.oldFloorLevel);
      assign("newFloorLevel", draft.newFloorLevel);
      assign("oldElevator", draft.oldElevator);
      assign("newElevator", draft.newElevator);
      assign("carryDistanceM", draft.carryDistanceM);
      assign("moveTrips", draft.moveTrips);
      assign("moveComplexity", draft.moveComplexity);
      assign("furnitureLiftRequired", draft.furnitureLiftRequired);
      assign("parkingRequired", draft.parkingRequired);
      assign("movingBoxes", draft.movingBoxes);
      assign("unpackingBoxes", draft.unpackingBoxes);
      assign("furniturePieces", draft.furniturePieces);
      assign("dismantlingHours", draft.dismantlingHours);
      assign("paintAreaM2", draft.paintAreaM2);
      assign("ceilingAreaM2", draft.ceilingAreaM2);
      if (draft.paintCoats !== undefined) {
        const coats = Math.max(1, Math.round(draft.paintCoats));
        planning.paintCoats = coats;
        planning.paintColors = planning.paintColors.map((color) => ({
          ...color,
          coats,
        }));
      }
      assign("disposalVolumeM3", draft.disposalVolumeM3);
      assign("clearanceHeavyItems", draft.clearanceHeavyItems);
      assign("clearanceDisposalIncluded", draft.clearanceDisposalIncluded);
      assign("clearanceHazardousVolumeM3", draft.clearanceHazardousVolumeM3);
      assign("clearanceContainerCount", draft.clearanceContainerCount);
      assign("clearanceBroomClean", draft.clearanceBroomClean);
      assign("storageVolumeM3", draft.storageVolumeM3);
      assign("storageMonths", draft.storageMonths);

      if (draft.rooms?.length) {
        planning.rooms = draft.rooms.map((room) => ({
          id: crypto.randomUUID(),
          name: room.name || "Raum",
          items: room.items.map((item) => ({
            id: crypto.randomUUID(),
            name: item.name,
            quantity: item.quantity,
            volumeM3: item.volumeM3,
          })),
        }));
      }
      if (draft.notes) {
        planning.notes = planning.notes
          ? `${planning.notes}\n${draft.notes}`
          : draft.notes;
      }

      return {
        ...current,
        title: draft.title || current.title,
        customer: draft.customer || current.customer,
        kilometers: draft.kilometers ?? current.kilometers,
        autoEstimate: true,
        planning,
      };
    });
    setActiveStep("price");
    setStatus("idle");
  }

  function updateCostEstimatePrintOption(
    option: keyof CostEstimatePrintOptions,
    checked: boolean
  ) {
    setCostEstimatePrintOptions((current) => ({
      ...current,
      [option]: checked,
    }));
  }

  function printCostEstimate() {
    setPrintError(null);
    if (
      !(calculation.customer.trim() || calculation.planning.contactName.trim()) ||
      calculation.planning.serviceTypes.length === 0
    ) {
      setPrintError(
        "Für ein Angebot müssen ein Kunde und mindestens eine Leistung erfasst sein."
      );
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrintError(
        "Das Druckfenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben."
      );
      return;
    }

    const pricing = calculatePricing(calculation, rates);
    const calculationRows = getCalculationRows(
      calculation,
      rates,
      materialCatalog
    );
    const rowsHtml = calculationRows
      .map(
        (row) => `<tr>
          <td><strong>${escapePrintHtml(row.label)}</strong>${costEstimatePrintOptions.calculationDetails ? `<span>${escapePrintHtml(row.formula)}</span>` : ""}</td>
          <td>${formatCurrency(row.value)}</td>
        </tr>`
      )
      .join("");
    const services = calculation.planning.serviceTypes
      .map(
        (service) =>
          serviceOptions.find((option) => option.id === service)?.label || service
      )
      .join(", ");
    const customer =
      calculation.customer || calculation.planning.contactName || "Kunde";
    const createdAt = new Date().toLocaleDateString("de-DE");
    const validUntil = calculation.validUntil
      ? new Date(`${calculation.validUntil}T00:00:00`).toLocaleDateString("de-DE")
      : "nicht festgelegt";
    const scopeItems = createOfferScopeItems(calculation.planning);
    const scopeHtml = `<h2>Leistungsumfang</h2>
      ${calculation.planning.scopeDescription.trim() ? `<div class="scope-description">${escapePrintHtml(calculation.planning.scopeDescription.trim()).replaceAll("\n", "<br>")}</div>` : ""}
      <div class="scope-list">${scopeItems.length
        ? scopeItems.map((item) => `<section class="scope-item"><h3>${escapePrintHtml(item.title)}</h3><ul>${item.details.map((detail) => `<li>${escapePrintHtml(detail)}</li>`).join("")}</ul></section>`).join("")
        : '<p class="muted">Der konkrete Leistungsumfang wurde noch nicht festgelegt.</p>'}</div>`;
    const contactCardHtml = `<div class="card"><p class="label">Kunde / Auftraggeber</p><strong>${escapePrintHtml(customer)}</strong><div class="muted">${escapePrintHtml(calculation.customerAddress || "Anschrift nicht angegeben")}<br>${escapePrintHtml(calculation.planning.contactPhone || "Telefon nicht angegeben")}<br>${escapePrintHtml(calculation.planning.contactEmail || "E-Mail nicht angegeben")}</div></div>`;
    const siteDetailsHtml = costEstimatePrintOptions.siteDetails
      ? `<h2>Objekt- und Einsatzdaten</h2>
        <section class="grid">
          <div class="card"><p class="label">Auszug / Einsatzort</p><strong>${escapePrintHtml(calculation.planning.oldAddress || "Adresse nicht angegeben")}</strong><div class="muted">Etage: ${escapePrintHtml(calculation.planning.oldFloor || "-")} · Aufzug: ${calculation.planning.oldElevator ? "vorhanden" : "nicht vorhanden"}</div></div>
          <div class="card"><p class="label">Einzug / Zielort</p><strong>${escapePrintHtml(calculation.planning.newAddress || "Adresse nicht angegeben")}</strong><div class="muted">Etage: ${escapePrintHtml(calculation.planning.newFloor || "-")} · Aufzug: ${calculation.planning.newElevator ? "vorhanden" : "nicht vorhanden"}</div></div>
        </section>
        <section class="facts">
          <div><span>Fahrtstrecke</span><strong>${calculation.kilometers} km</strong></div>
          <div><span>Trageweg</span><strong>${calculation.planning.carryDistanceM} m</strong></div>
          <div><span>Halteverbotszone</span><strong>${calculation.planning.parkingRequired ? "Erforderlich" : "Nicht erforderlich"}</strong></div>
        </section>`
      : "";
    const packingListRoomsHtml = calculation.planning.rooms
      .filter((room) => room.items.length > 0)
      .map(
        (room) => `<section class="inventory-room">
          <h3>${escapePrintHtml(room.name || "Raum")}</h3>
          <table class="inventory"><thead><tr><th>Gegenstand</th><th>Menge</th><th>Volumen</th></tr></thead><tbody>
            ${room.items.map((item) => `<tr><td>${escapePrintHtml(item.name || "Gegenstand")}</td><td>${item.quantity}</td><td>${(item.quantity * item.volumeM3).toFixed(2)} m³</td></tr>`).join("")}
          </tbody></table>
        </section>`
      )
      .join("");
    const packingListHtml = costEstimatePrintOptions.packingList
      ? `<h2>Packliste / Inventar</h2><div class="volume-summary"><span>Gesamtvolumen</span><strong>${calculateVolume(calculation.planning.rooms).toFixed(2)} m³</strong></div>${packingListRoomsHtml || '<p class="muted">Es wurden noch keine Gegenstände erfasst.</p>'}`
      : "";
    const notesHtml = costEstimatePrintOptions.notes && calculation.planning.notes
      ? `<div class="notes"><strong>Hinweise zur Ausführung:</strong><br>${escapePrintHtml(calculation.planning.notes).replaceAll("\n", "<br>")}</div>`
      : "";
    const photosHtml = costEstimatePrintOptions.photos && calculation.planning.photoUrls.length > 0
      ? `<section class="photos-section"><h2>Objektfotos</h2><div class="photos">${calculation.planning.photoUrls.map((url, index) => `<img src="${escapePrintHtml(url)}" alt="Objektfoto ${index + 1}" />`).join("")}</div></section>`
      : "";

    printWindow.document.write(`<!doctype html>
      <html lang="de"><head><title>Kostenvoranschlag - ${escapePrintHtml(calculation.title || customer)}</title>
      <style>
        @page { margin: 15mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #17315c; font-family: "Poppins", Arial, sans-serif; font-size: 10pt; line-height: 1.45; }
        .document { max-width: 190mm; margin: 0 auto; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding-bottom: 18px; border-bottom: 4px solid #E87722; }
        .logo { width: 142px; height: auto; object-fit: contain; }
        .document-type { margin: 4px 0 0; color: #E87722; font-size: 8.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .sender { margin-top: 8px; color: #62728c; font-size: 8pt; }
        h1 { margin: 4px 0 0; color: #0D2650; font-size: 25pt; line-height: 1.12; }
        .meta { min-width: 155px; border: 1px solid #dbe1ea; padding: 11px 13px; color: #62728c; font-size: 9pt; text-align: right; }
        .meta strong { display: block; margin-top: 3px; color: #0D2650; font-size: 10.5pt; }
        .customer, .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .customer { margin: 22px 0; }
        .customer.single { grid-template-columns: 1fr; }
        .card { border: 1px solid #dbe1ea; border-radius: 4px; padding: 14px; break-inside: avoid; }
        .label { margin: 0 0 7px; color: #E87722; font-size: 8pt; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
        .card strong { color: #0D2650; font-size: 11pt; }
        .muted { margin-top: 4px; color: #62728c; }
        h2 { margin: 25px 0 10px; color: #0D2650; font-size: 14pt; }
        h3 { margin: 0 0 7px; color: #0D2650; font-size: 11pt; }
        .scope-description { margin-bottom: 10px; border-left: 4px solid #E87722; background: #fff8f2; padding: 11px 13px; color: #334155; }
        .scope-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .scope-item { border: 1px solid #dbe1ea; border-radius: 4px; padding: 11px 13px; break-inside: avoid; }
        .scope-item ul { margin: 0; padding-left: 17px; color: #52647f; }
        .scope-item li + li { margin-top: 3px; }
        .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
        .facts div { border-top: 2px solid #f2f4f7; padding-top: 8px; }
        .facts span { display: block; color: #62728c; font-size: 8pt; }
        .facts strong { display: block; margin-top: 2px; color: #0D2650; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 2px solid #E87722; padding: 8px 7px; color: #0D2650; font-size: 8pt; text-align: left; text-transform: uppercase; }
        th:last-child { text-align: right; }
        td { border-bottom: 1px solid #e8edf3; padding: 9px 7px; vertical-align: top; }
        td strong { display: block; color: #0D2650; }
        td span { display: block; margin-top: 2px; color: #62728c; font-size: 8.5pt; }
        td:last-child { width: 34mm; color: #0D2650; font-weight: 700; text-align: right; white-space: nowrap; }
        .totals { width: 92mm; margin: 16px 0 0 auto; border: 1px solid #dbe1ea; border-radius: 4px; padding: 12px 14px; break-inside: avoid; }
        .total-row { display: flex; justify-content: space-between; gap: 18px; padding: 4px 0; color: #52647f; }
        .total-row strong { color: #0D2650; white-space: nowrap; }
        .total-row.net { margin-top: 5px; border-top: 1px solid #dbe1ea; padding-top: 9px; color: #0D2650; font-weight: 600; }
        .total-row.gross { margin: 8px -14px -12px; border-radius: 0 0 4px 4px; background: #0D2650; padding: 13px 14px; color: #fff; font-size: 12pt; font-weight: 700; }
        .total-row.gross strong { color: #fff; font-size: 14pt; }
        .volume-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; border-radius: 4px; background: #0D2650; padding: 11px 14px; color: #fff; }
        .volume-summary span { color: #d6e0ef; }
        .volume-summary strong { font-size: 13pt; }
        .inventory-room { margin-bottom: 16px; break-inside: avoid; }
        .inventory th:not(:first-child), .inventory td:not(:first-child) { text-align: right; }
        .inventory td:nth-child(2) { width: 22mm; }
        .photos-section { break-before: page; page-break-before: always; }
        .photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .photos img { width: 100%; height: 66mm; border-radius: 3px; object-fit: cover; }
        .notice, .terms { margin-top: 20px; border-left: 4px solid #E87722; background: #fff8f2; padding: 12px 14px; color: #52647f; font-size: 9pt; }
        .terms p { margin: 0 0 5px; }
        .terms p:last-child { margin-bottom: 0; }
        .notes { margin-top: 20px; border-left: 4px solid #E87722; background: #fff8f2; padding: 12px 14px; white-space: normal; }
        .footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 28px; border-top: 1px solid #dbe1ea; padding-top: 11px; color: #62728c; font-size: 8pt; }
        @media print { .document { max-width: none; } .header, .card, .totals, tr { break-inside: avoid; } }
      </style></head><body><main class="document">
        <header class="header">
          <div><img class="logo" src="${window.location.origin}/images/Umzugshelden.png" alt="Umzugshelden" /><p class="document-type">Angebot · Kostenvoranschlag</p><h1>Angebot</h1><div class="sender">${escapePrintHtml(OFFER_ISSUER.proprietor)} · ${escapePrintHtml(OFFER_ISSUER.street)} · ${escapePrintHtml(`${OFFER_ISSUER.postalCode} ${OFFER_ISSUER.city}`)}</div></div>
          <div class="meta">Angebotsnummer<strong>${escapePrintHtml(calculation.offerNumber)}</strong>Erstellt am<strong>${createdAt}</strong>Gültig bis<strong>${validUntil}</strong></div>
        </header>
        <section class="customer">
          ${contactCardHtml}
          <div class="card"><p class="label">Projekt</p><strong>${escapePrintHtml(calculation.title || "Dienstleistungsauftrag")}</strong><div class="muted">${escapePrintHtml(services || "Leistung noch nicht festgelegt")}<br>Wunschtermin: ${escapePrintHtml(calculation.planning.date || "noch offen")}</div></div>
        </section>
        ${siteDetailsHtml}
        ${scopeHtml}
        <h2>Leistungen und Kosten</h2>
        <table><thead><tr><th>Position / Berechnung</th><th>Betrag</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <section class="totals">
          <div class="total-row"><span>Direkte Kosten</span><strong>${formatCurrency(pricing.directCost)}</strong></div>
          <div class="total-row"><span>Aufschlag (${rates.surchargePercent}%)</span><strong>${formatCurrency(pricing.surcharge)}</strong></div>
          ${pricing.discount > 0 ? `<div class="total-row"><span>Kombi-Rabatt (${pricing.discountPercent}%)</span><strong>-${formatCurrency(pricing.discount)}</strong></div>` : ""}
          <div class="total-row net"><span>Nettosumme</span><strong>${formatCurrency(pricing.netTotal)}</strong></div>
          <div class="total-row"><span>MwSt. (${rates.vatPercent}%)</span><strong>${formatCurrency(pricing.vat)}</strong></div>
          <div class="total-row gross"><span>Gesamtbetrag brutto</span><strong>${formatCurrency(pricing.grossTotal)}</strong></div>
        </section>
        ${packingListHtml}
        ${notesHtml}
        ${photosHtml}
        <div class="terms"><p><strong>Zahlungsbedingung:</strong> ${escapePrintHtml(calculation.paymentTerms || DEFAULT_OFFER_PAYMENT_TERMS)}</p><p><strong>Vertragsschluss:</strong> Dieses Angebot ist freibleibend. Ein Vertrag kommt durch unsere Auftragsbestätigung oder den Beginn der Leistungserbringung zustande.</p><p><strong>Grundlage:</strong> Es gelten unsere AGB unter umzugshelden.io/agb.</p></div>
        <div class="notice"><strong>Unverbindlicher Kostenanschlag:</strong> Die Kalkulation basiert auf den aktuell erfassten Angaben. Wird eine wesentliche Überschreitung erwartet, informieren wir den Auftraggeber unverzüglich (§ 649 BGB). Änderungen oder Zusatzleistungen werden nur nach Abstimmung ausgeführt und gesondert berechnet.</div>
        <footer class="footer"><span>${escapePrintHtml(OFFER_ISSUER.companyName)} · ${escapePrintHtml(OFFER_ISSUER.proprietor)} · ${escapePrintHtml(OFFER_ISSUER.legalForm)}<br>${escapePrintHtml(OFFER_ISSUER.street)} · ${escapePrintHtml(`${OFFER_ISSUER.postalCode} ${OFFER_ISSUER.city}`)} · ${escapePrintHtml(OFFER_ISSUER.country)}</span><span>${escapePrintHtml(OFFER_ISSUER.phone)}<br>${escapePrintHtml(OFFER_ISSUER.email)} · umzugshelden.io</span></footer>
      </main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(
      () => printWindow.print(),
      costEstimatePrintOptions.photos && calculation.planning.photoUrls.length > 0
        ? 750
        : 250
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
      <h2>Ihr Angebot</h2><section class="price-panel"><div><p>Angebotspreis inklusive ${rates.vatPercent}% Mehrwertsteuer${calculation.discountPercent > 0 ? ` · inkl. ${calculation.discountPercent}% Kombi-Rabatt${calculation.packageName ? ` (${escapePrintHtml(calculation.packageName)})` : ""}` : ""}</p><strong>${formatCurrency(grossTotal)}</strong></div><div class="price-details">Netto<b>${formatCurrency(netTotal)}</b></div></section>
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
          {calculation.customerId && (
            <Button asChild variant='ghost' size='sm' className='mb-2 -ml-3 text-slate-600'>
              <Link href={`/admin/${companyData?.id}/crm/customers/${calculation.customerId}`}><ArrowLeft /> Zur Kundenakte</Link>
            </Button>
          )}
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>Angebote & Vor-Ort-Aufnahme</p>
          <h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>Dienstleistungs-Planer</h1>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>Aufnahme, Ressourcenplanung und Angebot in einem durchgaengigen Ablauf.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          {status === "saved" && <span className='flex items-center gap-1.5 text-sm font-medium text-emerald-700'><Check size={16} /> Gespeichert</span>}
          {status === "error" && <span className='text-sm font-medium text-red-600'>Speichern fehlgeschlagen</span>}
          <OfferAssistant onApply={applyAssistantDraft} />
          <Button asChild variant='outline' className='flex-1 sm:flex-none'><Link href={`/admin/${companyData?.id}/material-preisliste`}><PackageCheck /> Material-Preisliste</Link></Button>
          <Button variant='outline' className='flex-1 sm:flex-none' onClick={printCustomerDocument}><Printer /> Übersicht</Button>
          <Button variant='outline' className='flex-1 sm:flex-none' onClick={() => setIsCostEstimateDialogOpen(true)}><Printer /> Kostenvoranschlag</Button>
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
      <Dialog open={isCostEstimateDialogOpen} onOpenChange={setIsCostEstimateDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Kostenvoranschlag drucken</DialogTitle>
            <DialogDescription>
              Leistungsumfang, Angebotsdaten, Preise und Bedingungen sind immer enthalten. Wähle hier zusätzliche Anlagen und Details.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 py-2 sm:grid-cols-2'>
            <label className='flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50'>
              <Checkbox checked={costEstimatePrintOptions.siteDetails} onCheckedChange={(checked) => updateCostEstimatePrintOption("siteDetails", checked === true)} />
              <span><span className='block text-sm font-medium text-slate-950'>Objekt- und Adressdaten</span><span className='mt-1 block text-xs leading-5 text-slate-500'>Auszug, Zielort, Etagen und Laufweg</span></span>
            </label>
            <label className='flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50'>
              <Checkbox checked={costEstimatePrintOptions.calculationDetails} onCheckedChange={(checked) => updateCostEstimatePrintOption("calculationDetails", checked === true)} />
              <span><span className='block text-sm font-medium text-slate-950'>Genaue Rechenwege</span><span className='mt-1 block text-xs leading-5 text-slate-500'>Mengen, Stunden und Einzelpreise je Position</span></span>
            </label>
            <label className='flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50'>
              <Checkbox checked={costEstimatePrintOptions.packingList} onCheckedChange={(checked) => updateCostEstimatePrintOption("packingList", checked === true)} />
              <span><span className='block text-sm font-medium text-slate-950'>Packliste / Inventar</span><span className='mt-1 block text-xs leading-5 text-slate-500'>Räume, Gegenstände, Mengen und Volumen</span></span>
            </label>
            <label className='flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50'>
              <Checkbox checked={costEstimatePrintOptions.notes} onCheckedChange={(checked) => updateCostEstimatePrintOption("notes", checked === true)} />
              <span><span className='block text-sm font-medium text-slate-950'>Hinweise</span><span className='mt-1 block text-xs leading-5 text-slate-500'>Erfasste Hinweise zur Ausführung</span></span>
            </label>
            <label className='flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50'>
              <Checkbox checked={costEstimatePrintOptions.photos} onCheckedChange={(checked) => updateCostEstimatePrintOption("photos", checked === true)} />
              <span><span className='block text-sm font-medium text-slate-950'>Objektfotos</span><span className='mt-1 block text-xs leading-5 text-slate-500'>Ausgewählte Bilder als Fotoseite</span></span>
            </label>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setIsCostEstimateDialogOpen(false)}>Abbrechen</Button>
            <Button type='button' onClick={() => { setIsCostEstimateDialogOpen(false); printCostEstimate(); }}><Printer /> Jetzt drucken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={customInventoryRoomId !== null}
        onOpenChange={(open) => {
          if (!open) setCustomInventoryRoomId(null);
        }}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addInventoryItem();
            }}>
            <DialogHeader>
              <DialogTitle>Gegenstand hinzufügen</DialogTitle>
              <DialogDescription>
                Erfasse die Maße in Zentimetern. Das Einzelvolumen wird automatisch in Kubikmeter umgerechnet.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-5'>
              <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]'>
                <label className='text-sm font-medium text-slate-700'>
                  Bezeichnung
                  <input
                    autoFocus
                    required
                    value={inventoryItemDraft.name}
                    onChange={(event) => setInventoryItemDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder='z. B. Kommode'
                    className='mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Menge
                  <input
                    type='number'
                    min='1'
                    step='1'
                    required
                    value={inventoryItemDraft.quantity}
                    onChange={(event) => setInventoryItemDraft((current) => ({ ...current, quantity: event.target.value }))}
                    className='mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                  />
                </label>
              </div>
              <fieldset>
                <legend className='text-sm font-medium text-slate-700'>Maße</legend>
                <div className='mt-1.5 grid grid-cols-3 gap-2'>
                  {([
                    ["lengthCm", "Länge"],
                    ["widthCm", "Breite"],
                    ["heightCm", "Höhe"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className='text-xs text-slate-500'>
                      {label}
                      <div className='relative mt-1'>
                        <input
                          type='number'
                          min='0'
                          step='0.1'
                          value={inventoryItemDraft[key]}
                          onChange={(event) => setInventoryItemDraft((current) => ({ ...current, [key]: event.target.value }))}
                          className='h-10 w-full rounded-md border border-slate-300 px-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                        />
                        <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>cm</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className='text-sm font-medium text-slate-700'>
                Einzelvolumen
                <div className='relative mt-1.5'>
                  <input
                    type='number'
                    min='0'
                    step='0.001'
                    value={draftDimensionVolumeM3 === null ? inventoryItemDraft.volumeM3 : draftDimensionVolumeM3.toFixed(3)}
                    onChange={(event) => setInventoryItemDraft((current) => ({ ...current, volumeM3: event.target.value }))}
                    readOnly={draftDimensionVolumeM3 !== null}
                    required
                    className={`h-10 w-full rounded-md border border-slate-300 px-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${draftDimensionVolumeM3 !== null ? "bg-slate-100 text-slate-700" : ""}`}
                  />
                  <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500'>m³</span>
                </div>
                <span className='mt-1 block text-xs font-normal text-slate-500'>Ohne Maße kann das Volumen weiterhin direkt angegeben werden.</span>
              </label>
              {hasAnyDraftDimension && draftDimensionVolumeM3 === null && (
                <p className='text-sm text-amber-700'>Für die automatische Berechnung werden Länge, Breite und Höhe benötigt.</p>
              )}
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setCustomInventoryRoomId(null)}>Abbrechen</Button>
              <Button type='submit' disabled={!canAddInventoryItem}><PackagePlus /> Hinzufügen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <section className='mb-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm' aria-label='Planungsschritte'>
        <div className='mb-3 flex items-center justify-between gap-4'>
          <p className='text-sm font-medium text-slate-700'>
            Vor-Ort-Aufnahme: {completeStepCount} von {navSteps.length} Bereichen vorbereitet
          </p>
          <span className='text-sm text-slate-500'>
            Schritt {activeNavIndex + 1} von {navSteps.length}
          </span>
        </div>
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {navSteps.map((step, index) => {
            const Icon = step.icon;
            const active = index === activeNavIndex;
            const completed = step.completed;
            return (
              <button
                key={step.key}
                type='button'
                onClick={() => goToNavStep(step)}
                className={`flex min-w-32 shrink-0 items-center gap-2 rounded-md border px-3 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${active ? "bg-white/20" : completed ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>
                  {completed && !active ? <Check size={14} /> : index + 1}
                </span>
                <Icon size={16} />
                {step.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeStep !== "finish" && (
        <section className='mb-6 grid items-center gap-4 border-y border-blue-200 bg-blue-50 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:px-5'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white'>
              <Zap size={18} />
            </span>
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-slate-950'>Schnellangebot · Automatik aktiv</p>
              <p className='mt-0.5 text-xs leading-5 text-slate-600'>Mengen, Material, Personal und Fahrzeuge werden bei jeder Eingabe neu berechnet.</p>
            </div>
          </div>
          <div className='grid grid-cols-3 gap-2 sm:contents'>
            <div className='min-w-24 text-left sm:text-right'>
              <p className='text-xs text-slate-500'>Material netto</p>
              <p className='mt-0.5 font-semibold tabular-nums text-slate-950'>{formatCurrency(recommendation.materialCost)}</p>
            </div>
            <div className='min-w-24 text-left sm:text-right'>
              <p className='text-xs text-slate-500'>Arbeitszeit</p>
              <p className='mt-0.5 font-semibold tabular-nums text-slate-950'>{(recommendation.employees * recommendation.hoursPerEmployee).toFixed(1)} Std.</p>
            </div>
            <div className='min-w-24 text-left sm:text-right'>
              <p className='text-xs text-slate-500'>Brutto</p>
              <p className='mt-0.5 font-semibold tabular-nums text-slate-950'>{formatCurrency(grossTotal)}</p>
            </div>
          </div>
          <Button type='button' onClick={openCalculatedOffer} disabled={selectedServices.size === 0}>
            <Calculator /> Angebot ansehen
          </Button>
        </section>
      )}

      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-6'>
          {activeStep === "order" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={ClipboardList} title='Auftrag & Kunde' description='Die Eckdaten sind auf der Kundenansicht und in der gespeicherten Planung sichtbar.' />
            <div className='mb-6 border-b border-slate-200 pb-5'>
              <p className='mb-1 text-sm font-semibold text-slate-950'>1. Dienstleistungen waehlen</p>
              <p className='mb-3 text-sm text-slate-600'>Mehrfachauswahl moeglich – kombinierte Leistungen lassen sich als Kombi-Paket mit Rabatt anbieten.</p>
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
              <details className='mt-5 rounded-md border border-amber-200 bg-amber-50/60 p-4'>
                <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Kombi-Pakete verwalten (optional)</summary>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm font-semibold text-slate-950'>Kombi-Pakete</p>
                    <p className='mt-0.5 text-sm text-slate-600'>Ein Klick waehlt die enthaltenen Leistungen aus und setzt den Kombi-Rabatt.</p>
                  </div>
                  {calculation.packageName && <span className='rounded-full bg-amber-200/70 px-3 py-1 text-xs font-semibold text-amber-900'>{calculation.packageName} aktiv</span>}
                </div>
                <div className='mt-3 space-y-2'>
                  {packages.map((offerPackage) => {
                    const isActive = calculation.packageName === offerPackage.name;
                    return (
                      <div key={offerPackage.id} className={`flex flex-wrap items-center gap-2 rounded-md border bg-white p-2 ${isActive ? "border-amber-400 ring-1 ring-amber-300" : "border-slate-200"}`}>
                        <input value={offerPackage.name} onChange={(event) => updatePackage(offerPackage.id, { name: event.target.value })} aria-label='Paketname' className='h-9 w-40 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-sm font-medium text-slate-950 outline-none focus:border-primary' />
                        <span className='hidden max-w-56 truncate text-xs text-slate-500 lg:block'>{offerPackage.services.map((serviceKey) => serviceOptions.find((option) => option.id === serviceKey)?.label ?? serviceKey).join(" + ")}</span>
                        <div className='relative'>
                          <input type='number' min='0' max='100' step='0.5' value={offerPackage.discountPercent} onChange={(event) => updatePackage(offerPackage.id, { discountPercent: Math.min(100, toNumber(event.target.value)) })} aria-label='Kombi-Rabatt' className='h-9 w-20 rounded-md border border-slate-200 px-2 pr-6 text-sm outline-none focus:border-primary' />
                          <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>%</span>
                        </div>
                        <Button type='button' size='sm' variant={isActive ? 'default' : 'outline'} onClick={() => applyPackage(offerPackage)}>Anwenden</Button>
                        <Button type='button' variant='ghost' size='icon' title='Paket loeschen' onClick={() => removePackage(offerPackage.id)}><Trash2 className='text-red-600' /></Button>
                      </div>
                    );
                  })}
                </div>
                <div className='mt-3 flex flex-wrap gap-2 border-t border-amber-200 pt-3'>
                  <input value={newPackageName} onChange={(event) => setNewPackageName(event.target.value)} placeholder='Neues Paket benennen (nutzt aktuelle Auswahl & Rabatt)' className='h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary' />
                  <Button type='button' variant='outline' size='sm' onClick={saveCurrentSelectionAsPackage} disabled={!newPackageName.trim() || selectedServices.size === 0}><PackagePlus /> Als Paket speichern</Button>
                </div>
                <p className='mt-2 text-xs text-slate-500'>Pakete werden mit „Entwurf speichern“ dauerhaft gesichert.</p>
              </details>
            </div>
            {selectedServices.size === 0 ? <p className='rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600'>Waehle mindestens eine Dienstleistung, um die passende Aufnahme und Angebotslogik zu starten.</p> : <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <TextField label='Kunde / Projekt' value={calculation.customer} onChange={updateCustomerName} placeholder='Name oder Firma' />
                <TextField label='Ansprechpartner' value={calculation.planning.contactName} onChange={(value) => updatePlanning("contactName", value)} placeholder='Vor- und Nachname' />
                <TextField label='Wunschtermin' type='date' value={calculation.planning.date} onChange={(value) => updatePlanning("date", value)} />
              </div>
              <details className='rounded-md border border-slate-200 bg-slate-50 p-4'>
                <summary className='cursor-pointer text-sm font-semibold text-slate-950'>Weitere Kundendaten und Angebotsname</summary>
                <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                  <TextField label='Angebotsbezeichnung' value={calculation.title} onChange={(value) => updateCalculation("title", value)} placeholder='z. B. Umzug Familie Mustermann' />
                  <TextField label='Angebotsnummer' value={calculation.offerNumber} onChange={(value) => updateCalculation("offerNumber", value)} placeholder='z. B. ANG-20260918-001' />
                  <TextField label='Angebot gültig bis' type='date' value={calculation.validUntil} onChange={(value) => updateCalculation("validUntil", value)} />
                  <TextField label='Kundenanschrift' value={calculation.customerAddress} onChange={(value) => updateCalculation("customerAddress", value)} placeholder='Straße, PLZ Ort' />
                  <TextField label='Telefon' value={calculation.planning.contactPhone} onChange={(value) => updatePlanning("contactPhone", value)} placeholder='Telefonnummer' />
                  <TextField label='E-Mail' type='email' value={calculation.planning.contactEmail} onChange={(value) => updatePlanning("contactEmail", value)} placeholder='name@beispiel.de' />
                </div>
              </details>
            </div>}
          </section>}

          {activeStep === "site" && (calculation.planning.serviceTypes.length === 0 ? (
            <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
              <p className='rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600'>Wähle zuerst im Schritt „Auftrag“ mindestens eine Dienstleistung aus – für jede Auswahl erscheint oben ein eigener Schritt.</p>
            </section>
          ) : (
            <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
              {activeSiteService && (
                <ServiceConfigurator
                  service={activeSiteService}
                  planning={calculation.planning}
                  kilometers={calculation.kilometers}
                  recommendedBoxes={recommendation.boxes}
                  calculatedMaterials={recommendation.materials}
                  materialCatalog={materialCatalog}
                  onPlanningChange={updatePlanning}
                  onKilometersChange={(value) => updateCalculation("kilometers", value)}
                />
              )}
            </section>
          ))}

          {activeStep === "inventory" && usesMoveInventory && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Box} title='Volumen berechnen' description='Erfasse Maße oder ein direktes Einzelvolumen. Menge mal Einzelvolumen ergibt das Gesamtvolumen für Fahrzeug und Personal.' />
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
                  {room.items.map((item) => {
                    const dimensionVolumeM3 = calculateDimensionVolumeM3(item);
                    return <div key={item.id} className='rounded-md border border-slate-200 bg-white p-3'>
                      <div className='grid grid-cols-[minmax(0,1fr)_72px_36px] gap-2'>
                        <input value={item.name} onChange={(event) => updateInventoryItem(room.id, item.id, { name: event.target.value })} aria-label='Gegenstand' className='h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' />
                        <input type='number' min='0' value={item.quantity} onChange={(event) => updateInventoryItem(room.id, item.id, { quantity: toNumber(event.target.value) })} aria-label='Menge' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' />
                        <Button type='button' variant='ghost' size='icon' title='Gegenstand entfernen' onClick={() => removeInventoryItem(room.id, item.id)}><Trash2 className='text-red-600' /></Button>
                      </div>
                      <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                        {([
                          ["lengthCm", "Länge"],
                          ["widthCm", "Breite"],
                          ["heightCm", "Höhe"],
                        ] as const).map(([key, label]) => <label key={key} className='text-xs text-slate-500'>{label}<div className='relative mt-1'><input type='number' min='0' step='0.1' value={item[key] ?? ""} onChange={(event) => updateInventoryDimension(room.id, item.id, key, toOptionalNumber(event.target.value))} className='h-9 w-full rounded-md border border-slate-300 px-2 pr-8 text-sm text-slate-950 outline-none focus:border-primary' /><span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>cm</span></div></label>)}
                        <label className='text-xs text-slate-500'>Volumen<div className='relative mt-1'><input type='number' min='0' step='0.001' value={dimensionVolumeM3 === null ? item.volumeM3 : dimensionVolumeM3.toFixed(3)} onChange={(event) => updateInventoryItem(room.id, item.id, { volumeM3: toNumber(event.target.value) })} readOnly={dimensionVolumeM3 !== null} aria-label='Volumen in Kubikmeter' className={`h-9 w-full rounded-md border border-slate-300 px-2 pr-8 text-sm outline-none focus:border-primary ${dimensionVolumeM3 !== null ? "bg-slate-100 text-slate-700" : ""}`} /><span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>m³</span></div></label>
                      </div>
                    </div>;
                  })}
                </div>
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <Button type='button' variant='outline' size='sm' onClick={() => openInventoryItemDialog(room.id)}><PackagePlus /> Eigener Gegenstand</Button>
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
            <div className='mb-5 grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1' role='tablist' aria-label='Angebotsansicht'>
              <button type='button' role='tab' aria-selected={offerTab === "conditions"} onClick={() => setOfferTab("conditions")} className={`flex min-h-10 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition ${offerTab === "conditions" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
                <Euro size={16} /> Konditionen
              </button>
              <button type='button' role='tab' aria-selected={offerTab === "calculation"} onClick={() => setOfferTab("calculation")} className={`flex min-h-10 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition ${offerTab === "calculation" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
                <Calculator size={16} /> Genaue Rechnung
              </button>
            </div>
            {offerTab === "conditions" ? <>
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
              <NumberField label='Kombi-Rabatt' value={calculation.discountPercent} onChange={(value) => updateCalculation("discountPercent", Math.min(100, value))} suffix='%' step='0.5' />
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
                  <NumberField label='Arbeitszeit je m2 und Anstrich' value={rates.paintLaborHoursPerM2} onChange={(value) => updateRate("paintLaborHoursPerM2", value)} suffix='Std.' step='0.01' />
                  <NumberField label='Tapezierzeit je m2' value={rates.wallpaperLaborHoursPerM2} onChange={(value) => updateRate("wallpaperLaborHoursPerM2", value)} suffix='Std.' step='0.01' />
                  <NumberField label='Alt-Tapete entfernen je m2' value={rates.wallpaperRemovalHoursPerM2} onChange={(value) => updateRate("wallpaperRemovalHoursPerM2", value)} suffix='Std.' step='0.01' />
                </>}
                {selectedServices.has("clearance") && <>
                  <NumberField label='Entsorgung je m3 (Sperrmuell)' value={rates.disposalRatePerM3} onChange={(value) => updateRate("disposalRatePerM3", value)} suffix='EUR' step='0.01' />
                  <NumberField label='Sondermuell je m3' value={rates.hazardousDisposalRatePerM3} onChange={(value) => updateRate("hazardousDisposalRatePerM3", value)} suffix='EUR' step='0.01' />
                  <NumberField label='Container inkl. Stellung' value={rates.containerRate} onChange={(value) => updateRate("containerRate", value)} suffix='EUR / Stk.' step='0.01' />
                </>}
                {selectedServices.has("furnitureAssembly") && <NumberField label='Montagezeit je Moebelteil' value={rates.furnitureAssemblyMinutesPerPiece} onChange={(value) => updateRate("furnitureAssemblyMinutesPerPiece", value)} suffix='Min.' step='1' />}
                {selectedServices.has("packing") && <>
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
            </> : <CalculationBreakdown calculation={calculation} rates={rates} materialCatalog={materialCatalog} onPrint={() => setIsCostEstimateDialogOpen(true)} onRenamePosition={renamePosition} />}
          </section>}

          {activeStep === "price" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Clock3} title='Leistungsumfang & Bedingungen' description='Diese Angaben werden fest in das Kundendokument übernommen.' />
            <label className='block text-sm font-medium text-slate-700'>Konkrete Leistungsbeschreibung<textarea value={calculation.planning.scopeDescription} onChange={(event) => updatePlanning("scopeDescription", event.target.value)} rows={5} placeholder='Beschreibe konkret, welche Arbeiten ausgeführt werden, z. B. Demontage der Küche, Transport und Montage am Zielort ...' className='mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20' /></label>
            <label className='mt-4 block text-sm font-medium text-slate-700'>Hinweise zur Ausführung<textarea value={calculation.planning.notes} onChange={(event) => updatePlanning("notes", event.target.value)} rows={4} placeholder='Besondere Möbel, enge Treppenhäuser, Terminabsprachen oder weitere Hinweise ...' className='mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20' /></label>
            <div className='mt-4'><TextField label='Zahlungsbedingung' value={calculation.paymentTerms} onChange={(value) => updateCalculation("paymentTerms", value)} /></div>
            <div className='mt-5 flex justify-end'><Button onClick={() => void saveCalculation()} disabled={isSaving}><Save /> Planung & Angebot speichern</Button></div>
          </section>}

          {activeStep === "finish" && <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
            <SectionHeading icon={Save} title='Gespeicherte Planungen' description='Jede gespeicherte Planung enthält Inventar, Fotos und die ursprünglichen Konditionen.' />
            {savedCalculations.length === 0 ? <p className='py-6 text-center text-sm text-slate-500'>Noch keine Planung gespeichert.</p> : <div className='divide-y divide-slate-200'>{savedCalculations.map((item) => <div key={item.id} className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'><button type='button' onClick={() => loadCalculation(item)} className='min-w-0 text-left'><p className='truncate font-medium text-slate-950'>{item.title || "Unbenannte Planung"}</p><p className='mt-1 text-sm text-slate-600'>{item.customer || item.planning.contactName || "Ohne Kundenzuordnung"} · {new Date(item.createdAt).toLocaleDateString("de-DE")} · {calculateVolume(item.planning.rooms).toFixed(2)} m³</p></button><div className='flex shrink-0 items-center gap-3'><span className='font-semibold text-slate-950'>{formatCurrency(calculateGrossTotal(item, item.rates))}</span><Button variant='ghost' size='icon' title='Planung löschen' onClick={() => void deleteCalculation(item.id)} disabled={isSaving}><Trash2 className='text-red-600' /></Button></div></div>)}</div>}
          </section>}
          <div className='flex items-center justify-between gap-3 border-t border-slate-200 pt-5'>
            <Button type='button' variant='outline' onClick={goToPreviousStep} disabled={activeNavIndex <= 0}>
              <ArrowLeft /> Zurück
            </Button>
            {activeStep === "finish" ? (
              <Button onClick={() => void saveCalculation()} disabled={isSaving}>
                {isSaving ? <LoaderCircle className='animate-spin' /> : <Save />} Planung speichern
              </Button>
            ) : (
              <Button type='button' className='min-h-11' onClick={goToNextStep}>
                Weiter zu {navSteps[activeNavIndex + 1]?.label} <ArrowRight />
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
            {discount > 0 && <div className='flex justify-between gap-4 text-emerald-300'><span>Kombi-Rabatt{calculation.packageName ? ` (${calculation.packageName})` : ""}</span><span>-{formatCurrency(discount)}</span></div>}
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