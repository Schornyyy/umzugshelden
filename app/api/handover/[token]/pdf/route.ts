import { sendCustomEmail } from "@/actions/emailActions";
import {
  HANDOVER_ACCESS_COLLECTION,
  HANDOVER_PROTOCOL_COLLECTION,
} from "@/lib/crmHandoverAccess";
import {
  createHandoverDocumentHtml,
  createHandoverPdfFilename,
} from "@/lib/crmHandoverDocument";
import {
  HandoverRequestError,
  handoverErrorResponse,
  resolveHandoverAccess,
} from "@/lib/crmHandoverServer";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { launchPdfBrowser, type PdfBrowser } from "@/lib/launchPdfBrowser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ token: string }> };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(request: Request, context: RouteContext) {
  let browser: PdfBrowser | undefined;

  try {
    const { token } = await context.params;
    const { access, protocol } = await resolveHandoverAccess(token);
    if (protocol.status !== "finalized" || !protocol.finalizedAt) {
      throw new HandoverRequestError(
        "Das Protokoll muss vor dem Download abgeschlossen werden.",
        409
      );
    }

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(
      createHandoverDocumentHtml(protocol, {
        baseUrl: new URL(request.url).origin,
      }),
      { waitUntil: "networkidle0" }
    );
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const now = Date.now();
    let emailSentAt = access.emailSentAt;
    if (!emailSentAt) {
      const result = await sendCustomEmail({
        to: access.email,
        subject: `Ihr Übergabeprotokoll ${protocol.protocolNumber}`,
        templatePath: "CrmHandoverCompletedEmail.html",
        replacements: {
          companyName: escapeHtml(protocol.contractor.companyName),
          customerName: escapeHtml(
            protocol.customerName || protocol.customerCompany || "Damen und Herren"
          ),
          protocolNumber: escapeHtml(protocol.protocolNumber),
          moveDate: escapeHtml(
            new Date(`${protocol.moveDate}T12:00:00`).toLocaleDateString("de-DE")
          ),
          senderName: escapeHtml(protocol.contractor.proprietor),
        },
        attachments: [
          {
            filename: createHandoverPdfFilename(protocol),
            content: Buffer.from(pdf),
            contentType: "application/pdf",
          },
        ],
      });
      if (!result.success) {
        throw new Error(result.error || "Die Abschluss-E-Mail konnte nicht versendet werden.");
      }
      emailSentAt = now;
    }

    const database = getAdminDatabase();
    const batch = database.batch();
    batch.update(
      database.collection(HANDOVER_ACCESS_COLLECTION).doc(protocol.id),
      removeUndefined({ downloadedAt: now, emailSentAt })
    );
    batch.update(
      database.collection(HANDOVER_PROTOCOL_COLLECTION).doc(protocol.id),
      removeUndefined({
        "customerAccess.downloadedAt": now,
        "customerAccess.emailSentAt": emailSentAt,
      })
    );
    await batch.commit();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${createHandoverPdfFilename(
          protocol
        )}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return handoverErrorResponse(error);
  } finally {
    await browser?.close();
  }
}

function removeUndefined(value: Record<string, number | undefined>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  );
}