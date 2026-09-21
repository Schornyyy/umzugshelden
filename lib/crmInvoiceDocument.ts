import type { CrmInvoice, CrmInvoiceIssuer } from "@/types/Crm";

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const quantityFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const EMPTY_ISSUER: CrmInvoiceIssuer = {
  companyName: "",
  proprietor: "",
  legalForm: "",
  street: "",
  postalCode: "",
  city: "",
  country: "",
  email: "",
  phone: "",
  taxNumber: "",
  vatId: "",
  bankName: "",
  accountHolder: "",
  iban: "",
  bic: "",
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getInvoiceTotals(invoice: CrmInvoice) {
  const orderNet = roundMoney(
    invoice.lineItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    )
  );
  const orderVat = roundMoney(orderNet * (invoice.vatPercent / 100));
  const orderGross = roundMoney(orderNet + orderVat);
  const requestedInstallment = Number(invoice.installmentGross);
  const gross = roundMoney(
    invoice.invoiceType === "installment" && Number.isFinite(requestedInstallment)
      ? Math.min(orderGross, Math.max(0, requestedInstallment))
      : orderGross
  );
  const net = roundMoney(
    invoice.vatPercent > 0
      ? gross / (1 + invoice.vatPercent / 100)
      : gross
  );
  const vat = roundMoney(gross - net);

  return {
    net,
    vat,
    gross,
    orderNet,
    orderVat,
    orderGross,
    remainingGross: roundMoney(Math.max(0, orderGross - gross)),
  };
}

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
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("de-DE");
}

function sanitizeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function createInvoicePdfFilename(invoice: CrmInvoice) {
  const number = sanitizeFilePart(invoice.invoiceNumber || invoice.id.slice(0, 8));
  const prefix = invoice.invoiceType === "installment" ? "Abschlagsrechnung" : "Rechnung";
  return `${prefix}-${number || "Entwurf"}.pdf`;
}

export function createInvoiceDocumentHtml(
  invoice: CrmInvoice,
  options: { draft?: boolean } = {}
) {
  const issuer = { ...EMPTY_ISSUER, ...invoice.issuer };
  const totals = getInvoiceTotals(invoice);
  const isInstallment = invoice.invoiceType === "installment";
  const documentTitle = isInstallment ? "Abschlagsrechnung" : "Rechnung";
  const displayedInvoiceNumber = invoice.invoiceNumber || "Noch nicht vergeben";
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
    .map(escapeHtml)
    .join("<br>");
  const rows = invoice.lineItems
    .map(
      (line, index) =>
        `<tr><td>${escapeHtml(index + 1)}</td><td>${escapeHtml(line.description)}</td><td>${escapeHtml(quantityFormatter.format(line.quantity))} ${escapeHtml(line.unit)}</td><td>${escapeHtml(currencyFormatter.format(line.unitPrice))}</td><td>${escapeHtml(currencyFormatter.format(line.quantity * line.unitPrice))}</td></tr>`
    )
    .join("");
  const taxIdentifiers = [
    issuer.taxNumber ? `Steuernummer: ${issuer.taxNumber}` : "",
    issuer.vatId ? `USt-IdNr.: ${issuer.vatId}` : "",
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
  const draftBanner = options.draft
    ? '<div class="draft-banner">ENTWURF - NICHT ALS RECHNUNG VERWENDEN</div>'
    : "";
  const vatLabel = invoice.vatPercent === 0
    ? invoice.taxNote || "Umsatzsteuer 0 %"
    : `Umsatzsteuer ${quantityFormatter.format(invoice.vatPercent)} %`;
  const totalsHtml = isInstallment
    ? `<div class="section-label">Zugrunde liegender Auftragswert</div>
      <div class="total-row"><span>Nettowert</span><strong>${escapeHtml(currencyFormatter.format(totals.orderNet))}</strong></div>
      <div class="total-row"><span>${escapeHtml(vatLabel)}</span><strong>${escapeHtml(currencyFormatter.format(totals.orderVat))}</strong></div>
      <div class="total-row order-gross"><span>Auftragswert brutto</span><strong>${escapeHtml(currencyFormatter.format(totals.orderGross))}</strong></div>
      <div class="section-label installment-label">Dieser Abschlag</div>
      <div class="total-row"><span>Abschlag netto</span><strong>${escapeHtml(currencyFormatter.format(totals.net))}</strong></div>
      <div class="total-row"><span>${escapeHtml(vatLabel)}</span><strong>${escapeHtml(currencyFormatter.format(totals.vat))}</strong></div>
      <div class="total-row gross"><span>Rechnungsbetrag</span><strong>${escapeHtml(currencyFormatter.format(totals.gross))}</strong></div>
      <div class="total-row remaining"><span>Verbleibende Restschuld</span><strong>${escapeHtml(currencyFormatter.format(totals.remainingGross))}</strong></div>`
    : `<div class="total-row"><span>Nettosumme</span><strong>${escapeHtml(currencyFormatter.format(totals.net))}</strong></div>
      <div class="total-row"><span>${escapeHtml(vatLabel)}</span><strong>${escapeHtml(currencyFormatter.format(totals.vat))}</strong></div>
      <div class="total-row gross"><span>Rechnungsbetrag</span><strong>${escapeHtml(currencyFormatter.format(totals.gross))}</strong></div>`;

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(`${documentTitle} ${displayedInvoiceNumber}`)}</title>
  <style>
    @page{size:A4;margin:15mm}*{box-sizing:border-box}body{margin:0;color:#172554;font:10pt Arial,sans-serif;line-height:1.45}.document{max-width:190mm;margin:auto}.draft-banner{margin-bottom:12px;border:2px solid #b45309;background:#fff7ed;padding:8px;color:#92400e;font-size:10pt;font-weight:700;text-align:center}.sender{padding-bottom:5px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:8pt}.header{display:flex;justify-content:space-between;gap:24px;margin-top:22px}.recipient{min-height:42mm}.eyebrow{color:#c45f18;font-size:8pt;font-weight:700;text-transform:uppercase}h1{margin:2px 0 0;font-size:25pt;color:#0f2b54}.number{margin:3px 0;font-size:12pt;font-weight:700}.meta{display:grid;grid-template-columns:auto auto;gap:4px 18px;align-content:start}.meta span:nth-child(odd){color:#64748b}.meta span:nth-child(even){text-align:right;font-weight:700}.positions{width:100%;margin-top:24px;border-collapse:collapse}th{padding:8px;border-bottom:2px solid #c45f18;color:#475569;font-size:8pt;text-align:left;text-transform:uppercase}td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}th:nth-child(n+3),td:nth-child(n+3){text-align:right}.totals{width:92mm;margin:18px 0 0 auto}.section-label{margin:0 7px 4px;color:#64748b;font-size:8pt;font-weight:700;text-transform:uppercase}.installment-label{margin-top:11px;border-top:1px solid #cbd5e1;padding-top:9px}.total-row{display:flex;justify-content:space-between;gap:16px;padding:5px 7px}.order-gross{font-weight:700}.gross{margin-top:6px;background:#0f2b54;padding:11px;color:#fff;font-size:12pt}.remaining{border:1px solid #fdba74;border-top:0;background:#fff7ed;padding:9px 10px;color:#9a3412;font-weight:700}.payment{margin-top:26px;border-left:4px solid #c45f18;background:#fff7ed;padding:13px 15px}.payment-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:10px}.label{color:#64748b;font-size:8pt;text-transform:uppercase}.footer{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:34px;border-top:1px solid #cbd5e1;padding-top:10px;color:#475569;font-size:8pt}tr,.header,.totals,.payment{break-inside:avoid}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style>
</head>
<body>
  <main class="document">
    ${draftBanner}
    <div class="sender">${escapeHtml(senderLine)}</div>
    <section class="header">
      <div class="recipient">
        <p class="eyebrow">${escapeHtml(documentTitle)} an</p>
        <strong>${recipientNames}</strong><br>
        ${multiline(invoice.customerAddress)}
      </div>
      <div>
        <p class="eyebrow">${escapeHtml(documentTitle)}</p>
        <h1>${escapeHtml(documentTitle)}</h1>
        <p class="number">${escapeHtml(displayedInvoiceNumber)}</p>
      </div>
    </section>
    <section class="meta">
      <span>Rechnungsnummer</span><span>${escapeHtml(displayedInvoiceNumber)}</span>
      <span>Kundennummer</span><span>${escapeHtml(invoice.customerNumber || "")}</span>
      <span>Rechnungsdatum</span><span>${escapeHtml(formatDate(invoice.issueDate))}</span>
      <span>Leistungsdatum</span><span>${escapeHtml(formatDate(invoice.serviceDate))}</span>
      <span>Fälligkeitsdatum</span><span>${escapeHtml(formatDate(invoice.dueDate))}</span>
    </section>
    <table class="positions">
      <thead><tr><th>Pos.</th><th>Leistung</th><th>Menge / Einheit</th><th>Netto je Einheit</th><th>Netto gesamt</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="totals">${totalsHtml}</section>
    <section class="payment">
      <strong>Zahlungshinweise</strong>
      <p>Zahlbar bis ${escapeHtml(formatDate(invoice.dueDate))} ohne Abzug.</p>
      <p>${multiline(invoice.notes)}</p>
      <div class="payment-grid">
        <div><span class="label">Bank</span><br>${escapeHtml(issuer.bankName)}<br><span class="label">Kontoinhaber</span><br>${escapeHtml(issuer.accountHolder)}</div>
        <div><span class="label">IBAN</span><br>${escapeHtml(issuer.iban)}<br><span class="label">BIC</span><br>${escapeHtml(issuer.bic)}</div>
      </div>
    </section>
    <footer class="footer">
      <div><strong>${escapeHtml(issuer.companyName)}</strong><br>${escapeHtml(issuer.proprietor)}<br>${escapeHtml(issuer.legalForm)}</div>
      <div>${escapeHtml(issuer.street)}<br>${escapeHtml(`${issuer.postalCode} ${issuer.city}`.trim())}<br>${escapeHtml(issuer.country)}</div>
      <div>${escapeHtml(issuer.email)}<br>${escapeHtml(issuer.phone)}${taxIdentifiers ? `<br>${taxIdentifiers}` : ""}</div>
    </footer>
  </main>
</body>
</html>`;
}