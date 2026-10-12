import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";

export const runtime = "nodejs";
export const maxDuration = 30;

const PROPOSAL_COLLECTION = "blogGenerationProposals";
const BLOG_COLLECTION = "blogPages_umzugshelden";

const decisionSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  action: z.enum(["accept", "reject"]),
});

function serializeProposal(
  id: string,
  data: FirebaseFirestore.DocumentData,
): BlogGenerationProposal {
  return {
    ...data,
    id,
    createdAt: new Date(Number(data.createdAt) || 0).toISOString(),
    decidedAt:
      typeof data.decidedAt === "number"
        ? new Date(data.decidedAt).toISOString()
        : undefined,
  } as BlogGenerationProposal;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await context.params;
  const ownerId = new URL(request.url).searchParams.get("ownerId")?.trim() || "";
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }
  const document = await getAdminDatabase()
    .collection(PROPOSAL_COLLECTION)
    .doc(proposalId)
    .get();
  if (!document.exists || document.get("ownerId") !== ownerId) {
    return NextResponse.json(
      { success: false, error: "Blogvorschlag nicht gefunden" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    success: true,
    proposal: serializeProposal(document.id, document.data()!),
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await context.params;
  try {
    const input = decisionSchema.parse(await request.json());
    if (!(await authorizeAdminOwner(request, input.ownerId))) {
      return NextResponse.json(
        { success: false, error: "Nicht autorisiert" },
        { status: 401 },
      );
    }
    const database = getAdminDatabase();
    const proposalReference = database
      .collection(PROPOSAL_COLLECTION)
      .doc(proposalId);
    let publishedPath = "";
    await database.runTransaction(async (transaction) => {
      const document = await transaction.get(proposalReference);
      if (
        !document.exists ||
        document.get("ownerId") !== input.ownerId
      ) {
        throw new Error("Blogvorschlag nicht gefunden");
      }
      if (document.get("status") !== "pending") {
        throw new Error("Über diesen Blogvorschlag wurde bereits entschieden.");
      }
      const proposal = document.data()!;
      if (input.action === "accept") {
        const draft = proposal.draft;
        publishedPath = `${draft.mainCategory}/${draft.subcategorySlug}/${draft.slug}`;
        const duplicate = await database
          .collection(BLOG_COLLECTION)
          .where("path", "==", publishedPath)
          .limit(1)
          .get();
        if (!duplicate.empty) {
          throw new Error("Unter dieser Blog-URL existiert bereits ein Beitrag.");
        }
        const now = Date.now();
        const pageReference = database.collection(BLOG_COLLECTION).doc();
        transaction.create(pageReference, {
          titel: draft.title,
          slug: draft.slug,
          path: publishedPath,
          parentId: null,
          description: draft.description,
          subcategorySlug: draft.subcategorySlug,
          mainCategory: draft.mainCategory,
          thumbnailUrl: null,
          keywords: draft.keywords,
          meta_description: draft.metaDescription,
          sections: [],
          faq: [],
          blocks: [],
          serviceBlocks: draft.blocks,
          serviceKey: draft.serviceKey,
          cityName: draft.cityName,
          visible: true,
          createdAt: now,
          updatedAt: now,
        });
      }
      transaction.update(proposalReference, {
        status: input.action === "accept" ? "accepted" : "rejected",
        decidedAt: Date.now(),
        decidedBy: "admin",
      });
    });
    if (publishedPath) {
      revalidatePath(`/blog/${publishedPath}`);
      revalidatePath("/blog");
      revalidatePath("/sitemaps/blog/sitemap.xml");
    }
    return NextResponse.json({
      success: true,
      status: input.action === "accept" ? "accepted" : "rejected",
      publishedPath: publishedPath || undefined,
    });
  } catch (error) {
    console.error("Blog generation decision failed", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof z.ZodError
            ? "Ungültige Entscheidung"
            : error instanceof Error
              ? error.message
              : "Die Entscheidung konnte nicht gespeichert werden.",
      },
      { status: error instanceof z.ZodError ? 400 : 409 },
    );
  }
}
