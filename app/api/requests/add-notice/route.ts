import { NextResponse } from "next/server";
import { addRequestNotice } from "@/actions/requestsActions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, ownerId, titel, msg } = body || {};

    if (!requestId || !ownerId || !titel || !msg) {
      return NextResponse.json(
        { error: "requestId, ownerId, titel und msg erforderlich." },
        { status: 400 }
      );
    }

    const updated = await addRequestNotice(requestId, ownerId, { titel, msg });
    if (!updated) {
      return NextResponse.json(
        { error: "Anfrage nicht gefunden oder Owner ungültig." },
        { status: 404 }
      );
    }
    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Notiz:", error);
    const msg = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
