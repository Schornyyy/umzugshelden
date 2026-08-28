"use client";

import SignaturePadField from "@/components/crm/SignaturePadField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { database } from "@/config/firebase";
import { createCustomerNumber } from "@/lib/crmIdentifiers";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type {
  CrmCustomer,
  CrmHandoverContractor,
  CrmHandoverIssue,
  CrmHandoverIssueType,
  CrmHandoverObservation,
  CrmHandoverPhoto,
  CrmHandoverPhotoCategory,
  CrmHandoverProtocol,
} from "@/types/Crm";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  FilePlus2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  Printer,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";

const CUSTOMER_COLLECTION = "crm_customers_umzugshelden";
const OFFER_COLLECTION = "offer_calculators_umzugshelden";
const PROTOCOL_COLLECTION = "crm_handover_protocols_umzugshelden";
const INVOICE_SETTINGS_COLLECTION = "crm_invoice_settings_umzugshelden";
const MAX_PROTOCOL_PHOTOS = 30;
const MAX_PROTOCOL_SIZE_BYTES = 900_000;

const DEFAULT_CONTRACTOR: CrmHandoverContractor = {
  companyName: "Umzugshelden",
  proprietor: "Muhammed Ali Güngör",
  legalForm: "Einzelunternehmen",
  street: "In der Trift 1",
  postalCode: "57489",
  city: "Drolshagen",
  country: "Deutschland",
  email: "info@umzugshelden.io",
  phone: "+49 151 68567708",
};

const DECLARATION_TEXT =
  "Dieses Protokoll dokumentiert den bei der Übergabe gemeinsam festgestellten, äußerlich erkennbaren Zustand und die aufgenommenen Abweichungen. Die Unterzeichnung bestätigt die Richtigkeit der aufgenommenen Angaben und den Erhalt einer Ausfertigung. Sie beinhaltet keinen Verzicht auf gesetzliche Rechte oder Ansprüche; verdeckte Schäden bleiben vorbehalten.";

type OfferSnapshot = {
  id: string;
  customerId?: string;
  title: string;
  createdAt: number;
  planning: {
    date: string;
    serviceTypes: string[];
    contactName: string;
    contactEmail: string;
    oldAddress: string;
    newAddress: string;
    notes: string;
    photoUrls: string[];
  };
};

type StoredInvoiceSettings = {
  ownerId?: string;
  issuer?: Partial<CrmHandoverContractor>;
};

type Feedback = {
  type: "saved" | "error";
  message: string;
};

const issueTypeOptions: Array<{
  value: CrmHandoverIssueType;
  label: string;
}> = [
  { value: "preexisting", label: "Vorbestehender Zustand" },
  { value: "transportDamage", label: "Transportschaden" },
  { value: "propertyDamage", label: "Sachschaden am Objekt" },
  { value: "missing", label: "Fehlteil" },
  { value: "other", label: "Sonstige Abweichung" },
];

const photoCategoryOptions: Array<{
  value: CrmHandoverPhotoCategory;
  label: string;
}> = [
  { value: "pickup", label: "Abholort" },
  { value: "delivery", label: "Zielort" },
  { value: "damage", label: "Schaden / Abweichung" },
  { value: "other", label: "Sonstiges" },
];

const observationOptions: Array<{
  value: CrmHandoverObservation;
  label: string;
}> = [
  { value: "notRecorded", label: "Nicht erfasst" },
  { value: "confirmed", label: "Bestätigt" },
  {
    value: "notConfirmed",
    label: "Nicht bestätigt / abweichend",
  },
  { value: "notApplicable", label: "Nicht zutreffend" },
];

const completionFields: Array<{
  key: keyof Pick<
    CrmHandoverProtocol,
    | "servicesCompleted"
    | "inventoryDelivered"
    | "visibleInspectionCompleted"
    | "keysReturned"
    | "siteLeftClean"
  >;
  label: string;
}> = [
  {
    key: "servicesCompleted",
    label: "Vereinbarte Leistungen als abgeschlossen aufgenommen",
  },
  {
    key: "inventoryDelivered",
    label: "Transportiertes Inventar als übergeben aufgenommen",
  },
  {
    key: "visibleInspectionCompleted",
    label: "Gemeinsame äußerliche Sichtprüfung durchgeführt",
  },
  {
    key: "keysReturned",
    label: "Überlassene Schlüssel als zurückgegeben aufgenommen",
  },
  {
    key: "siteLeftClean",
    label: "Einsatzorte als sauber verlassen aufgenommen",
  },
];

const inputClassName =
  "mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const textareaClassName =
  "mt-1.5 min-h-24 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function dateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function dateTimeInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeDateTimeValue(value?: string) {
  if (!value) return dateTimeInputValue();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
    return value.slice(0, 16);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeInputValue(parsed);
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
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeForFirestore(item)])
    ) as T;
  }
  return value;
}

function contractorValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizeObservation(value: unknown): CrmHandoverObservation {
  if (value === true) return "confirmed";
  return observationOptions.some((option) => option.value === value)
    ? (value as CrmHandoverObservation)
    : "notRecorded";
}

function observationLabel(value: CrmHandoverObservation) {
  return (
    observationOptions.find((option) => option.value === value)?.label ??
    "Nicht erfasst"
  );
}

function mergeContractor(
  source?: Partial<CrmHandoverContractor>,
  fallback: CrmHandoverContractor = DEFAULT_CONTRACTOR
): CrmHandoverContractor {
  return {
    companyName: contractorValue(source?.companyName, fallback.companyName),
    proprietor: contractorValue(source?.proprietor, fallback.proprietor),
    legalForm: contractorValue(source?.legalForm, fallback.legalForm),
    street: contractorValue(source?.street, fallback.street),
    postalCode: contractorValue(source?.postalCode, fallback.postalCode),
    city: contractorValue(source?.city, fallback.city),
    country: contractorValue(source?.country, fallback.country),
    email: contractorValue(source?.email, fallback.email),
    phone: contractorValue(source?.phone, fallback.phone),
  };
}

function normalizeCustomer(customer: CrmCustomer, documentId: string) {
  const id = customer.id || documentId;
  const createdAt = customer.createdAt ?? customer.updatedAt ?? Date.now();
  return {
    ...customer,
    id,
    customerNumber:
      customer.customerNumber || createCustomerNumber(id, createdAt),
  };
}

function isAllowedPhotoUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeOffer(value: unknown): OfferSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<OfferSnapshot>;
  if (!source.id || !source.planning || !Array.isArray(source.planning.serviceTypes)) {
    return null;
  }
  const planning = source.planning;
  return {
    id: source.id,
    customerId: source.customerId,
    title: typeof source.title === "string" ? source.title : "Angebot",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
    planning: {
      date: typeof planning.date === "string" ? planning.date : "",
      serviceTypes: planning.serviceTypes.filter(
        (serviceType): serviceType is string => typeof serviceType === "string"
      ),
      contactName:
        typeof planning.contactName === "string" ? planning.contactName : "",
      contactEmail:
        typeof planning.contactEmail === "string" ? planning.contactEmail : "",
      oldAddress:
        typeof planning.oldAddress === "string" ? planning.oldAddress : "",
      newAddress:
        typeof planning.newAddress === "string" ? planning.newAddress : "",
      notes: typeof planning.notes === "string" ? planning.notes : "",
      photoUrls: Array.isArray(planning.photoUrls)
        ? planning.photoUrls.filter(
            (url): url is string =>
              typeof url === "string" && isAllowedPhotoUrl(url)
          )
        : [],
    },
  };
}

function isMoveOffer(offer: OfferSnapshot) {
  return offer.planning.serviceTypes.some(
    (serviceType) => serviceType === "move" || serviceType === "seniorMove"
  );
}

function serviceTypeFromOffer(offer: OfferSnapshot) {
  return offer.planning.serviceTypes.includes("seniorMove")
    ? "seniorMove"
    : "move";
}

function offerPhotos(offer?: OfferSnapshot): CrmHandoverPhoto[] {
  if (!offer) return [];
  return Array.from(new Set(offer.planning.photoUrls))
    .slice(0, MAX_PROTOCOL_PHOTOS)
    .map((url) => ({
      id: crypto.randomUUID(),
      url,
      category: "pickup",
      caption: "Foto aus der Auftragsaufnahme",
    }));
}

function emptySignature() {
  return { name: "", signedAt: "", dataUrl: "" };
}

function protocolNumber(id: string, moveDate: string) {
  const year = /^\d{4}/.test(moveDate)
    ? moveDate.slice(0, 4)
    : String(new Date().getFullYear());
  return `UP-${year}-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function createProtocolDraft(
  ownerId: string,
  contractor: CrmHandoverContractor,
  customer?: CrmCustomer,
  offer?: OfferSnapshot
): CrmHandoverProtocol {
  const id = crypto.randomUUID();
  const now = Date.now();
  const today = dateInputValue();
  const moveDate =
    offer?.planning.date && isValidDate(offer.planning.date)
      ? offer.planning.date
      : today;
  return {
    id,
    ownerId,
    customerId: customer?.id ?? offer?.customerId ?? "",
    customerNumber: customer?.customerNumber ?? "",
    offerId: offer?.id ?? "",
    protocolNumber: protocolNumber(id, moveDate),
    status: "draft",
    serviceType: offer ? serviceTypeFromOffer(offer) : "move",
    moveDate,
    handoverAt: dateTimeInputValue(),
    customerName: customer?.name ?? offer?.planning.contactName ?? "",
    customerCompany: customer?.company ?? "",
    customerAddress: customer ? customerAddress(customer) : "",
    customerEmail: customer?.email ?? offer?.planning.contactEmail ?? "",
    contractor: { ...contractor },
    pickupAddress: offer?.planning.oldAddress ?? "",
    deliveryAddress: offer?.planning.newAddress ?? "",
    crewLeader: "",
    servicesCompleted: "notRecorded",
    inventoryDelivered: "notRecorded",
    visibleInspectionCompleted: "notRecorded",
    keysReturned: "notRecorded",
    siteLeftClean: "notRecorded",
    reservations: "",
    notes: offer?.planning.notes ?? "",
    issues: [],
    photos: offerPhotos(offer),
    accuracyConfirmed: false,
    customerSignature: emptySignature(),
    contractorSignature: emptySignature(),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeIssue(value: unknown): CrmHandoverIssue | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<CrmHandoverIssue>;
  const type = issueTypeOptions.some((option) => option.value === source.type)
    ? source.type
    : "other";
  return {
    id: typeof source.id === "string" && source.id ? source.id : crypto.randomUUID(),
    type: type as CrmHandoverIssueType,
    subject: typeof source.subject === "string" ? source.subject : "",
    description:
      typeof source.description === "string" ? source.description : "",
    actionTaken:
      typeof source.actionTaken === "string" ? source.actionTaken : "",
  };
}

function normalizePhoto(value: unknown): CrmHandoverPhoto | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<CrmHandoverPhoto>;
  if (typeof source.url !== "string" || !isAllowedPhotoUrl(source.url)) {
    return null;
  }
  const category = photoCategoryOptions.some(
    (option) => option.value === source.category
  )
    ? source.category
    : "other";
  return {
    id: typeof source.id === "string" && source.id ? source.id : crypto.randomUUID(),
    url: source.url,
    category: category as CrmHandoverPhotoCategory,
    caption: typeof source.caption === "string" ? source.caption : "",
  };
}

function normalizeSignature(value: unknown) {
  const source =
    value && typeof value === "object"
      ? (value as { name?: unknown; signedAt?: unknown; dataUrl?: unknown })
      : {};
  return {
    name: typeof source.name === "string" ? source.name : "",
    signedAt: typeof source.signedAt === "string" ? source.signedAt : "",
    dataUrl: typeof source.dataUrl === "string" ? source.dataUrl : "",
  };
}

function normalizeProtocol(
  value: CrmHandoverProtocol,
  documentId: string,
  ownerId: string,
  customers: CrmCustomer[],
  contractor: CrmHandoverContractor
) {
  const source = value as Partial<CrmHandoverProtocol>;
  const customer = customers.find((item) => item.id === source.customerId);
  const createdAt =
    typeof source.createdAt === "number" ? source.createdAt : Date.now();
  const id = source.id || documentId;
  const moveDate = source.moveDate || dateInputValue();
  const isFinalized =
    source.status === "finalized" || typeof source.finalizedAt === "number";
  return {
    id,
    ownerId,
    customerId: source.customerId ?? "",
    customerNumber:
      source.customerNumber ??
      customer?.customerNumber ??
      (customer ? createCustomerNumber(customer.id, customer.createdAt) : ""),
    offerId: source.offerId ?? "",
    protocolNumber: source.protocolNumber || protocolNumber(id, moveDate),
    status: isFinalized ? "finalized" : "draft",
    serviceType: source.serviceType === "seniorMove" ? "seniorMove" : "move",
    moveDate,
    handoverAt: normalizeDateTimeValue(source.handoverAt),
    customerName: source.customerName ?? customer?.name ?? "",
    customerCompany: source.customerCompany ?? customer?.company ?? "",
    customerAddress:
      source.customerAddress ?? (customer ? customerAddress(customer) : ""),
    customerEmail: source.customerEmail ?? customer?.email ?? "",
    contractor: mergeContractor(source.contractor, contractor),
    pickupAddress: source.pickupAddress ?? "",
    deliveryAddress: source.deliveryAddress ?? "",
    crewLeader: source.crewLeader ?? "",
    servicesCompleted: normalizeObservation(source.servicesCompleted),
    inventoryDelivered: normalizeObservation(source.inventoryDelivered),
    visibleInspectionCompleted: normalizeObservation(
      source.visibleInspectionCompleted
    ),
    keysReturned: normalizeObservation(source.keysReturned),
    siteLeftClean: normalizeObservation(source.siteLeftClean),
    reservations: source.reservations ?? "",
    notes: source.notes ?? "",
    issues: Array.isArray(source.issues)
      ? source.issues
          .map(normalizeIssue)
          .filter((issue): issue is CrmHandoverIssue => issue !== null)
      : [],
    photos: Array.isArray(source.photos)
      ? source.photos
          .map(normalizePhoto)
          .filter((photo): photo is CrmHandoverPhoto => photo !== null)
          .slice(0, MAX_PROTOCOL_PHOTOS)
      : [],
    accuracyConfirmed: Boolean(source.accuracyConfirmed),
    customerSignature: normalizeSignature(source.customerSignature),
    contractorSignature: normalizeSignature(source.contractorSignature),
    finalizedAt: isFinalized
      ? source.finalizedAt ?? source.updatedAt ?? createdAt
      : undefined,
    createdAt,
    updatedAt:
      typeof source.updatedAt === "number" ? source.updatedAt : createdAt,
  } satisfies CrmHandoverProtocol;
}

function cloneProtocol(protocol: CrmHandoverProtocol) {
  return {
    ...protocol,
    contractor: { ...protocol.contractor },
    issues: protocol.issues.map((issue) => ({ ...issue })),
    photos: protocol.photos.map((photo) => ({ ...photo })),
    customerSignature: { ...protocol.customerSignature },
    contractorSignature: { ...protocol.contractorSignature },
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && dateInputValue(parsed) === value;
}

function isValidDateTime(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/
  );
  if (!match) return false;
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue] =
    match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue ?? "0");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59 &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function isSignatureDataUrl(value: string) {
  return (
    value.length >= 200 &&
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value)
  );
}

function serializedProtocolSize(protocol: CrmHandoverProtocol) {
  return new Blob([
    JSON.stringify(sanitizeForFirestore(protocol)),
  ]).size;
}

function getCustomerAddressParts(value: string) {
  const parts = value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const postalPartIndex = parts.findIndex((part) => /\b\d{5}\b/.test(part));
  const postalPart = postalPartIndex >= 0 ? parts[postalPartIndex] : "";
  const localityOnPostalLine = postalPart.replace(/^.*?\b\d{5}\b/, "").trim();
  const countryPartIndex = parts.findIndex((part) => /^deutschland$/i.test(part));
  const localityAfterPostalCode =
    postalPartIndex >= 0
      ? parts
          .slice(
            postalPartIndex + 1,
            countryPartIndex >= 0 ? countryPartIndex : parts.length
          )
          .find((part) => !/^deutschland$/i.test(part))
      : undefined;

  return {
    hasStreet:
      postalPartIndex > 0 &&
      parts
        .slice(0, postalPartIndex)
        .some((part) => !/^deutschland$/i.test(part)),
    hasPostalCode: /\b\d{5}\b/.test(postalPart),
    hasCity: Boolean(localityOnPostalLine || localityAfterPostalCode),
    hasCountry: countryPartIndex >= 0,
  };
}

function getValidationIssues(
  protocol: CrmHandoverProtocol,
  availableOffers: OfferSnapshot[] = []
) {
  const issues: string[] = [];
  const validateLinkedOffer = arguments.length > 1;
  if (!protocol.customerId.trim()) issues.push("Kunde ist nicht ausgewählt.");
  if (!protocol.customerName.trim()) issues.push("Kundenname fehlt.");
  if (!protocol.customerNumber.trim()) issues.push("Kundennummer fehlt.");
  const customerAddressParts = getCustomerAddressParts(
    protocol.customerAddress
  );
  if (!customerAddressParts.hasStreet) {
    issues.push("Kundenanschrift: Straße oder Adresszeile fehlt.");
  }
  if (!customerAddressParts.hasPostalCode) {
    issues.push(
      "Kundenanschrift: Gültige deutsche Postleitzahl mit fünf Ziffern fehlt."
    );
  }
  if (!customerAddressParts.hasCity) {
    issues.push("Kundenanschrift: Ort fehlt.");
  }
  if (!customerAddressParts.hasCountry) {
    issues.push("Kundenanschrift: Deutschland fehlt.");
  }
  if (!protocol.offerId.trim()) {
    issues.push("Umzugsangebot ist nicht ausgewählt.");
  } else if (validateLinkedOffer) {
    const linkedOffer = availableOffers.find(
      (offer) => offer.id === protocol.offerId && isMoveOffer(offer)
    );
    if (!linkedOffer) {
      issues.push("Das ausgewählte Umzugsangebot ist nicht mehr verfügbar.");
    } else {
      if (
        linkedOffer.customerId &&
        linkedOffer.customerId !== protocol.customerId
      ) {
        issues.push("Das ausgewählte Umzugsangebot gehört nicht zum Kunden.");
      }
      if (protocol.serviceType !== serviceTypeFromOffer(linkedOffer)) {
        issues.push(
          "Die Leistungsart stimmt nicht mit dem ausgewählten Umzugsangebot überein."
        );
      }
    }
  }
  if (protocol.serviceType !== "move" && protocol.serviceType !== "seniorMove") {
    issues.push("Leistungsart muss Umzug oder Seniorenumzug sein.");
  }
  if (!isValidDate(protocol.moveDate)) issues.push("Gültiges Umzugsdatum fehlt.");
  if (!isValidDateTime(protocol.handoverAt)) {
    issues.push("Gültiger Übergabezeitpunkt fehlt.");
  }
  if (!protocol.pickupAddress.trim()) issues.push("Abholadresse fehlt.");
  if (!protocol.deliveryAddress.trim()) issues.push("Zieladresse fehlt.");
  if (!protocol.crewLeader.trim()) issues.push("Teamleitung fehlt.");
  if (!protocol.contractor.companyName.trim()) {
    issues.push("Auftragnehmer: Firmenname fehlt.");
  }
  if (!protocol.contractor.proprietor.trim()) {
    issues.push("Auftragnehmer: Inhaberin oder Inhaber fehlt.");
  }
  if (!protocol.contractor.legalForm.trim()) {
    issues.push("Auftragnehmer: Rechtsform fehlt.");
  }
  if (!protocol.contractor.street.trim()) {
    issues.push("Auftragnehmer: Straße fehlt.");
  }
  if (!protocol.contractor.postalCode.trim()) {
    issues.push("Auftragnehmer: Postleitzahl fehlt.");
  }
  if (!protocol.contractor.city.trim()) {
    issues.push("Auftragnehmer: Ort fehlt.");
  }
  if (!protocol.contractor.country.trim()) {
    issues.push("Auftragnehmer: Land fehlt.");
  }

  completionFields.forEach((field) => {
    if (protocol[field.key] === "notRecorded") {
      issues.push(`${field.label}: Status ist noch nicht erfasst.`);
    }
  });
  const hasNotConfirmedObservation = completionFields.some(
    (field) => protocol[field.key] === "notConfirmed"
  );
  const hasCompleteIssue = protocol.issues.some(
    (issue) => issue.subject.trim() && issue.description.trim()
  );
  if (
    hasNotConfirmedObservation &&
    !hasCompleteIssue &&
    !protocol.reservations.trim()
  ) {
    issues.push(
      "Bei einer nicht bestätigten Feststellung ist eine vollständige Abweichung oder ein Vorbehalt erforderlich."
    );
  }
  protocol.issues.forEach((issue, index) => {
    if (!issue.subject.trim()) {
      issues.push(`Abweichung ${index + 1}: Gegenstand oder Ort fehlt.`);
    }
    if (!issue.description.trim()) {
      issues.push(`Abweichung ${index + 1}: Feststellung fehlt.`);
    }
  });
  protocol.photos.forEach((photo, index) => {
    if (!photo.caption.trim()) {
      issues.push(`Foto ${index + 1}: Bildunterschrift fehlt.`);
    }
  });
  if (protocol.photos.length > MAX_PROTOCOL_PHOTOS) {
    issues.push(`Es sind höchstens ${MAX_PROTOCOL_PHOTOS} Protokollfotos erlaubt.`);
  }
  if (serializedProtocolSize(protocol) > MAX_PROTOCOL_SIZE_BYTES) {
    issues.push(
      "Das Protokoll ist größer als 900.000 Byte. Bitte Fotos, Unterschriften oder Notizen reduzieren."
    );
  }
  if (!protocol.accuracyConfirmed) {
    issues.push("Bestätigung der aufgenommenen Angaben fehlt.");
  }
  if (!protocol.customerSignature.name.trim()) {
    issues.push("Name der Kundin oder des Kunden bei der Unterschrift fehlt.");
  }
  if (!isSignatureDataUrl(protocol.customerSignature.dataUrl)) {
    issues.push("Unterschrift der Kundin oder des Kunden fehlt oder ist ungültig.");
  }
  if (!isValidDateTime(protocol.customerSignature.signedAt)) {
    issues.push("Gültiger Zeitpunkt der Kundenunterschrift fehlt.");
  }
  if (!protocol.contractorSignature.name.trim()) {
    issues.push("Name der Auftragnehmervertretung bei der Unterschrift fehlt.");
  }
  if (!isSignatureDataUrl(protocol.contractorSignature.dataUrl)) {
    issues.push("Unterschrift der Auftragnehmervertretung fehlt oder ist ungültig.");
  }
  if (!isValidDateTime(protocol.contractorSignature.signedAt)) {
    issues.push("Gültiger Zeitpunkt der Auftragnehmerunterschrift fehlt.");
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

function safePrintPhotoUrl(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return escapeHtml(parsed.href);
  } catch {
    return "";
  }
}

function safePrintSignatureUrl(value: string) {
  return isSignatureDataUrl(value) ? escapeHtml(value) : "";
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Nicht angegeben"
    : parsed.toLocaleDateString("de-DE");
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Nicht angegeben"
    : parsed.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof ClipboardCheck;
  title: string;
}) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
      <Icon size={17} className="text-blue-700" />
      {title}
    </h3>
  );
}

export default function HandoverProtocolManager() {
  const { companyData } = useCompanyData();
  const searchParams = useSearchParams();
  const requestedCustomerId = searchParams.get("customerId");
  const requestedOfferId = searchParams.get("offerId");
  const [protocols, setProtocols] = useState<CrmHandoverProtocol[]>([]);
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [offers, setOffers] = useState<OfferSnapshot[]>([]);
  const [contractor, setContractor] = useState<CrmHandoverContractor>({
    ...DEFAULT_CONTRACTOR,
  });
  const [draft, setDraft] = useState<CrmHandoverProtocol | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const deferredSearch = useDeferredValue(
    search.trim().toLocaleLowerCase("de-DE")
  );

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function load(companyId: string) {
      setIsLoading(true);
      try {
        const [protocolSnapshot, customerSnapshot, offerSnapshot, settingsSnapshot] =
          await Promise.all([
            getDocs(
              query(
                collection(database, PROTOCOL_COLLECTION),
                where("ownerId", "==", companyId)
              )
            ),
            getDocs(
              query(
                collection(database, CUSTOMER_COLLECTION),
                where("ownerId", "==", companyId)
              )
            ),
            getDoc(doc(database, OFFER_COLLECTION, companyId)),
            getDoc(doc(database, INVOICE_SETTINGS_COLLECTION, companyId)),
          ]);
        if (!active) return;

        const settings = settingsSnapshot.data() as StoredInvoiceSettings | undefined;
        const loadedContractor =
          !settings?.ownerId || settings.ownerId === companyId
            ? mergeContractor(settings?.issuer)
            : { ...DEFAULT_CONTRACTOR };
        const loadedCustomers = customerSnapshot.docs
          .filter((item) => item.data().ownerId === companyId)
          .map((item) => normalizeCustomer(item.data() as CrmCustomer, item.id));
        const storedOffers: unknown[] = (
          Array.isArray(offerSnapshot.data()?.savedCalculations)
            ? offerSnapshot.data()?.savedCalculations
            : []
        ) as unknown[];
        const loadedOffers = storedOffers
          .map(normalizeOffer)
          .filter((offer): offer is OfferSnapshot => offer !== null)
          .filter(isMoveOffer)
          .sort((left, right) => right.createdAt - left.createdAt);
        const loadedProtocols = protocolSnapshot.docs
          .filter((item) => item.data().ownerId === companyId)
          .map((item) =>
            normalizeProtocol(
              item.data() as CrmHandoverProtocol,
              item.id,
              companyId,
              loadedCustomers,
              loadedContractor
            )
          )
          .sort((left, right) => right.createdAt - left.createdAt);

        setContractor(loadedContractor);
        setCustomers(loadedCustomers);
        setOffers(loadedOffers);
        setProtocols(loadedProtocols);

        const requestedCustomer = loadedCustomers.find(
          (customer) => customer.id === requestedCustomerId
        );
        const requestedOffer = loadedOffers.find(
          (offer) =>
            offer.id === requestedOfferId &&
            (!requestedCustomerId || offer.customerId === requestedCustomerId)
        );
        const offerCustomer = loadedCustomers.find(
          (customer) => customer.id === requestedOffer?.customerId
        );

        if (requestedOffer) {
          setDraft(
            createProtocolDraft(
              companyId,
              loadedContractor,
              requestedCustomer ?? offerCustomer,
              requestedOffer
            )
          );
        } else if (requestedCustomer) {
          setDraft(
            createProtocolDraft(
              companyId,
              loadedContractor,
              requestedCustomer
            )
          );
        } else {
          setDraft(loadedProtocols[0] ? cloneProtocol(loadedProtocols[0]) : null);
        }
      } catch {
        if (active) {
          setFeedback({
            type: "error",
            message: "Übergabeprotokolle konnten nicht geladen werden.",
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

  const filteredProtocols = protocols.filter((protocol) =>
    [
      protocol.protocolNumber,
      protocol.customerNumber,
      protocol.customerName,
      protocol.customerCompany,
      protocol.pickupAddress,
      protocol.deliveryAddress,
    ]
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(deferredSearch)
  );
  const draftIsFinalized = draft?.status === "finalized";
  const validationIssues = draft ? getValidationIssues(draft, offers) : [];

  function updateDraft(
    patch: Partial<CrmHandoverProtocol>,
    options: { preserveSignatures?: boolean } = {}
  ) {
    if (draftIsFinalized) return;
    setDraft((current) => {
      if (!current) return current;
      const hasSignatureData = Boolean(
        current.customerSignature.dataUrl ||
          current.contractorSignature.dataUrl
      );
      return {
        ...current,
        ...(!options.preserveSignatures && hasSignatureData
          ? {
              customerSignature: emptySignature(),
              contractorSignature: emptySignature(),
              accuracyConfirmed: false,
            }
          : {}),
        ...patch,
      };
    });
    setFeedback(null);
  }

  function updateProtocolList(protocol: CrmHandoverProtocol) {
    setProtocols((current) =>
      [protocol, ...current.filter((item) => item.id !== protocol.id)].sort(
        (left, right) => right.createdAt - left.createdAt
      )
    );
    setDraft(cloneProtocol(protocol));
  }

  function startNewProtocol() {
    if (!companyData?.id) return;
    setDraft(createProtocolDraft(companyData.id, contractor));
    setFeedback(null);
  }

  function selectCustomer(customerId: string) {
    if (!draft || draftIsFinalized) return;
    const customer = customers.find((item) => item.id === customerId);
    updateDraft({
      customerId,
      customerNumber: customer?.customerNumber ?? "",
      offerId: "",
      customerName: customer?.name ?? "",
      customerCompany: customer?.company ?? "",
      customerAddress: customer ? customerAddress(customer) : "",
      customerEmail: customer?.email ?? "",
    });
  }

  function selectOffer(offerId: string) {
    if (!draft || draftIsFinalized) return;
    if (!offerId) {
      updateDraft({ offerId: "" });
      return;
    }
    const offer = offers.find((item) => item.id === offerId);
    if (!offer || !isMoveOffer(offer)) return;
    const customer = customers.find((item) => item.id === offer.customerId);
    updateDraft({
      offerId: offer.id,
      serviceType: serviceTypeFromOffer(offer),
      moveDate: isValidDate(offer.planning.date)
        ? offer.planning.date
        : draft.moveDate,
      pickupAddress: offer.planning.oldAddress,
      deliveryAddress: offer.planning.newAddress,
      notes: offer.planning.notes,
      photos: offerPhotos(offer),
      customerId: customer?.id ?? offer.customerId ?? "",
      customerNumber: customer?.customerNumber ?? "",
      customerName: customer?.name ?? offer.planning.contactName,
      customerCompany: customer?.company ?? "",
      customerAddress: customer ? customerAddress(customer) : "",
      customerEmail: customer?.email ?? offer.planning.contactEmail,
    });
  }

  function addIssue() {
    if (!draft || draftIsFinalized) return;
    updateDraft({
      issues: [
        ...draft.issues,
        {
          id: crypto.randomUUID(),
          type: "other",
          subject: "",
          description: "",
          actionTaken: "",
        },
      ],
    });
  }

  function updateIssue(id: string, patch: Partial<CrmHandoverIssue>) {
    if (!draft || draftIsFinalized) return;
    updateDraft({
      issues: draft.issues.map((issue) =>
        issue.id === id ? { ...issue, ...patch } : issue
      ),
    });
  }

  function removeIssue(id: string) {
    if (!draft || draftIsFinalized) return;
    updateDraft({ issues: draft.issues.filter((issue) => issue.id !== id) });
  }

  function appendPhotos(selection: string | string[]) {
    if (!draft || draftIsFinalized) return;
    const selectedUrls = (Array.isArray(selection) ? selection : [selection]).filter(
      isAllowedPhotoUrl
    );
    const currentUrls = new Set(draft.photos.map((photo) => photo.url));
    const eligibleUrls = Array.from(new Set(selectedUrls)).filter(
      (url) => !currentUrls.has(url)
    );
    const remainingSlots = Math.max(
      0,
      MAX_PROTOCOL_PHOTOS - draft.photos.length
    );
    const addedPhotos = eligibleUrls
      .slice(0, remainingSlots)
      .map<CrmHandoverPhoto>((url) => ({
        id: crypto.randomUUID(),
        url,
        category: "other",
        caption: "",
      }));
    if (addedPhotos.length > 0) {
      updateDraft({ photos: [...draft.photos, ...addedPhotos] });
    }
    if (eligibleUrls.length > remainingSlots) {
      setFeedback({
        type: "error",
        message: `Es sind höchstens ${MAX_PROTOCOL_PHOTOS} Protokollfotos erlaubt. Überzählige Fotos wurden nicht hinzugefügt.`,
      });
    }
  }

  function updatePhoto(id: string, patch: Partial<CrmHandoverPhoto>) {
    if (!draft || draftIsFinalized) return;
    updateDraft({
      photos: draft.photos.map((photo) =>
        photo.id === id ? { ...photo, ...patch } : photo
      ),
    });
  }

  function removePhoto(id: string) {
    if (!draft || draftIsFinalized) return;
    updateDraft({ photos: draft.photos.filter((photo) => photo.id !== id) });
  }

  function updateSignature(
    key: "customerSignature" | "contractorSignature",
    patch: Partial<CrmHandoverProtocol[typeof key]>
  ) {
    if (!draft || draftIsFinalized) return;
    setDraft((current) => {
      if (!current) return current;
      const currentSignature = current[key];
      const nameChanged =
        patch.name !== undefined && patch.name !== currentSignature.name;
      const dataChanged =
        patch.dataUrl !== undefined &&
        patch.dataUrl !== currentSignature.dataUrl;
      const clearChangedSignature = nameChanged && Boolean(currentSignature.dataUrl);
      return {
        ...current,
        [key]: {
          ...currentSignature,
          ...patch,
          ...(clearChangedSignature ? { dataUrl: "", signedAt: "" } : {}),
        },
        accuracyConfirmed:
          clearChangedSignature || dataChanged
            ? false
            : current.accuracyConfirmed,
      };
    });
    setFeedback(null);
  }

  function changeSignatureData(
    key: "customerSignature" | "contractorSignature",
    dataUrl: string
  ) {
    updateSignature(key, {
      dataUrl,
      signedAt: dataUrl ? new Date().toISOString() : "",
    });
  }

  async function writeMutableProtocol(
    ownerId: string,
    protocol: CrmHandoverProtocol
  ) {
    const protocolReference = doc(database, PROTOCOL_COLLECTION, protocol.id);
    await runTransaction(database, async (transaction) => {
      const persistedSnapshot = await transaction.get(protocolReference);
      if (persistedSnapshot.exists()) {
        const persisted =
          persistedSnapshot.data() as Partial<CrmHandoverProtocol>;
        if (persisted.ownerId !== ownerId) {
          throw new Error("owner-scope");
        }
        if (persisted.status === "finalized" || persisted.finalizedAt) {
          throw new Error("finalized");
        }
      }
      transaction.set(protocolReference, sanitizeForFirestore(protocol));
    });
  }

  async function saveDraft() {
    const ownerId = companyData?.id;
    if (!draft || !ownerId || draftIsFinalized) return;
    setIsSaving(true);
    try {
      const nextProtocol: CrmHandoverProtocol = {
        ...draft,
        ownerId,
        status: "draft",
        finalizedAt: undefined,
        updatedAt: Date.now(),
      };
      await writeMutableProtocol(ownerId, nextProtocol);
      updateProtocolList(nextProtocol);
      setFeedback({ type: "saved", message: "Entwurf gespeichert." });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error && error.message === "finalized"
            ? "Das Protokoll wurde bereits finalisiert und nicht überschrieben."
            : "Entwurf konnte nicht gespeichert werden.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function finalizeProtocol() {
    const ownerId = companyData?.id;
    if (!draft || !ownerId || draftIsFinalized) return;
    const currentIssues = getValidationIssues(draft, offers);
    if (currentIssues.length > 0) {
      setFeedback({
        type: "error",
        message: "Finalisierung erst nach Ergänzung aller Pflichtangaben möglich.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const immutableSnapshot: CrmHandoverProtocol = {
        ...draft,
        ownerId,
        status: "finalized",
        finalizedAt: now,
        updatedAt: now,
      };
      await writeMutableProtocol(ownerId, immutableSnapshot);
      updateProtocolList(immutableSnapshot);
      setFeedback({ type: "saved", message: "Protokoll finalisiert." });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error && error.message === "finalized"
            ? "Das Protokoll wurde bereits finalisiert."
            : "Protokoll konnte nicht finalisiert werden.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function printProtocol() {
    if (!draft) return;
    const protocol = draft;
    const issues = getValidationIssues(protocol, offers);
    const printAsDraft = protocol.status !== "finalized" || issues.length > 0;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setFeedback({
        type: "error",
        message: "Das Druckfenster wurde vom Browser blockiert.",
      });
      return;
    }

    const contractorName = [
      protocol.contractor.companyName,
      protocol.contractor.proprietor,
      protocol.contractor.legalForm,
    ]
      .filter((value) => value.trim())
      .map(safeText)
      .join("<br>");
    const contractorAddress = [
      protocol.contractor.street,
      `${protocol.contractor.postalCode} ${protocol.contractor.city}`.trim(),
      protocol.contractor.country,
    ]
      .filter((value) => value.trim())
      .map(safeText)
      .join("<br>");
    const customerNames = [protocol.customerCompany, protocol.customerName]
      .filter((value) => value.trim())
      .map(safeText)
      .join("<br>");
    const completionRows = completionFields
      .map(
        (field) =>
          `<tr><td>${safeText(field.label)}</td><td class="answer">${safeText(
            observationLabel(protocol[field.key])
          )}</td></tr>`
      )
      .join("");
    const issueRows =
      protocol.issues.length > 0
        ? protocol.issues
            .map(
              (issue, index) =>
                `<tr><td>${safeText(index + 1)}</td><td>${safeText(
                  issueTypeOptions.find((option) => option.value === issue.type)
                    ?.label ?? "Sonstige Abweichung"
                )}</td><td><strong>${safeText(issue.subject)}</strong><br>${safeMultiline(
                  issue.description
                )}</td><td>${safeMultiline(issue.actionTaken || "Nicht angegeben")}</td></tr>`
            )
            .join("")
        : '<tr><td colspan="4">Keine Abweichungen aufgenommen.</td></tr>';
    const photoCards = protocol.photos
      .map((photo) => {
        const photoUrl = safePrintPhotoUrl(photo.url);
        if (!photoUrl) return "";
        const category =
          photoCategoryOptions.find((option) => option.value === photo.category)
            ?.label ?? "Sonstiges";
        return `<figure><img src="${photoUrl}" alt="${safeText(
          photo.caption
        )}"><figcaption><strong>${safeText(category)}</strong><br>${safeText(
          photo.caption || "Ohne Bildunterschrift"
        )}</figcaption></figure>`;
      })
      .filter(Boolean)
      .join("");
    const customerSignatureUrl = safePrintSignatureUrl(
      protocol.customerSignature.dataUrl
    );
    const contractorSignatureUrl = safePrintSignatureUrl(
      protocol.contractorSignature.dataUrl
    );
    const draftBanner = printAsDraft
      ? '<div class="draft-banner">ENTWURF - NICHT ALS ÜBERGABEPROTOKOLL VERWENDEN</div>'
      : "";
    const hasImages = Boolean(
      photoCards || customerSignatureUrl || contractorSignatureUrl
    );

    printWindow.document.write(`<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${safeText(protocol.protocolNumber || "Übergabeprotokoll")}</title>
  <style>
    @page{margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172554;font:9.5pt Arial,sans-serif;line-height:1.45}.document{max-width:190mm;margin:auto}.draft-banner{margin-bottom:12px;border:2px solid #b45309;background:#fff7ed;padding:9px;color:#92400e;font-size:10pt;font-weight:700;text-align:center}.sender{padding-bottom:6px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:8pt}.header{display:flex;justify-content:space-between;gap:24px;margin:20px 0}.eyebrow{margin:0;color:#c45f18;font-size:8pt;font-weight:700;text-transform:uppercase}h1{margin:3px 0;color:#0f2b54;font-size:23pt}h2{margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid #c45f18;color:#0f2b54;font-size:13pt}.number{font-size:11pt;font-weight:700}.party-grid,.route-grid,.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.party{padding:11px;border:1px solid #e2e8f0}.label{color:#64748b;font-size:8pt;text-transform:uppercase}.meta{display:grid;grid-template-columns:repeat(4,auto);gap:5px 15px;padding:10px;background:#f8fafc}.meta span:nth-child(odd){color:#64748b}.meta span:nth-child(even){font-weight:700}.route{min-height:30mm;padding:10px;border-left:3px solid #c45f18;background:#fff7ed}table{width:100%;border-collapse:collapse}th{padding:7px;border-bottom:2px solid #c45f18;color:#475569;font-size:8pt;text-align:left;text-transform:uppercase}td{padding:7px;border-bottom:1px solid #e2e8f0;vertical-align:top}.answer{width:18mm;font-weight:700}.notes{padding:10px;border:1px solid #e2e8f0;white-space:normal}.photo-section{break-before:page}.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10mm 8mm}figure{break-inside:avoid;margin:0}figure img{display:block;width:100%;height:75mm;object-fit:contain;border:1px solid #cbd5e1;background:#f8fafc}figcaption{padding:5px 0;font-size:8.5pt}.declaration{margin-top:20px;padding:12px;border-left:4px solid #0f2b54;background:#f8fafc}.signature{break-inside:avoid;margin-top:16px}.signature img{display:block;width:100%;height:35mm;object-fit:contain;border-bottom:1px solid #334155}.signature-space{height:35mm;border-bottom:1px solid #334155}.footer{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:28px;padding-top:9px;border-top:1px solid #cbd5e1;color:#475569;font-size:8pt}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style>
</head>
<body>
  <main class="document">
    ${draftBanner}
    <div class="sender">${safeText(protocol.contractor.companyName)} · ${safeText(
      protocol.contractor.street
    )} · ${safeText(
      `${protocol.contractor.postalCode} ${protocol.contractor.city}`.trim()
    )}</div>
    <section class="header">
      <div><p class="eyebrow">Dokumentation der Übergabe</p><h1>Übergabeprotokoll</h1><p class="number">${safeText(
        protocol.protocolNumber || "Ohne Nummer"
      )}</p></div>
      <div><span class="label">Umzugsdatum</span><br><strong>${safeText(
        formatDate(protocol.moveDate)
      )}</strong><br><br><span class="label">Übergabe</span><br><strong>${safeText(
        formatDateTime(protocol.handoverAt)
      )}</strong></div>
    </section>
    <section class="meta">
      <span>Protokollnummer</span><span>${safeText(protocol.protocolNumber)}</span>
      <span>Kundennummer</span><span>${safeText(protocol.customerNumber || "Nicht angegeben")}</span>
      <span>Leistungsart</span><span>${protocol.serviceType === "seniorMove" ? "Seniorenumzug" : "Umzug"}</span>
      <span>Teamleitung</span><span>${safeText(protocol.crewLeader || "Nicht angegeben")}</span>
    </section>
    <h2>Vertragsparteien</h2>
    <section class="party-grid">
      <div class="party"><span class="label">Auftraggeber / Kunde</span><p><strong>${
        customerNames || "Nicht angegeben"
      }</strong><br>${safeMultiline(protocol.customerAddress || "Nicht angegeben")}<br>${safeText(
        protocol.customerEmail
      )}</p></div>
      <div class="party"><span class="label">Auftragnehmer</span><p><strong>${contractorName}</strong><br>${contractorAddress}<br>${safeText(
        protocol.contractor.email
      )}<br>${safeText(protocol.contractor.phone)}</p></div>
    </section>
    <h2>Route</h2>
    <section class="route-grid">
      <div class="route"><span class="label">Abholort</span><p>${safeMultiline(
        protocol.pickupAddress || "Nicht angegeben"
      )}</p></div>
      <div class="route"><span class="label">Zielort</span><p>${safeMultiline(
        protocol.deliveryAddress || "Nicht angegeben"
      )}</p></div>
    </section>
    <h2>Feststellungen zur Durchführung</h2>
    <table><tbody>${completionRows}</tbody></table>
    <h2>Aufgenommene Abweichungen</h2>
    <table><thead><tr><th>Nr.</th><th>Art</th><th>Gegenstand / Feststellung</th><th>Maßnahme</th></tr></thead><tbody>${issueRows}</tbody></table>
    <h2>Vorbehalte und Notizen</h2>
    <div class="notes"><strong>Vorbehalte</strong><p>${safeMultiline(
      protocol.reservations || "Keine Vorbehalte aufgenommen."
    )}</p><strong>Weitere Notizen</strong><p>${safeMultiline(
      protocol.notes || "Keine weiteren Notizen aufgenommen."
    )}</p></div>
    ${
      photoCards
        ? `<section class="photo-section"><h2>Fotodokumentation</h2><div class="photo-grid">${photoCards}</div></section>`
        : ""
    }
    <section class="declaration"><strong>Erklärung</strong><p>${safeText(
      DECLARATION_TEXT
    )}</p></section>
    <section class="signature-grid">
      <div class="signature"><span class="label">Kundin / Kunde</span>${
        customerSignatureUrl
          ? `<img src="${customerSignatureUrl}" alt="Unterschrift Kundin oder Kunde">`
          : '<div class="signature-space"></div>'
      }<p><strong>${safeText(
        protocol.customerSignature.name || "Name nicht angegeben"
      )}</strong><br>${safeText(
        protocol.customerSignature.signedAt
          ? formatDateTime(protocol.customerSignature.signedAt)
          : "Nicht unterzeichnet"
      )}</p></div>
      <div class="signature"><span class="label">Auftragnehmervertretung</span>${
        contractorSignatureUrl
          ? `<img src="${contractorSignatureUrl}" alt="Unterschrift Auftragnehmervertretung">`
          : '<div class="signature-space"></div>'
      }<p><strong>${safeText(
        protocol.contractorSignature.name || "Name nicht angegeben"
      )}</strong><br>${safeText(
        protocol.contractorSignature.signedAt
          ? formatDateTime(protocol.contractorSignature.signedAt)
          : "Nicht unterzeichnet"
      )}</p></div>
    </section>
    <footer class="footer">
      <div><strong>${safeText(protocol.contractor.companyName)}</strong><br>${safeText(
        protocol.contractor.proprietor
      )}<br>${safeText(protocol.contractor.legalForm)}</div>
      <div>${safeText(protocol.contractor.street)}<br>${safeText(
        `${protocol.contractor.postalCode} ${protocol.contractor.city}`.trim()
      )}<br>${safeText(protocol.contractor.country)}</div>
      <div>${safeText(protocol.contractor.email)}<br>${safeText(
        protocol.contractor.phone
      )}</div>
    </footer>
  </main>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), hasImages ? 1500 : 300);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={17} />
        Übergabeprotokolle werden geladen ...
      </div>
    );
  }

  return (
    <main className="pb-4">
      <header className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            CRM & Auftragsabschluss
          </p>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Übergabeprotokolle
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Feststellungen, Abweichungen, Fotos und Unterschriften zur Übergabe erfassen.
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
          <Button onClick={startNewProtocol}>
            <FilePlus2 /> Neues Protokoll
          </Button>
        </div>
      </header>

      <div className="grid min-h-[760px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:grid-cols-[310px_minmax(0,1fr)]">
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
                placeholder="Protokoll suchen ..."
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <div className="max-h-[680px] divide-y divide-slate-200 overflow-y-auto">
            {filteredProtocols.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Noch keine Übergabeprotokolle gespeichert.
              </p>
            ) : (
              filteredProtocols.map((protocol) => (
                <button
                  key={protocol.id}
                  type="button"
                  onClick={() => {
                    setDraft(cloneProtocol(protocol));
                    setFeedback(null);
                  }}
                  className={`w-full px-4 py-4 text-left hover:bg-white ${
                    draft?.id === protocol.id
                      ? "bg-blue-50 shadow-[inset_3px_0_0_#2563eb]"
                      : ""
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-950">
                      {protocol.protocolNumber}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        protocol.status === "finalized"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {protocol.status === "finalized" ? "Finalisiert" : "Entwurf"}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {protocol.customerCompany ||
                      protocol.customerName ||
                      "Ohne Kunde"}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-slate-700">
                    {formatDate(protocol.moveDate)} · {protocol.customerNumber || "Keine Kundennr."}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {draft ? (
          <section className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {draft.protocolNumber}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {draftIsFinalized
                    ? "Finalisierter, unveränderlicher Übergabesnapshot"
                    : "Bearbeitbarer Entwurf des Übergabeprotokolls"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={printProtocol}>
                  <Printer /> Drucken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void saveDraft()}
                  disabled={isSaving || draftIsFinalized}
                >
                  {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
                  Entwurf speichern
                </Button>
                <Button
                  onClick={() => void finalizeProtocol()}
                  disabled={isSaving || draftIsFinalized || validationIssues.length > 0}
                >
                  <ShieldCheck /> Finalisieren
                </Button>
              </div>
            </div>

            <div className="mb-5 grid border-y border-slate-200 bg-slate-50/60 lg:grid-cols-[1fr_1fr_1.15fr] lg:divide-x lg:divide-slate-200">
              <section className="p-4">
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  Auftraggeber
                </h3>
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
              <section className="border-t border-slate-200 p-4 lg:border-t-0">
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  Auftragnehmer
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {draft.contractor.companyName}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                  {[
                    draft.contractor.proprietor,
                    draft.contractor.legalForm,
                    draft.contractor.street,
                    `${draft.contractor.postalCode} ${draft.contractor.city}`.trim(),
                    draft.contractor.country,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </p>
              </section>
              <section className="border-t border-slate-200 p-4 lg:border-t-0">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                  {validationIssues.length > 0 && (
                    <AlertTriangle size={14} className="text-amber-600" />
                  )}
                  Finalisierungsprüfung
                </h3>
                {validationIssues.length > 0 ? (
                  <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs leading-4 text-amber-800">
                    {validationIssues.map((issue) => (
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

            <div className="space-y-6">
              <section className="border-b border-slate-200 pb-6">
                <SectionHeading icon={ClipboardCheck} title="Protokolldaten" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700">
                    Protokollnummer
                    <input
                      value={draft.protocolNumber}
                      readOnly
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Leistungsart
                    <select
                      value={draft.serviceType}
                      onChange={(event) =>
                        updateDraft({
                          serviceType: event.target.value as "move" | "seniorMove",
                        })
                      }
                      disabled={draftIsFinalized}
                      className={inputClassName}
                    >
                      <option value="move">Umzug</option>
                      <option value="seniorMove">Seniorenumzug</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Umzugsdatum
                    <input
                      type="date"
                      value={draft.moveDate}
                      onChange={(event) => updateDraft({ moveDate: event.target.value })}
                      disabled={draftIsFinalized}
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Übergabezeitpunkt
                    <input
                      type="datetime-local"
                      value={draft.handoverAt}
                      onChange={(event) =>
                        updateDraft({ handoverAt: event.target.value })
                      }
                      disabled={draftIsFinalized}
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Kunde
                    <select
                      value={draft.customerId}
                      onChange={(event) => selectCustomer(event.target.value)}
                      disabled={draftIsFinalized}
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
                  <label className="text-sm font-medium text-slate-700">
                    Umzugsangebot
                    <select
                      value={draft.offerId}
                      onChange={(event) => selectOffer(event.target.value)}
                      disabled={draftIsFinalized}
                      className={inputClassName}
                    >
                      <option value="">Angebot auswählen</option>
                      {offers.map((offer) => (
                        <option key={offer.id} value={offer.id}>
                          {offer.title || "Umzugsangebot"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                    Teamleitung vor Ort
                    <input
                      value={draft.crewLeader}
                      onChange={(event) =>
                        updateDraft({ crewLeader: event.target.value })
                      }
                      disabled={draftIsFinalized}
                      className={inputClassName}
                    />
                  </label>
                </div>
              </section>

              <section className="border-b border-slate-200 pb-6">
                <SectionHeading icon={MapPin} title="Route und Parteien" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Abholadresse
                    <textarea
                      value={draft.pickupAddress}
                      onChange={(event) =>
                        updateDraft({ pickupAddress: event.target.value })
                      }
                      disabled={draftIsFinalized}
                      className={textareaClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Zieladresse
                    <textarea
                      value={draft.deliveryAddress}
                      onChange={(event) =>
                        updateDraft({ deliveryAddress: event.target.value })
                      }
                      disabled={draftIsFinalized}
                      className={textareaClassName}
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="border-l-4 border-blue-700 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                      <UserRound size={15} /> Kunde
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {draft.customerCompany || draft.customerName || "Nicht ausgewählt"}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                      {draft.customerAddress || "Keine Anschrift"}
                      {draft.customerEmail ? `\n${draft.customerEmail}` : ""}
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-600 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                      <UsersRound size={15} /> Auftragnehmer
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {draft.contractor.companyName}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                      {draft.contractor.proprietor}
                      {`\n${draft.contractor.street}`}
                      {`\n${draft.contractor.postalCode} ${draft.contractor.city}`}
                      {`\n${draft.contractor.email}`}
                      {`\n${draft.contractor.phone}`}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-b border-slate-200 pb-6">
                <SectionHeading icon={Check} title="Feststellungen zur Durchführung" />
                <div className="grid gap-2">
                  {completionFields.map((field) => (
                    <label
                      key={field.key}
                      className="grid w-full gap-2 border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] sm:items-center"
                    >
                      <span>{field.label}</span>
                      <select
                        value={draft[field.key]}
                        onChange={(event) =>
                          updateDraft({
                            [field.key]: event.target
                              .value as CrmHandoverObservation,
                          })
                        }
                        disabled={draftIsFinalized}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        {observationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>

              <section className="border-b border-slate-200 pb-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <SectionHeading icon={AlertTriangle} title="Abweichungen und Schäden" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIssue}
                    disabled={draftIsFinalized}
                  >
                    <Plus /> Abweichung hinzufügen
                  </Button>
                </div>
                {draft.issues.length === 0 ? (
                  <p className="border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Keine Abweichungen aufgenommen.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {draft.issues.map((issue, index) => (
                      <div
                        key={issue.id}
                        className="rounded-md border border-slate-200 bg-slate-50/40 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-950">
                            Abweichung {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Abweichung entfernen"
                            onClick={() => removeIssue(issue.id)}
                            disabled={draftIsFinalized}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="text-sm font-medium text-slate-700">
                            Art
                            <select
                              value={issue.type}
                              onChange={(event) =>
                                updateIssue(issue.id, {
                                  type: event.target.value as CrmHandoverIssueType,
                                })
                              }
                              disabled={draftIsFinalized}
                              className={inputClassName}
                            >
                              {issueTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Gegenstand, Ort oder Objekt *
                            <input
                              value={issue.subject}
                              onChange={(event) =>
                                updateIssue(issue.id, { subject: event.target.value })
                              }
                              disabled={draftIsFinalized}
                              className={inputClassName}
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Beschreibung / Feststellung *
                            <textarea
                              value={issue.description}
                              onChange={(event) =>
                                updateIssue(issue.id, {
                                  description: event.target.value,
                                })
                              }
                              disabled={draftIsFinalized}
                              className={textareaClassName}
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Aufgenommene Maßnahme
                            <textarea
                              value={issue.actionTaken}
                              onChange={(event) =>
                                updateIssue(issue.id, {
                                  actionTaken: event.target.value,
                                })
                              }
                              disabled={draftIsFinalized}
                              className={textareaClassName}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="border-b border-slate-200 pb-6">
                <SectionHeading icon={ClipboardCheck} title="Vorbehalte und Notizen" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Vorbehalte
                    <textarea
                      value={draft.reservations}
                      onChange={(event) =>
                        updateDraft({ reservations: event.target.value })
                      }
                      disabled={draftIsFinalized}
                      className={textareaClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Weitere Notizen
                    <textarea
                      value={draft.notes}
                      onChange={(event) => updateDraft({ notes: event.target.value })}
                      disabled={draftIsFinalized}
                      className={textareaClassName}
                    />
                  </label>
                </div>
              </section>

              <section className="border-b border-slate-200 pb-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <SectionHeading icon={ImagePlus} title="Fotodokumentation" />
                  {!draftIsFinalized && (
                    <MediathekDialog
                      btnName="Fotos auswählen"
                      multiSelect
                      onSelect={appendPhotos}
                    />
                  )}
                </div>
                {draft.photos.length === 0 ? (
                  <p className="border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Keine Fotos ausgewählt.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {draft.photos.map((photo) => (
                      <article
                        key={photo.id}
                        className="overflow-hidden rounded-md border border-slate-200 bg-white"
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          <Image
                            src={photo.url}
                            alt={photo.caption || "Protokollfoto"}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3 p-3">
                          <label className="text-xs font-medium text-slate-700">
                            Kategorie
                            <select
                              value={photo.category}
                              onChange={(event) =>
                                updatePhoto(photo.id, {
                                  category: event.target
                                    .value as CrmHandoverPhotoCategory,
                                })
                              }
                              disabled={draftIsFinalized}
                              className={inputClassName}
                            >
                              {photoCategoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-medium text-slate-700">
                            Bildunterschrift *
                            <input
                              value={photo.caption}
                              onChange={(event) =>
                                updatePhoto(photo.id, { caption: event.target.value })
                              }
                              disabled={draftIsFinalized}
                              className={inputClassName}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhoto(photo.id)}
                            disabled={draftIsFinalized}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <Trash2 /> Foto entfernen
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="border-b border-slate-200 pb-6">
                <SectionHeading icon={UserRound} title="Unterschriften" />
                <p className="mb-4 flex items-start gap-2 border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  Spätere Änderungen am Protokoll machen vorhandene Unterschriften ungültig und entfernen sie.
                </p>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Name Kundin / Kunde
                      <input
                        value={draft.customerSignature.name}
                        onChange={(event) =>
                          updateSignature("customerSignature", {
                            name: event.target.value,
                          })
                        }
                        disabled={draftIsFinalized}
                        className={inputClassName}
                      />
                    </label>
                    <div className="mt-4">
                      <SignaturePadField
                        label="Unterschrift Kundin / Kunde"
                        value={draft.customerSignature.dataUrl}
                        onChange={(value) =>
                          changeSignatureData("customerSignature", value)
                        }
                        disabled={draftIsFinalized}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Name Auftragnehmervertretung
                      <input
                        value={draft.contractorSignature.name}
                        onChange={(event) =>
                          updateSignature("contractorSignature", {
                            name: event.target.value,
                          })
                        }
                        disabled={draftIsFinalized}
                        className={inputClassName}
                      />
                    </label>
                    <div className="mt-4">
                      <SignaturePadField
                        label="Unterschrift Auftragnehmervertretung"
                        value={draft.contractorSignature.dataUrl}
                        onChange={(value) =>
                          changeSignatureData("contractorSignature", value)
                        }
                        disabled={draftIsFinalized}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <Checkbox
                    checked={draft.accuracyConfirmed}
                    onCheckedChange={(checked) =>
                      updateDraft(
                        { accuracyConfirmed: checked === true },
                        { preserveSignatures: true }
                      )
                    }
                    disabled={draftIsFinalized}
                    className="mt-1"
                  />
                  <span>{DECLARATION_TEXT}</span>
                </label>
                <p className="text-xs text-slate-500">
                  Das Protokoll verbessert Dokumentation und Beweissicherung, ist aber keine Rechtsberatung.
                </p>
              </section>
            </div>
          </section>
        ) : (
          <section className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center">
            <ClipboardCheck size={34} className="text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Noch kein Protokoll ausgewählt
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Erstelle ein neues Übergabeprotokoll oder wähle einen gespeicherten Eintrag aus.
            </p>
            <Button className="mt-5" onClick={startNewProtocol}>
              <FilePlus2 /> Neues Protokoll
            </Button>
          </section>
        )}
      </div>
    </main>
  );
}