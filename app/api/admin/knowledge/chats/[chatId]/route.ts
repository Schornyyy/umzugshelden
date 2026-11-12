import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  KNOWLEDGE_CHAT_COLLECTION,
  knowledgeChatMessageSchema,
  knowledgeChatSchema,
} from "@/lib/knowledgeChat";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ownerSchema = z.string().trim().min(1).max(200);
const updateSchema = z.object({
  ownerId: ownerSchema,
  testMode: z.boolean(),
});
const deleteSchema = z.object({ ownerId: ownerSchema });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const ownerId = new URL(request.url).searchParams.get("ownerId") ?? "";
    const { chatId } = await params;
    if (
      !ownerSchema.safeParse(ownerId).success ||
      !z.string().trim().min(1).max(100).safeParse(chatId).success
    ) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const reference = getAdminDatabase()
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .doc(chatId);
    const snapshot = await reference.get();
    const chat = knowledgeChatSchema.safeParse(snapshot.data());
    if (!snapshot.exists || !chat.success || chat.data.ownerId !== ownerId) {
      return NextResponse.json(
        { error: "Chat wurde nicht gefunden." },
        { status: 404 },
      );
    }
    const messageSnapshot = await reference
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();
    const messages = messageSnapshot.docs
      .map((document) =>
        knowledgeChatMessageSchema.safeParse(document.data()),
      )
      .filter((result) => result.success)
      .map((result) => result.data);
    return NextResponse.json(
      { chat: chat.data, messages },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Wissens-Chat konnte nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Chat konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    const { chatId } = await params;
    if (
      !parsed.success ||
      !z.string().trim().min(1).max(100).safeParse(chatId).success
    ) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const reference = getAdminDatabase()
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .doc(chatId);
    const snapshot = await reference.get();
    const chat = knowledgeChatSchema.safeParse(snapshot.data());
    if (
      !snapshot.exists ||
      !chat.success ||
      chat.data.ownerId !== parsed.data.ownerId
    ) {
      return NextResponse.json(
        { error: "Chat wurde nicht gefunden." },
        { status: 404 },
      );
    }
    const updated = {
      ...chat.data,
      testMode: parsed.data.testMode,
      updatedAt: Date.now(),
    };
    await reference.set(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Chat-Testmodus konnte nicht geändert werden:", error);
    return NextResponse.json(
      { error: "Testmodus konnte nicht geändert werden." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    const { chatId } = await params;
    if (
      !parsed.success ||
      !z.string().trim().min(1).max(100).safeParse(chatId).success
    ) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const database = getAdminDatabase();
    const reference = database
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .doc(chatId);
    const snapshot = await reference.get();
    const chat = knowledgeChatSchema.safeParse(snapshot.data());
    if (
      !snapshot.exists ||
      !chat.success ||
      chat.data.ownerId !== parsed.data.ownerId
    ) {
      return NextResponse.json(
        { error: "Chat wurde nicht gefunden." },
        { status: 404 },
      );
    }

    while (true) {
      const messages = await reference.collection("messages").limit(400).get();
      if (messages.empty) break;
      const batch = database.batch();
      messages.docs.forEach((message) => batch.delete(message.ref));
      await batch.commit();
    }
    await reference.delete();
    return NextResponse.json({ id: chatId });
  } catch (error) {
    console.error("Wissens-Chat konnte nicht gelöscht werden:", error);
    return NextResponse.json(
      { error: "Chat konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
