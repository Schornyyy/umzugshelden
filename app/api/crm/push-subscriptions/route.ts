import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase, getAdminMessaging } from "@/lib/firebaseAdmin";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUBSCRIPTION_COLLECTION = "crm_push_subscriptions_umzugshelden";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    ownerId?: string;
    token?: string;
    sendTest?: boolean;
  } | null;
  const ownerId = payload?.ownerId?.trim() ?? "";
  const token = payload?.token?.trim() ?? "";
  if (!ownerId || !token) {
    return NextResponse.json(
      { error: "Owner-ID und Push-Token werden benötigt." },
      { status: 400 },
    );
  }
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const id = createHash("sha256").update(token).digest("hex");
  if (payload?.sendTest === true) {
    try {
      await getAdminMessaging().send({
        token,
        data: {
          title: "Erinnerungen aktiviert",
          body: "Dieses Gerät erhält jetzt Erinnerungen vor Besichtigungsterminen.",
          link: `/admin/${ownerId}/crm`,
        },
        webpush: {
          headers: { Urgency: "high" },
          fcmOptions: { link: `/admin/${ownerId}/crm` },
        },
      });
    } catch (error) {
      console.error("Push-Testnachricht konnte nicht gesendet werden.", error);
      return NextResponse.json(
        {
          error:
            "Das Gerät wurde erkannt, aber die Test-Benachrichtigung konnte nicht zugestellt werden.",
        },
        { status: 502 },
      );
    }
  }
  await getAdminDatabase()
    .collection(SUBSCRIPTION_COLLECTION)
    .doc(id)
    .set(
      {
        ownerId,
        token,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  return NextResponse.json({ success: true });
}
