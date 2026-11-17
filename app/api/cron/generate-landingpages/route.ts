import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  isSeoLandingCampaignActive,
  SEO_LANDING_CAMPAIGN_COLLECTION,
} from "@/lib/seoLandingPages";
import { runSeoLandingCampaignStep } from "@/lib/seoLandingPageWorkflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORK_BUDGET_MS = 55_000;

/** Arbeitet offene Keyword-Kampagnen weiter ab, auch wenn kein Admin-Fenster offen ist. */
export async function GET(request: Request) {
  const deadlineAt = Date.now() + WORK_BUDGET_MS;
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
  }
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return NextResponse.json({ success: false, error: "NEXT_PUBLIC_OWNERID fehlt" }, { status: 500 });
  }

  const snapshot = await getAdminDatabase()
    .collection(SEO_LANDING_CAMPAIGN_COLLECTION)
    .where("ownerId", "==", ownerId)
    .get();
  const campaign = snapshot.docs
    .filter(
      (document) =>
        isSeoLandingCampaignActive(document.get("stage")) &&
        Number(document.get("lockedUntil") || 0) <= Date.now(),
    )
    .sort((left, right) => Number(left.get("createdAt") || 0) - Number(right.get("createdAt") || 0))[0];
  if (!campaign) {
    return NextResponse.json({ success: true, pending: false, message: "Keine offene Kampagne." });
  }
  const result = await runSeoLandingCampaignStep(campaign.id, ownerId, deadlineAt);
  return NextResponse.json({ ...result, campaignId: campaign.id });
}
