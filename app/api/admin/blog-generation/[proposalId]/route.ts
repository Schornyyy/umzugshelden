import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  blogKeywordRegistryId,
  normalizeBlogKeyword,
} from "@/lib/blogKeywords";
import type { BlogGenerationProposal } from "@/types/blog/BlogGeneration";

export const runtime = "nodejs";
export const maxDuration = 30;

const PROPOSAL_COLLECTION = "blogGenerationProposals";
const BLOG_COLLECTION = "blogPages_umzugshelden";
const KEYWORD_REGISTRY_COLLECTION = "blogKeywordRegistry";

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
      const draft = proposal.draft;
      const primaryKeyword = String(
        draft.primaryKeyword || proposal.keyword || draft.keywords?.[0] || "",
      );
      const primaryKeywordNormalized =
        draft.primaryKeywordNormalized ||
        normalizeBlogKeyword(primaryKeyword);
      if (!primaryKeywordNormalized) {
        throw new Error("Der Blogvorschlag enthält kein gültiges Hauptkeyword.");
      }
      const keywordReference = database
        .collection(KEYWORD_REGISTRY_COLLECTION)
        .doc(blogKeywordRegistryId(primaryKeyword));
      const keywordDocument = await transaction.get(keywordReference);
      const keywordRegistry = keywordDocument.data();
      if (input.action === "accept") {
        const now = Date.now();
        const targetBlogId =
          typeof proposal.targetBlogId === "string"
            ? proposal.targetBlogId
            : undefined;
        const duplicateKeywordBlogs = await transaction.get(
          database
            .collection(BLOG_COLLECTION)
            .where(
              "primaryKeywordNormalized",
              "==",
              primaryKeywordNormalized,
            ),
        );
        if (
          duplicateKeywordBlogs.docs.some(
            (blogDocument) => blogDocument.id !== targetBlogId,
          )
        ) {
          throw new Error(
            `Das Hauptkeyword "${primaryKeyword}" ist bereits einem anderen Blog zugeordnet.`,
          );
        }
        if (
          keywordDocument.exists &&
          keywordRegistry?.proposalId !== proposalId &&
          keywordRegistry?.blogId !== targetBlogId
        ) {
          throw new Error(
            `Das Hauptkeyword "${primaryKeyword}" ist bereits einem anderen Blog zugeordnet.`,
          );
        }
        let publishedBlogId: string;
        if (targetBlogId) {
          const pageReference = database
            .collection(BLOG_COLLECTION)
            .doc(targetBlogId);
          const currentPage = await transaction.get(pageReference);
          if (!currentPage.exists) {
            throw new Error("Der zu optimierende Blogartikel existiert nicht mehr.");
          }
          const current = currentPage.data()!;
          if (
            Number(current.updatedAt || 0) >
            Number(proposal.previousBlog?.updatedAt || 0)
          ) {
            throw new Error(
              "Der Blogartikel wurde nach Erstellung des Vorschlags geändert.",
            );
          }
          publishedBlogId = pageReference.id;
          publishedPath = String(current.path || "");
          transaction.set(
            pageReference,
            {
              titel: draft.title,
              description: draft.description,
              keywords: draft.keywords,
              primaryKeyword,
              primaryKeywordNormalized,
              keywordType: draft.keywordType || "primary",
              meta_description: draft.metaDescription,
              serviceBlocks: draft.blocks,
              serviceKey: draft.serviceKey,
              cityName: draft.cityName,
              lastOptimizedAt: now,
              updatedAt: now,
            },
            { merge: true },
          );
        } else {
          publishedPath = `${draft.mainCategory}/${draft.subcategorySlug}/${draft.slug}`;
          const duplicate = await transaction.get(
            database
              .collection(BLOG_COLLECTION)
              .where("path", "==", publishedPath)
              .limit(1),
          );
          if (!duplicate.empty) {
            throw new Error("Unter dieser Blog-URL existiert bereits ein Beitrag.");
          }
          const pageReference = database.collection(BLOG_COLLECTION).doc();
          publishedBlogId = pageReference.id;
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
            primaryKeyword,
            primaryKeywordNormalized,
            keywordType: draft.keywordType || "primary",
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
        transaction.set(keywordReference, {
          keyword: primaryKeyword,
          normalizedKeyword: primaryKeywordNormalized,
          keywordType: draft.keywordType || "primary",
          status: "published",
          proposalId,
          blogId: publishedBlogId,
          ownerId: input.ownerId,
          expiresAt: null,
          updatedAt: now,
        });
      } else if (keywordRegistry?.proposalId === proposalId) {
        transaction.delete(keywordReference);
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
