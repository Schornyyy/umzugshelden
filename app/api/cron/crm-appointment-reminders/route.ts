import { authorizeCronRequest } from "@/lib/adminApiAuth";
import { getAdminDatabase, getAdminMessaging } from "@/lib/firebaseAdmin";
import type { CrmAppointment, CrmCustomer } from "@/types/Crm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CUSTOMER_COLLECTION = "crm_customers_umzugshelden";
const SUBSCRIPTION_COLLECTION = "crm_push_subscriptions_umzugshelden";
const TEN_MINUTES = 10 * 60_000;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_OWNERID fehlt." },
      { status: 500 },
    );
  }

  const database = getAdminDatabase();
  const [customerSnapshot, subscriptionSnapshot] = await Promise.all([
    database.collection(CUSTOMER_COLLECTION).where("ownerId", "==", ownerId).get(),
    database
      .collection(SUBSCRIPTION_COLLECTION)
      .where("ownerId", "==", ownerId)
      .get(),
  ]);
  const tokens = subscriptionSnapshot.docs
    .map((document) => String(document.get("token") ?? "").trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json({ success: true, sent: 0, reason: "no-subscriptions" });
  }

  const now = Date.now();
  let sent = 0;
  for (const customerDocument of customerSnapshot.docs) {
    const customer = customerDocument.data() as CrmCustomer;
    const dueAppointments = (customer.appointments ?? []).filter((appointment) => {
      const startAt = new Date(appointment.startAt).getTime();
      const reminderAt = startAt - TEN_MINUTES;
      return (
        appointment.type === "visit" &&
        !appointment.completed &&
        !appointment.reminderSentAt &&
        Number.isFinite(startAt) &&
        reminderAt <= now &&
        startAt > now
      );
    });
    if (dueAppointments.length === 0) continue;

    const sentAppointmentIds = new Set<string>();
    for (const appointment of dueAppointments) {
      const link = `/admin/${ownerId}/crm/customers/${customerDocument.id}/appointments/${appointment.id}`;
      const response = await getAdminMessaging().sendEachForMulticast({
        tokens,
        data: {
          title: "Besichtigungstermin starten",
          body: `${appointment.title} bei ${customer.name} beginnt in 10 Minuten.`,
          link,
        },
        webpush: {
          headers: { Urgency: "high" },
          fcmOptions: { link },
        },
      });
      if (response.successCount > 0) {
        sentAppointmentIds.add(appointment.id);
        sent += response.successCount;
      }

      const invalidTokens = response.responses.flatMap((result, index) => {
        const code = result.error?.code;
        return code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
          ? [tokens[index]]
          : [];
      });
      if (invalidTokens.length > 0) {
        const batch = database.batch();
        for (const subscription of subscriptionSnapshot.docs) {
          if (invalidTokens.includes(String(subscription.get("token") ?? ""))) {
            batch.delete(subscription.ref);
          }
        }
        await batch.commit();
      }
    }

    if (sentAppointmentIds.size > 0) {
      const appointments = (customer.appointments ?? []).map(
        (appointment): CrmAppointment =>
          sentAppointmentIds.has(appointment.id)
            ? { ...appointment, reminderSentAt: now }
            : appointment,
      );
      await customerDocument.ref.update({ appointments, updatedAt: now });
    }
  }

  return NextResponse.json({ success: true, sent });
}
