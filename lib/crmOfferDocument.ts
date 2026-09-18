export type CrmOfferRates = {
  employeeHourlyRate?: number;
  kilometerRate?: number;
  planningFee?: number;
  surchargePercent?: number;
  vatPercent?: number;
};

export type CrmOfferPlanning = {
  serviceTypes?: string[];
  scopeDescription?: string;
  date?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  oldAddress?: string;
  newAddress?: string;
  oldFloor?: string;
  newFloor?: string;
  oldElevator?: boolean;
  newElevator?: boolean;
  carryDistanceM?: number;
  oldCarryDistanceM?: number;
  newCarryDistanceM?: number;
  moveTrips?: number;
  dismantlingHours?: number;
  specialItemCount?: number;
  careHours?: number;
  furnitureLiftRequired?: boolean;
  parkingRequired?: boolean;
  livingAreaM2?: number;
  paintAreaM2?: number;
  ceilingAreaM2?: number;
  paintCoats?: number;
  repairAreaM2?: number;
  plasterAreaM2?: number;
  wallpaperEnabled?: boolean;
  wallpaperAreaMode?: "allWalls" | "custom";
  wallpaperAreaM2?: number;
  removeOldWallpaper?: boolean;
  paintWallpaper?: boolean;
  paintColors?: Array<{
    id?: string;
    name?: string;
    areaMode?: "remaining" | "custom";
    areaM2?: number;
    coats?: number;
  }>;
  furniturePieces?: number;
  movingBoxes?: number;
  unpackingBoxes?: number;
  fragileItemCount?: number;
  storageVolumeM3?: number;
  storageMonths?: number;
  disposalVolumeM3?: number;
  clearanceHeavyItems?: number;
  clearanceDisposalIncluded?: boolean;
  clearanceHazardousVolumeM3?: number;
  clearanceContainerCount?: number;
  clearanceBroomClean?: boolean;
  notes?: string;
  vehicleSelections?: Array<{ vehicleId: string; quantity: number }>;
  extraServices?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  rooms?: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      volumeM3: number;
    }>;
  }>;
};

export type CrmOfferDocument = {
  id: string;
  customerId?: string;
  title: string;
  createdAt: number;
  offerNumber?: string;
  validUntil?: string;
  paymentTerms?: string;
  grossTotal?: number;
  employees?: number;
  hoursPerEmployee?: number;
  kilometers?: number;
  vehicleDays?: number;
  materialCost?: number;
  disposalCost?: number;
  storageCost?: number;
  logisticsCost?: number;
  otherCost?: number;
  discountPercent?: number;
  packageName?: string;
  rates?: CrmOfferRates;
  planning?: CrmOfferPlanning;
};

export type CrmOfferCustomer = {
  name: string;
  company?: string;
  customerNumber?: string;
  email?: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
};

export const OFFER_ISSUER = {
  companyName: "Umzugshelden",
  proprietor: "Muhammed Ali Güngör",
  legalForm: "Einzelunternehmen",
  street: "In der Trift 1",
  postalCode: "57489",
  city: "Drolshagen",
  country: "Deutschland",
  email: "info@umzugshelden.io",
  phone: "+49 151 68567708",
  website: "https://umzugshelden.io",
} as const;

export const DEFAULT_OFFER_PAYMENT_TERMS =
  "Zahlbar unmittelbar nach Leistungserbringung, sofern nichts anderes vereinbart wurde.";

export type OfferScopeItem = {
  title: string;
  details: string[];
};

const serviceLabels: Record<string, string> = {
  move: "Umzug",
  seniorMove: "Seniorenumzug",
  clearance: "Entrümpelung",
  painting: "Anstricharbeiten",
  furnitureAssembly: "Möbelmontage",
  packing: "Einpackservice",
  storage: "Einlagerung",
};

const vehicleOptions: Record<string, { name: string; dailyRate: number }> = {
  transporter: { name: "Sprinter", dailyRate: 120 },
  "truck-3-5t": { name: "3,5-t Koffer", dailyRate: 95 },
  "truck-7-5t": { name: "7,5-t LKW", dailyRate: 165 },
  "truck-12t": { name: "12-t LKW", dailyRate: 235 },
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function safeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCurrency(value: number) {
  return currencyFormatter.format(safeNumber(value));
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

function offerNumber(offer: CrmOfferDocument) {
  return offer.offerNumber?.trim() || `ANG-${offer.id.slice(0, 8).toUpperCase()}`;
}

function formatInputDate(value: string | undefined) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return dateFormatter.format(new Date(year, month - 1, day));
}

function defaultValidUntil(createdAt: number) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 14);
  return dateFormatter.format(date);
}

function planningVolume(planning: CrmOfferPlanning) {
  return (planning.rooms ?? []).reduce(
    (total, room) =>
      total +
      room.items.reduce(
        (roomTotal, item) =>
          roomTotal + safeNumber(item.quantity) * safeNumber(item.volumeM3),
        0
      ),
    0
  );
}

function formatCoats(coats: number) {
  const roundedCoats = Math.max(1, Math.round(coats));
  return `${formatNumber(roundedCoats)} ${roundedCoats === 1 ? "Anstrich" : "Anstriche"}`;
}

function createPaintScopeDetails(
  planning: CrmOfferPlanning,
  totalPaintArea: number
) {
  if (totalPaintArea <= 0) return [];

  const colors = planning.paintColors ?? [];
  if (colors.length === 0) {
    const coats = Math.max(1, Math.round(safeNumber(planning.paintCoats) || 1));
    return [
      `Zu streichende Fläche: ${formatNumber(totalPaintArea)} m² mit ${formatCoats(coats)}.`,
    ];
  }

  const fixedArea = colors.reduce(
    (total, color) =>
      color.areaMode === "custom" ? total + safeNumber(color.areaM2) : total,
    0
  );
  const remainingArea = Math.max(0, totalPaintArea - fixedArea);
  let remainingAssigned = false;
  const areasByCoats = new Map<number, number>();

  for (const color of colors) {
    const area =
      color.areaMode === "custom"
        ? safeNumber(color.areaM2)
        : !remainingAssigned
          ? remainingArea
          : 0;
    if (color.areaMode !== "custom" && !remainingAssigned) {
      remainingAssigned = true;
    }
    if (area <= 0) continue;
    const coats = Math.max(1, Math.round(safeNumber(color.coats) || 1));
    areasByCoats.set(coats, (areasByCoats.get(coats) ?? 0) + area);
  }

  if (areasByCoats.size === 0) {
    return [`Zu streichende Fläche: ${formatNumber(totalPaintArea)} m².`];
  }

  return [
    `Zu streichende Fläche: ${[...areasByCoats.entries()]
      .map(([coats, area]) => `${formatNumber(area)} m² mit ${formatCoats(coats)}`)
      .join(", ")}.`,
  ];
}

export function createOfferScopeItems(
  planning: CrmOfferPlanning
): OfferScopeItem[] {
  const volume = planningVolume(planning);
  const items = (planning.serviceTypes ?? []).map((service): OfferScopeItem => {
    switch (service) {
      case "move":
      case "seniorMove":
        return {
          title: service === "seniorMove" ? "Seniorenumzug" : "Umzug",
          details: [
            "Be- und Entladen sowie Transport des erfassten Umzugsguts zwischen den angegebenen Adressen.",
            ...(volume > 0 ? [`Umzugsvolumen laut Inventar: ${formatNumber(volume)} m³.`] : []),
            ...(safeNumber(planning.moveTrips) > 0
              ? [`Geplant: ${formatNumber(safeNumber(planning.moveTrips))} Fahrt(en).`]
              : []),
            ...(safeNumber(planning.dismantlingHours) > 0
              ? [`Demontage und Montage: ${formatNumber(safeNumber(planning.dismantlingHours))} Arbeitsstunden.`]
              : []),
            ...(safeNumber(planning.specialItemCount) > 0
              ? [`Transport von ${formatNumber(safeNumber(planning.specialItemCount))} erfassten Spezialgegenstand/-gegenständen.`]
              : []),
            ...(service === "seniorMove" && safeNumber(planning.careHours) > 0
              ? [`Betreuung und Organisation: ${formatNumber(safeNumber(planning.careHours))} Arbeitsstunden.`]
              : []),
          ],
        };
      case "clearance":
        return {
          title: "Entrümpelung",
          details: [
            "Räumen der erfassten Flächen und Abtransport des angegebenen Räumguts.",
            ...(safeNumber(planning.disposalVolumeM3) > 0
              ? [`Erfasstes Räumungsvolumen: ${formatNumber(safeNumber(planning.disposalVolumeM3))} m³.`]
              : []),
            planning.clearanceDisposalIncluded === false
              ? "Entsorgungsgebühren und Entsorgung sind nicht enthalten."
              : "Fachgerechte Entsorgung einschließlich der kalkulierten Gebühren ist enthalten.",
            ...(safeNumber(planning.clearanceHazardousVolumeM3) > 0
              ? [`Problemstoffe/Sondermüll: ${formatNumber(safeNumber(planning.clearanceHazardousVolumeM3))} m³.`]
              : []),
            ...(safeNumber(planning.clearanceContainerCount) > 0
              ? [`Bereitstellung von ${formatNumber(safeNumber(planning.clearanceContainerCount))} Container(n).`]
              : []),
            ...(planning.clearanceBroomClean ? ["Besenreine Übergabe der geräumten Flächen."] : []),
          ],
        };
      case "painting": {
        const wallpaperArea = planning.wallpaperEnabled
          ? planning.wallpaperAreaMode === "allWalls"
            ? safeNumber(planning.paintAreaM2)
            : safeNumber(planning.wallpaperAreaM2)
          : 0;
        const paintedWallArea = Math.max(
          0,
          safeNumber(planning.paintAreaM2) -
            (planning.wallpaperEnabled && !planning.paintWallpaper
              ? wallpaperArea
              : 0)
        );
        const totalPaintArea =
          paintedWallArea + safeNumber(planning.ceilingAreaM2);
        const repairArea =
          safeNumber(planning.repairAreaM2) + safeNumber(planning.plasterAreaM2);
        return {
          title: "Anstricharbeiten",
          details: [
            "Vorbereitung und Anstrich der erfassten Wand- und Deckenflächen.",
            ...createPaintScopeDetails(planning, totalPaintArea),
            ...(repairArea > 0
              ? [`Spachtel- und Ausbesserungsarbeiten auf ${formatNumber(repairArea)} m².`]
              : []),
            ...(planning.wallpaperEnabled
              ? [`Tapezierarbeiten${wallpaperArea > 0 ? ` auf ${formatNumber(wallpaperArea)} m²` : ""}${planning.removeOldWallpaper ? " einschließlich Entfernung der vorhandenen Tapete" : ""}.`]
              : []),
          ],
        };
      }
      case "furnitureAssembly":
        return {
          title: "Möbelmontage",
          details: [
            "Fachgerechte Demontage und/oder Montage der vereinbarten Möbelstücke.",
            ...(safeNumber(planning.furniturePieces) > 0
              ? [`Umfang: ${formatNumber(safeNumber(planning.furniturePieces))} Möbelteil(e).`]
              : []),
          ],
        };
      case "packing":
        return {
          title: "Ein- und Auspackservice",
          details: [
            "Sicheres Verpacken des vereinbarten Hausrats in geeignete Umzugskartons.",
            ...(safeNumber(planning.movingBoxes) > 0
              ? [`Einpacken: ${formatNumber(safeNumber(planning.movingBoxes))} Karton(s).`]
              : []),
            ...(safeNumber(planning.unpackingBoxes) > 0
              ? [`Auspacken: ${formatNumber(safeNumber(planning.unpackingBoxes))} Karton(s).`]
              : []),
            ...(safeNumber(planning.fragileItemCount) > 0
              ? [`Gesonderte Verpackung von ${formatNumber(safeNumber(planning.fragileItemCount))} empfindlichen Gegenstand/Gegenständen.`]
              : []),
          ],
        };
      case "storage":
        return {
          title: "Einlagerung",
          details: [
            "Einlagerung des erfassten Umzugsguts im vereinbarten Umfang.",
            ...(safeNumber(planning.storageVolumeM3) > 0
              ? [`Lagervolumen: ${formatNumber(safeNumber(planning.storageVolumeM3))} m³.`]
              : []),
            ...(safeNumber(planning.storageMonths) > 0
              ? [`Lagerdauer: ${formatNumber(safeNumber(planning.storageMonths))} Monat(e).`]
              : []),
          ],
        };
      default:
        return {
          title: serviceLabels[service] ?? service,
          details: ["Ausführung gemäß der erfassten Angebotsplanung."],
        };
    }
  });

  for (const service of planning.extraServices ?? []) {
    if (!service.name.trim() || safeNumber(service.quantity) <= 0) continue;
    items.push({
      title: service.name.trim(),
      details: [`Zusatzleistung, Menge: ${formatNumber(service.quantity)}.`],
    });
  }

  return items;
}

function sanitizeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function createOfferPdfFilename(offer: CrmOfferDocument) {
  const title = sanitizeFilePart(offer.title || offerNumber(offer));
  return `Angebot-${title || offerNumber(offer)}.pdf`;
}

export function createOfferDocumentHtml(
  offer: CrmOfferDocument,
  customer: CrmOfferCustomer
) {
  const rates = offer.rates ?? {};
  const planning = offer.planning ?? {};
  const employeeHourlyRate = safeNumber(rates.employeeHourlyRate);
  const employees = safeNumber(offer.employees);
  const hoursPerEmployee = safeNumber(offer.hoursPerEmployee);
  const vehicleDays = safeNumber(offer.vehicleDays);
  const kilometers = safeNumber(offer.kilometers);
  const rows: Array<{ label: string; formula: string; value: number }> = [];

  const employeeCost = employees * hoursPerEmployee * employeeHourlyRate;
  if (employeeCost > 0) {
    rows.push({
      label: "Personal",
      formula: `${formatNumber(employees)} Mitarbeiter × ${formatNumber(hoursPerEmployee)} Std. × ${formatCurrency(employeeHourlyRate)}`,
      value: employeeCost,
    });
  }

  for (const selection of planning.vehicleSelections ?? []) {
    const vehicle = vehicleOptions[selection.vehicleId];
    if (!vehicle || selection.quantity <= 0 || vehicleDays <= 0) continue;
    rows.push({
      label: vehicle.name,
      formula: `${formatNumber(selection.quantity)} Fahrzeug(e) × ${formatNumber(vehicleDays)} Tag(e) × ${formatCurrency(vehicle.dailyRate)}`,
      value: selection.quantity * vehicleDays * vehicle.dailyRate,
    });
  }

  const mileageCost = kilometers * safeNumber(rates.kilometerRate);
  if (mileageCost > 0) {
    rows.push({
      label: "Fahrtstrecke",
      formula: `${formatNumber(kilometers)} km × ${formatCurrency(safeNumber(rates.kilometerRate))}`,
      value: mileageCost,
    });
  }

  const planningFee = safeNumber(rates.planningFee);
  if (planningFee > 0) {
    rows.push({ label: "Planungs- & Auftragspauschale", formula: "Festbetrag", value: planningFee });
  }

  const costRows: Array<[string, number | undefined]> = [
    ["Material", offer.materialCost],
    ["Entsorgung", offer.disposalCost],
    ["Einlagerung", offer.storageCost],
    ["Lift & Halteverbotszone", offer.logisticsCost],
    ["Weitere Kosten", offer.otherCost],
  ];
  for (const [label, amount] of costRows) {
    const value = safeNumber(amount);
    if (value > 0) rows.push({ label, formula: "Laut Angebotsplanung", value });
  }

  for (const service of planning.extraServices ?? []) {
    const value = safeNumber(service.quantity) * safeNumber(service.unitPrice);
    if (value <= 0) continue;
    rows.push({
      label: service.name || "Zusatzleistung",
      formula: `${formatNumber(service.quantity)} × ${formatCurrency(service.unitPrice)}`,
      value,
    });
  }

  const directCost = rows.reduce((total, row) => total + row.value, 0);
  const surchargePercent = safeNumber(rates.surchargePercent);
  const surcharge = directCost * (surchargePercent / 100);
  const discountPercent = Math.min(100, Math.max(0, safeNumber(offer.discountPercent)));
  const discount = (directCost + surcharge) * (discountPercent / 100);
  const netTotal = directCost + surcharge - discount;
  const vatPercent = safeNumber(rates.vatPercent);
  const vat = netTotal * (vatPercent / 100);
  const grossTotal = netTotal + vat;
  const services = (planning.serviceTypes ?? [])
    .map((service) => serviceLabels[service] ?? service)
    .join(", ");
  const customerAddress = [
    customer.street,
    `${customer.postalCode ?? ""} ${customer.city ?? ""}`.trim(),
  ]
    .filter(Boolean)
    .join("<br />");
  const scopeItems = createOfferScopeItems(planning);
  const scopeHtml = `<h2>Leistungsumfang</h2>${planning.scopeDescription?.trim() ? `<div class="scope-description">${escapeHtml(planning.scopeDescription.trim()).replaceAll("\n", "<br>")}</div>` : ""}<div class="scope-list">${scopeItems.length ? scopeItems
    .map(
      (item) => `<section class="scope-item"><h3>${escapeHtml(item.title)}</h3><ul>${item.details
        .map((detail) => `<li>${escapeHtml(detail)}</li>`)
        .join("")}</ul></section>`
    )
    .join("") : '<p class="muted">Der konkrete Leistungsumfang wurde noch nicht festgelegt.</p>'}</div>`;
  const costRowsHtml = rows
    .map(
      (row) => `<tr><td><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.formula)}</span></td><td>${formatCurrency(row.value)}</td></tr>`
    )
    .join("");
  const rooms = (planning.rooms ?? []).filter((room) => room.items?.length);
  const volume = rooms.reduce(
    (total, room) =>
      total +
      room.items.reduce(
        (roomTotal, item) =>
          roomTotal + safeNumber(item.quantity) * safeNumber(item.volumeM3),
        0
      ),
    0
  );
  const inventoryHtml = rooms.length
    ? `<h2>Packliste / Inventar</h2><div class="volume"><span>Gesamtvolumen</span><strong>${formatNumber(volume)} m³</strong></div>${rooms
        .map(
          (room) => `<section class="room"><h3>${escapeHtml(room.name || "Raum")}</h3><table><thead><tr><th>Gegenstand</th><th>Menge</th><th>Volumen</th></tr></thead><tbody>${room.items
            .map(
              (item) => `<tr><td>${escapeHtml(item.name || "Gegenstand")}</td><td>${formatNumber(item.quantity)}</td><td>${formatNumber(item.quantity * item.volumeM3)} m³</td></tr>`
            )
            .join("")}</tbody></table></section>`
        )
        .join("")}`
    : "";

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Angebot ${escapeHtml(offerNumber(offer))}</title>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #17315c; font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.45; }
.document { width: 100%; }
.header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 4px solid #e87722; padding-bottom: 17px; }
.brand { color: #0d2650; font-size: 24pt; font-weight: 700; }
.document-type { margin-top: 3px; color: #e87722; font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.meta { min-width: 48mm; border: 1px solid #dbe1ea; padding: 10px 12px; color: #62728c; font-size: 8.5pt; text-align: right; }
.meta strong { display: block; margin-top: 3px; color: #0d2650; font-size: 10pt; }
h1 { margin: 22px 0 12px; color: #0d2650; font-size: 22pt; }
h2 { margin: 24px 0 10px; color: #0d2650; font-size: 14pt; }
h3 { margin: 0 0 7px; color: #0d2650; font-size: 10.5pt; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 13px; }
.card { border: 1px solid #dbe1ea; padding: 13px; break-inside: avoid; }
.label { margin: 0 0 6px; color: #e87722; font-size: 8pt; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; }
.muted { margin-top: 5px; color: #62728c; }
.sender { margin-top: 9px; color: #62728c; font-size: 8pt; }
.scope-description { margin-bottom: 10px; border-left: 4px solid #e87722; background: #fff8f2; padding: 10px 12px; color: #334155; }
.scope-list { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.scope-item { border: 1px solid #dbe1ea; padding: 10px 12px; break-inside: avoid; }
.scope-item ul { margin: 0; padding-left: 16px; color: #52647f; }
.scope-item li + li { margin-top: 3px; }
table { width: 100%; border-collapse: collapse; }
th { border-bottom: 2px solid #e87722; padding: 7px; color: #0d2650; font-size: 8pt; text-align: left; text-transform: uppercase; }
th:last-child, td:last-child { text-align: right; }
td { border-bottom: 1px solid #e8edf3; padding: 8px 7px; vertical-align: top; }
td strong { display: block; color: #0d2650; }
td span { display: block; margin-top: 2px; color: #62728c; font-size: 8.5pt; }
td:last-child { width: 35mm; font-weight: 700; white-space: nowrap; }
.totals { width: 92mm; margin: 16px 0 0 auto; border: 1px solid #dbe1ea; padding: 11px 13px; break-inside: avoid; }
.total-row { display: flex; justify-content: space-between; gap: 15px; padding: 4px 0; color: #52647f; }
.total-row strong { color: #0d2650; white-space: nowrap; }
.net { margin-top: 5px; border-top: 1px solid #dbe1ea; padding-top: 8px; font-weight: 700; }
.gross { margin: 8px -13px -11px; background: #0d2650; padding: 12px 13px; color: white; font-size: 11pt; font-weight: 700; }
.gross strong { color: white; font-size: 13pt; }
.notice, .notes, .terms { margin-top: 20px; border-left: 4px solid #e87722; background: #fff8f2; padding: 11px 13px; color: #52647f; }
.terms p { margin: 0 0 5px; }
.terms p:last-child { margin-bottom: 0; }
.volume { display: flex; justify-content: space-between; margin-bottom: 12px; background: #0d2650; padding: 10px 13px; color: white; }
.room { margin-bottom: 15px; break-inside: avoid; }
.footer { display: flex; justify-content: space-between; gap: 18px; margin-top: 27px; border-top: 1px solid #dbe1ea; padding-top: 10px; color: #62728c; font-size: 8pt; }
tr, .header, .card, .totals { break-inside: avoid; }
</style></head><body><main class="document">
<header class="header"><div><div class="brand">Umzugshelden</div><div class="document-type">Angebot · Kostenvoranschlag</div><div class="sender">${escapeHtml(OFFER_ISSUER.proprietor)} · ${escapeHtml(OFFER_ISSUER.street)} · ${escapeHtml(`${OFFER_ISSUER.postalCode} ${OFFER_ISSUER.city}`)}</div></div><div class="meta">Angebotsnummer<strong>${escapeHtml(offerNumber(offer))}</strong>Erstellt am<strong>${formatDate(offer.createdAt)}</strong>Gültig bis<strong>${offer.validUntil ? escapeHtml(formatInputDate(offer.validUntil)) : defaultValidUntil(offer.createdAt)}</strong></div></header>
<h1>${escapeHtml(offer.title || "Ihr persönliches Angebot")}</h1>
<section class="grid"><div class="card"><p class="label">Kunde</p><strong>${escapeHtml(customer.company || customer.name)}</strong>${customer.company ? `<div class="muted">${escapeHtml(customer.name)}</div>` : ""}<div class="muted">${customerAddress || "Adresse nicht angegeben"}<br>${escapeHtml(customer.email || "E-Mail nicht angegeben")}<br>${escapeHtml(customer.phone || "Telefon nicht angegeben")}${customer.customerNumber ? `<br>Kundennummer: ${escapeHtml(customer.customerNumber)}` : ""}</div></div><div class="card"><p class="label">Projekt</p><strong>${escapeHtml(services || "Leistung nach Vereinbarung")}</strong><div class="muted">Wunschtermin: ${escapeHtml(planning.date || "noch offen")}${offer.packageName ? `<br>Paket: ${escapeHtml(offer.packageName)}` : ""}</div></div></section>
${planning.oldAddress || planning.newAddress ? `<section class="grid"><div class="card"><p class="label">Auszug / Einsatzort</p><strong>${escapeHtml(planning.oldAddress || "Nicht angegeben")}</strong><div class="muted">Etage: ${escapeHtml(planning.oldFloor || "-")} · Aufzug: ${planning.oldElevator ? "vorhanden" : "nicht vorhanden"}</div></div><div class="card"><p class="label">Einzug / Zielort</p><strong>${escapeHtml(planning.newAddress || "Nicht angegeben")}</strong><div class="muted">Etage: ${escapeHtml(planning.newFloor || "-")} · Aufzug: ${planning.newElevator ? "vorhanden" : "nicht vorhanden"}</div></div></section>` : ""}
${scopeHtml}
<h2>Leistungen und Kosten</h2><table><thead><tr><th>Position / Berechnung</th><th>Betrag</th></tr></thead><tbody>${costRowsHtml || '<tr><td>Leistung nach Vereinbarung</td><td>-</td></tr>'}</tbody></table>
<section class="totals"><div class="total-row"><span>Direkte Kosten</span><strong>${formatCurrency(directCost)}</strong></div><div class="total-row"><span>Aufschlag (${formatNumber(surchargePercent)} %)</span><strong>${formatCurrency(surcharge)}</strong></div>${discount > 0 ? `<div class="total-row"><span>Rabatt (${formatNumber(discountPercent)} %)</span><strong>-${formatCurrency(discount)}</strong></div>` : ""}<div class="total-row net"><span>Nettosumme</span><strong>${formatCurrency(netTotal)}</strong></div><div class="total-row"><span>MwSt. (${formatNumber(vatPercent)} %)</span><strong>${formatCurrency(vat)}</strong></div><div class="total-row gross"><span>Gesamtbetrag brutto</span><strong>${formatCurrency(grossTotal)}</strong></div></section>
${inventoryHtml}${planning.notes ? `<div class="notes"><strong>Hinweise zur Ausführung:</strong><br>${escapeHtml(planning.notes).replaceAll("\n", "<br>")}</div>` : ""}
<div class="terms"><p><strong>Zahlungsbedingung:</strong> ${escapeHtml(offer.paymentTerms?.trim() || DEFAULT_OFFER_PAYMENT_TERMS)}</p><p><strong>Vertragsschluss:</strong> Dieses Angebot ist freibleibend. Ein Vertrag kommt durch unsere Auftragsbestätigung oder den Beginn der Leistungserbringung zustande.</p><p><strong>Grundlage:</strong> Es gelten unsere AGB unter umzugshelden.io/agb.</p></div>
<div class="notice"><strong>Unverbindlicher Kostenanschlag:</strong> Die Kalkulation basiert auf den aktuell erfassten Angaben. Wird eine wesentliche Überschreitung erwartet, informieren wir den Auftraggeber unverzüglich (§ 649 BGB). Änderungen oder Zusatzleistungen werden nur nach Abstimmung ausgeführt und gesondert berechnet.</div>
<footer class="footer"><span>${escapeHtml(OFFER_ISSUER.companyName)} · ${escapeHtml(OFFER_ISSUER.proprietor)} · ${escapeHtml(OFFER_ISSUER.legalForm)}<br>${escapeHtml(OFFER_ISSUER.street)} · ${escapeHtml(`${OFFER_ISSUER.postalCode} ${OFFER_ISSUER.city}`)} · ${escapeHtml(OFFER_ISSUER.country)}</span><span>${escapeHtml(OFFER_ISSUER.phone)}<br>${escapeHtml(OFFER_ISSUER.email)} · umzugshelden.io</span></footer>
</main></body></html>`;
}