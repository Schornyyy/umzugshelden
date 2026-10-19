import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase, getAdminMessaging } from "@/lib/firebaseAdmin";
import type { CrmCustomer } from "@/types/Crm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CUSTOMER_COLLECTION = "crm_customers_umzugshelden";
const SUBSCRIPTION_COLLECTION = "crm_push_subscriptions_umzugshelden";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    ownerId?: string;
    customerId?: string;
    appointmentId?: string;
  } | null;
  const ownerId = payload?.ownerId?.trim() ?? "";
  const customerId = payload?.customerId?.trim() ?? "";
  const appointmentId = payload?.appointmentId?.trim() ?? "";
  if (!ownerId || !customerId || !appointmentId) {
    return NextResponse.json(
      { error: "Owner, Kunde und Termin werden benötigt." },
      { status: 400 },
    );
  }
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const database = getAdminDatabase();
  const [customerSnapshot, subscriptionSnapshot] = await Promise.all([
    database.collection(CUSTOMER_COLLECTION).doc(customerId).get(),
    database
      .collection(SUBSCRIPTION_COLLECTION)
      .where("ownerId", "==", ownerId)
      .get(),
  ]);
  if (!customerSnapshot.exists) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }
  const customer = customerSnapshot.data() as CrmCustomer;
  if (customer.ownerId !== ownerId) {
    return NextResponse.json(
      { error: "Der Kunde gehört nicht zu diesem CRM." },
      { status: 403 },
    );
  }
  const appointment = customer.appointments?.find(
    (candidate) => candidate.id === appointmentId,
  );
  if (!appointment) {
    return NextResponse.json({ error: "Termin nicht gefunden." }, { status: 404 });
  }
  const tokens = subscriptionSnapshot.docs
    .map((document) => String(document.get("token") ?? "").trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json(
      {
        error:
          "Für dieses CRM ist noch kein Gerät für Erinnerungen registriert.",
      },
      { status: 409 },
    );
  }

  const link = `/admin/${ownerId}/crm/customers/${customerId}/appointments/${appointmentId}`;
  const response = await getAdminMessaging().sendEachForMulticast({
    tokens,
    data: {
      title: "Besichtigungstermin starten",
      body: `${appointment.title} bei ${customer.name} kann jetzt gestartet werden.`,
      link,
    },
    webpush: {
      headers: { Urgency: "high" },
      fcmOptions: { link },
    },
  });
  if (response.successCount === 0) {
    console.error(
      "Manuelle Terminerinnerung konnte nicht zugestellt werden.",
      response.responses.map((result) => result.error?.code).filter(Boolean),
    );
    return NextResponse.json(
      { error: "Die Erinnerung konnte an kein Gerät zugestellt werden." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    sent: response.successCount,
    failed: response.failureCount,
  });
}
