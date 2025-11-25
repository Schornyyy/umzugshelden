import { NextResponse } from "next/server";
import { createRequest } from "@/actions/requestsActions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, Email und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ungültiges E-Mail-Format." },
        { status: 400 }
      );
    }

    const ownerId = process.env.NEXT_PUBLIC_OWNERID;
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner-ID nicht konfiguriert." },
        { status: 500 }
      );
    }

    const request = await createRequest(ownerId, { name, email, phone, message });
    return NextResponse.json({ request });
  } catch (error) {
    console.error("Fehler beim Erstellen der Anfrage:", error);
    const msg = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
