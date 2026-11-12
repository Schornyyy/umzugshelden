import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  KNOWLEDGE_CHAT_COLLECTION,
  knowledgeChatSchema,
  type KnowledgeChat,
} from "@/lib/knowledgeChat";
import { knowledgeCategorySchema } from "@/lib/knowledgeSettings";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ownerSchema = z.string().trim().min(1).max(200);
const createSchema = z.object({
  ownerId: ownerSchema,
  category: knowledgeCategorySchema,
  testMode: z.boolean().default(false),
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
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .where("ownerId", "==", ownerId)
      .get();
    const chats = snapshot.docs
      .map((document) => knowledgeChatSchema.safeParse(document.data()))
      .filter((result) => result.success)
      .map((result) => result.data)
      .sort((first, second) => second.updatedAt - first.updatedAt);
    return NextResponse.json(
      { chats },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Wissens-Chats konnten nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Chats konnten nicht geladen werden." },
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
        { error: "Bitte einen gültigen Bereich auswählen." },
        { status: 400 },
      );
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const reference = getAdminDatabase()
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .doc();
    const now = Date.now();
    const chat: KnowledgeChat = {
      id: reference.id,
      ownerId: parsed.data.ownerId,
      category: parsed.data.category,
      testMode: parsed.data.testMode,
      title: "Neuer Chat",
      createdAt: now,
      updatedAt: now,
    };
    await reference.create(chat);
    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error("Wissens-Chat konnte nicht erstellt werden:", error);
    return NextResponse.json(
      { error: "Chat konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
