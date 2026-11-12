import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  knowledgeCreatorSchema,
  type KnowledgeCreator,
} from "@/lib/knowledgeSettings";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREATOR_COLLECTION = "knowledge_creators_umzugshelden";
const ownerSchema = z.string().trim().min(1).max(200);
const createSchema = z.object({
  ownerId: ownerSchema,
  name: z.string().trim().min(1).max(150),
});

export async function GET(request: Request) {
  try {
    const ownerId = new URL(request.url).searchParams.get("ownerId") ?? "";
    if (!ownerSchema.safeParse(ownerId).success) {
      return NextResponse.json({ error: "Owner-ID fehlt." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const snapshot = await getAdminDatabase()
      .collection(CREATOR_COLLECTION)
      .where("ownerId", "==", ownerId)
      .get();
    const creators = snapshot.docs
      .map((document) => knowledgeCreatorSchema.safeParse(document.data()))
      .filter((result) => result.success)
      .map((result) => result.data)
      .sort((first, second) => first.name.localeCompare(second.name, "de"));
    return NextResponse.json(
      { creators },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Wissens-Ersteller konnten nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Ersteller konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bitte einen gültigen Namen eingeben." },
        { status: 400 },
      );
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const database = getAdminDatabase();
    const duplicate = await database
      .collection(CREATOR_COLLECTION)
      .where("ownerId", "==", parsed.data.ownerId)
      .get();
    const normalizedName = parsed.data.name.toLocaleLowerCase("de");
    if (
      duplicate.docs.some(
        (document) =>
          String(document.get("name") ?? "").toLocaleLowerCase("de") ===
          normalizedName,
      )
    ) {
      return NextResponse.json(
        { error: "Dieser Ersteller existiert bereits." },
        { status: 409 },
      );
    }

    const reference = database.collection(CREATOR_COLLECTION).doc();
    const creator: KnowledgeCreator = {
      id: reference.id,
      ownerId: parsed.data.ownerId,
      name: parsed.data.name,
      createdAt: Date.now(),
    };
    await reference.create(creator);
    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    console.error("Wissens-Ersteller konnte nicht gespeichert werden:", error);
    return NextResponse.json(
      { error: "Ersteller konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
