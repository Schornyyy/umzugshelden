import { NextResponse } from "next/server";
import { deleteApplication } from "@/actions/applicationActions";

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
    const { id, ownerId } = await req.json();
    if (!id || !ownerId) {
      return NextResponse.json({ error: "id und ownerId erforderlich." }, { status: 400 });
    }
    const deleted = await deleteApplication(id, ownerId);
    if (!deleted) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden oder Owner ungültig." }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: deleted.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) || "Unbekannter Fehler" }, { status: 500 });
  }
}
