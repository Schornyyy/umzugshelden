import { NextResponse } from "next/server";
import { addApplicationNote } from "@/actions/applicationActions";

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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unbekannter Fehler" }, { status: 500 });
  }
}
