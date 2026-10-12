import { NextResponse } from "next/server";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";

export async function GET(request: Request) {
  const ownerId = new URL(request.url).searchParams.get("ownerId")?.trim() || "";
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }
  try {
    const snapshot = await getAdminDatabase()
      .collection("blogGenerationProposals")
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
        } as BlogGenerationProposal;
      })
      .filter((proposal) => proposal.status === "pending")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error("Blog generation list failed", error);
    return NextResponse.json(
      { success: false, error: "Blogfreigaben konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}
