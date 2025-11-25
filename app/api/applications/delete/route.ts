import { NextResponse } from "next/server";
import { deleteApplication } from "@/actions/applicationActions";

export async function POST(req: Request) {
  try {
    const { id, ownerId } = await req.json();
    if (!id || !ownerId) {
      return NextResponse.json({ error: "id und ownerId erforderlich." }, { status: 400 });
    }
    const deleted = await deleteApplication(id, ownerId);
    if (!deleted) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden oder Owner ungültig." }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: deleted.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unbekannter Fehler" }, { status: 500 });
  }
}
