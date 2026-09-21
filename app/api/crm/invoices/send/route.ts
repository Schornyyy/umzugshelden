import { sendCustomEmail } from "@/actions/emailActions";
import {
  createInvoiceDocumentHtml,
  createInvoicePdfFilename,
  getInvoiceTotals,
} from "@/lib/crmInvoiceDocument";
import type { CrmInvoice } from "@/types/Crm";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 60;

type SendInvoiceRequest = {
  to?: string;
  subject?: string;
  message?: string;
  invoice?: CrmInvoice;
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

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("de-DE");
}

function isSendableInvoice(invoice: CrmInvoice | undefined) {
  if (
    !invoice?.id ||
    !invoice.invoiceNumber ||
    !invoice.finalizedAt ||
    invoice.status === "draft" ||
    !Array.isArray(invoice.lineItems)
  ) {
    return false;
  }
  const totals = getInvoiceTotals(invoice);
  return (
    totals.orderGross > 0 &&
    (invoice.invoiceType !== "installment" ||
      (totals.gross > 0 && totals.gross < totals.orderGross))
  );
}

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    const body = (await request.json()) as SendInvoiceRequest;
    const to = body.to?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Bitte eine gültige Empfängeradresse angeben." },
        { status: 400 }
      );
    }
    if (!subject || !message || !isSendableInvoice(body.invoice)) {
      return NextResponse.json(
        { error: "Eine finalisierte Rechnung, Betreff und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }
    if (subject.length > 200 || message.length > 10_000) {
      return NextResponse.json(
        { error: "Betreff oder Nachricht ist zu lang." },
        { status: 400 }
      );
    }

    const invoice = body.invoice as CrmInvoice;
    const totals = getInvoiceTotals(invoice);
    const isInstallment = invoice.invoiceType === "installment";
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(createInvoiceDocumentHtml(invoice), {
      waitUntil: "domcontentloaded",
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const result = await sendCustomEmail({
      to,
      subject,
      templatePath: "CrmInvoiceEmail.html",
      replacements: {
        companyName: escapeHtml(invoice.issuer?.companyName || "Umzugshelden"),
        customerName: escapeHtml(
          invoice.customerName || invoice.customerCompany || "Damen und Herren"
        ),
        documentType: isInstallment ? "Abschlagsrechnung" : "Rechnung",
        invoiceNumber: escapeHtml(invoice.invoiceNumber),
        invoiceDate: escapeHtml(formatDate(invoice.issueDate)),
        dueDate: escapeHtml(formatDate(invoice.dueDate)),
        messageHtml: escapeHtml(message).replaceAll("\n", "<br />"),
        invoiceAmount: escapeHtml(currencyFormatter.format(totals.gross)),
        remainingHtml: isInstallment
          ? `<tr><td style="border-top:1px solid #dbe1ea;padding:14px 20px;color:#9a3412;"><strong>Verbleibende Restschuld</strong><span style="float:right;font-weight:700;">${escapeHtml(currencyFormatter.format(totals.remainingGross))}</span></td></tr>`
          : "",
        senderName: escapeHtml(invoice.issuer?.proprietor || "Umzugshelden"),
      },
      attachments: [
        {
          filename: createInvoicePdfFilename(invoice),
          content: Buffer.from(pdf),
          contentType: "application/pdf",
        },
      ],
    });

    if (!result.success) {
      throw new Error(result.error || "Die Rechnung konnte nicht versendet werden.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Versand der CRM-Rechnung:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Die Rechnung konnte nicht versendet werden.",
      },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}