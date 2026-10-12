import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
} from "@/types/city/CityServicePage";
import type { CityServiceOptimizationProposal } from "@/types/city/CityPageGeneration";

export const runtime = "nodejs";

const decisionSchema = z.object({
  ownerId: z.string().trim().min(1).max(200),
  action: z.enum(["accept", "reject"]),
});

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

function serializeProposal(
  id: string,
  data: FirebaseFirestore.DocumentData,
): CityServiceOptimizationProposal {
  return {
    ...data,
    id,
    createdAt: new Date(data.createdAt).toISOString(),
    decidedAt:
      typeof data.decidedAt === "number"
        ? new Date(data.decidedAt).toISOString()
        : undefined,
  } as CityServiceOptimizationProposal;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await context.params;
  const ownerId = new URL(request.url).searchParams.get("ownerId")?.trim() ?? "";
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }
  const document = await getAdminDatabase()
    .collection("cityServiceOptimizationProposals")
    .doc(proposalId)
    .get();
  if (!document.exists || document.get("ownerId") !== ownerId) {
    return NextResponse.json(
      { success: false, error: "Vorschlag nicht gefunden" },
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
      .collection("cityServiceOptimizationProposals")
      .doc(proposalId);
    const now = Date.now();
    let citySlug = "";
    let serviceKey: CityServiceKey | undefined;

    await database.runTransaction(async (transaction) => {
      const proposalDocument = await transaction.get(proposalReference);
      if (
        !proposalDocument.exists ||
        proposalDocument.get("ownerId") !== input.ownerId
      ) {
        throw new Error("Vorschlag nicht gefunden");
      }
      if (proposalDocument.get("status") !== "pending") {
        throw new Error("Über diesen Vorschlag wurde bereits entschieden.");
      }
      const proposal = proposalDocument.data()!;
      citySlug = String(proposal.citySlug);
      const rawServiceKey = String(proposal.serviceKey);
      if (!(CITY_SERVICE_KEYS as readonly string[]).includes(rawServiceKey)) {
        throw new Error("Der Vorschlag enthält eine ungültige Dienstleistung.");
      }
      serviceKey = rawServiceKey as CityServiceKey;
      const stateId = `${safeDocumentPart(input.ownerId)}__${citySlug}__${serviceKey}`;
      const stateReference = database
        .collection("cityServiceOptimizationStates")
        .doc(stateId);

      if (input.action === "accept") {
        const pageReference = database
          .collection("cityServicePages")
          .doc(stateId);
        const templateReference = database
          .collection("cityServiceTemplates")
          .doc(`${safeDocumentPart(input.ownerId)}__${serviceKey}`);
        const [currentPage, currentTemplate] = await Promise.all([
          transaction.get(pageReference),
          transaction.get(templateReference),
        ]);
        const current = currentPage.data() ?? {};
        const latestUpdate = Math.max(
          typeof current.updatedAt === "number" ? current.updatedAt : 0,
          typeof currentTemplate.get("updatedAt") === "number"
            ? currentTemplate.get("updatedAt")
            : 0,
        );
        if (latestUpdate > Number(proposal.previous?.updatedAt ?? 0)) {
          throw new Error(
            "Die Seite wurde nach Erstellung dieses Vorschlags geändert. Bitte den Vorschlag ablehnen und später neu erzeugen.",
          );
        }
        transaction.set(pageReference, {
          ...current,
          id: stateId,
          ownerId: input.ownerId,
          cityName: proposal.cityName,
          citySlug,
          serviceKey,
          templateId: `${safeDocumentPart(input.ownerId)}__${serviceKey}`,
          inheritTemplate: false,
          blocks: proposal.draft.blocks,
          seo: proposal.draft.seo,
          published:
            typeof current.published === "boolean" ? current.published : true,
          createdAt:
            typeof current.createdAt === "number" ? current.createdAt : now,
          updatedAt: now,
        });
      }

      transaction.update(proposalReference, {
        status: input.action === "accept" ? "accepted" : "rejected",
        decidedAt: now,
        decidedBy: "admin",
      });
      transaction.set(
        stateReference,
        {
          pendingProposalId: null,
          ...(input.action === "accept" ? { lastAcceptedAt: now } : {}),
          updatedAt: now,
        },
        { merge: true },
      );
    });

    if (input.action === "accept" && serviceKey) {
      revalidatePath(`/stadt/${citySlug}/${serviceKey}`);
      revalidatePath("/sitemaps/companycity/sitemap.xml");
    }
    return NextResponse.json({
      success: true,
      status: input.action === "accept" ? "accepted" : "rejected",
    });
  } catch (error) {
    console.error("City service optimization decision failed", error);
    const isInputError = error instanceof z.ZodError;
    return NextResponse.json(
      {
        success: false,
        error: isInputError
          ? "Ungültige Entscheidung"
          : error instanceof Error
            ? error.message
            : "Die Entscheidung konnte nicht gespeichert werden.",
      },
      { status: isInputError ? 400 : 409 },
    );
  }
}
