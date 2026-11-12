import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import {
  COMPANY_KNOWLEDGE_JOB_COLLECTION,
  processCompanyKnowledgeJob,
} from "@/lib/companyKnowledgeIndexer";
import {
  companyKnowledgeJobSchema,
  type CompanyKnowledgeJob,
} from "@/lib/companyKnowledge";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { after, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const ownerSchema = z.string().trim().min(1).max(200);
const startSchema = z.object({ ownerId: ownerSchema });

async function listJobs(ownerId: string) {
  const snapshot = await getAdminDatabase()
    .collection(COMPANY_KNOWLEDGE_JOB_COLLECTION)
    .where("ownerId", "==", ownerId)
    .get();
  return snapshot.docs
    .map((document) => companyKnowledgeJobSchema.safeParse(document.data()))
    .filter((result) => result.success)
    .map((result) => result.data)
    .sort((first, second) => second.createdAt - first.createdAt);
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
    return NextResponse.json(
      { job: (await listJobs(ownerId))[0] ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Firmenwissen-Status konnte nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Firmenwissen-Status konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Owner-ID fehlt." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const existing = (await listJobs(parsed.data.ownerId))[0];
    if (
      existing &&
      (existing.status === "pending" || existing.status === "processing")
    ) {
      return NextResponse.json(
        { error: "Die Firmendaten werden bereits verarbeitet.", job: existing },
        { status: 409 },
      );
    }

    const reference = getAdminDatabase()
      .collection(COMPANY_KNOWLEDGE_JOB_COLLECTION)
      .doc();
    const job: CompanyKnowledgeJob = {
      id: reference.id,
      ownerId: parsed.data.ownerId,
      status: "pending",
      stage: "Verarbeitung wird vorbereitet",
      sourceCount: 0,
      chunkCount: 0,
      createdAt: Date.now(),
    };
    await reference.create(job);
    after(async () => {
      await processCompanyKnowledgeJob(job.id, job.ownerId);
    });
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    console.error("Firmenwissen-Verarbeitung konnte nicht gestartet werden:", error);
    return NextResponse.json(
      { error: "Firmenwissen-Verarbeitung konnte nicht gestartet werden." },
      { status: 500 },
    );
  }
}
