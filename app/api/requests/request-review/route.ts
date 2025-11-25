import { NextResponse } from "next/server";
import { getRequestById, addRequestNotice } from "@/actions/requestsActions";
import { sendCustomEmail } from "@/actions/emailActions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, ownerId } = body || {};

    if (!requestId || !ownerId) {
      return NextResponse.json(
        { error: "requestId und ownerId erforderlich." },
        { status: 400 }
      );
    }

    const reviewLink = process.env.NEXT_PUBLIC_REVIEW_LINK || process.env.REVIEW_LINK;
    if (!reviewLink) {
      return NextResponse.json(
        { error: "Bewertungslink nicht konfiguriert (NEXT_PUBLIC_REVIEW_LINK)." },
        { status: 500 }
      );
    }

    const request = await getRequestById(requestId, ownerId);
    if (!request) {
      return NextResponse.json(
        { error: "Anfrage nicht gefunden oder Owner ungültig." },
        { status: 404 }
      );
    }

    // Send email to the requester
    const emailResult = await sendCustomEmail({
      to: request.email,
      subject: "Ihre Bewertung für unseren Hausmeisterservice",
      replacements: { name: request.name, reviewLink },
      templatePath: "ReviewRequest.html",
    });

    if (!emailResult.success) {
      const err =
        typeof emailResult.error === "string"
          ? emailResult.error
          : "Fehler beim Senden der Bewertungs-E-Mail";
      return NextResponse.json({ error: err }, { status: 500 });
    }

    // Append notice
    const updated = await addRequestNotice(requestId, ownerId, {
      titel: "Bewertung angefragt",
      msg: `Bewertungslink an ${request.email} gesendet (${reviewLink}).`,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Notiz konnte nicht hinzugefügt werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Fehler bei Bewertungsanforderung:", error);
    const msg = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
