import { database } from "@/config/firebase";
import {
  normalizeAppointmentSession,
  normalizeCrmAppointment,
} from "@/lib/crmAppointmentWorkflow";
import type {
  CrmActiveAppointment,
  CrmAppointment,
  CrmAppointmentChecklistTemplate,
  CrmCustomer,
} from "@/types/Crm";
import {
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

export const CRM_CUSTOMER_COLLECTION = "crm_customers_umzugshelden";
export const CRM_APPOINTMENT_TEMPLATE_COLLECTION =
  "crm_appointment_checklist_templates_umzugshelden";
export const CRM_APPOINTMENT_RUNTIME_COLLECTION =
  "crm_active_appointments_umzugshelden";

export class ActiveAppointmentConflictError extends Error {
  constructor(public readonly activeAppointment: CrmActiveAppointment) {
    super("Es läuft bereits ein anderer Termin.");
    this.name = "ActiveAppointmentConflictError";
  }
}

function findAppointment(
  customer: CrmCustomer,
  appointmentId: string,
): CrmAppointment {
  const appointment = customer.appointments?.find(
    (candidate) => candidate.id === appointmentId,
  );
  if (!appointment) throw new Error("Termin nicht gefunden.");
  return normalizeCrmAppointment(appointment);
}

function replaceAppointment(
  customer: CrmCustomer,
  appointment: CrmAppointment,
): CrmCustomer {
  return {
    ...customer,
    appointments: customer.appointments.map((candidate) =>
      candidate.id === appointment.id ? appointment : candidate,
    ),
    updatedAt: Date.now(),
  };
}

function runtimeFromAppointment(
  ownerId: string,
  customer: CrmCustomer,
  appointment: CrmAppointment,
  now: number,
): CrmActiveAppointment {
  if (!appointment.session) {
    throw new Error("Der Termin wurde noch nicht gestartet.");
  }
  return {
    ownerId,
    customerId: customer.id,
    appointmentId: appointment.id,
    customerName: customer.name,
    title: appointment.title,
    startedAt: appointment.session.startedAt,
    paused: appointment.session.paused,
    segments: appointment.session.segments,
    currentPhase: appointment.currentPhase ?? "beforeDeparture",
    updatedAt: now,
  };
}

export function subscribeActiveAppointment(
  ownerId: string,
  onValue: (appointment: CrmActiveAppointment | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(database, CRM_APPOINTMENT_RUNTIME_COLLECTION, ownerId),
    (snapshot) => {
      onValue(
        snapshot.exists()
          ? (snapshot.data() as CrmActiveAppointment)
          : null,
      );
    },
    (error) => onError(error),
  );
}

export function subscribeAppointmentTemplates(
  ownerId: string,
  onValue: (templates: CrmAppointmentChecklistTemplate[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(database, CRM_APPOINTMENT_TEMPLATE_COLLECTION, ownerId),
    (snapshot) => {
      const templates = snapshot.data()?.templates;
      onValue(
        Array.isArray(templates)
          ? (templates as CrmAppointmentChecklistTemplate[])
          : [],
      );
    },
    (error) => onError(error),
  );
}

export async function saveAppointmentTemplates(
  ownerId: string,
  templates: CrmAppointmentChecklistTemplate[],
): Promise<void> {
  await setDoc(
    doc(database, CRM_APPOINTMENT_TEMPLATE_COLLECTION, ownerId),
    { ownerId, templates, updatedAt: Date.now() },
    { merge: true },
  );
}

export async function startAppointmentSession(
  ownerId: string,
  customerId: string,
  appointmentId: string,
): Promise<CrmAppointment> {
  const customerRef = doc(database, CRM_CUSTOMER_COLLECTION, customerId);
  const runtimeRef = doc(
    database,
    CRM_APPOINTMENT_RUNTIME_COLLECTION,
    ownerId,
  );

  return runTransaction(database, async (transaction) => {
    const [customerSnapshot, runtimeSnapshot] = await Promise.all([
      transaction.get(customerRef),
      transaction.get(runtimeRef),
    ]);
    if (!customerSnapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
    const customer = {
      ...(customerSnapshot.data() as CrmCustomer),
      id: customerSnapshot.id,
    };
    const currentRuntime = runtimeSnapshot.exists()
      ? (runtimeSnapshot.data() as CrmActiveAppointment)
      : null;
    if (
      currentRuntime &&
      (currentRuntime.customerId !== customerId ||
        currentRuntime.appointmentId !== appointmentId)
    ) {
      throw new ActiveAppointmentConflictError(currentRuntime);
    }

    const appointment = findAppointment(customer, appointmentId);
    if (appointment.session?.endedAt) {
      throw new Error("Der Termin wurde bereits abgeschlossen.");
    }
    const now = Date.now();
    const session = appointment.session
      ? normalizeAppointmentSession(appointment.session)
      : {
          startedAt: now,
          paused: false,
          segments: [{ startedAt: now }],
          note: "",
          photos: [],
        };
    const updatedAppointment = {
      ...appointment,
      session,
      currentPhase: appointment.currentPhase ?? "beforeDeparture",
    };
    const updatedCustomer = replaceAppointment(customer, updatedAppointment);

    transaction.update(customerRef, {
      appointments: updatedCustomer.appointments,
      updatedAt: updatedCustomer.updatedAt,
    });
    transaction.set(
      runtimeRef,
      runtimeFromAppointment(ownerId, updatedCustomer, updatedAppointment, now),
    );
    return updatedAppointment;
  });
}

export async function pauseAppointmentSession(
  ownerId: string,
  customerId: string,
  appointmentId: string,
): Promise<CrmAppointment> {
  return setAppointmentPaused(ownerId, customerId, appointmentId, true);
}

export async function resumeAppointmentSession(
  ownerId: string,
  customerId: string,
  appointmentId: string,
): Promise<CrmAppointment> {
  return setAppointmentPaused(ownerId, customerId, appointmentId, false);
}

async function setAppointmentPaused(
  ownerId: string,
  customerId: string,
  appointmentId: string,
  paused: boolean,
): Promise<CrmAppointment> {
  const customerRef = doc(database, CRM_CUSTOMER_COLLECTION, customerId);
  const runtimeRef = doc(
    database,
    CRM_APPOINTMENT_RUNTIME_COLLECTION,
    ownerId,
  );
  return runTransaction(database, async (transaction) => {
    const [customerSnapshot, runtimeSnapshot] = await Promise.all([
      transaction.get(customerRef),
      transaction.get(runtimeRef),
    ]);
    if (!customerSnapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
    if (!runtimeSnapshot.exists()) {
      throw new Error("Es ist kein aktiver Termin vorhanden.");
    }
    const runtime = runtimeSnapshot.data() as CrmActiveAppointment;
    if (
      runtime.customerId !== customerId ||
      runtime.appointmentId !== appointmentId
    ) {
      throw new ActiveAppointmentConflictError(runtime);
    }

    const customer = {
      ...(customerSnapshot.data() as CrmCustomer),
      id: customerSnapshot.id,
    };
    const appointment = findAppointment(customer, appointmentId);
    if (!appointment.session || appointment.session.endedAt) {
      throw new Error("Der Termin ist nicht aktiv.");
    }
    const session = normalizeAppointmentSession(appointment.session);
    if (session.paused === paused) return appointment;

    const now = Date.now();
    const segments = session.segments.map((segment) => ({ ...segment }));
    if (paused) {
      const currentSegment = segments.at(-1);
      if (currentSegment && !currentSegment.endedAt) currentSegment.endedAt = now;
    } else {
      segments.push({ startedAt: now });
    }
    const updatedAppointment = {
      ...appointment,
      session: { ...session, paused, segments },
    };
    const updatedCustomer = replaceAppointment(customer, updatedAppointment);
    transaction.update(customerRef, {
      appointments: updatedCustomer.appointments,
      updatedAt: updatedCustomer.updatedAt,
    });
    transaction.set(
      runtimeRef,
      runtimeFromAppointment(ownerId, updatedCustomer, updatedAppointment, now),
    );
    return updatedAppointment;
  });
}

export async function saveAppointmentWorkflow(
  ownerId: string,
  customerId: string,
  appointment: CrmAppointment,
): Promise<CrmAppointment> {
  const customerRef = doc(database, CRM_CUSTOMER_COLLECTION, customerId);
  const runtimeRef = doc(
    database,
    CRM_APPOINTMENT_RUNTIME_COLLECTION,
    ownerId,
  );
  return runTransaction(database, async (transaction) => {
    const [customerSnapshot, runtimeSnapshot] = await Promise.all([
      transaction.get(customerRef),
      transaction.get(runtimeRef),
    ]);
    if (!customerSnapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
    const customer = {
      ...(customerSnapshot.data() as CrmCustomer),
      id: customerSnapshot.id,
    };
    const storedAppointment = findAppointment(customer, appointment.id);
    const requestedAppointment = normalizeCrmAppointment(appointment);
    const storedSession = storedAppointment.session
      ? normalizeAppointmentSession(storedAppointment.session)
      : undefined;
    const normalizedBase: CrmAppointment = {
      ...storedAppointment,
      ...requestedAppointment,
    };
    const normalized: CrmAppointment = storedSession
      ? {
          ...normalizedBase,
          session: {
            ...storedSession,
            note: requestedAppointment.session?.note ?? storedSession.note,
            photos:
              requestedAppointment.session?.photos ?? storedSession.photos,
          },
        }
      : normalizedBase;
    const updatedCustomer = replaceAppointment(customer, normalized);
    const now = Date.now();
    transaction.update(customerRef, {
      appointments: updatedCustomer.appointments,
      updatedAt: updatedCustomer.updatedAt,
    });

    const runtime = runtimeSnapshot.exists()
      ? (runtimeSnapshot.data() as CrmActiveAppointment)
      : null;
    if (
      runtime?.customerId === customerId &&
      runtime.appointmentId === appointment.id &&
      normalized.session &&
      !normalized.session.endedAt
    ) {
      transaction.set(
        runtimeRef,
        runtimeFromAppointment(ownerId, updatedCustomer, normalized, now),
      );
    }
    return normalized;
  });
}

export async function finishAppointmentSession(
  ownerId: string,
  customerId: string,
  appointmentId: string,
  note: string,
): Promise<CrmAppointment> {
  const customerRef = doc(database, CRM_CUSTOMER_COLLECTION, customerId);
  const runtimeRef = doc(
    database,
    CRM_APPOINTMENT_RUNTIME_COLLECTION,
    ownerId,
  );
  return runTransaction(database, async (transaction) => {
    const [customerSnapshot, runtimeSnapshot] = await Promise.all([
      transaction.get(customerRef),
      transaction.get(runtimeRef),
    ]);
    if (!customerSnapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
    const customer = {
      ...(customerSnapshot.data() as CrmCustomer),
      id: customerSnapshot.id,
    };
    const appointment = findAppointment(customer, appointmentId);
    if (!appointment.session || appointment.session.endedAt) {
      throw new Error("Der Termin ist nicht aktiv.");
    }
    const now = Date.now();
    const session = normalizeAppointmentSession(appointment.session);
    const segments = session.segments.map((segment) => ({ ...segment }));
    const currentSegment = segments.at(-1);
    if (!session.paused && currentSegment && !currentSegment.endedAt) {
      currentSegment.endedAt = now;
    }
    const updatedAppointment: CrmAppointment = {
      ...appointment,
      completed: true,
      session: {
        ...session,
        paused: true,
        segments,
        note: note.trim(),
        endedAt: now,
      },
    };
    const updatedCustomer = replaceAppointment(customer, updatedAppointment);
    transaction.update(customerRef, {
      appointments: updatedCustomer.appointments,
      updatedAt: updatedCustomer.updatedAt,
    });

    if (runtimeSnapshot.exists()) {
      const runtime = runtimeSnapshot.data() as CrmActiveAppointment;
      if (
        runtime.customerId === customerId &&
        runtime.appointmentId === appointmentId
      ) {
        transaction.delete(runtimeRef);
      }
    }
    return updatedAppointment;
  });
}
