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

type InvoicePdfRequest = {
  invoice?: CrmInvoice;
  draft?: boolean;
};

function isValidInvoice(invoice: CrmInvoice | undefined) {
  if (!invoice?.id || !Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
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
    const body = (await request.json()) as InvoicePdfRequest;
    if (!isValidInvoice(body.invoice)) {
      return NextResponse.json(
        { error: "Die Rechnungsdaten oder der Abschlagsbetrag sind ungültig." },
        { status: 400 }
      );
    }

    const invoice = body.invoice as CrmInvoice;
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(
      createInvoiceDocumentHtml(invoice, { draft: Boolean(body.draft) }),
      { waitUntil: "domcontentloaded" }
    );
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${createInvoicePdfFilename(invoice)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Fehler beim Erstellen der CRM-Rechnung:", error);
    return NextResponse.json(
      { error: "Die PDF-Rechnung konnte nicht erstellt werden." },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}