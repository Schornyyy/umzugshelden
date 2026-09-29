import type {
  CrmHandoverObservation,
  CrmHandoverProtocol,
} from "@/types/Crm";

export const HANDOVER_DECLARATION_TEXT =
  "Dieses Protokoll dokumentiert den bei der Übergabe gemeinsam festgestellten, äußerlich erkennbaren Zustand und die aufgenommenen Abweichungen. Die Unterzeichnung bestätigt die Richtigkeit der aufgenommenen Angaben und den Erhalt einer Ausfertigung. Sie beinhaltet keinen Verzicht auf gesetzliche Rechte oder Ansprüche; verdeckte Schäden bleiben vorbehalten.";

export const HANDOVER_COMPLETION_FIELDS: Array<{
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

const observationLabels: Record<CrmHandoverObservation, string> = {
  notRecorded: "Nicht erfasst",
  confirmed: "Bestätigt",
  notConfirmed: "Nicht bestätigt / abweichend",
  notApplicable: "Nicht zutreffend",
};

const issueTypeLabels = {
  preexisting: "Vorbestehender Zustand",
  transportDamage: "Transportschaden",
  propertyDamage: "Sachschaden am Objekt",
  missing: "Fehlteil",
  other: "Sonstige Abweichung",
};

const photoCategoryLabels = {
  pickup: "Abholort",
  delivery: "Zielort",
  damage: "Schaden / Abweichung",
  other: "Sonstiges",
};

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function multiline(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Nicht angegeben"
    : date.toLocaleDateString("de-DE");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Nicht angegeben"
    : date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function isHandoverSignatureDataUrl(value: string) {
  return (
    value.length >= 200 &&
    value.length <= 700_000 &&
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value)
  );
}

export function isHandoverDateTime(value: string) {
  const date = new Date(value);
  return Boolean(value) && !Number.isNaN(date.getTime());
}

function getAddressIssues(value: string) {
  const parts = value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const postalPartIndex = parts.findIndex((part) => /\b\d{5}\b/.test(part));
  const postalPart = postalPartIndex >= 0 ? parts[postalPartIndex] : "";
  const city = postalPart.replace(/^.*?\b\d{5}\b/, "").trim();
  const issues: string[] = [];
  if (postalPartIndex <= 0) issues.push("Kundenanschrift: Straße fehlt.");
  if (!/\b\d{5}\b/.test(postalPart)) {
    issues.push("Kundenanschrift: gültige Postleitzahl fehlt.");
  }
  if (!city && postalPartIndex === parts.length - 1) {
    issues.push("Kundenanschrift: Ort fehlt.");
  }
  return issues;
}

function getBaseProtocolIssues(protocol: CrmHandoverProtocol) {
  const issues: string[] = [];
  if (!protocol.id.trim()) issues.push("Protokoll-ID fehlt.");
  if (!protocol.customerId.trim()) issues.push("Kunde ist nicht ausgewählt.");
  if (!protocol.customerName.trim()) issues.push("Kundenname fehlt.");
  if (!protocol.customerNumber.trim()) issues.push("Kundennummer fehlt.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(protocol.customerEmail.trim())) {
    issues.push("Gültige Kunden-E-Mail-Adresse fehlt.");
  }
  issues.push(...getAddressIssues(protocol.customerAddress));
  if (!protocol.offerId.trim()) issues.push("Umzugsangebot ist nicht ausgewählt.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(protocol.moveDate)) {
    issues.push("Gültiges Umzugsdatum fehlt.");
  }
  if (!isHandoverDateTime(protocol.handoverAt)) {
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
  if (!protocol.contractor.street.trim()) {
    issues.push("Auftragnehmer: Straße fehlt.");
  }
  if (!protocol.contractor.postalCode.trim() || !protocol.contractor.city.trim()) {
    issues.push("Auftragnehmer: Postleitzahl oder Ort fehlt.");
  }
  protocol.issues.forEach((issue, index) => {
    if (!issue.subject.trim() || !issue.description.trim()) {
      issues.push(`Abweichung ${index + 1} ist nicht vollständig.`);
    }
  });
  protocol.photos.forEach((photo, index) => {
    if (!photo.caption.trim()) {
      issues.push(`Foto ${index + 1}: Bildunterschrift fehlt.`);
    }
  });
  return issues;
}

export function getHandoverShareIssues(protocol: CrmHandoverProtocol) {
  const issues = getBaseProtocolIssues(protocol);
  if (!protocol.contractorSignature.name.trim()) {
    issues.push("Name der Auftragnehmervertretung bei der Unterschrift fehlt.");
  }
  if (!isHandoverSignatureDataUrl(protocol.contractorSignature.dataUrl)) {
    issues.push("Unterschrift der Auftragnehmervertretung fehlt oder ist ungültig.");
  }
  if (!isHandoverDateTime(protocol.contractorSignature.signedAt)) {
    issues.push("Zeitpunkt der Auftragnehmerunterschrift fehlt.");
  }
  return issues;
}

export function getHandoverCompletionIssues(protocol: CrmHandoverProtocol) {
  const issues = getHandoverShareIssues(protocol);
  HANDOVER_COMPLETION_FIELDS.forEach((field) => {
    if (protocol[field.key] === "notRecorded") {
      issues.push(`${field.label}: Status ist noch nicht erfasst.`);
    }
  });
  const hasRejectedObservation = HANDOVER_COMPLETION_FIELDS.some(
    (field) => protocol[field.key] === "notConfirmed"
  );
  if (
    hasRejectedObservation &&
    !protocol.reservations.trim() &&
    !protocol.issues.some(
      (issue) => issue.subject.trim() && issue.description.trim()
    )
  ) {
    issues.push("Eine Abweichung oder ein Vorbehalt muss beschrieben werden.");
  }
  if (!protocol.accuracyConfirmed) {
    issues.push("Bestätigung der aufgenommenen Angaben fehlt.");
  }
  if (!protocol.customerSignature.name.trim()) {
    issues.push("Name der Kundin oder des Kunden fehlt.");
  }
  if (!isHandoverSignatureDataUrl(protocol.customerSignature.dataUrl)) {
    issues.push("Kundenunterschrift fehlt oder ist ungültig.");
  }
  if (!isHandoverDateTime(protocol.customerSignature.signedAt)) {
    issues.push("Zeitpunkt der Kundenunterschrift fehlt.");
  }
  return issues;
}

function printableImageUrl(value: string, baseUrl?: string) {
  try {
    const parsed = new URL(value, baseUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? escapeHtml(parsed.href)
      : "";
  } catch {
    return "";
  }
}

function sanitizeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function createHandoverPdfFilename(protocol: CrmHandoverProtocol) {
  return `Uebergabeprotokoll-${sanitizeFilePart(
    protocol.protocolNumber || protocol.id.slice(0, 8)
  )}.pdf`;
}

export function createHandoverDocumentHtml(
  protocol: CrmHandoverProtocol,
  options: { draft?: boolean; baseUrl?: string } = {}
) {
  const customerNames = [protocol.customerCompany, protocol.customerName]
    .filter((value) => value.trim())
    .map(escapeHtml)
    .join("<br>");
  const completionRows = HANDOVER_COMPLETION_FIELDS.map(
    (field) =>
      `<tr><td>${escapeHtml(field.label)}</td><td class="answer">${escapeHtml(
        observationLabels[protocol[field.key]]
      )}</td></tr>`
  ).join("");
  const issueRows = protocol.issues.length
    ? protocol.issues
        .map(
          (issue, index) =>
            `<tr><td>${index + 1}</td><td>${escapeHtml(
              issueTypeLabels[issue.type]
            )}</td><td><strong>${escapeHtml(issue.subject)}</strong><br>${multiline(
              issue.description
            )}</td><td>${multiline(issue.actionTaken || "Nicht angegeben")}</td></tr>`
        )
        .join("")
    : '<tr><td colspan="4">Keine Abweichungen aufgenommen.</td></tr>';
  const photos = protocol.photos
    .map((photo) => {
      const url = printableImageUrl(photo.url, options.baseUrl);
      return url
        ? `<figure><img src="${url}" alt="${escapeHtml(
            photo.caption
          )}"><figcaption><strong>${escapeHtml(
            photoCategoryLabels[photo.category]
          )}</strong><br>${escapeHtml(photo.caption)}</figcaption></figure>`
        : "";
    })
    .filter(Boolean)
    .join("");
  const draftBanner = options.draft
    ? '<div class="draft-banner">ENTWURF - NICHT ALS ÜBERGABEPROTOKOLL VERWENDEN</div>'
    : "";

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(
    protocol.protocolNumber
  )}</title><style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172554;font:9.5pt Arial,sans-serif;line-height:1.45}.document{max-width:190mm;margin:auto}.draft-banner{margin-bottom:12px;border:2px solid #b45309;background:#fff7ed;padding:9px;color:#92400e;font-weight:700;text-align:center}.sender{padding-bottom:6px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:8pt}.header{display:flex;justify-content:space-between;gap:24px;margin:20px 0}.eyebrow,.label{color:#64748b;font-size:8pt;font-weight:700;text-transform:uppercase}h1{margin:3px 0;color:#0f2b54;font-size:23pt}h2{margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid #c45f18;color:#0f2b54;font-size:13pt}.number{font-size:11pt;font-weight:700}.party-grid,.route-grid,.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.party{padding:11px;border:1px solid #e2e8f0}.meta{display:grid;grid-template-columns:repeat(4,auto);gap:5px 15px;padding:10px;background:#f8fafc}.meta span:nth-child(odd){color:#64748b}.meta span:nth-child(even){font-weight:700}.route{min-height:28mm;padding:10px;border-left:3px solid #c45f18;background:#fff7ed}table{width:100%;border-collapse:collapse}th{padding:7px;border-bottom:2px solid #c45f18;color:#475569;font-size:8pt;text-align:left;text-transform:uppercase}td{padding:7px;border-bottom:1px solid #e2e8f0;vertical-align:top}.answer{width:50mm;font-weight:700}.notes{padding:10px;border:1px solid #e2e8f0}.photo-section{break-before:page}.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10mm 8mm}figure{break-inside:avoid;margin:0}figure img{display:block;width:100%;height:75mm;object-fit:contain;border:1px solid #cbd5e1}figcaption{padding:5px 0;font-size:8.5pt}.declaration{margin-top:20px;padding:12px;border-left:4px solid #0f2b54;background:#f8fafc}.signature{break-inside:avoid;margin-top:16px}.signature img{display:block;width:100%;height:35mm;object-fit:contain;border-bottom:1px solid #334155}.footer{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:28px;padding-top:9px;border-top:1px solid #cbd5e1;color:#475569;font-size:8pt}
</style></head><body><main class="document">${draftBanner}
<div class="sender">${escapeHtml(protocol.contractor.companyName)} · ${escapeHtml(
    protocol.contractor.street
  )} · ${escapeHtml(`${protocol.contractor.postalCode} ${protocol.contractor.city}`)}</div>
<section class="header"><div><p class="eyebrow">Dokumentation der Übergabe</p><h1>Übergabeprotokoll</h1><p class="number">${escapeHtml(
    protocol.protocolNumber
  )}</p></div><div><span class="label">Umzugsdatum</span><br><strong>${escapeHtml(
    formatDate(protocol.moveDate)
  )}</strong><br><br><span class="label">Übergabe</span><br><strong>${escapeHtml(
    formatDateTime(protocol.handoverAt)
  )}</strong></div></section>
<section class="meta"><span>Kundennummer</span><span>${escapeHtml(
    protocol.customerNumber
  )}</span><span>Leistungsart</span><span>${
    protocol.serviceType === "seniorMove" ? "Seniorenumzug" : "Umzug"
  }</span><span>Teamleitung</span><span>${escapeHtml(protocol.crewLeader)}</span></section>
<h2>Vertragsparteien</h2><section class="party-grid"><div class="party"><span class="label">Auftraggeber / Kunde</span><p><strong>${
    customerNames || "Nicht angegeben"
  }</strong><br>${multiline(protocol.customerAddress)}<br>${escapeHtml(
    protocol.customerEmail
  )}</p></div><div class="party"><span class="label">Auftragnehmer</span><p><strong>${escapeHtml(
    protocol.contractor.companyName
  )}</strong><br>${escapeHtml(protocol.contractor.proprietor)} · ${escapeHtml(
    protocol.contractor.legalForm
  )}<br>${escapeHtml(protocol.contractor.street)}<br>${escapeHtml(
    `${protocol.contractor.postalCode} ${protocol.contractor.city}`
  )}<br>${escapeHtml(protocol.contractor.country)}</p></div></section>
<h2>Route</h2><section class="route-grid"><div class="route"><span class="label">Abholort</span><p>${multiline(
    protocol.pickupAddress
  )}</p></div><div class="route"><span class="label">Zielort</span><p>${multiline(
    protocol.deliveryAddress
  )}</p></div></section>
<h2>Feststellungen zur Durchführung</h2><table><tbody>${completionRows}</tbody></table>
<h2>Aufgenommene Abweichungen</h2><table><thead><tr><th>Nr.</th><th>Art</th><th>Gegenstand / Feststellung</th><th>Maßnahme</th></tr></thead><tbody>${issueRows}</tbody></table>
<h2>Vorbehalte und Notizen</h2><div class="notes"><strong>Vorbehalte</strong><p>${multiline(
    protocol.reservations || "Keine Vorbehalte aufgenommen."
  )}</p><strong>Weitere Notizen</strong><p>${multiline(
    protocol.notes || "Keine weiteren Notizen aufgenommen."
  )}</p></div>
${
  photos
    ? `<section class="photo-section"><h2>Fotodokumentation</h2><div class="photo-grid">${photos}</div></section>`
    : ""
}
<section class="declaration"><strong>Erklärung</strong><p>${escapeHtml(
    HANDOVER_DECLARATION_TEXT
  )}</p></section>
<section class="signature-grid"><div class="signature"><span class="label">Kundin / Kunde</span><img src="${escapeHtml(
    protocol.customerSignature.dataUrl
  )}" alt="Unterschrift Kundin oder Kunde"><p><strong>${escapeHtml(
    protocol.customerSignature.name
  )}</strong><br>${escapeHtml(
    formatDateTime(protocol.customerSignature.signedAt)
  )}</p></div><div class="signature"><span class="label">Auftragnehmervertretung</span><img src="${escapeHtml(
    protocol.contractorSignature.dataUrl
  )}" alt="Unterschrift Auftragnehmervertretung"><p><strong>${escapeHtml(
    protocol.contractorSignature.name
  )}</strong><br>${escapeHtml(
    formatDateTime(protocol.contractorSignature.signedAt)
  )}</p></div></section>
<footer class="footer"><div><strong>${escapeHtml(
    protocol.contractor.companyName
  )}</strong><br>${escapeHtml(protocol.contractor.proprietor)}<br>${escapeHtml(
    protocol.contractor.legalForm
  )}</div><div>${escapeHtml(protocol.contractor.street)}<br>${escapeHtml(
    `${protocol.contractor.postalCode} ${protocol.contractor.city}`
  )}<br>${escapeHtml(protocol.contractor.country)}</div><div>${escapeHtml(
    protocol.contractor.email
  )}<br>${escapeHtml(protocol.contractor.phone)}</div></footer>
</main></body></html>`;
}