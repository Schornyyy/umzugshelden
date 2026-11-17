import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { discoverBusinesses } from "@/lib/b2bDiscovery";
import { B2B_CATEGORY_VALUES } from "@/lib/b2bCategories";
import { upsertB2bLeads } from "@/lib/b2bLeadStore";
import type { B2bLeadCategory } from "@/types/B2b";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type DiscoverRequest = {
  ownerId?: string;
  center?: string;
  radiusKm?: number;
  category?: B2bLeadCategory;
};

const allowedCategories = new Set<B2bLeadCategory>(B2B_CATEGORY_VALUES);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiscoverRequest;
    const ownerId = body.ownerId?.trim() ?? "";
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const center = body.center?.trim() ?? "";
    const category = body.category;
    const radiusKm = body.radiusKm ?? 50;
    if (!center || center.length > 120) {
      return NextResponse.json(
        { error: "Bitte einen gültigen Suchmittelpunkt angeben." },
        { status: 400 },
      );
    }
    if (!category || !allowedCategories.has(category)) {
      return NextResponse.json(
        { error: "Bitte eine gültige Unternehmenskategorie wählen." },
        { status: 400 },
      );
    }
    if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50) {
      return NextResponse.json(
        { error: "Der Suchradius muss zwischen 1 und 50 km liegen." },
        { status: 400 },
      );
    }

    const businesses = await discoverBusinesses({
      category,
      center,
      radiusKm,
    });
    const importableBusinesses = businesses.filter(
      (business) =>
        business.email &&
        business.contactName &&
        business.website,
    );
    const { imported, updated } = await upsertB2bLeads(
      ownerId,
      importableBusinesses.map((business) => ({ ...business, category })),
    );

    return NextResponse.json({
      success: true,
      found: businesses.length,
      withEmail: importableBusinesses.length,
      imported,
      updated,
      missingEmail: businesses
        .filter((business) => !business.email)
        .map((business) => business.companyName),
      aiFailed: businesses.filter((business) => business.aiStatus === "failed").length,
    });
  } catch (error) {
    console.error("B2B discovery failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Die B2B-Recherche ist fehlgeschlagen.",
      },
      { status: 500 },
    );
  }
}
