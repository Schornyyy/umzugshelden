"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { database } from "@/config/firebase";
import {
  createCustomerNumber,
  createInvoiceNumber,
} from "@/lib/crmIdentifiers";
import {
  createInvoiceDocumentHtml,
  createInvoicePdfFilename,
  getInvoiceTotals,
} from "@/lib/crmInvoiceDocument";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type {
  CrmCustomer,
  CrmInvoice,
  CrmInvoiceIssuer,
  CrmInvoiceLine,
  CrmInvoiceReminder,
  CrmInvoiceSettings,
  CrmInvoiceStatus,
  CrmInvoiceType,
} from "@/types/Crm";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  BellRing,
  Check,
  Download,
  FilePlus2,
  LoaderCircle,
  Mail,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  Settings2,
  Send,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CRM_COLLECTION = "crm_customers_umzugshelden";
const OFFER_COLLECTION = "offer_calculators_umzugshelden";
const INVOICE_COLLECTION = "crm_invoices_umzugshelden";
const CRM_INVOICE_SETTINGS = "crm_invoice_settings_umzugshelden";

const DEFAULT_ISSUER: CrmInvoiceIssuer = {
  companyName: "Umzugshelden",
  proprietor: "Muhammed Ali Güngör",
  legalForm: "Einzelunternehmen",
  street: "In der Trift 1",
  postalCode: "57489",
  city: "Drolshagen",
  country: "Deutschland",
  email: "info@umzugshelden.io",
  phone: "+49 151 68567708",
  taxNumber: "",
  vatId: "",
  bankName: "",
  accountHolder: "Muhammed Ali Güngör",
  iban: "",
  bic: "",
};

const vehicleOptions = [
  { id: "transporter", name: "Sprinter", dailyRate: 120 },
  { id: "truck-3-5t", name: "3,5-t Koffer", dailyRate: 95 },
  { id: "truck-7-5t", name: "7,5-t LKW", dailyRate: 165 },
  { id: "truck-12t", name: "12-t LKW", dailyRate: 235 },
];

type OfferSnapshot = {
  id: string;
  customerId?: string;
  title: string;
  createdAt: number;
  employees: number;
  hoursPerEmployee: number;
  kilometers: number;
  vehicleDays: number;
  materialCost: number;
  disposalCost: number;
  storageCost: number;
  logisticsCost: number;
  otherCost: number;
  rates: {
    employeeHourlyRate: number;
    kilometerRate: number;
    planningFee: number;
    surchargePercent: number;
    vatPercent: number;
  };
  planning: {
    date: string;
    serviceTypes: string[];
    vehicleSelections: Array<{ vehicleId: string; quantity: number }>;
    extraServices: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
};

type StoredInvoiceSettings = Omit<Partial<CrmInvoiceSettings>, "issuer"> & {
  issuer?: Partial<CrmInvoiceIssuer>;
};

type Feedback = {
  type: "saved" | "error";
  message: string;
};

type InvoiceConfigurationDraft = {
  invoiceType: CrmInvoiceType;
  installmentGross: number;
};

type InvoiceEmailDraft = {
  to: string;
  subject: string;
  message: string;
};

type SettingsFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  min?: number;
};

const invoiceStatuses: Array<{
  value: CrmInvoiceStatus;
  label: string;
  className: string;
}> = [
  { value: "draft", label: "Entwurf", className: "bg-slate-100 text-slate-700" },
  { value: "sent", label: "Versendet", className: "bg-blue-50 text-blue-700" },
  { value: "paid", label: "Bezahlt", className: "bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Storniert", className: "bg-red-50 text-red-700" },
];

const serviceLabels: Record<string, string> = {
  move: "Umzug",
  seniorMove: "Seniorenumzug",
  clearance: "Entrümpelung",
  painting: "Anstricharbeiten",
  furnitureAssembly: "Möbelmontage",
  packing: "Einpackservice",
  storage: "Einlagerung",
};

const reminderLevels = [
  { level: 1, label: "Zahlungserinnerung", defaultFee: 0, defaultInterest: 0 },
  { level: 2, label: "1. Mahnung", defaultFee: 5, defaultInterest: 5 },
  { level: 3, label: "2. Mahnung", defaultFee: 5, defaultInterest: 5 },
  { level: 4, label: "Letzte Mahnung", defaultFee: 5, defaultInterest: 5 },
];

type ReminderDraft = {
  level: number;
  label: string;
  issueDate: string;
  paymentDeadline: string;
  fee: number;
  interestRatePercent: number;
  note: string;
};

function overdueDaysBetween(dueDate: string, issueDate: string) {
  const due = new Date(`${dueDate}T12:00:00`).getTime();
  const issue = new Date(`${issueDate}T12:00:00`).getTime();
  if (Number.isNaN(due) || Number.isNaN(issue)) return 0;
  return Math.max(0, Math.round((issue - due) / 86_400_000));
}

function calculateReminderInterest(
  gross: number,
  ratePercent: number,
  overdueDays: number
) {
  return Math.round(gross * (ratePercent / 100) * (overdueDays / 365) * 100) / 100;
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const quantityFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const inputClassName =
  "mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function SettingsField({ label, value, onChange, type = "text", min }: SettingsFieldProps) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}

function dateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

function getTotals(invoice: CrmInvoice) {
  return getInvoiceTotals(invoice);
}

function addLine(
  lines: CrmInvoiceLine[],
  description: string,
  quantity: number,
  unit: string,
  unitPrice: number
) {
  if (quantity <= 0 || unitPrice === 0) return;
  lines.push({ id: crypto.randomUUID(), description, quantity, unit, unitPrice });
}

function offerToLines(offer: OfferSnapshot): CrmInvoiceLine[] {
  const lines: CrmInvoiceLine[] = [];
  addLine(
    lines,
    "Arbeitsleistung",
    offer.employees * offer.hoursPerEmployee,
    "Std.",
    offer.rates.employeeHourlyRate
  );
  offer.planning.vehicleSelections.forEach((selection) => {
    const vehicle = vehicleOptions.find((option) => option.id === selection.vehicleId);
    if (vehicle) {
      addLine(
        lines,
        vehicle.name,
        selection.quantity * offer.vehicleDays,
        "Tag",
        vehicle.dailyRate
      );
    }
  });
  addLine(lines, "Fahrtstrecke", offer.kilometers, "km", offer.rates.kilometerRate);
  addLine(lines, "Planungs- und Auftragspauschale", 1, "pauschal", offer.rates.planningFee);
  addLine(lines, "Material", 1, "pauschal", offer.materialCost);
  addLine(lines, "Entsorgung", 1, "pauschal", offer.disposalCost);
  addLine(lines, "Einlagerung", 1, "pauschal", offer.storageCost);
  addLine(lines, "Logistik, Lift und Halteverbotszone", 1, "pauschal", offer.logisticsCost);
  addLine(lines, "Weitere Kosten", 1, "pauschal", offer.otherCost);
  offer.planning.extraServices.forEach((service) =>
    addLine(
      lines,
      service.name || "Zusatzleistung",
      service.quantity,
      "Stk.",
      service.unitPrice
    )
  );

  const directCost = lines.reduce(
    (total, line) => total + line.quantity * line.unitPrice,
    0
  );
  addLine(
    lines,
    `Aufschlag (${offer.rates.surchargePercent} %)`,
    1,
    "pauschal",
    directCost * (offer.rates.surchargePercent / 100)
  );
  return lines;
}

function customerAddress(customer: CrmCustomer) {
  return [
    customer.street.trim(),
    `${customer.postalCode} ${customer.city}`.trim(),
    "Deutschland",
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    const sanitized = Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeForFirestore(item)])
    );
    return sanitized as T;
  }
  return value;
}

function mergeIssuer(
  ...sources: Array<Partial<CrmInvoiceIssuer> | undefined>
): CrmInvoiceIssuer {
  return sources.reduce<CrmInvoiceIssuer>(
    (issuer, source) => ({
      ...issuer,
      ...(source ? sanitizeForFirestore(source) : {}),
    }),
    { ...DEFAULT_ISSUER }
  );
}

function createDefaultSettings(ownerId: string): CrmInvoiceSettings {
  return {
    ownerId,
    issuer: { ...DEFAULT_ISSUER },
    invoicePrefix: "RE",
    paymentTermDays: 14,
    nextNumberByYear: {},
    updatedAt: 0,
  };
}

function normalizeSettings(
  ownerId: string,
  data?: StoredInvoiceSettings
): CrmInvoiceSettings {
  const defaults = createDefaultSettings(ownerId);
  return {
    ownerId,
    issuer: mergeIssuer(defaults.issuer, data?.issuer),
    invoicePrefix: data?.invoicePrefix?.trim() || defaults.invoicePrefix,
    paymentTermDays: Number.isFinite(data?.paymentTermDays)
      ? Math.max(0, Math.trunc(data?.paymentTermDays ?? 0))
      : defaults.paymentTermDays,
    nextNumberByYear: { ...(data?.nextNumberByYear ?? {}) },
    updatedAt: data?.updatedAt ?? defaults.updatedAt,
  };
}

function normalizeCustomer(customer: CrmCustomer, documentId: string) {
  const id = customer.id || documentId;
  const createdAt = customer.createdAt ?? customer.updatedAt ?? Date.now();
  return {
    ...customer,
    id,
    customerNumber: customer.customerNumber || createCustomerNumber(id, createdAt),
  };
}

function normalizeInvoice(
  invoice: CrmInvoice,
  documentId: string,
  customers: CrmCustomer[],
  settings: CrmInvoiceSettings
) {
  const customer = customers.find((item) => item.id === invoice.customerId);
  const normalized: CrmInvoice = {
    ...invoice,
    id: invoice.id || documentId,
    customerNumber: invoice.customerNumber || customer?.customerNumber || "",
    issuer: mergeIssuer(settings.issuer, invoice.issuer),
    sequenceNumber: invoice.sequenceNumber ?? 0,
    invoiceType: invoice.invoiceType === "installment" ? "installment" : "full",
    installmentGross:
      Number.isFinite(invoice.installmentGross) && (invoice.installmentGross ?? 0) >= 0
        ? invoice.installmentGross
        : undefined,
    taxNote: invoice.taxNote ?? "",
    reminders: invoice.reminders ?? [],
  };

  if (!normalized.finalizedAt && normalized.status !== "draft") {
    normalized.finalizedAt = normalized.updatedAt || normalized.createdAt || Date.now();
  }
  return normalized;
}

function createInvoiceDraft(
  ownerId: string,
  settings: CrmInvoiceSettings,
  customer?: CrmCustomer,
  offer?: OfferSnapshot
): CrmInvoice {
  const today = dateInputValue();
  return {
    id: crypto.randomUUID(),
    ownerId,
    customerId: customer?.id ?? "",
    customerNumber: customer?.customerNumber ?? "",
    offerId: offer?.id ?? "",
    invoiceNumber: "",
    sequenceNumber: 0,
    invoiceType: "full",
    status: "draft",
    issueDate: today,
    serviceDate: offer?.planning.date || today,
    dueDate: addDays(today, settings.paymentTermDays),
    customerName: customer?.name ?? "",
    customerCompany: customer?.company ?? "",
    customerEmail: customer?.email ?? "",
    customerAddress: customer ? customerAddress(customer) : "",
    lineItems: offer
      ? offerToLines(offer)
      : [
          {
            id: crypto.randomUUID(),
            description: "Leistung",
            quantity: 1,
            unit: "pauschal",
            unitPrice: 0,
          },
        ],
    vatPercent: offer?.rates.vatPercent ?? 19,
    taxNote: "",
    issuer: { ...settings.issuer },
    notes:
      "Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function isFinalized(invoice: CrmInvoice) {
  return Boolean(invoice.finalizedAt);
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function hasCompleteRecipientAddress(value: string) {
  const normalized = value.replaceAll(",", "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    lines.length >= 3 &&
    /\b\d{5}\b/.test(normalized) &&
    /deutschland/i.test(normalized)
  );
}

function isValidGermanIban(value: string) {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!/^DE\d{20}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const character of rearranged) {
    const expanded = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;
    for (const digit of expanded) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

function getComplianceIssues(
  invoice: CrmInvoice,
  allowMissingInvoiceNumber = false
) {
  const issues: string[] = [];
  const issuer = mergeIssuer(invoice.issuer);

  if (
    !issuer.companyName.trim() ||
    !issuer.proprietor.trim() ||
    !issuer.legalForm.trim()
  ) {
    issues.push("Vollständige Ausstellerbezeichnung fehlt.");
  }
  if (
    !issuer.street.trim() ||
    !issuer.postalCode.trim() ||
    !issuer.city.trim() ||
    !issuer.country.trim()
  ) {
    issues.push("Vollständige Ausstelleranschrift fehlt.");
  }
  if (!issuer.taxNumber.trim() && !issuer.vatId.trim()) {
    issues.push("Steuernummer oder USt-IdNr. fehlt.");
  }
  if (!invoice.customerCompany.trim() && !invoice.customerName.trim()) {
    issues.push("Empfängername fehlt.");
  }
  if (!hasCompleteRecipientAddress(invoice.customerAddress)) {
    issues.push("Vollständige Empfängeranschrift fehlt.");
  }
  if (!invoice.customerNumber?.trim()) {
    issues.push("Kundennummer fehlt.");
  }
  if (!isValidDate(invoice.issueDate)) {
    issues.push("Gültiges Rechnungsdatum fehlt.");
  }
  if (!isValidDate(invoice.serviceDate)) {
    issues.push("Gültiges Leistungsdatum fehlt.");
  }
  if (!isValidDate(invoice.dueDate)) {
    issues.push("Gültiges Fälligkeitsdatum fehlt.");
  }
  if (!allowMissingInvoiceNumber && !invoice.invoiceNumber.trim()) {
    issues.push("Rechnungsnummer fehlt.");
  }
  const hasBillableLine = invoice.lineItems.some(
    (line) =>
      line.description.trim() &&
      Number.isFinite(line.quantity) &&
      line.quantity !== 0 &&
      Number.isFinite(line.unitPrice) &&
      line.unitPrice !== 0
  );
  if (!hasBillableLine) {
    issues.push("Mindestens eine ausgefüllte Position mit Betrag fehlt.");
  }
  const totals = getTotals(invoice);
  if (
    invoice.invoiceType === "installment" &&
    (totals.gross <= 0 || totals.gross >= totals.orderGross)
  ) {
    issues.push("Der Abschlag muss größer als 0 und kleiner als der Auftragswert sein.");
  }
  if (!Number.isFinite(invoice.vatPercent) || invoice.vatPercent < 0) {
    issues.push("Der Umsatzsteuersatz darf nicht negativ sein.");
  }
  if (invoice.vatPercent === 0 && !invoice.taxNote?.trim()) {
    issues.push("Steuer- oder Befreiungshinweis bei 0 % USt. fehlt.");
  }
  if (!issuer.accountHolder.trim()) {
    issues.push("Kontoinhaber fehlt.");
  }
  if (!isValidGermanIban(issuer.iban)) {
    issues.push("Gültige deutsche IBAN fehlt.");
  }
  return issues;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeText(value: string | number) {
  return escapeHtml(String(value));
}

function safeMultiline(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function formatPrintDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("de-DE");
}

function numberingDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : dateInputValue();
}

function getNextSequenceFloor(invoices: CrmInvoice[], issueDate: string) {
  const year = numberingDate(issueDate).slice(0, 4);
  const highestSequence = invoices.reduce((highest, invoice) => {
    const invoiceYear = numberingDate(invoice.issueDate).slice(0, 4);
    if (invoiceYear !== year) return highest;
    const numberSequence = Number(invoice.invoiceNumber.match(/-(\d+)$/)?.[1]);
    const sequence = Math.max(
      invoice.sequenceNumber ?? 0,
      Number.isFinite(numberSequence) ? numberSequence : 0
    );
    return Math.max(highest, sequence);
  }, 0);
  return highestSequence + 1;
}

export default function InvoiceManager() {
  const { companyData } = useCompanyData();
  const searchParams = useSearchParams();
  const requestedCustomerId = searchParams.get("customerId");
  const requestedOfferId = searchParams.get("offerId");
  const [invoices, setInvoices] = useState<CrmInvoice[]>([]);
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [offers, setOffers] = useState<OfferSnapshot[]>([]);
  const [settings, setSettings] = useState<CrmInvoiceSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<CrmInvoiceSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [invoiceConfiguration, setInvoiceConfiguration] =
    useState<InvoiceConfigurationDraft | null>(null);
  const [draft, setDraft] = useState<CrmInvoice | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [invoiceEmailDraft, setInvoiceEmailDraft] =
    useState<InvoiceEmailDraft | null>(null);
  const [invoiceEmailError, setInvoiceEmailError] = useState("");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reminderDraft, setReminderDraft] = useState<ReminderDraft | null>(null);
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function load(companyId: string) {
      setIsLoading(true);
      try {
        const [
          invoiceSnapshot,
          customerSnapshot,
          offerSnapshot,
          settingsSnapshot,
        ] = await Promise.all([
          getDocs(
            query(
              collection(database, INVOICE_COLLECTION),
              where("ownerId", "==", companyId)
            )
          ),
          getDocs(
            query(
              collection(database, CRM_COLLECTION),
              where("ownerId", "==", companyId)
            )
          ),
          getDoc(doc(database, OFFER_COLLECTION, companyId)),
          getDoc(doc(database, CRM_INVOICE_SETTINGS, companyId)),
        ]);
        if (!active) return;

        const loadedSettings = normalizeSettings(
          companyId,
          settingsSnapshot.data() as StoredInvoiceSettings | undefined
        );
        const loadedCustomers = customerSnapshot.docs.map((item) =>
          normalizeCustomer(item.data() as CrmCustomer, item.id)
        );
        const loadedInvoices = invoiceSnapshot.docs
          .map((item) =>
            normalizeInvoice(
              item.data() as CrmInvoice,
              item.id,
              loadedCustomers,
              loadedSettings
            )
          )
          .sort((left, right) => right.createdAt - left.createdAt);
        const loadedOffers = (offerSnapshot.data()?.savedCalculations ?? []) as OfferSnapshot[];

        setSettings(loadedSettings);
        setInvoices(loadedInvoices);
        setCustomers(loadedCustomers);
        setOffers(loadedOffers);

        const requestedCustomer = loadedCustomers.find(
          (customer) => customer.id === requestedCustomerId
        );
        const requestedOffer = loadedOffers.find(
          (offer) =>
            offer.id === requestedOfferId &&
            (!requestedCustomerId || offer.customerId === requestedCustomerId)
        );
        const offerCustomer =
          requestedCustomer ??
          loadedCustomers.find((customer) => customer.id === requestedOffer?.customerId);

        if (requestedCustomer || requestedOffer) {
          setDraft(
            createInvoiceDraft(
              companyId,
              loadedSettings,
              offerCustomer,
              requestedOffer
            )
          );
        } else {
          setDraft(loadedInvoices[0] ?? null);
        }
      } catch {
        if (active) {
          setFeedback({
            type: "error",
            message: "Rechnungsdaten konnten nicht geladen werden.",
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load(ownerId);
    return () => {
      active = false;
    };
  }, [companyData?.id, requestedCustomerId, requestedOfferId]);

  const filteredInvoices = invoices.filter((invoice) =>
    [
      invoice.invoiceNumber,
      invoice.customerNumber,
      invoice.customerName,
      invoice.customerCompany,
    ]
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(search.trim().toLocaleLowerCase("de-DE"))
  );
  const customerOffers = offers.filter(
    (offer) => !draft?.customerId || offer.customerId === draft.customerId
  );
  const totals = draft
    ? getTotals(draft)
    : {
        net: 0,
        vat: 0,
        gross: 0,
        orderNet: 0,
        orderVat: 0,
        orderGross: 0,
        remainingGross: 0,
      };
  const savedInvoice = draft
    ? invoices.find((invoice) => invoice.id === draft.id)
    : undefined;
  const draftIsFinalized = draft ? isFinalized(draft) : false;
  const complianceIssues = draft ? getComplianceIssues(draft, !savedInvoice) : [];
  const printSource = draftIsFinalized ? savedInvoice ?? draft : draft;
  const printComplianceIssues = printSource
    ? getComplianceIssues(printSource, !printSource.invoiceNumber.trim())
    : [];
  const printAsDraft = Boolean(
    printSource &&
      (printSource.status === "draft" ||
        !printSource.invoiceNumber.trim() ||
        printComplianceIssues.length > 0 ||
        (savedInvoice && printSource !== savedInvoice))
  );
  const canPrint = Boolean(printSource);
  const canEmailInvoice = Boolean(
    savedInvoice &&
      isFinalized(savedInvoice) &&
      savedInvoice.status !== "cancelled" &&
      getComplianceIssues(savedInvoice).length === 0
  );
  const availableStatuses = draftIsFinalized
    ? invoiceStatuses.filter((status) => status.value !== "draft")
    : invoiceStatuses;
  const reminders = savedInvoice?.reminders ?? [];
  const nextReminderLevel =
    reminderLevels[Math.min(reminders.length, reminderLevels.length - 1)];
  const invoiceOverdueDays = savedInvoice
    ? overdueDaysBetween(savedInvoice.dueDate, dateInputValue())
    : 0;
  const canCreateReminder = Boolean(
    savedInvoice && isFinalized(savedInvoice) && savedInvoice.status === "sent"
  );

  function updateInvoiceList(next: CrmInvoice) {
    setInvoices((current) =>
      [next, ...current.filter((invoice) => invoice.id !== next.id)].sort(
        (left, right) => right.createdAt - left.createdAt
      )
    );
    setDraft(next);
  }

  function startNewInvoice() {
    if (!companyData?.id || !settings) return;
    setDraft(createInvoiceDraft(companyData.id, settings));
    setFeedback(null);
  }

  function openSettings() {
    if (!settings) return;
    setSettingsDraft({
      ...settings,
      issuer: { ...settings.issuer },
      nextNumberByYear: { ...settings.nextNumberByYear },
    });
    setIsSettingsOpen(true);
  }

  function openInvoiceConfiguration() {
    if (!draft) return;
    const currentTotals = getTotals(draft);
    setInvoiceConfiguration({
      invoiceType: draft.invoiceType === "installment" ? "installment" : "full",
      installmentGross:
        draft.invoiceType === "installment"
          ? currentTotals.gross
          : Math.round(currentTotals.orderGross * 0.5 * 100) / 100,
    });
  }

  function applyInvoiceConfiguration() {
    if (!draft || !invoiceConfiguration || draftIsFinalized) return;
    const orderGross = getTotals(draft).orderGross;
    const installmentGross = Math.min(
      orderGross,
      Math.max(0, invoiceConfiguration.installmentGross)
    );
    if (
      invoiceConfiguration.invoiceType === "installment" &&
      (installmentGross <= 0 || installmentGross >= orderGross)
    ) {
      setFeedback({
        type: "error",
        message: "Der Abschlag muss größer als 0 und kleiner als der Auftragswert sein.",
      });
      return;
    }
    setDraft({
      ...draft,
      invoiceType: invoiceConfiguration.invoiceType,
      installmentGross:
        invoiceConfiguration.invoiceType === "installment"
          ? installmentGross
          : undefined,
    });
    setInvoiceConfiguration(null);
    setFeedback(null);
  }

  function updateSettingsIssuer(field: keyof CrmInvoiceIssuer, value: string) {
    setSettingsDraft((current) =>
      current
        ? {
            ...current,
            issuer: { ...current.issuer, [field]: value },
          }
        : current
    );
  }

  async function saveInvoiceSettings() {
    const ownerId = companyData?.id;
    if (!ownerId || !settingsDraft) return;

    const nextSettings = normalizeSettings(ownerId, {
      ...settingsDraft,
      nextNumberByYear: { ...(settings?.nextNumberByYear ?? {}) },
      updatedAt: Date.now(),
    });
    setIsSavingSettings(true);
    try {
      await setDoc(
        doc(database, CRM_INVOICE_SETTINGS, ownerId),
        sanitizeForFirestore(nextSettings)
      );
      setSettings(nextSettings);
      setDraft((current) =>
        current && current.status === "draft" && !isFinalized(current)
          ? { ...current, issuer: { ...nextSettings.issuer } }
          : current
      );
      setIsSettingsOpen(false);
      setFeedback({ type: "saved", message: "Rechnungsdaten gespeichert." });
    } catch {
      setFeedback({
        type: "error",
        message: "Rechnungsdaten konnten nicht gespeichert werden.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  }

  function setCustomer(id: string) {
    if (!draft || draftIsFinalized) return;
    const customer = customers.find((item) => item.id === id);
    setDraft({
      ...draft,
      customerId: id,
      customerNumber: customer?.customerNumber ?? "",
      offerId: "",
      customerName: customer?.name ?? "",
      customerCompany: customer?.company ?? "",
      customerEmail: customer?.email ?? "",
      customerAddress: customer ? customerAddress(customer) : "",
    });
  }

  function setOffer(id: string) {
    if (!draft || draftIsFinalized) return;
    const offer = offers.find((item) => item.id === id);
    const customer = customers.find((item) => item.id === offer?.customerId);
    setDraft({
      ...draft,
      offerId: id,
      customerId: customer?.id ?? draft.customerId,
      customerNumber: customer?.customerNumber ?? draft.customerNumber,
      customerName: customer?.name ?? draft.customerName,
      customerCompany: customer?.company ?? draft.customerCompany,
      customerEmail: customer?.email ?? draft.customerEmail,
      customerAddress: customer ? customerAddress(customer) : draft.customerAddress,
      lineItems: offer ? offerToLines(offer) : draft.lineItems,
      vatPercent: offer?.rates.vatPercent ?? draft.vatPercent,
      serviceDate: offer?.planning.date || draft.serviceDate,
    });
  }

  function updateLine(id: string, patch: Partial<CrmInvoiceLine>) {
    if (!draft || draftIsFinalized) return;
    setDraft({
      ...draft,
      lineItems: draft.lineItems.map((line) =>
        line.id === id ? { ...line, ...patch } : line
      ),
    });
  }

  function changeStatus(status: CrmInvoiceStatus) {
    if (!draft) return;
    if (draftIsFinalized && status === "draft") return;

    const next = { ...draft, status };
    if (status !== "draft") {
      const issues = getComplianceIssues(next, !savedInvoice);
      if (issues.length > 0) {
        setFeedback({
          type: "error",
          message: "Statuswechsel erst nach Behebung der Pflichtangaben möglich.",
        });
        return;
      }
    }
    setDraft(next);
    setFeedback(null);
  }

  async function saveInvoice() {
    const ownerId = companyData?.id;
    if (!draft || !ownerId || !settings) return;

    const persisted = invoices.find((invoice) => invoice.id === draft.id);
    let invoiceToValidate = draft;

    if (persisted && isFinalized(persisted)) {
      if (draft.status === "draft") {
        setFeedback({
          type: "error",
          message: "Eine finalisierte Rechnung kann kein Entwurf mehr werden.",
        });
        return;
      }
      invoiceToValidate = { ...persisted, status: draft.status };
    }

    if (invoiceToValidate.status !== "draft") {
      const issues = getComplianceIssues(invoiceToValidate, !persisted);
      if (issues.length > 0) {
        setFeedback({
          type: "error",
          message: "Die Rechnung enthält noch Pflichtangaben.",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      if (!persisted) {
        const settingsReference = doc(database, CRM_INVOICE_SETTINGS, ownerId);
        const invoiceReference = doc(database, INVOICE_COLLECTION, draft.id);
        const sequenceFloor = getNextSequenceFloor(invoices, draft.issueDate);

        const result = await runTransaction(database, async (transaction) => {
          const settingsSnapshot = await transaction.get(settingsReference);
          const invoiceSnapshot = await transaction.get(invoiceReference);
          const transactionSettings = normalizeSettings(
            ownerId,
            settingsSnapshot.data() as StoredInvoiceSettings | undefined
          );

          if (invoiceSnapshot.exists()) {
            return {
              invoice: normalizeInvoice(
                invoiceSnapshot.data() as CrmInvoice,
                invoiceSnapshot.id,
                customers,
                transactionSettings
              ),
              settings: transactionSettings,
            };
          }

          const allocationDate = numberingDate(draft.issueDate);
          const year = allocationDate.slice(0, 4);
          const sequence = Math.max(
            transactionSettings.nextNumberByYear[year] ?? 1,
            sequenceFloor
          );
          const now = Date.now();
          const nextInvoice: CrmInvoice = {
            ...draft,
            ownerId,
            invoiceNumber: createInvoiceNumber(
              transactionSettings.invoicePrefix,
              allocationDate,
              sequence
            ),
            sequenceNumber: sequence,
            finalizedAt:
              draft.status === "draft" ? undefined : draft.finalizedAt ?? now,
            updatedAt: now,
          };
          const nextSettings: CrmInvoiceSettings = {
            ...transactionSettings,
            nextNumberByYear: {
              ...transactionSettings.nextNumberByYear,
              [year]: sequence + 1,
            },
            updatedAt: now,
          };

          transaction.set(settingsReference, sanitizeForFirestore(nextSettings));
          transaction.set(invoiceReference, sanitizeForFirestore(nextInvoice));
          return { invoice: nextInvoice, settings: nextSettings };
        });

        setSettings(result.settings);
        updateInvoiceList(result.invoice);
      } else if (isFinalized(persisted)) {
        const nextInvoice: CrmInvoice = {
          ...persisted,
          status: draft.status,
          updatedAt: Date.now(),
        };
        await setDoc(
          doc(database, INVOICE_COLLECTION, nextInvoice.id),
          sanitizeForFirestore(nextInvoice)
        );
        updateInvoiceList(nextInvoice);
      } else {
        const now = Date.now();
        const nextInvoice: CrmInvoice = {
          ...draft,
          ownerId,
          invoiceNumber: persisted.invoiceNumber,
          sequenceNumber: persisted.sequenceNumber ?? 0,
          finalizedAt:
            draft.status === "draft" ? undefined : draft.finalizedAt ?? now,
          updatedAt: now,
        };
        await setDoc(
          doc(database, INVOICE_COLLECTION, nextInvoice.id),
          sanitizeForFirestore(nextInvoice)
        );
        updateInvoiceList(nextInvoice);
      }

      setFeedback({ type: "saved", message: "Rechnung gespeichert." });
    } catch {
      setFeedback({
        type: "error",
        message: "Rechnung konnte nicht gespeichert werden.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openReminderDialog() {
    if (!canCreateReminder || !savedInvoice) return;
    const today = dateInputValue();
    setReminderDraft({
      level: Math.min(reminders.length, reminderLevels.length - 1) + 1,
      label: nextReminderLevel.label,
      issueDate: today,
      paymentDeadline: addDays(today, 14),
      fee: nextReminderLevel.defaultFee,
      interestRatePercent: nextReminderLevel.defaultInterest,
      note: "",
    });
  }

  async function saveReminder() {
    if (!savedInvoice || !reminderDraft) return;
    const gross = getTotals(savedInvoice).gross;
    const overdueDays = overdueDaysBetween(
      savedInvoice.dueDate,
      reminderDraft.issueDate
    );
    const reminder: CrmInvoiceReminder = {
      id: crypto.randomUUID(),
      level: reminderDraft.level,
      label: reminderDraft.label,
      issueDate: reminderDraft.issueDate,
      paymentDeadline: reminderDraft.paymentDeadline,
      fee: reminderDraft.fee,
      interestRatePercent: reminderDraft.interestRatePercent,
      interestAmount: calculateReminderInterest(
        gross,
        reminderDraft.interestRatePercent,
        overdueDays
      ),
      overdueDays,
      note: reminderDraft.note,
      createdAt: Date.now(),
    };
    const nextInvoice: CrmInvoice = {
      ...savedInvoice,
      reminders: [...(savedInvoice.reminders ?? []), reminder],
      updatedAt: Date.now(),
    };
    setIsSavingReminder(true);
    try {
      await setDoc(
        doc(database, INVOICE_COLLECTION, nextInvoice.id),
        sanitizeForFirestore(nextInvoice)
      );
      updateInvoiceList(nextInvoice);
      setReminderDraft(null);
      setFeedback({ type: "saved", message: `${reminder.label} gespeichert.` });
      printReminder(nextInvoice, reminder);
    } catch {
      setFeedback({
        type: "error",
        message: "Mahnung konnte nicht gespeichert werden.",
      });
    } finally {
      setIsSavingReminder(false);
    }
  }

  function printReminder(invoice: CrmInvoice, reminder: CrmInvoiceReminder) {
    const issuer = mergeIssuer(invoice.issuer);
    const gross = getTotals(invoice).gross;
    const previousReminders = (invoice.reminders ?? [])
      .filter((item) => item.createdAt < reminder.createdAt)
      .sort((left, right) => left.createdAt - right.createdAt);
    const previousFees = previousReminders.reduce(
      (total, item) => total + item.fee,
      0
    );
    const totalDue = gross + previousFees + reminder.fee + reminder.interestAmount;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setFeedback({
        type: "error",
        message: "Das Druckfenster konnte nicht geöffnet werden.",
      });
      return;
    }

    const senderLine = [
      issuer.companyName,
      `${issuer.proprietor} · ${issuer.legalForm}`,
      issuer.street,
      `${issuer.postalCode} ${issuer.city}`.trim(),
      issuer.country,
    ]
      .filter((value) => value.trim())
      .join(" · ");
    const recipientNames = [invoice.customerCompany, invoice.customerName]
      .filter((value) => value.trim())
      .map(safeText)
      .join("<br>");
    const taxIdentifiers = [
      issuer.taxNumber ? `Steuernummer: ${issuer.taxNumber}` : "",
      issuer.vatId ? `USt-IdNr.: ${issuer.vatId}` : "",
    ]
      .filter(Boolean)
      .map(safeText)
      .join("<br>");

    const isFirstLevel = reminder.level <= 1;
    const isFinalLevel = reminder.level >= reminderLevels.length;
    const priorReminder = previousReminders[previousReminders.length - 1];
    const priorReference = priorReminder
      ? `unserer ${priorReminder.label} vom ${formatPrintDate(priorReminder.issueDate)}`
      : "unserer Zahlungserinnerung";
    const invoiceReference = `Rechnung Nr. ${invoice.invoiceNumber} vom ${formatPrintDate(invoice.issueDate)}`;
    const intro = isFirstLevel
      ? `sicherlich haben Sie unsere ${invoiceReference} übersehen. Wir möchten Sie freundlich daran erinnern, dass der Rechnungsbetrag seit dem ${formatPrintDate(invoice.dueDate)} fällig ist.`
      : `trotz ${priorReference} konnten wir bis heute keinen Zahlungseingang zu unserer ${invoiceReference} feststellen. Sie befinden sich gemäß § 286 BGB in Zahlungsverzug.`;
    const demand = isFirstLevel
      ? `Wir bitten Sie, den offenen Gesamtbetrag von ${currencyFormatter.format(totalDue)} bis spätestens zum ${formatPrintDate(reminder.paymentDeadline)} auf das unten genannte Konto zu überweisen.`
      : `Wir fordern Sie auf, den offenen Gesamtbetrag von ${currencyFormatter.format(totalDue)} bis spätestens zum ${formatPrintDate(reminder.paymentDeadline)} auf das unten genannte Konto zu überweisen.`;
    const escalation = isFinalLevel
      ? `<p><strong>Sollte der Gesamtbetrag nicht bis zum ${safeText(formatPrintDate(reminder.paymentDeadline))} bei uns eingehen, werden wir ohne weitere Ankündigung gerichtliche Schritte einleiten (gerichtliches Mahnverfahren) bzw. die Forderung an ein Inkassounternehmen übergeben. Die dadurch entstehenden weiteren Kosten gehen zu Ihren Lasten.</strong></p>`
      : "";
    const interestNote =
      reminder.interestAmount > 0
        ? `<p class="small">Die Verzugszinsen wurden mit ${safeText(quantityFormatter.format(reminder.interestRatePercent))} % p. a. für ${safeText(String(reminder.overdueDays))} Tage Verzug seit dem ${safeText(formatPrintDate(invoice.dueDate))} berechnet (§ 288 BGB: bei Verbrauchern 5, bei Unternehmen 9 Prozentpunkte über dem Basiszinssatz).</p>`
        : "";
    const noteHtml = reminder.note.trim()
      ? `<p>${safeMultiline(reminder.note)}</p>`
      : "";

    const claimRows = [
      `<tr><td>Hauptforderung aus ${safeText(invoiceReference)}, fällig am ${safeText(formatPrintDate(invoice.dueDate))}</td><td>${safeText(currencyFormatter.format(gross))}</td></tr>`,
      ...previousReminders
        .filter((item) => item.fee > 0)
        .map(
          (item) =>
            `<tr><td>Mahngebühr ${safeText(item.label)} vom ${safeText(formatPrintDate(item.issueDate))}</td><td>${safeText(currencyFormatter.format(item.fee))}</td></tr>`
        ),
      ...(reminder.fee > 0
        ? [
            `<tr><td>Mahngebühr ${safeText(reminder.label)}</td><td>${safeText(currencyFormatter.format(reminder.fee))}</td></tr>`,
          ]
        : []),
      ...(reminder.interestAmount > 0
        ? [
            `<tr><td>Verzugszinsen (${safeText(quantityFormatter.format(reminder.interestRatePercent))} % p. a., ${safeText(String(reminder.overdueDays))} Tage)</td><td>${safeText(currencyFormatter.format(reminder.interestAmount))}</td></tr>`,
          ]
        : []),
    ].join("");

    printWindow.document.write(`<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${safeText(`${reminder.label} zu ${invoice.invoiceNumber}`)}</title>
  <style>
    @page{margin:15mm}*{box-sizing:border-box}body{margin:0;color:#172554;font:10pt Arial,sans-serif;line-height:1.5}.document{max-width:190mm;margin:auto}.sender{padding-bottom:5px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:8pt}.header{display:flex;justify-content:space-between;gap:24px;margin-top:22px}.recipient{min-height:42mm}.eyebrow{color:#c45f18;font-size:8pt;font-weight:700;text-transform:uppercase}h1{margin:2px 0 0;font-size:22pt;color:#0f2b54}.meta{display:grid;grid-template-columns:auto auto;gap:4px 18px;align-content:start}.meta span:nth-child(odd){color:#64748b}.meta span:nth-child(even){text-align:right;font-weight:700}.body-text{margin-top:22px}.body-text p{margin:0 0 11px}.claims{width:100%;margin-top:14px;border-collapse:collapse}.claims td{padding:8px 7px;border-bottom:1px solid #e2e8f0}.claims td:last-child{width:36mm;text-align:right;font-weight:700;white-space:nowrap}.total-row{display:flex;justify-content:space-between;gap:16px;margin-top:8px;margin-left:auto;width:96mm;padding:11px;background:#0f2b54;color:#fff;font-size:12pt;font-weight:700}.payment{margin-top:24px;padding:13px 15px;border-left:4px solid #c45f18;background:#fff7ed}.payment-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:10px}.label{color:#64748b;font-size:8pt;text-transform:uppercase}.small{color:#475569;font-size:8.5pt}.footer{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:34px;padding-top:10px;border-top:1px solid #cbd5e1;color:#475569;font-size:8pt}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style>
</head>
<body>
  <main class="document">
    <div class="sender">${safeText(senderLine)}</div>
    <section class="header">
      <div class="recipient">
        <p class="eyebrow">An</p>
        <strong>${recipientNames}</strong><br>
        ${safeMultiline(invoice.customerAddress)}
      </div>
      <div>
        <p class="eyebrow">Mahnwesen</p>
        <h1>${safeText(reminder.label)}</h1>
      </div>
    </section>
    <section class="meta">
      <span>Datum</span><span>${safeText(formatPrintDate(reminder.issueDate))}</span>
      <span>Rechnungsnummer</span><span>${safeText(invoice.invoiceNumber)}</span>
      <span>Rechnungsdatum</span><span>${safeText(formatPrintDate(invoice.issueDate))}</span>
      <span>Kundennummer</span><span>${safeText(invoice.customerNumber || "")}</span>
      <span>Ursprüngliche Fälligkeit</span><span>${safeText(formatPrintDate(invoice.dueDate))}</span>
      <span>Neue Zahlungsfrist</span><span>${safeText(formatPrintDate(reminder.paymentDeadline))}</span>
    </section>
    <section class="body-text">
      <p>Sehr geehrte Damen und Herren,</p>
      <p>${safeText(intro)}</p>
      <table class="claims"><tbody>${claimRows}</tbody></table>
      <div class="total-row"><span>Offener Gesamtbetrag</span><span>${safeText(currencyFormatter.format(totalDue))}</span></div>
      ${interestNote}
      <p style="margin-top:14px">${safeText(demand)}</p>
      ${escalation}
      ${noteHtml}
      <p>Sollten Sie die Zahlung zwischenzeitlich bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.</p>
      <p>Mit freundlichen Grüßen<br>${safeText(issuer.proprietor)}<br>${safeText(issuer.companyName)}</p>
    </section>
    <section class="payment">
      <strong>Bankverbindung</strong>
      <div class="payment-grid">
        <div><span class="label">Bank</span><br>${safeText(issuer.bankName)}<br><span class="label">Kontoinhaber</span><br>${safeText(issuer.accountHolder)}</div>
        <div><span class="label">IBAN</span><br>${safeText(issuer.iban)}<br><span class="label">BIC</span><br>${safeText(issuer.bic)}</div>
      </div>
      <p class="small" style="margin-bottom:0">Bitte geben Sie bei der Überweisung die Rechnungsnummer ${safeText(invoice.invoiceNumber)} an.</p>
    </section>
    <footer class="footer">
      <div><strong>${safeText(issuer.companyName)}</strong><br>${safeText(issuer.proprietor)}<br>${safeText(issuer.legalForm)}</div>
      <div>${safeText(issuer.street)}<br>${safeText(`${issuer.postalCode} ${issuer.city}`.trim())}<br>${safeText(issuer.country)}</div>
      <div>${safeText(issuer.email)}<br>${safeText(issuer.phone)}${taxIdentifiers ? `<br>${taxIdentifiers}` : ""}</div>
    </footer>
  </main>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  function printInvoice() {
    if (!printSource) return;
    const invoice = printSource;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setFeedback({
        type: "error",
        message: "Das Druckfenster konnte nicht geöffnet werden.",
      });
      return;
    }

    printWindow.document.write(
      createInvoiceDocumentHtml(invoice, { draft: printAsDraft })
    );
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  async function downloadInvoice() {
    if (!printSource) return;
    setIsDownloading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/crm/invoices/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice: printSource, draft: printAsDraft }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Die PDF-Rechnung konnte nicht erstellt werden.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = createInvoicePdfFilename(printSource);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback({ type: "saved", message: "PDF heruntergeladen." });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Die PDF-Rechnung konnte nicht erstellt werden.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  function openInvoiceEmailDialog() {
    if (!savedInvoice || !canEmailInvoice) return;
    const documentType =
      savedInvoice.invoiceType === "installment"
        ? "Abschlagsrechnung"
        : "Rechnung";
    setInvoiceEmailDraft({
      to: savedInvoice.customerEmail,
      subject: `Ihre ${documentType} ${savedInvoice.invoiceNumber}`,
      message:
        `anbei erhalten Sie Ihre ${documentType.toLowerCase()} als PDF. ` +
        "Bei Rückfragen melden Sie sich gerne bei uns.",
    });
    setInvoiceEmailError("");
  }

  async function sendInvoiceEmail() {
    if (!savedInvoice || !invoiceEmailDraft || !canEmailInvoice) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmailDraft.to.trim())) {
      setInvoiceEmailError("Bitte eine gültige Empfängeradresse angeben.");
      return;
    }
    if (!invoiceEmailDraft.subject.trim() || !invoiceEmailDraft.message.trim()) {
      setInvoiceEmailError("Betreff und Nachricht dürfen nicht leer sein.");
      return;
    }

    setIsSendingInvoice(true);
    setInvoiceEmailError("");
    try {
      const response = await fetch("/api/crm/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: invoiceEmailDraft.to.trim(),
          subject: invoiceEmailDraft.subject.trim(),
          message: invoiceEmailDraft.message.trim(),
          invoice: savedInvoice,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Die Rechnung konnte nicht versendet werden.");
      }

      if (savedInvoice.status !== "sent" && savedInvoice.status !== "paid") {
        const sentInvoice: CrmInvoice = {
          ...savedInvoice,
          status: "sent",
          updatedAt: Date.now(),
        };
        await setDoc(
          doc(database, INVOICE_COLLECTION, sentInvoice.id),
          sanitizeForFirestore(sentInvoice)
        );
        updateInvoiceList(sentInvoice);
      }
      setInvoiceEmailDraft(null);
      setFeedback({ type: "saved", message: "Rechnung per E-Mail versendet." });
    } catch (error) {
      setInvoiceEmailError(
        error instanceof Error
          ? error.message
          : "Die Rechnung konnte nicht versendet werden."
      );
    } finally {
      setIsSendingInvoice(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={17} />
        Rechnungen werden geladen ...
      </div>
    );
  }

  return (
    <>
      <main className="pb-4">
        <header className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              CRM & Buchhaltung
            </p>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Rechnungen</h1>
            <p className="mt-2 text-sm text-slate-600">
              Aus Angeboten abrechnen, Positionen anpassen und Zahlungsstatus verfolgen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {feedback?.type === "saved" && (
              <span className="flex items-center gap-1 text-sm text-emerald-700">
                <Check size={15} /> {feedback.message}
              </span>
            )}
            {feedback?.type === "error" && (
              <span className="text-sm text-red-600">{feedback.message}</span>
            )}
            <Button variant="outline" onClick={openSettings} disabled={!settings}>
              <Settings2 /> Rechnungsdaten
            </Button>
            <Button onClick={startNewInvoice} disabled={!settings}>
              <FilePlus2 /> Neue Rechnung
            </Button>
          </div>
        </header>

        <div className="grid min-h-[700px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-200 p-3">
              <label className="relative block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechnung suchen ..."
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>
            <div className="max-h-[620px] divide-y divide-slate-200 overflow-y-auto">
              {filteredInvoices.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  Noch keine Rechnungen gespeichert.
                </p>
              ) : (
                filteredInvoices.map((invoice) => {
                  const status = invoiceStatuses.find(
                    (item) => item.value === invoice.status
                  )!;
                  const amount = getTotals(invoice).gross;
                  return (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => {
                        setDraft(invoice);
                        setFeedback(null);
                      }}
                      className={`w-full px-4 py-4 text-left hover:bg-white ${
                        draft?.id === invoice.id
                          ? "bg-blue-50 shadow-[inset_3px_0_0_#2563eb]"
                          : ""
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-950">
                          {invoice.invoiceNumber || "Ohne Nummer"}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {invoice.customerCompany || invoice.customerName || "Ohne Empfänger"}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-slate-950">
                        {currencyFormatter.format(amount)}
                      </span>
                      {invoice.invoiceType === "installment" && (
                        <span className="mt-1 block text-[11px] font-medium text-amber-700">
                          Abschlag · Rest {currencyFormatter.format(getTotals(invoice).remainingGross)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {draft ? (
            <section className="min-w-0 p-4 sm:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {draft.invoiceNumber || "Neue Rechnung"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {draftIsFinalized
                      ? "Finalisierter, unveränderlicher Rechnungssnapshot"
                      : "Rechnungssnapshot für Aussteller und Empfänger"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={openInvoiceConfiguration}
                    disabled={draftIsFinalized}
                  >
                    <SlidersHorizontal /> Rechnung einstellen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={printInvoice}
                    disabled={!canPrint}
                    title={
                      printAsDraft
                        ? "Aktuellen Stand deutlich als Entwurf drucken"
                        : "Finalisierte Rechnung drucken"
                    }
                  >
                    <Printer /> {printAsDraft ? "Entwurf drucken" : "Drucken"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void downloadInvoice()}
                    disabled={!canPrint || isDownloading}
                  >
                    {isDownloading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openInvoiceEmailDialog}
                    disabled={!canEmailInvoice}
                    title={
                      canEmailInvoice
                        ? "Finalisierte Rechnung per E-Mail senden"
                        : "Erst vollständig ausfüllen, finalisieren und speichern"
                    }
                  >
                    <Mail /> E-Mail
                  </Button>
                  <Button onClick={() => void saveInvoice()} disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
                    Speichern
                  </Button>
                </div>
              </div>

              <div className="mb-5 grid border-y border-slate-200 bg-slate-50/60 md:grid-cols-3 md:divide-x md:divide-slate-200">
                <section className="p-4">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Aussteller</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {draft.issuer?.companyName || "Nicht angegeben"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                    {[
                      draft.issuer?.proprietor,
                      draft.issuer?.legalForm,
                      draft.issuer?.street,
                      `${draft.issuer?.postalCode ?? ""} ${draft.issuer?.city ?? ""}`.trim(),
                      draft.issuer?.country,
                    ]
                      .filter(Boolean)
                      .join("\n")}
                  </p>
                </section>
                <section className="border-t border-slate-200 p-4 md:border-t-0">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Empfänger</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {draft.customerCompany || draft.customerName || "Nicht ausgewählt"}
                  </p>
                  {draft.customerCompany && draft.customerName && (
                    <p className="text-xs text-slate-600">{draft.customerName}</p>
                  )}
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                    {draft.customerAddress || "Keine Anschrift"}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    Kundennr.: {draft.customerNumber || "fehlt"}
                  </p>
                </section>
                <section className="border-t border-slate-200 p-4 md:border-t-0">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                    {complianceIssues.length > 0 && (
                      <AlertTriangle size={14} className="text-amber-600" />
                    )}
                    Pflichtangaben
                  </h3>
                  {complianceIssues.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs leading-4 text-amber-800">
                      {complianceIssues.map((issue) => (
                        <li key={issue}>• {issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <Check size={14} /> Pflichtangaben vollständig
                    </p>
                  )}
                </section>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">
                  Rechnungsnummer
                  <input
                    value={draft.invoiceNumber}
                    readOnly
                    placeholder="Beim ersten Speichern"
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) => changeStatus(event.target.value as CrmInvoiceStatus)}
                    className={inputClassName}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Rechnungsdatum
                  <input
                    type="date"
                    value={draft.issueDate}
                    disabled={draftIsFinalized}
                    onChange={(event) => setDraft({ ...draft, issueDate: event.target.value })}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Fällig am
                  <input
                    type="date"
                    value={draft.dueDate}
                    disabled={draftIsFinalized}
                    onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                  Kunde
                  <select
                    value={draft.customerId}
                    disabled={draftIsFinalized}
                    onChange={(event) => setCustomer(event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Kunde auswählen</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company || customer.name} · {customer.customerNumber}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                  Aus Angebot übernehmen
                  <select
                    value={draft.offerId}
                    disabled={draftIsFinalized}
                    onChange={(event) => setOffer(event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Ohne Angebot</option>
                    {customerOffers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.title} · {serviceLabels[offer.planning.serviceTypes[0]] || "Leistung"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Leistungsdatum
                  <input
                    type="date"
                    value={draft.serviceDate}
                    disabled={draftIsFinalized}
                    onChange={(event) => setDraft({ ...draft, serviceDate: event.target.value })}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  MwSt.
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.vatPercent}
                      disabled={draftIsFinalized}
                      onChange={(event) =>
                        setDraft({ ...draft, vatPercent: Number(event.target.value) })
                      }
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                      %
                    </span>
                  </div>
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Steuer- oder Befreiungshinweis
                  <input
                    value={draft.taxNote ?? ""}
                    disabled={draftIsFinalized}
                    onChange={(event) => setDraft({ ...draft, taxNote: event.target.value })}
                    placeholder={
                      draft.vatPercent === 0
                        ? "Bei 0 % Umsatzsteuer erforderlich"
                        : "Optional"
                    }
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">Rechnungspositionen</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={draftIsFinalized}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        lineItems: [
                          ...draft.lineItems,
                          {
                            id: crypto.randomUUID(),
                            description: "Neue Position",
                            quantity: 1,
                            unit: "Stk.",
                            unitPrice: 0,
                          },
                        ],
                      })
                    }
                  >
                    <Plus /> Position
                  </Button>
                </div>
                <div className="overflow-x-auto pb-1">
                  <div className="min-w-[720px] space-y-2">
                    <div className="grid grid-cols-[minmax(220px,1fr)_80px_90px_120px_40px] gap-2 px-1 text-[11px] font-semibold uppercase text-slate-500">
                      <span>Beschreibung</span>
                      <span>Menge</span>
                      <span>Einheit</span>
                      <span>Netto</span>
                      <span />
                    </div>
                    {draft.lineItems.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-[minmax(220px,1fr)_80px_90px_120px_40px] gap-2"
                      >
                        <input
                          aria-label="Beschreibung"
                          value={line.description}
                          disabled={draftIsFinalized}
                          onChange={(event) =>
                            updateLine(line.id, { description: event.target.value })
                          }
                          className="h-9 min-w-0 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <input
                          aria-label="Menge"
                          type="number"
                          step="0.01"
                          value={line.quantity}
                          disabled={draftIsFinalized}
                          onChange={(event) =>
                            updateLine(line.id, { quantity: Number(event.target.value) })
                          }
                          className="h-9 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <input
                          aria-label="Einheit"
                          value={line.unit}
                          disabled={draftIsFinalized}
                          onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                          className="h-9 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <input
                          aria-label="Einzelpreis"
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          disabled={draftIsFinalized}
                          onChange={(event) =>
                            updateLine(line.id, { unitPrice: Number(event.target.value) })
                          }
                          className="h-9 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="Position entfernen"
                          disabled={draftIsFinalized}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              lineItems: draft.lineItems.filter((item) => item.id !== line.id),
                            })
                          }
                        >
                          <Trash2 size={15} className="text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ml-auto mt-6 max-w-md space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                {draft.invoiceType === "installment" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Auftragswert brutto</span>
                      <strong>{currencyFormatter.format(totals.orderGross)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
                      <span className="font-semibold">Abschlagsbetrag</span>
                      <strong>{currencyFormatter.format(totals.gross)}</strong>
                    </div>
                    <div className="flex justify-between text-amber-800">
                      <span className="font-medium">Verbleibende Restschuld</span>
                      <strong>{currencyFormatter.format(totals.remainingGross)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nettosumme</span>
                      <strong>{currencyFormatter.format(totals.net)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        MwSt. {quantityFormatter.format(draft.vatPercent)} %
                      </span>
                      <strong>{currencyFormatter.format(totals.vat)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
                      <span className="font-semibold">Rechnungsbetrag</span>
                      <strong>{currencyFormatter.format(totals.gross)}</strong>
                    </div>
                  </>
                )}
              </div>

              <label className="mt-5 block text-sm font-medium text-slate-700">
                Zahlungs- und Rechnungshinweise
                <textarea
                  value={draft.notes}
                  disabled={draftIsFinalized}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>

              {savedInvoice && isFinalized(savedInvoice) && (
                <div className="mt-6 rounded-md border border-slate-200 p-4">
                  <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <BellRing size={15} /> Mahnwesen
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Zahlungserinnerung und Mahnungen mit Verzugszinsen nach § 288 BGB,
                        Mahngebühr und neuer Zahlungsfrist – als rechtskonformes Dokument druckbar.
                      </p>
                      {savedInvoice.status === "sent" && invoiceOverdueDays > 0 && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Fällig seit {invoiceOverdueDays} Tag(en) (
                          {formatPrintDate(savedInvoice.dueDate)}).
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openReminderDialog}
                      disabled={!canCreateReminder}
                      title={
                        canCreateReminder
                          ? undefined
                          : "Nur für versendete, unbezahlte Rechnungen möglich"
                      }
                    >
                      <Plus /> {nextReminderLevel.label} erstellen
                    </Button>
                  </div>
                  {reminders.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                      Noch keine Mahnung erstellt.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {reminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">
                              {reminder.label}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatPrintDate(reminder.issueDate)} · Zahlungsfrist{" "}
                              {formatPrintDate(reminder.paymentDeadline)} ·{" "}
                              {reminder.overdueDays} Tage Verzug
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-xs text-slate-600">
                              Gebühr {currencyFormatter.format(reminder.fee)} · Zinsen{" "}
                              {currencyFormatter.format(reminder.interestAmount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printReminder(savedInvoice, reminder)}
                            >
                              <Printer /> Drucken
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Die Druck-/PDF-Ausgabe ist keine strukturierte E-Rechnung nach EN 16931.
              </p>
            </section>
          ) : (
            <section className="flex min-h-96 flex-col items-center justify-center text-center">
              <ReceiptText size={35} className="text-slate-300" />
              <h2 className="mt-3 font-semibold text-slate-950">Rechnung auswählen</h2>
              <p className="mt-1 text-sm text-slate-500">
                Oder eine neue Rechnung aus einem Angebot erstellen.
              </p>
            </section>
          )}
        </div>
      </main>

      <Dialog
        open={Boolean(reminderDraft)}
        onOpenChange={(open) => {
          if (!open) setReminderDraft(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Mahnung erstellen</DialogTitle>
            <DialogDescription>
              Das Dokument enthält Rechnungsbezug, Fälligkeit, Verzugszinsen nach § 288 BGB
              und eine neue Zahlungsfrist. Es wird gespeichert und direkt gedruckt.
            </DialogDescription>
          </DialogHeader>
          {reminderDraft && savedInvoice && (() => {
            const gross = getTotals(savedInvoice).gross;
            const overdueDays = overdueDaysBetween(
              savedInvoice.dueDate,
              reminderDraft.issueDate
            );
            const interest = calculateReminderInterest(
              gross,
              reminderDraft.interestRatePercent,
              overdueDays
            );
            const previousFees = reminders.reduce(
              (total, item) => total + item.fee,
              0
            );
            const totalDue = gross + previousFees + reminderDraft.fee + interest;
            return (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Mahnstufe
                    <select
                      value={reminderDraft.label}
                      onChange={(event) => {
                        const levelInfo =
                          reminderLevels.find(
                            (item) => item.label === event.target.value
                          ) ?? reminderLevels[0];
                        setReminderDraft({
                          ...reminderDraft,
                          level: levelInfo.level,
                          label: levelInfo.label,
                          fee: levelInfo.defaultFee,
                          interestRatePercent: levelInfo.defaultInterest,
                        });
                      }}
                      className={inputClassName}
                    >
                      {reminderLevels.map((item) => (
                        <option key={item.level} value={item.label}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Mahndatum
                    <input
                      type="date"
                      value={reminderDraft.issueDate}
                      onChange={(event) =>
                        setReminderDraft({
                          ...reminderDraft,
                          issueDate: event.target.value,
                          paymentDeadline: addDays(event.target.value, 14),
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Neue Zahlungsfrist
                    <input
                      type="date"
                      value={reminderDraft.paymentDeadline}
                      onChange={(event) =>
                        setReminderDraft({
                          ...reminderDraft,
                          paymentDeadline: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Mahngebühr
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={reminderDraft.fee}
                        onChange={(event) =>
                          setReminderDraft({
                            ...reminderDraft,
                            fee: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-blue-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                        EUR
                      </span>
                    </div>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Verzugszins p. a.
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={reminderDraft.interestRatePercent}
                        onChange={(event) =>
                          setReminderDraft({
                            ...reminderDraft,
                            interestRatePercent: Math.max(
                              0,
                              Number(event.target.value) || 0
                            ),
                          })
                        }
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-blue-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                        %
                      </span>
                    </div>
                  </label>
                </div>
                <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-slate-700">
                  § 288 BGB: Verzugszins bei Verbrauchern 5, bei Unternehmen 9
                  Prozentpunkte über dem Basiszinssatz. Mahngebühren müssen dem
                  tatsächlichen Aufwand entsprechen (üblich sind 2,50–5 EUR je Schreiben).
                </p>
                <label className="block text-sm font-medium text-slate-700">
                  Zusätzlicher Hinweis (optional)
                  <textarea
                    value={reminderDraft.note}
                    onChange={(event) =>
                      setReminderDraft({ ...reminderDraft, note: event.target.value })
                    }
                    rows={2}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hauptforderung</span>
                    <strong>{currencyFormatter.format(gross)}</strong>
                  </div>
                  {previousFees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bisherige Mahngebühren</span>
                      <strong>{currencyFormatter.format(previousFees)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mahngebühr</span>
                    <strong>{currencyFormatter.format(reminderDraft.fee)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Verzugszinsen ({overdueDays} Tage Verzug)
                    </span>
                    <strong>{currencyFormatter.format(interest)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2">
                    <span className="font-semibold">Gesamtforderung</span>
                    <strong>{currencyFormatter.format(totalDue)}</strong>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDraft(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => void saveReminder()}
              disabled={isSavingReminder || !reminderDraft}
            >
              {isSavingReminder ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Printer />
              )}
              Speichern & Drucken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(invoiceEmailDraft)}
        onOpenChange={(open) => {
          if (!open) setInvoiceEmailDraft(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Rechnung per E-Mail senden</DialogTitle>
            <DialogDescription>
              Die finalisierte Rechnung wird als PDF erstellt und an die angegebene
              E-Mail-Adresse angehängt.
            </DialogDescription>
          </DialogHeader>
          {invoiceEmailDraft && (
            <div className="space-y-4 py-1">
              <label className="block text-sm font-medium text-slate-700">
                Empfänger
                <input
                  type="email"
                  value={invoiceEmailDraft.to}
                  onChange={(event) =>
                    setInvoiceEmailDraft({
                      ...invoiceEmailDraft,
                      to: event.target.value,
                    })
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Betreff
                <input
                  value={invoiceEmailDraft.subject}
                  onChange={(event) =>
                    setInvoiceEmailDraft({
                      ...invoiceEmailDraft,
                      subject: event.target.value,
                    })
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Nachricht
                <textarea
                  value={invoiceEmailDraft.message}
                  onChange={(event) =>
                    setInvoiceEmailDraft({
                      ...invoiceEmailDraft,
                      message: event.target.value,
                    })
                  }
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500"
                />
              </label>
              {invoiceEmailError && (
                <p className="text-sm font-medium text-red-600">{invoiceEmailError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceEmailDraft(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => void sendInvoiceEmail()}
              disabled={
                isSendingInvoice ||
                !invoiceEmailDraft?.to.trim() ||
                !invoiceEmailDraft.subject.trim() ||
                !invoiceEmailDraft.message.trim()
              }
            >
              {isSendingInvoice ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Send />
              )}
              PDF-Rechnung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(invoiceConfiguration)}
        onOpenChange={(open) => {
          if (!open) setInvoiceConfiguration(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rechnung einstellen</DialogTitle>
            <DialogDescription>
              Lege fest, ob der volle Auftragswert oder nur ein Abschlag berechnet wird.
              Die verbleibende Restschuld erscheint auf der Rechnung.
            </DialogDescription>
          </DialogHeader>
          {invoiceConfiguration && draft && (() => {
            const orderGross = getTotals(draft).orderGross;
            const installmentGross = Math.min(
              orderGross,
              Math.max(0, invoiceConfiguration.installmentGross)
            );
            const percentage = orderGross > 0
              ? installmentGross / orderGross * 100
              : 0;
            const isInstallment = invoiceConfiguration.invoiceType === "installment";
            return (
              <div className="space-y-4 py-1">
                <fieldset className="grid grid-cols-2 gap-2">
                  <legend className="mb-2 text-sm font-medium text-slate-700">
                    Rechnungsart
                  </legend>
                  {([
                    ["full", "Vollrechnung"],
                    ["installment", "Abschlagsrechnung"],
                  ] as const).map(([value, label]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-md border p-3 text-sm font-medium ${
                        invoiceConfiguration.invoiceType === value
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="invoiceType"
                        value={value}
                        checked={invoiceConfiguration.invoiceType === value}
                        onChange={() =>
                          setInvoiceConfiguration({
                            ...invoiceConfiguration,
                            invoiceType: value,
                          })
                        }
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                {isInstallment && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Abschlag brutto
                      <div className="relative mt-1.5">
                        <input
                          type="number"
                          min="0.01"
                          max={Math.max(0, orderGross - 0.01)}
                          step="0.01"
                          value={invoiceConfiguration.installmentGross}
                          onChange={(event) =>
                            setInvoiceConfiguration({
                              ...invoiceConfiguration,
                              installmentGross: Number(event.target.value),
                            })
                          }
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-blue-500"
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                          EUR
                        </span>
                      </div>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Anteil am Auftragswert
                      <div className="relative mt-1.5">
                        <input
                          type="number"
                          min="0.01"
                          max="99.99"
                          step="0.01"
                          value={Math.round(percentage * 100) / 100}
                          onChange={(event) =>
                            setInvoiceConfiguration({
                              ...invoiceConfiguration,
                              installmentGross:
                                orderGross * (Number(event.target.value) / 100),
                            })
                          }
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-blue-500"
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                          %
                        </span>
                      </div>
                    </label>
                  </div>
                )}
                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Auftragswert brutto</span>
                    <strong>{currencyFormatter.format(orderGross)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rechnungsbetrag brutto</span>
                    <strong>
                      {currencyFormatter.format(isInstallment ? installmentGross : orderGross)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-amber-800">
                    <span className="font-medium">Restschuld</span>
                    <strong>
                      {currencyFormatter.format(isInstallment ? orderGross - installmentGross : 0)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceConfiguration(null)}>
              Abbrechen
            </Button>
            <Button onClick={applyInvoiceConfiguration}>Übernehmen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rechnungsdaten</DialogTitle>
            <DialogDescription>
              Diese Angaben werden beim Erstellen als unveränderlicher Aussteller-Snapshot in
              die Rechnung übernommen.
            </DialogDescription>
          </DialogHeader>
          {settingsDraft && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Unternehmen</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SettingsField
                    label="Unternehmensname"
                    value={settingsDraft.issuer.companyName}
                    onChange={(value) => updateSettingsIssuer("companyName", value)}
                  />
                  <SettingsField
                    label="Inhaber"
                    value={settingsDraft.issuer.proprietor}
                    onChange={(value) => updateSettingsIssuer("proprietor", value)}
                  />
                  <SettingsField
                    label="Rechtsform"
                    value={settingsDraft.issuer.legalForm}
                    onChange={(value) => updateSettingsIssuer("legalForm", value)}
                  />
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-950">
                  Anschrift und Kontakt
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SettingsField
                    label="Straße und Hausnummer"
                    value={settingsDraft.issuer.street}
                    onChange={(value) => updateSettingsIssuer("street", value)}
                  />
                  <SettingsField
                    label="Postleitzahl"
                    value={settingsDraft.issuer.postalCode}
                    onChange={(value) => updateSettingsIssuer("postalCode", value)}
                  />
                  <SettingsField
                    label="Ort"
                    value={settingsDraft.issuer.city}
                    onChange={(value) => updateSettingsIssuer("city", value)}
                  />
                  <SettingsField
                    label="Land"
                    value={settingsDraft.issuer.country}
                    onChange={(value) => updateSettingsIssuer("country", value)}
                  />
                  <SettingsField
                    label="E-Mail"
                    type="email"
                    value={settingsDraft.issuer.email}
                    onChange={(value) => updateSettingsIssuer("email", value)}
                  />
                  <SettingsField
                    label="Telefon"
                    type="tel"
                    value={settingsDraft.issuer.phone}
                    onChange={(value) => updateSettingsIssuer("phone", value)}
                  />
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Steuer und Bank</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SettingsField
                    label="Steuernummer"
                    value={settingsDraft.issuer.taxNumber}
                    onChange={(value) => updateSettingsIssuer("taxNumber", value)}
                  />
                  <SettingsField
                    label="USt-IdNr."
                    value={settingsDraft.issuer.vatId}
                    onChange={(value) => updateSettingsIssuer("vatId", value)}
                  />
                  <SettingsField
                    label="Bankname"
                    value={settingsDraft.issuer.bankName}
                    onChange={(value) => updateSettingsIssuer("bankName", value)}
                  />
                  <SettingsField
                    label="Kontoinhaber"
                    value={settingsDraft.issuer.accountHolder}
                    onChange={(value) => updateSettingsIssuer("accountHolder", value)}
                  />
                  <SettingsField
                    label="IBAN"
                    value={settingsDraft.issuer.iban}
                    onChange={(value) => updateSettingsIssuer("iban", value)}
                  />
                  <SettingsField
                    label="BIC"
                    value={settingsDraft.issuer.bic}
                    onChange={(value) => updateSettingsIssuer("bic", value)}
                  />
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-950">
                  Nummerierung und Zahlungsziel
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SettingsField
                    label="Rechnungspräfix"
                    value={settingsDraft.invoicePrefix}
                    onChange={(value) =>
                      setSettingsDraft({ ...settingsDraft, invoicePrefix: value })
                    }
                  />
                  <SettingsField
                    label="Zahlungsziel in Tagen"
                    type="number"
                    min={0}
                    value={settingsDraft.paymentTermDays}
                    onChange={(value) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        paymentTermDays: Math.max(0, Math.trunc(Number(value) || 0)),
                      })
                    }
                  />
                </div>
              </section>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => void saveInvoiceSettings()}
              disabled={isSavingSettings || !settingsDraft}
            >
              {isSavingSettings ? <LoaderCircle className="animate-spin" /> : <Save />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}