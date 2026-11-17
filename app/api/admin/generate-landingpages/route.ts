import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import { runSeoLandingCampaignStep } from "@/lib/seoLandingPageWorkflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORK_BUDGET_MS = 55_000;

const requestSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  campaignId: z.string().trim().min(1).max(200),
});

export async function POST(request: Request) {
  const deadlineAt = Date.now() + WORK_BUDGET_MS;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (!(await authorizeAdminOwnerOrCron(request, parsed.data.ownerId))) {
    return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
  }
  const result = await runSeoLandingCampaignStep(
    parsed.data.campaignId,
    parsed.data.ownerId,
    deadlineAt,
  );
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
