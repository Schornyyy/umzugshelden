import { sendCustomEmail } from "@/actions/emailActions";
import {
  createOfferDocumentHtml,
  createOfferPdfFilename,
  type CrmOfferCustomer,
  type CrmOfferDocument,
} from "@/lib/crmOfferDocument";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 60;

type SendOfferRequest = {
  to?: string;
  subject?: string;
  message?: string;
  offer?: CrmOfferDocument;
  customer?: CrmOfferCustomer;
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function emailReplacements(
  offer: CrmOfferDocument,
  customer: CrmOfferCustomer,
  message: string
) {
  const services = (offer.planning?.serviceTypes ?? [])
    .map((service) => {
      const labels: Record<string, string> = {
        move: "Umzug",
        seniorMove: "Seniorenumzug",
        clearance: "Entrümpelung",
        painting: "Anstricharbeiten",
        furnitureAssembly: "Möbelmontage",
        packing: "Einpackservice",
        storage: "Einlagerung",
      };
      return labels[service] ?? service;
    })
    .map(escapeHtml)
    .join("<br />") || "Leistungen nach Vereinbarung";
  const scheduleHtml = offer.planning?.date
    ? `<tr><td style="border-top:1px solid #dbe1ea;padding:18px 20px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Geplanter Termin</div><div style="margin-top:8px;font-size:15px;color:#17315c;">${escapeHtml(offer.planning.date)}</div></td></tr>`
    : "";
  const addresses = [
    offer.planning?.oldAddress &&
      `<strong>Auszug / Einsatzort</strong><br />${escapeHtml(offer.planning.oldAddress)}`,
    offer.planning?.newAddress &&
      `<strong>Einzug / Zielort</strong><br />${escapeHtml(offer.planning.newAddress)}`,
  ].filter(Boolean);
  const addressHtml = addresses.length
    ? `<tr><td style="border-top:1px solid #dbe1ea;padding:18px 20px;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Adressen</div><div style="margin-top:8px;font-size:14px;line-height:1.6;color:#17315c;">${addresses.join("<br /><br />")}</div></td></tr>`
    : "";

  return {
    customerName: escapeHtml(customer.name),
    messageHtml: escapeHtml(message).replaceAll("\n", "<br />"),
    offerNumber: escapeHtml(offer.id.slice(0, 8).toUpperCase()),
    offerTitle: escapeHtml(offer.title || "Ihr Angebot"),
    offerDate: escapeHtml(formatDate(offer.createdAt)),
    servicesHtml: services,
    scheduleHtml,
    addressHtml,
    grossTotal:
      typeof offer.grossTotal === "number"
        ? escapeHtml(currencyFormatter.format(offer.grossTotal))
        : "Siehe PDF-Anhang",
  };
}

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    const body = (await request.json()) as SendOfferRequest;
    const to = body.to?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Bitte eine gültige Empfängeradresse angeben." },
        { status: 400 }
      );
    }
    if (!subject || !message || !body.offer?.id || !body.customer?.name) {
      return NextResponse.json(
        { error: "Angebot, Kunde, Betreff und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }
    if (subject.length > 200 || message.length > 10_000) {
      return NextResponse.json(
        { error: "Betreff oder Nachricht ist zu lang." },
        { status: 400 }
      );
    }

    const pdfHtml = createOfferDocumentHtml(body.offer, body.customer);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(pdfHtml, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const result = await sendCustomEmail({
      to,
      subject,
      templatePath: "CrmOfferEmail.html",
      replacements: emailReplacements(body.offer, body.customer, message),
      attachments: [
        {
          filename: createOfferPdfFilename(body.offer),
          content: Buffer.from(pdf),
          contentType: "application/pdf",
        },
      ],
    });

    if (!result.success) {
      throw new Error(result.error || "Das Angebot konnte nicht versendet werden.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Versand des CRM-Angebots:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Das Angebot konnte nicht versendet werden.",
      },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}