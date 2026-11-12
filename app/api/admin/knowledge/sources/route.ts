import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  ingestKnowledgeSource,
  knowledgeSourceId,
} from "@/lib/knowledgeIngestion";
import {
  knowledgeCategorySchema,
  knowledgeCreatorSchema,
  knowledgeSourceSchema,
  knowledgeSourceTypeSchema,
  type KnowledgeSource,
} from "@/lib/knowledgeSettings";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const CREATOR_COLLECTION = "knowledge_creators_umzugshelden";
const SOURCE_COLLECTION = "knowledge_sources_umzugshelden";
const ownerSchema = z.string().trim().min(1).max(200);
const sourceInputSchema = z
  .object({
    ownerId: ownerSchema,
    creatorId: z.string().trim().min(1).max(100),
    category: knowledgeCategorySchema,
    type: knowledgeSourceTypeSchema,
    title: z.string().trim().min(1).max(300),
    sourceUrl: z.string().url().max(2000).optional(),
    contentUrl: z.string().url().max(2000).optional(),
    fileName: z.string().trim().min(1).max(300).optional(),
  })
  .superRefine((value, context) => {
    if (value.type === "website" && !value.sourceUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "Website-URL fehlt.",
      });
    }
    if (value.type === "pdf" && (!value.contentUrl || !value.fileName)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentUrl"],
        message: "PDF-Datei fehlt.",
      });
    }
    if (
      value.type === "spotify" &&
      !value.sourceUrl
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "Spotify-Episodenlink fehlt.",
      });
    }
  });

function withoutUndefined(value: KnowledgeSource) {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  );
}

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
      .collection(SOURCE_COLLECTION)
      .where("ownerId", "==", ownerId)
      .get();
    const sources = snapshot.docs
      .map((document) => knowledgeSourceSchema.safeParse(document.data()))
      .filter((result) => result.success)
      .map((result) => result.data)
      .sort((first, second) => second.createdAt - first.createdAt);
    return NextResponse.json(
      { sources },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Wissensquellen konnten nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Wissensquellen konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = sourceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Wissensquelle." },
        { status: 400 },
      );
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const database = getAdminDatabase();
    const creatorSnapshot = await database
      .collection(CREATOR_COLLECTION)
      .doc(parsed.data.creatorId)
      .get();
    const creator = knowledgeCreatorSchema.safeParse(creatorSnapshot.data());
    if (
      !creatorSnapshot.exists ||
      !creator.success ||
      creator.data.ownerId !== parsed.data.ownerId
    ) {
      return NextResponse.json(
        { error: "Der ausgewählte Ersteller wurde nicht gefunden." },
        { status: 404 },
      );
    }

    const id = knowledgeSourceId();
    const sourceReference = database.collection(SOURCE_COLLECTION).doc(id);
    const source: KnowledgeSource = {
      id,
      ownerId: parsed.data.ownerId,
      creatorId: creator.data.id,
      creatorName: creator.data.name,
      category: parsed.data.category,
      type: parsed.data.type,
      title: parsed.data.title,
      sourceUrl: parsed.data.sourceUrl,
      contentUrl: parsed.data.contentUrl,
      fileName: parsed.data.fileName,
      status: "processing",
      chunkCount: 0,
      createdAt: Date.now(),
    };
    await sourceReference.create(withoutUndefined(source));

    try {
      const result = await ingestKnowledgeSource({
        sourceId: source.id,
        type: source.type,
        creatorId: source.creatorId,
        creatorName: source.creatorName,
        category: source.category,
        title: source.title,
        sourceUrl: source.sourceUrl,
        contentUrl: source.contentUrl,
        fileName: source.fileName,
      });
      const completed: KnowledgeSource = {
        ...source,
        title: result.resolvedTitle,
        status: "ready",
        chunkCount: result.chunkCount,
        pageCount: result.pageCount,
        completedAt: Date.now(),
      };
      await sourceReference.set(withoutUndefined(completed));
      return NextResponse.json(completed, { status: 201 });
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Die Quelle konnte nicht verarbeitet werden.";
      console.error("Wissensquelle konnte nicht verarbeitet werden:", processingError);
      const failed: KnowledgeSource = {
        ...source,
        status: "failed",
        chunkCount: 0,
        error: message.slice(0, 1000),
        completedAt: Date.now(),
      };
      await sourceReference.set(withoutUndefined(failed));
      return NextResponse.json(
        { error: message, source: failed },
        { status: 422 },
      );
    }
  } catch (error) {
    console.error("Wissensquelle konnte nicht gespeichert werden:", error);
    return NextResponse.json(
      { error: "Wissensquelle konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
