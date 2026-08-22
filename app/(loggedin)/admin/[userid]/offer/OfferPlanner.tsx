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
  Printer,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

type PlanningStep = "order" | "site" | "inventory" | "price" | "finish";

type Rates = {
  employeeHourlyRate: number;
  vehicleDailyRate: number;
  kilometerRate: number;
  planningFee: number;
  surchargePercent: number;
  vatPercent: number;
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

type PlanningDetails = {
  serviceTypes: string[];
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
  parkingRequired: boolean;
  packingRequired: boolean;
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
  otherCost: number;
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

const serviceOptions = [
  "Umzug",
  "Seniorenumzug",
  "Entruempelung",
  "Malerarbeiten",
  "Moebelmontage",
  "Einpackservice",
  "Einlagerung",
];

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
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function createPlanning(): PlanningDetails {
  return {
    serviceTypes: ["Umzug"],
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
    parkingRequired: false,
    packingRequired: false,
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
    otherCost: 0,
    planning: createPlanning(),
  };
}

function normalizePlanning(planning?: Partial<PlanningDetails>): PlanningDetails {
  const fallback = createPlanning();
  return {
    ...fallback,
    ...planning,
    serviceTypes: planning?.serviceTypes ?? fallback.serviceTypes,
    rooms: planning?.rooms ?? fallback.rooms,
    extraServices: planning?.extraServices ?? [],
    photoUrls: planning?.photoUrls ?? [],
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

function calculateGrossTotal(calculation: Calculation, rates: Rates) {
  const directCost =
    calculation.employees *
      calculation.hoursPerEmployee *
      rates.employeeHourlyRate +
    calculation.vehicleDays * rates.vehicleDailyRate +
    calculation.kilometers * rates.kilometerRate +
    rates.planningFee +
    calculation.materialCost +
    calculation.disposalCost +
    calculation.otherCost +
    calculateExtraServices(calculation.planning.extraServices);
  return (
    directCost *
    (1 + rates.surchargePercent / 100) *
    (1 + rates.vatPercent / 100)
  );
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
          className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-14 text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
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
        className='h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
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
    <div className='mb-5 flex items-start gap-3'>
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
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

  const employeeCost =
    calculation.employees *
    calculation.hoursPerEmployee *
    rates.employeeHourlyRate;
  const vehicleCost = calculation.vehicleDays * rates.vehicleDailyRate;
  const mileageCost = calculation.kilometers * rates.kilometerRate;
  const extraServiceCost = calculateExtraServices(
    calculation.planning.extraServices
  );
  const volume = calculateVolume(calculation.planning.rooms);
  const directCost =
    employeeCost +
    vehicleCost +
    mileageCost +
    rates.planningFee +
    calculation.materialCost +
    calculation.disposalCost +
    calculation.otherCost +
    extraServiceCost;
  const surcharge = directCost * (rates.surchargePercent / 100);
  const netTotal = directCost + surcharge;
  const vat = netTotal * (rates.vatPercent / 100);
  const grossTotal = netTotal + vat;
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
    inventory: volume > 0 || calculation.planning.photoUrls.length > 0,
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

  function toggleService(service: string) {
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
        <div class="card"><p class="card-label">Geplante Leistungen</p><div class="tag-list">${calculation.planning.serviceTypes.map((service) => `<span class="tag">${escapePrintHtml(service)}</span>`).join("") || "<span class=\"muted\">Noch nicht festgelegt</span>"}</div><p class="muted" style="margin:14px 0 0"><strong>Wunschtermin:</strong> ${escapePrintHtml(calculation.planning.date || "Noch offen")}</p></div>
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
    <main className='mx-auto w-full max-w-7xl pb-12'>
      <header className='mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end'>
        <div>
          <p className='mb-1 text-sm font-medium text-primary'>Angebote & Vor-Ort-Aufnahme</p>
          <h1 className='text-3xl font-bold tracking-normal text-slate-950'>Dienstleistungs-Planer</h1>
          <p className='mt-2 max-w-3xl text-slate-600'>Erfasse beim Kunden alle Leistungen, Volumen, Zugangswege und Fotos. Aus der Aufnahme entsteht direkt eine gespeicherte, druckbare Angebotsübersicht.</p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          {status === "saved" && <span className='flex items-center gap-1.5 text-sm font-medium text-emerald-700'><Check size={16} /> Gespeichert</span>}
          {status === "error" && <span className='text-sm font-medium text-red-600'>Speichern fehlgeschlagen</span>}
          <Button variant='outline' onClick={printCustomerDocument}><Printer /> Drucken</Button>
          <Button onClick={() => void persist()} disabled={isSaving}>{isSaving ? <LoaderCircle className='animate-spin' /> : <Save />} Entwurf speichern</Button>
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

      <section className='mb-6 border-b border-slate-200 pb-5' aria-label='Planungsschritte'>
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
                className={`flex min-w-28 shrink-0 items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition ${
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
          {activeStep === "order" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={ClipboardList} title='Auftrag & Kunde' description='Die Eckdaten sind auf der Kundenansicht und in der gespeicherten Planung sichtbar.' />
            <div className='grid gap-4 sm:grid-cols-2'>
              <TextField label='Angebotsbezeichnung' value={calculation.title} onChange={(value) => updateCalculation("title", value)} placeholder='z. B. Umzug Familie Mustermann' />
              <TextField label='Kunde / Projekt' value={calculation.customer} onChange={(value) => updateCalculation("customer", value)} placeholder='Name oder Firma' />
              <TextField label='Ansprechpartner' value={calculation.planning.contactName} onChange={(value) => updatePlanning("contactName", value)} placeholder='Vor- und Nachname' />
              <TextField label='Telefon' value={calculation.planning.contactPhone} onChange={(value) => updatePlanning("contactPhone", value)} placeholder='Telefonnummer' />
              <TextField label='E-Mail' type='email' value={calculation.planning.contactEmail} onChange={(value) => updatePlanning("contactEmail", value)} placeholder='name@beispiel.de' />
              <TextField label='Wunschtermin' type='date' value={calculation.planning.date} onChange={(value) => updatePlanning("date", value)} />
            </div>
            <div className='mt-5 border-t border-slate-200 pt-5'>
              <p className='mb-3 text-sm font-medium text-slate-700'>Dienstleistungen</p>
              <div className='flex flex-wrap gap-2'>
                {serviceOptions.map((service) => {
                  const checked = calculation.planning.serviceTypes.includes(service);
                  return <label key={service} className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition ${checked ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}><input type='checkbox' checked={checked} onChange={() => toggleService(service)} className='sr-only' />{service}</label>;
                })}
              </div>
            </div>
          </section>}

          {activeStep === "site" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={MapPin} title='Objekt, Zugänge & Laufwege' description='Erfasst die Informationen, die Personalbedarf und Aufwand beim Einsatz bestimmen.' />
            <div className='grid gap-4 sm:grid-cols-2'>
              <TextField label='Auszugsadresse / Einsatzort' value={calculation.planning.oldAddress} onChange={(value) => updatePlanning("oldAddress", value)} placeholder='Straße, PLZ Ort' />
              <TextField label='Einzugsadresse / Zielort' value={calculation.planning.newAddress} onChange={(value) => updatePlanning("newAddress", value)} placeholder='Straße, PLZ Ort' />
              <TextField label='Etage Auszug' value={calculation.planning.oldFloor} onChange={(value) => updatePlanning("oldFloor", value)} placeholder='z. B. 3. OG' />
              <TextField label='Etage Einzug' value={calculation.planning.newFloor} onChange={(value) => updatePlanning("newFloor", value)} placeholder='z. B. EG' />
              <NumberField label='Laufweg / Trageweg' value={calculation.planning.carryDistanceM} onChange={(value) => updatePlanning("carryDistanceM", value)} suffix='m' />
              <NumberField label='Fahrtstrecke gesamt' value={calculation.kilometers} onChange={(value) => updateCalculation("kilometers", value)} suffix='km' step='0.1' />
            </div>
            <div className='mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-5'>
              <label className='flex items-center gap-2 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.oldElevator} onChange={(event) => updatePlanning("oldElevator", event.target.checked)} className='h-4 w-4 accent-primary' />Aufzug am Auszug</label>
              <label className='flex items-center gap-2 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.newElevator} onChange={(event) => updatePlanning("newElevator", event.target.checked)} className='h-4 w-4 accent-primary' />Aufzug am Einzug</label>
              <label className='flex items-center gap-2 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.parkingRequired} onChange={(event) => updatePlanning("parkingRequired", event.target.checked)} className='h-4 w-4 accent-primary' />Halteverbotszone nötig</label>
              <label className='flex items-center gap-2 text-sm text-slate-700'><input type='checkbox' checked={calculation.planning.packingRequired} onChange={(event) => updatePlanning("packingRequired", event.target.checked)} className='h-4 w-4 accent-primary' />Einpackservice nötig</label>
            </div>
          </section>}

          {activeStep === "inventory" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={Box} title='Volumen berechnen' description='Lege Räume und Gegenstände an. Menge mal Einzelvolumen ergibt das Gesamtvolumen für Fahrzeug und Personal.' />
            <div className='mb-4 flex items-center justify-between rounded-md bg-emerald-50 px-4 py-3 text-emerald-950'>
              <span className='text-sm font-medium'>Erfasstes Umzugsvolumen</span><strong className='text-xl'>{volume.toFixed(2)} m³</strong>
            </div>
            <div className='space-y-4'>
              {calculation.planning.rooms.map((room) => <div key={room.id} className='rounded-md border border-slate-200 p-4'>
                <div className='mb-3 flex items-center gap-2'>
                  <input value={room.name} onChange={(event) => updateRoom(room.id, { name: event.target.value })} className='h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20' />
                  <Button type='button' variant='ghost' size='icon' title='Raum entfernen' onClick={() => removeRoom(room.id)} disabled={calculation.planning.rooms.length === 1}><Trash2 className='text-red-600' /></Button>
                </div>
                <div className='space-y-2'>
                  {room.items.map((item) => <div key={item.id} className='grid grid-cols-[minmax(0,1fr)_72px_100px_36px] gap-2'>
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

          {activeStep === "inventory" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={ImagePlus} title='Objektfotos' description='Wähle vorhandene Bilder oder lade direkt bei der Vor-Ort-Aufnahme neue Fotos in die Mediathek.' />
            <MediathekDialog btnName='Fotos auswählen oder hochladen' multiSelect onSelect={(urls) => updatePlanning("photoUrls", Array.isArray(urls) ? urls : [urls])} />
            {calculation.planning.photoUrls.length > 0 && <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {calculation.planning.photoUrls.map((url) => <div key={url} className='relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-100'><img src={url} alt='Objektaufnahme' className='h-full w-full object-cover' /><Button type='button' variant='destructive' size='icon' title='Foto entfernen' onClick={() => updatePlanning("photoUrls", calculation.planning.photoUrls.filter((photoUrl) => photoUrl !== url))} className='absolute right-2 top-2 h-8 w-8'><Trash2 size={15} /></Button></div>)}
            </div>}
          </section>}

          {activeStep === "price" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={Euro} title='Konditionen & Angebot' description='Standardwerte und auftragsspezifische Kosten fließen direkt in den Angebotspreis ein.' />
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <NumberField label='Mitarbeiter-Stundensatz' value={rates.employeeHourlyRate} onChange={(value) => updateRate("employeeHourlyRate", value)} suffix='EUR / Std.' step='0.01' />
              <NumberField label='Fahrzeug pro Tag' value={rates.vehicleDailyRate} onChange={(value) => updateRate("vehicleDailyRate", value)} suffix='EUR' step='0.01' />
              <NumberField label='Fahrtkosten pro Kilometer' value={rates.kilometerRate} onChange={(value) => updateRate("kilometerRate", value)} suffix='EUR / km' step='0.01' />
              <NumberField label='Planungs- & Auftragspauschale' value={rates.planningFee} onChange={(value) => updateRate("planningFee", value)} suffix='EUR' step='0.01' />
              <NumberField label='Aufschlag / Gewinnmarge' value={rates.surchargePercent} onChange={(value) => updateRate("surchargePercent", value)} suffix='%' step='0.1' />
              <NumberField label='Mehrwertsteuer' value={rates.vatPercent} onChange={(value) => updateRate("vatPercent", value)} suffix='%' step='0.1' />
              <NumberField label='Mitarbeiter' value={calculation.employees} onChange={(value) => updateCalculation("employees", value)} suffix='Personen' />
              <NumberField label='Stunden je Mitarbeiter' value={calculation.hoursPerEmployee} onChange={(value) => updateCalculation("hoursPerEmployee", value)} suffix='Std.' step='0.25' />
              <NumberField label='Fahrzeugtage' value={calculation.vehicleDays} onChange={(value) => updateCalculation("vehicleDays", value)} suffix='Tage' step='0.5' />
              <NumberField label='Materialkosten' value={calculation.materialCost} onChange={(value) => updateCalculation("materialCost", value)} suffix='EUR' step='0.01' />
              <NumberField label='Entsorgung' value={calculation.disposalCost} onChange={(value) => updateCalculation("disposalCost", value)} suffix='EUR' step='0.01' />
              <NumberField label='Weitere Kosten' value={calculation.otherCost} onChange={(value) => updateCalculation("otherCost", value)} suffix='EUR' step='0.01' />
            </div>
            <div className='mt-5 border-t border-slate-200 pt-5'>
              <div className='mb-3 flex items-center justify-between'><p className='text-sm font-medium text-slate-700'>Zusatzleistungen</p><Button type='button' variant='outline' size='sm' onClick={addExtraService}><PackagePlus /> Zusatzleistung</Button></div>
              <div className='space-y-2'>{calculation.planning.extraServices.map((service) => <div key={service.id} className='grid grid-cols-[minmax(0,1fr)_72px_120px_36px] gap-2'><input value={service.name} onChange={(event) => updateExtraService(service.id, { name: event.target.value })} aria-label='Zusatzleistung' className='h-9 min-w-0 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' /><input type='number' min='0' value={service.quantity} onChange={(event) => updateExtraService(service.id, { quantity: toNumber(event.target.value) })} aria-label='Menge' className='h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary' /><div className='relative'><input type='number' min='0' step='0.01' value={service.unitPrice} onChange={(event) => updateExtraService(service.id, { unitPrice: toNumber(event.target.value) })} aria-label='Einzelpreis' className='h-9 w-full rounded-md border border-slate-300 px-2 pr-9 text-sm outline-none focus:border-primary' /><span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>EUR</span></div><Button type='button' variant='ghost' size='icon' title='Zusatzleistung entfernen' onClick={() => removeExtraService(service.id)}><Trash2 className='text-red-600' /></Button></div>)}</div>
            </div>
          </section>}

          {activeStep === "price" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
            <SectionHeading icon={Clock3} title='Hinweise zur Ausführung' description='Diese Informationen werden in der Kundenansicht mit ausgegeben.' />
            <textarea value={calculation.planning.notes} onChange={(event) => updatePlanning("notes", event.target.value)} rows={5} placeholder='Besondere Möbel, enge Treppenhäuser, Terminabsprachen oder weitere Hinweise ...' className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20' />
            <div className='mt-5 flex justify-end'><Button onClick={() => void saveCalculation()} disabled={isSaving}><Save /> Planung & Angebot speichern</Button></div>
          </section>}

          {activeStep === "finish" && <section className='rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
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
              <Button type='button' onClick={goToNextStep}>
                Weiter zu {planningSteps[currentStepIndex + 1]?.label} <ArrowRight />
              </Button>
            )}
          </div>
        </div>

        <aside className='sticky top-6 rounded-md border border-slate-200 bg-slate-950 p-5 text-white shadow-sm'>
          <p className='text-sm font-medium text-slate-300'>Voraussichtlicher Angebotspreis</p>
          <p className='mt-2 text-4xl font-bold'>{formatCurrency(grossTotal)}</p>
          <p className='mt-1 text-sm text-slate-400'>inkl. {rates.vatPercent}% MwSt.</p>
          <div className='mt-6 grid grid-cols-2 gap-3 border-y border-white/15 py-5'><div><p className='text-xs text-slate-400'>Volumen</p><p className='mt-1 text-xl font-semibold'>{volume.toFixed(2)} m³</p></div><div><p className='text-xs text-slate-400'>Laufweg</p><p className='mt-1 text-xl font-semibold'>{calculation.planning.carryDistanceM} m</p></div></div>
          <div className='mt-5 space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><Users size={15} /> Personal</span><span>{formatCurrency(employeeCost)}</span></div>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><Car size={15} /> Fahrt & Fahrzeug</span><span>{formatCurrency(mileageCost + vehicleCost)}</span></div>
            <div className='flex items-center justify-between gap-3 text-slate-300'><span className='flex items-center gap-2'><PackagePlus size={15} /> Zusatzleistungen</span><span>{formatCurrency(extraServiceCost)}</span></div>
            <div className='flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-slate-300'><span>Pauschale & Extras</span><span>{formatCurrency(rates.planningFee + calculation.materialCost + calculation.disposalCost + calculation.otherCost)}</span></div>
            <div className='flex justify-between gap-4 text-slate-300'><span>Aufschlag</span><span>{formatCurrency(surcharge)}</span></div>
            <div className='flex justify-between gap-4 text-slate-300'><span>Netto</span><span>{formatCurrency(netTotal)}</span></div>
            <div className='flex justify-between gap-4 border-t border-white/15 pt-3 font-medium text-white'><span>MwSt.</span><span>{formatCurrency(vat)}</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}