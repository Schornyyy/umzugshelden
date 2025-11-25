import { NextResponse } from "next/server";
import { addApplicationNote } from "@/actions/applicationActions";

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function POST(req: Request) {
  try {
    const { id, ownerId, titel, msg } = await req.json();
    if (!id || !ownerId || !titel || !msg) {
      return NextResponse.json({ error: "id, ownerId, titel und msg erforderlich." }, { status: 400 });
    }
    const updated = await addApplicationNote(id, ownerId, { titel, msg });
    if (!updated) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden oder Owner ungültig." }, { status: 404 });
    }
    return NextResponse.json({ application: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) || "Unbekannter Fehler" }, { status: 500 });
  }
}
