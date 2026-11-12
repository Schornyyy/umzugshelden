import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { discoverBusinesses } from "@/lib/b2bDiscovery";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { B2bLeadCategory } from "@/types/B2b";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type DiscoverRequest = {
  ownerId?: string;
  center?: string;
  radiusKm?: number;
  category?: B2bLeadCategory;
};

const LEAD_COLLECTION = "b2b_leads_umzugshelden";
const allowedCategories = new Set<B2bLeadCategory>([
  "real_estate_agent",
  "property_management",
  "housing_company",
  "senior_care",
]);

function leadId(ownerId: string, companyName: string, address: string) {
  return createHash("sha256")
    .update(`${ownerId}|${companyName.toLowerCase()}|${address.toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

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
    const database = getAdminDatabase();
    const now = Date.now();
    let imported = 0;
    let updated = 0;
    for (const business of importableBusinesses) {
      const id = leadId(ownerId, business.companyName, business.address);
      const reference = database.collection(LEAD_COLLECTION).doc(id);
      const existing = await reference.get();
      const existingData = existing.data();
      await reference.set(
        {
          ownerId,
          companyName: business.companyName,
          contactName: existingData?.contactName || business.contactName,
          email: business.email || existingData?.email || "",
          phone: business.phone || existingData?.phone || "",
          website: business.website || existingData?.website || "",
          address: business.address,
          category,
          status: existingData?.status ?? "new",
          nextFollowUpAt: existingData?.nextFollowUpAt ?? null,
          lastContactAt: existingData?.lastContactAt ?? null,
          googleMapsUrl: business.googleMapsUrl,
          source: "google_maps",
          aiOfferAngle: business.aiOfferAngle,
          aiEmailReason: business.aiEmailReason,
          aiStatus: business.aiStatus,
          distanceKm: business.distanceKm,
          createdAt: existingData?.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true },
      );
      if (existing.exists) updated += 1;
      else imported += 1;
    }

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
