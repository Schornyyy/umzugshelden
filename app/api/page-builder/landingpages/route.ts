import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  createLandingPageFromTemplate,
  landingPageServiceKeySchema,
} from "@/lib/landingPageSettings";
import {
  LANDING_PAGE_COLLECTION,
  listPublicLandingPages,
} from "@/lib/landingPageSettingsServer";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ownerSchema = z.string().trim().min(1).max(200);
const generateSchema = z.object({
  ownerId: ownerSchema,
  serviceKey: landingPageServiceKeySchema,
});

export async function GET(request: Request) {
  try {
    const ownerId = new URL(request.url).searchParams.get("ownerId") ?? "";
    if (!ownerSchema.safeParse(ownerId).success) {
      return NextResponse.json({ error: "Owner-ID fehlt." }, { status: 400 });
    }
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const pages = (await listPublicLandingPages()).filter(
      (page) => page.ownerId === ownerId,
    );
    return NextResponse.json({ pages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Landingpages konnten nicht geladen werden:", error);
    return NextResponse.json(
      { error: "Landingpages konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bitte eine gültige Dienstleistung auswählen." },
        { status: 400 },
      );
    }
    if (!(await authorizeAdminOwner(request, parsed.data.ownerId))) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const page = createLandingPageFromTemplate(
      parsed.data.serviceKey,
      parsed.data.ownerId,
    );
    const reference = getAdminDatabase()
      .collection(LANDING_PAGE_COLLECTION)
      .doc(page.slug);
    const existing = await reference.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Für diese Dienstleistung existiert bereits eine Landingpage." },
        { status: 409 },
      );
    }

    await reference.create(page);
    revalidatePath(`/landingpage/${page.slug}`);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Landingpage konnte nicht generiert werden:", error);
    return NextResponse.json(
      { error: "Landingpage konnte nicht generiert werden." },
      { status: 500 },
    );
  }
}
