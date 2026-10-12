import { NextResponse } from "next/server";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { CityServiceOptimizationProposal } from "@/types/city/CityPageGeneration";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await getAdminDatabase()
      .collection("cityServiceOptimizationProposals")
      .where("ownerId", "==", ownerId)
      .limit(100)
      .get();
    const proposals = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          ...data,
          id: document.id,
          createdAt: new Date(Number(data.createdAt) || 0).toISOString(),
          decidedAt:
            typeof data.decidedAt === "number"
              ? new Date(data.decidedAt).toISOString()
              : undefined,
        } as CityServiceOptimizationProposal;
      })
      .filter((proposal) => proposal.status === "pending")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error("City service optimization list failed", error);
    return NextResponse.json(
      { success: false, error: "Freigaben konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}
