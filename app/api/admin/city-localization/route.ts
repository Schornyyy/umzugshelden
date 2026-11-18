import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwnerOrCron } from "@/lib/adminApiAuth";
import { runCityLocalizationStep } from "@/lib/cityLocalization";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORK_BUDGET_MS = 55_000;

/** Ein Arbeitsschritt der Stadtseiten-Lokalisierung (Admin-Direktlauf). */
export async function POST(request: Request) {
  const deadlineAt = Date.now() + WORK_BUDGET_MS;
  const parsed = z.object({ ownerId: z.string().trim().min(1).max(200) }).safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (!(await authorizeAdminOwnerOrCron(request, parsed.data.ownerId))) {
    return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
  }
  try {
    const result = await runCityLocalizationStep(parsed.data.ownerId, deadlineAt);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("City localization step failed", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Schritt fehlgeschlagen." },
      { status: 500 },
    );
  }
}
