import { NextResponse } from "next/server";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { POST as runBlogGeneration } from "@/app/api/admin/generate-blog/route";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORKFLOW_COLLECTION = "blogGenerationWorkflows";

export async function GET(request: Request) {
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_OWNERID fehlt" },
      { status: 500 },
    );
  }

  const now = Date.now();
  const snapshot = await getAdminDatabase()
    .collection(WORKFLOW_COLLECTION)
    .where("ownerId", "==", ownerId)
    .get();
  const workflow = snapshot.docs
    .filter(
      (document) =>
        document.get("stage") !== "completed" &&
        Number(document.get("nextAttemptAt") || 0) <= now,
    )
    .sort(
      (left, right) =>
        Number(left.get("createdAt") || 0) -
        Number(right.get("createdAt") || 0),
    )[0];
  const authorization =
    request.headers.get("authorization") ||
    `Bearer ${process.env.CRON_SECRET || ""}`;
  const response = await runBlogGeneration(
    new Request(
      `${new URL(request.url).origin}/api/admin/generate-blog`,
      {
        method: "POST",
        headers: {
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ownerId,
          workflowId: workflow?.id,
          mode: "run",
        }),
      },
    ),
  );
  const data = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (response.ok && data?.success === true) {
    if (workflow) {
      await workflow.ref.set(
        {
          failureRetryCount: 0,
          lastError: null,
          nextAttemptAt: null,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    }
    return NextResponse.json(data);
  }

  if (workflow) {
    const retryCount = Number(workflow.get("failureRetryCount") || 0) + 1;
    const retryDelay = Math.min(
      24 * 60 * 60 * 1_000,
      5 * 60 * 1_000 * 2 ** Math.min(retryCount - 1, 8),
    );
    await workflow.ref.set(
      {
        failureRetryCount: retryCount,
        lastError:
          typeof data?.error === "string"
            ? data.error.slice(0, 1_000)
            : "Blog-Workflow fehlgeschlagen",
        lastFailureAt: now,
        nextAttemptAt: now + retryDelay,
        updatedAt: now,
      },
      { merge: true },
    );
    return NextResponse.json({
      success: true,
      pending: true,
      stage: "error-retry",
      workflowId: workflow.id,
      retryAt: new Date(now + retryDelay).toISOString(),
    });
  }

  return NextResponse.json(
    data ?? { success: false, error: "Blog-Cron fehlgeschlagen" },
    { status: response.status },
  );
}
