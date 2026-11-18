import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/adminApiAuth";
import { runCityLocalizationStep } from "@/lib/cityLocalization";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORK_BUDGET_MS = 55_000;

/** Arbeitet einen laufenden Lokalisierungs-Lauf weiter ab, auch ohne offenes Admin-Fenster. */
export async function GET(request: Request) {
  const deadlineAt = Date.now() + WORK_BUDGET_MS;
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
  }
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return NextResponse.json({ success: false, error: "NEXT_PUBLIC_OWNERID fehlt" }, { status: 500 });
  }
  try {
    return NextResponse.json({ success: true, ...(await runCityLocalizationStep(ownerId, deadlineAt)) });
  } catch (error) {
    console.error("City localization cron failed", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Fehler" }, { status: 500 });
  }
}
