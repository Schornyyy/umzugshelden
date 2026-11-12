import { draftContentToEmailHtml } from "@/lib/b2bEmailHtml";
import { nextB2bFollowUp } from "@/lib/b2bFollowUp";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { sendBrevoEmail } from "@/lib/brevo";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SendB2bEmailRequest = {
  ownerId?: string;
  leadId?: string;
  subject?: string;
  content?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEAD_COLLECTION = "b2b_leads_umzugshelden";
const ACTIVITY_COLLECTION = "b2b_email_activities_umzugshelden";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendB2bEmailRequest;
    const ownerId = body.ownerId?.trim() ?? "";
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const leadId = body.leadId?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    if (!leadId || !subject || !body.content) {
      return NextResponse.json(
        { error: "Lead, Betreff und E-Mail-Text sind erforderlich." },
        { status: 400 },
      );
    }
    if (subject.length > 200 || body.content.length > 100_000) {
      return NextResponse.json(
        { error: "Betreff oder E-Mail-Text ist zu lang." },
        { status: 400 },
      );
    }
    const database = getAdminDatabase();
    const leadReference = database.collection(LEAD_COLLECTION).doc(leadId);
    const leadSnapshot = await leadReference.get();
    if (!leadSnapshot.exists || leadSnapshot.get("ownerId") !== ownerId) {
      return NextResponse.json(
        { error: "Der B2B-Lead wurde nicht gefunden." },
        { status: 404 },
      );
    }

    const to = String(leadSnapshot.get("email") ?? "").trim();
    const contactName = String(leadSnapshot.get("contactName") ?? "").trim();
    const website = String(leadSnapshot.get("website") ?? "").trim();
    const category = String(leadSnapshot.get("category") ?? "").trim();
    if (!category || !contactName || !website || !to) {
      return NextResponse.json(
        {
          error:
            "Branche, Ansprechpartner, Website und E-Mail müssen ausgefüllt sein.",
        },
        { status: 400 },
      );
    }
    if (!EMAIL_PATTERN.test(to)) {
      return NextResponse.json(
        { error: "Für diesen Lead ist keine gültige E-Mail-Adresse hinterlegt." },
        { status: 400 },
      );
    }

    const htmlContent = draftContentToEmailHtml(body.content);
    const result = await sendBrevoEmail({
      to,
      recipientName: contactName,
      subject,
      htmlContent,
    });

    const sentAt = Date.now();
    const previousActivities = await database
      .collection(ACTIVITY_COLLECTION)
      .where("leadId", "==", leadId)
      .get();
    const { followUpDays, nextFollowUpAt } = nextB2bFollowUp(
      sentAt,
      previousActivities.size,
    );
    const activityReference = database.collection(ACTIVITY_COLLECTION).doc();
    const batch = database.batch();
    batch.set(activityReference, {
      ownerId,
      leadId,
      to,
      subject,
      htmlContent,
      brevoMessageId: result.messageId,
      sentAt,
      channel: "brevo",
      status: "sent",
    });
    batch.update(leadReference, {
      lastContactAt: sentAt,
      nextFollowUpAt,
      status: "contacted",
      updatedAt: sentAt,
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      activityId: activityReference.id,
      sentAt,
      nextFollowUpAt,
      followUpDays,
      brevoMessageId: result.messageId,
    });
  } catch (error) {
    console.error("B2B email send failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Die E-Mail konnte nicht versendet werden.",
      },
      { status: 500 },
    );
  }
}
