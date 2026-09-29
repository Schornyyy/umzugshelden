import {
  HANDOVER_ACCESS_COLLECTION,
  HANDOVER_PROTOCOL_COLLECTION,
  type CrmHandoverAccessRecord,
  parseHandoverAccessToken,
  tokenHashesMatch,
} from "@/lib/crmHandoverAccess";
import {
  getHandoverCompletionIssues,
  isHandoverSignatureDataUrl,
} from "@/lib/crmHandoverDocument";
import {
  HandoverRequestError,
  handoverErrorResponse,
  publicProtocol,
  removeUndefinedDeep,
  resolveHandoverAccess,
} from "@/lib/crmHandoverServer";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type {
  CrmHandoverIssue,
  CrmHandoverProtocol,
} from "@/types/Crm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";

const observationSchema = z.enum([
  "notRecorded",
  "confirmed",
  "notConfirmed",
  "notApplicable",
]);

const customerUpdateSchema = z.object({
  servicesCompleted: observationSchema,
  inventoryDelivered: observationSchema,
  visibleInspectionCompleted: observationSchema,
  keysReturned: observationSchema,
  siteLeftClean: observationSchema,
  reservations: z.string().max(10_000),
  notes: z.string().max(10_000),
  issues: z
    .array(
      z.object({
        id: z.string().max(100).optional(),
        type: z.enum([
          "preexisting",
          "transportDamage",
          "propertyDamage",
          "missing",
          "other",
        ]),
        subject: z.string().max(500),
        description: z.string().max(5_000),
        actionTaken: z.string().max(5_000),
      })
    )
    .max(30),
  accuracyConfirmed: z.boolean(),
  customerSignature: z.object({
    name: z.string().max(200),
    dataUrl: z.string().max(700_000),
  }),
});

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const { access, protocol } = await resolveHandoverAccess(token);
    return Response.json(
      { protocol: publicProtocol(protocol), expiresAt: access.expiresAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handoverErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const parsedToken = parseHandoverAccessToken(token);
    if (!parsedToken) {
      throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
    }

    const body = await request.json().catch(() => null);
    const parsedUpdates = customerUpdateSchema.safeParse(body?.updates);
    if (!parsedUpdates.success) {
      throw new HandoverRequestError(
        "Die eingegebenen Protokolldaten sind ungültig oder zu lang.",
        400
      );
    }
    if (!isHandoverSignatureDataUrl(parsedUpdates.data.customerSignature.dataUrl)) {
      throw new HandoverRequestError(
        "Die Kundenunterschrift fehlt oder ist ungültig.",
        400
      );
    }

    const database = getAdminDatabase();
    const accessReference = database
      .collection(HANDOVER_ACCESS_COLLECTION)
      .doc(parsedToken.protocolId);
    const protocolReference = database
      .collection(HANDOVER_PROTOCOL_COLLECTION)
      .doc(parsedToken.protocolId);

    const finalizedProtocol = await database.runTransaction(async (transaction) => {
      const [accessSnapshot, protocolSnapshot] = await Promise.all([
        transaction.get(accessReference),
        transaction.get(protocolReference),
      ]);
      if (!accessSnapshot.exists || !protocolSnapshot.exists) {
        throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
      }

      const access = accessSnapshot.data() as CrmHandoverAccessRecord;
      const currentProtocol = protocolSnapshot.data() as CrmHandoverProtocol;
      if (
        access.protocolId !== parsedToken.protocolId ||
        !tokenHashesMatch(access.tokenHash, parsedToken.tokenHash) ||
        currentProtocol.ownerId !== access.ownerId
      ) {
        throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
      }
      if (access.expiresAt <= Date.now()) {
        throw new HandoverRequestError(
          "Dieser Zugriffslink ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
          410
        );
      }
      if (currentProtocol.status === "finalized" || currentProtocol.finalizedAt) {
        throw new HandoverRequestError(
          "Das Übergabeprotokoll wurde bereits abgeschlossen.",
          409
        );
      }

      const now = Date.now();
      const issues: CrmHandoverIssue[] = parsedUpdates.data.issues.map(
        (issue) => ({
          id: issue.id || randomUUID(),
          type: issue.type,
          subject: issue.subject.trim(),
          description: issue.description.trim(),
          actionTaken: issue.actionTaken.trim(),
        })
      );
      const nextProtocol: CrmHandoverProtocol = removeUndefinedDeep({
        ...currentProtocol,
        ...parsedUpdates.data,
        reservations: parsedUpdates.data.reservations.trim(),
        notes: parsedUpdates.data.notes.trim(),
        issues,
        customerSignature: {
          name: parsedUpdates.data.customerSignature.name.trim(),
          dataUrl: parsedUpdates.data.customerSignature.dataUrl,
          signedAt: new Date(now).toISOString(),
        },
        status: "finalized",
        finalizedAt: now,
        updatedAt: now,
        customerAccess: {
          ...currentProtocol.customerAccess,
          email: access.email,
          sentAt: access.sentAt,
          expiresAt: access.expiresAt,
          completedAt: now,
        },
      });
      const validationIssues = getHandoverCompletionIssues(nextProtocol);
      if (validationIssues.length) {
        throw new HandoverRequestError(validationIssues[0], 400);
      }

      transaction.set(protocolReference, nextProtocol);
      transaction.update(accessReference, { completedAt: now });
      return nextProtocol;
    });

    return Response.json({
      success: true,
      protocol: publicProtocol(finalizedProtocol),
    });
  } catch (error) {
    return handoverErrorResponse(error);
  }
}