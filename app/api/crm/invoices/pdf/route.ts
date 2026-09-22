import {
  createInvoiceDocumentHtml,
  createInvoicePdfFilename,
  getInvoiceTotals,
} from "@/lib/crmInvoiceDocument";
import { launchPdfBrowser, type PdfBrowser } from "@/lib/launchPdfBrowser";
import type { CrmInvoice } from "@/types/Crm";
import { NextResponse } from "next/server";

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
      (totals.gross > 0 && totals.gross < totals.orderGross)) &&
    (invoice.invoiceType !== "final" ||
      (Boolean(invoice.relatedInstallmentId) &&
        Boolean(invoice.relatedInstallmentNumber) &&
        totals.creditedGross > 0 &&
        totals.creditedGross < totals.orderGross))
  );
}

export async function POST(request: Request) {
  let browser: PdfBrowser | undefined;

  try {
    const body = (await request.json()) as InvoicePdfRequest;
    if (!isValidInvoice(body.invoice)) {
      return NextResponse.json(
        { error: "Die Rechnungsdaten oder der Abschlagsbezug sind ungültig." },
        { status: 400 }
      );
    }

    const invoice = body.invoice as CrmInvoice;
    browser = await launchPdfBrowser();
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