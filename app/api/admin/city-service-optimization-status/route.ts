import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";

const querySchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  citySlug: z.string().trim().min(1).max(200),
  serviceKey: z.enum(CITY_SERVICE_KEYS),
});

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = querySchema.parse({
      ownerId: url.searchParams.get("ownerId"),
      citySlug: url.searchParams.get("citySlug"),
      serviceKey: url.searchParams.get("serviceKey"),
    });
    if (!(await authorizeAdminOwner(request, input.ownerId))) {
      return NextResponse.json(
        { success: false, error: "Nicht autorisiert" },
        { status: 401 },
      );
    }
    const id = `${safeDocumentPart(input.ownerId)}__${input.citySlug}__${input.serviceKey}`;
    const document = await getAdminDatabase()
      .collection("cityServiceOptimizationStates")
      .doc(id)
      .get();
    const state = document.data() ?? {};
    return NextResponse.json({
      success: true,
      state: {
        pendingProposalId: state.pendingProposalId ?? null,
        targetRank:
          typeof state.targetRank === "number" ? state.targetRank : null,
        suspendedForTopFive: state.suspendedForTopFive === true,
        lastGeneratedAt:
          typeof state.lastGeneratedAt === "number"
            ? state.lastGeneratedAt
            : null,
        lastAcceptedAt:
          typeof state.lastAcceptedAt === "number"
            ? state.lastAcceptedAt
            : null,
      },
    });
  } catch (error) {
    console.warn("Invalid optimization status request", error);
    return NextResponse.json(
      { success: false, error: "Status konnte nicht geladen werden" },
      { status: 400 },
    );
  }
}
