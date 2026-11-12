import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  KNOWLEDGE_CHAT_COLLECTION,
  knowledgeChatMessageSchema,
  knowledgeChatSchema,
  type KnowledgeChatMessage,
} from "@/lib/knowledgeChat";
import { sendKnowledgeChatMessage } from "@/lib/knowledgeChatN8n";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const sendSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
});

function chatTitle(content: string) {
  const firstLine = content.split(/\r?\n/, 1)[0].trim();
  return firstLine.length > 70 ? `${firstLine.slice(0, 67)}...` : firstLine;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = sendSchema.safeParse(body);
    const { chatId } = await params;
    if (
      !parsed.success ||
      !z.string().trim().min(1).max(100).safeParse(chatId).success
    ) {
      return NextResponse.json(
        { error: "Bitte eine gültige Nachricht eingeben." },
        { status: 400 },
      );
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const database = getAdminDatabase();
    const chatReference = database
      .collection(KNOWLEDGE_CHAT_COLLECTION)
      .doc(chatId);
    const chatSnapshot = await chatReference.get();
    const chat = knowledgeChatSchema.safeParse(chatSnapshot.data());
    if (
      !chatSnapshot.exists ||
      !chat.success ||
      chat.data.ownerId !== parsed.data.ownerId
    ) {
      return NextResponse.json(
        { error: "Chat wurde nicht gefunden." },
        { status: 404 },
      );
    }

    const historySnapshot = await chatReference
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const history = historySnapshot.docs
      .map((document) =>
        knowledgeChatMessageSchema.safeParse(document.data()),
      )
      .filter((result) => result.success)
      .map((result) => result.data)
      .reverse();

    const userReference = chatReference.collection("messages").doc();
    const now = Date.now();
    const userMessage: KnowledgeChatMessage = {
      id: userReference.id,
      chatId,
      role: "user",
      content: parsed.data.content,
      createdAt: now,
    };
    const nextTitle =
      chat.data.title === "Neuer Chat"
        ? chatTitle(userMessage.content)
        : chat.data.title;
    const batch = database.batch();
    batch.create(userReference, userMessage);
    batch.update(chatReference, { title: nextTitle, updatedAt: now });
    await batch.commit();

    let output: string;
    try {
      output = await sendKnowledgeChatMessage({
        category: chat.data.category,
        testMode: chat.data.testMode,
        sessionId: chatId,
        message: userMessage.content,
        history,
      });
    } catch (error) {
      console.error("Wissens-Chat n8n-Anfrage fehlgeschlagen:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "n8n konnte die Nachricht nicht beantworten.",
          userMessage,
        },
        { status: 502 },
      );
    }

    const assistantReference = chatReference.collection("messages").doc();
    const assistantMessage: KnowledgeChatMessage = {
      id: assistantReference.id,
      chatId,
      role: "assistant",
      content: output,
      createdAt: Date.now(),
    };
    const responseBatch = database.batch();
    responseBatch.create(assistantReference, assistantMessage);
    responseBatch.update(chatReference, {
      title: nextTitle,
      updatedAt: assistantMessage.createdAt,
    });
    await responseBatch.commit();
    return NextResponse.json({
      chat: { ...chat.data, title: nextTitle, updatedAt: assistantMessage.createdAt },
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Wissens-Chat Nachricht konnte nicht gesendet werden:", error);
    return NextResponse.json(
      { error: "Nachricht konnte nicht gesendet werden." },
      { status: 500 },
    );
  }
}
