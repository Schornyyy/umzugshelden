import { sendCustomEmail } from "@/actions/emailActions";
import {
  HandoverRequestError,
  requireCrmOwner,
} from "@/lib/crmHandoverServer";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { CrmCustomer, CrmNote } from "@/types/Crm";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const CRM_COLLECTION = "crm_customers_umzugshelden";

type ReviewRequestBody = {
  customerId?: string;
  ownerId?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | ReviewRequestBody
      | null;
    const customerId = body?.customerId?.trim() ?? "";
    const ownerId = body?.ownerId?.trim() ?? "";
    if (!customerId || !ownerId) {
      throw new HandoverRequestError("Kunde oder Eigentümer fehlt.", 400);
    }

    await requireCrmOwner(request, ownerId);

    const configuredReviewLink =
      process.env.REVIEW_LINK || process.env.NEXT_PUBLIC_REVIEW_LINK;
    if (!configuredReviewLink) {
      throw new HandoverRequestError(
        "Der Google-Bewertungslink ist nicht konfiguriert.",
        500
      );
    }
    const reviewUrl = new URL(configuredReviewLink);
    if (reviewUrl.protocol !== "https:") {
      throw new HandoverRequestError(
        "Der Google-Bewertungslink muss eine HTTPS-Adresse sein.",
        500
      );
    }
    const reviewLink = reviewUrl.toString();

    const customerReference = getAdminDatabase()
      .collection(CRM_COLLECTION)
      .doc(customerId);
    const customerSnapshot = await customerReference.get();
    const customer = customerSnapshot.data() as CrmCustomer | undefined;
    if (!customerSnapshot.exists || !customer || customer.ownerId !== ownerId) {
      throw new HandoverRequestError("Kunde nicht gefunden.", 404);
    }
    const email = customer.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HandoverRequestError(
        "Für diesen Kunden ist keine gültige E-Mail-Adresse hinterlegt.",
        400
      );
    }

    const emailResult = await sendCustomEmail({
      to: email,
      subject: "Wie war Ihr Umzug mit uns?",
      replacements: {
        name: escapeHtml(customer.name.trim() || "Damen und Herren"),
        reviewLink: escapeHtml(reviewLink),
      },
      templatePath: "ReviewRequest.html",
    });
    if (!emailResult.success) {
      throw new Error(
        emailResult.error || "Die Bewertungs-E-Mail konnte nicht versendet werden."
      );
    }

    const now = Date.now();
    const note: CrmNote = {
      id: randomUUID(),
      text: `Google-Bewertung per E-Mail an ${email} angefragt.`,
      createdAt: now,
    };
    await customerReference.update({
      notes: [note, ...(customer.notes ?? [])],
      updatedAt: now,
    });

    return Response.json({ success: true, note, updatedAt: now });
  } catch (error) {
    if (error instanceof HandoverRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Fehler beim Anfordern einer Google-Bewertung:", error);
    return Response.json(
      { error: "Die Bewertungs-E-Mail konnte nicht versendet werden." },
      { status: 500 }
    );
  }
}