import "server-only";

import { createHash } from "node:crypto";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { B2bLead, B2bLeadCategory } from "@/types/B2b";

export const B2B_LEAD_COLLECTION = "b2b_leads_umzugshelden";

export type B2bLeadInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  category: B2bLeadCategory;
  googleMapsUrl: string;
  aiOfferAngle: string;
  aiEmailReason: string;
  aiStatus: B2bLead["aiStatus"];
  distanceKm: number | null;
  searchTerm?: string;
};

export function b2bLeadId(ownerId: string, companyName: string, address: string) {
  return createHash("sha256")
    .update(`${ownerId}|${companyName.toLowerCase()}|${address.toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

export function websiteDomain(website: string) {
  const match = website.trim().match(/^https?:\/\/([^/?#:\s]+)/i);
  return match ? match[1].toLowerCase().replace(/^www\./, "") : "";
}

/** Legt Leads an oder aktualisiert sie, ohne CRM-Status und gepflegte Daten zu überschreiben. */
export async function upsertB2bLeads(ownerId: string, leads: readonly B2bLeadInput[]) {
  const database = getAdminDatabase();
  const now = Date.now();
  let imported = 0;
  let updated = 0;
  for (const lead of leads) {
    const reference = database
      .collection(B2B_LEAD_COLLECTION)
      .doc(b2bLeadId(ownerId, lead.companyName, lead.address));
    const existing = await reference.get();
    const existingData = existing.data();
    await reference.set(
      {
        ownerId,
        companyName: lead.companyName,
        contactName: existingData?.contactName || lead.contactName,
        email: lead.email || existingData?.email || "",
        phone: lead.phone || existingData?.phone || "",
        website: lead.website || existingData?.website || "",
        address: lead.address,
        category: lead.category,
        status: existingData?.status ?? "new",
        nextFollowUpAt: existingData?.nextFollowUpAt ?? null,
        lastContactAt: existingData?.lastContactAt ?? null,
        googleMapsUrl: lead.googleMapsUrl,
        source: "google_maps",
        aiOfferAngle: lead.aiOfferAngle || existingData?.aiOfferAngle || "",
        aiEmailReason: lead.aiEmailReason || existingData?.aiEmailReason || "",
        aiStatus: lead.aiStatus,
        distanceKm: lead.distanceKm,
        ...(lead.searchTerm ? { searchTerm: lead.searchTerm } : {}),
        createdAt: existingData?.createdAt ?? now,
        updatedAt: now,
      },
      { merge: true },
    );
    if (existing.exists) updated += 1;
    else imported += 1;
  }
  return { imported, updated };
}

/** Domains aller bereits gespeicherten Leads, um sie nicht erneut zu recherchieren. */
export async function listKnownB2bLeadDomains(ownerId: string) {
  const snapshot = await getAdminDatabase()
    .collection(B2B_LEAD_COLLECTION)
    .where("ownerId", "==", ownerId)
    .select("website")
    .get();
  return [
    ...new Set(
      snapshot.docs
        .map((document) => websiteDomain(String(document.get("website") || "")))
        .filter(Boolean),
    ),
  ];
}
