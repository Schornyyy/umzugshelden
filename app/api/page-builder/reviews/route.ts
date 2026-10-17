import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { reviewSettingsSchema } from "@/lib/reviewSettings";
import { getPublicReviewSettings } from "@/lib/reviewSettingsServer";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveSchema = reviewSettingsSchema.extend({
  ownerId: z.string().trim().min(1).max(200),
});

function settingsDocument() {
  return getAdminDatabase().collection("page_builder_elements_umzugshelden").doc("reviews");
}

export async function GET() {
  try {
    const settings = await getPublicReviewSettings();
    return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Bewertungen konnten nicht geladen werden:", error);
    return NextResponse.json({ error: "Bewertungen konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bitte Namen, Bewertungstexte und Sterne (1 bis 5) prüfen." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const settings = reviewSettingsSchema.parse(parsed.data);
    await settingsDocument().set(settings);
    revalidatePath("/stadt", "layout");
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Bewertungen konnten nicht gespeichert werden:", error);
    return NextResponse.json({ error: "Bewertungen konnten nicht gespeichert werden." }, { status: 500 });
  }
}
