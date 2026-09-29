import { sendCustomEmail } from "@/actions/emailActions";
import {
  createHandoverAccessToken,
  HANDOVER_ACCESS_COLLECTION,
  HANDOVER_ACCESS_DURATION_MS,
  HANDOVER_PROTOCOL_COLLECTION,
  type CrmHandoverAccessRecord,
} from "@/lib/crmHandoverAccess";
import { getHandoverShareIssues } from "@/lib/crmHandoverDocument";
import {
  HandoverRequestError,
  handoverErrorResponse,
  removeUndefinedDeep,
  requireCrmOwner,
} from "@/lib/crmHandoverServer";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { CrmHandoverProtocol } from "@/types/Crm";

export const runtime = "nodejs";
export const maxDuration = 60;

type ShareProtocolRequest = {
  to?: string;
  subject?: string;
  message?: string;
  protocol?: CrmHandoverProtocol;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShareProtocolRequest;
    const protocol = body.protocol;
    const to = body.to?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!protocol?.id || !protocol.ownerId) {
      throw new HandoverRequestError("Protokolldaten fehlen.", 400);
    }
    await requireCrmOwner(request, protocol.ownerId);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new HandoverRequestError(
        "Bitte eine gültige Empfängeradresse angeben.",
        400
      );
    }
    if (!subject || !message || subject.length > 200 || message.length > 10_000) {
      throw new HandoverRequestError(
        "Betreff und Nachricht sind erforderlich und dürfen nicht zu lang sein.",
        400
      );
    }

    const now = Date.now();
    const expiresAt = now + HANDOVER_ACCESS_DURATION_MS;
    const nextProtocol: CrmHandoverProtocol = removeUndefinedDeep({
      ...protocol,
      customerEmail: to,
      status: "draft",
      finalizedAt: undefined,
      customerAccess: {
        email: to,
        sentAt: now,
        expiresAt,
      },
      updatedAt: now,
    });
    const validationIssues = getHandoverShareIssues(nextProtocol);
    if (validationIssues.length) {
      return Response.json(
        {
          error: "Das Protokoll ist noch nicht versandbereit.",
          issues: validationIssues,
        },
        { status: 400 }
      );
    }
    if (Buffer.byteLength(JSON.stringify(nextProtocol), "utf8") > 900_000) {
      throw new HandoverRequestError(
        "Das Protokoll ist zu groß. Bitte Fotos oder Unterschriften reduzieren.",
        400
      );
    }

    const { token, tokenHash } = createHandoverAccessToken(protocol.id);
    const accessRecord: CrmHandoverAccessRecord = {
      protocolId: protocol.id,
      ownerId: protocol.ownerId,
      tokenHash,
      email: to,
      sentAt: now,
      expiresAt,
    };
    const database = getAdminDatabase();
    const protocolReference = database
      .collection(HANDOVER_PROTOCOL_COLLECTION)
      .doc(protocol.id);
    const accessReference = database
      .collection(HANDOVER_ACCESS_COLLECTION)
      .doc(protocol.id);

    await database.runTransaction(async (transaction) => {
      const persistedSnapshot = await transaction.get(protocolReference);
      const persisted = persistedSnapshot.data() as
        | Partial<CrmHandoverProtocol>
        | undefined;
      if (persistedSnapshot.exists && persisted?.ownerId !== protocol.ownerId) {
        throw new HandoverRequestError("Kein Zugriff auf dieses Protokoll.", 403);
      }
      if (persisted?.status === "finalized" || persisted?.finalizedAt) {
        throw new HandoverRequestError(
          "Ein finalisiertes Protokoll kann nicht erneut zur Bearbeitung versendet werden.",
          409
        );
      }
      transaction.set(protocolReference, nextProtocol);
      transaction.set(accessReference, accessRecord);
    });

    const accessUrl = `${getBaseUrl(request)}/uebergabe/${encodeURIComponent(token)}`;
    const emailResult = await sendCustomEmail({
      to,
      subject,
      templatePath: "CrmHandoverInvitationEmail.html",
      replacements: {
        companyName: escapeHtml(protocol.contractor.companyName),
        customerName: escapeHtml(
          protocol.customerName || protocol.customerCompany || "Damen und Herren"
        ),
        messageHtml: escapeHtml(message).replaceAll("\n", "<br />"),
        protocolNumber: escapeHtml(protocol.protocolNumber),
        moveDate: escapeHtml(
          new Date(`${protocol.moveDate}T12:00:00`).toLocaleDateString("de-DE")
        ),
        accessUrl: escapeHtml(accessUrl),
        expiresAt: escapeHtml(new Date(expiresAt).toLocaleString("de-DE")),
        senderName: escapeHtml(protocol.contractor.proprietor),
      },
    });
    if (!emailResult.success) {
      throw new Error(emailResult.error || "Die E-Mail konnte nicht versendet werden.");
    }

    return Response.json({ protocol: nextProtocol, expiresAt });
  } catch (error) {
    return handoverErrorResponse(error);
  }
}