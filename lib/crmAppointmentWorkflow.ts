import type {
  CrmAppointment,
  CrmAppointmentChecklistItem,
  CrmAppointmentChecklistTemplate,
  CrmAppointmentPhase,
  CrmAppointmentSession,
} from "@/types/Crm";

export const CRM_APPOINTMENT_PHASES: CrmAppointmentPhase[] = [
  "beforeDeparture",
  "arrival",
  "work",
  "afterWork",
];

export const CRM_APPOINTMENT_PHASE_LABELS: Record<
  CrmAppointmentPhase,
  string
> = {
  beforeDeparture: "Vor der Fahrt",
  arrival: "Bei Ankunft",
  work: "Bei der Arbeit",
  afterWork: "Nach der Arbeit",
};

export function normalizeAppointmentSession(
  session: CrmAppointmentSession,
): CrmAppointmentSession {
  const segments =
    Array.isArray(session.segments) && session.segments.length > 0
      ? session.segments
          .filter(
            (segment) =>
              typeof segment?.startedAt === "number" &&
              (segment.endedAt === undefined ||
                typeof segment.endedAt === "number"),
          )
          .map((segment) => ({ ...segment }))
      : [
          {
            startedAt: session.startedAt,
            ...(session.endedAt ? { endedAt: session.endedAt } : {}),
          },
        ];

  return {
    ...session,
    paused:
      typeof session.paused === "boolean"
        ? session.paused
        : Boolean(session.endedAt),
    segments,
    note: session.note ?? "",
    photos: Array.isArray(session.photos) ? session.photos : [],
  };
}

export function normalizeCrmAppointment(
  appointment: CrmAppointment,
): CrmAppointment {
  const { session, ...appointmentWithoutSession } = appointment;
  const checklist = Array.isArray(appointment.checklist)
    ? appointment.checklist
        .filter(
          (item) =>
            item &&
            CRM_APPOINTMENT_PHASES.includes(item.phase) &&
            typeof item.title === "string",
        )
        .map((item) => ({
          ...item,
          details: item.details ?? "",
          required: item.required ?? false,
          completed: item.completed ?? false,
        }))
    : [];

  return {
    ...appointmentWithoutSession,
    currentPhase: CRM_APPOINTMENT_PHASES.includes(
      appointment.currentPhase as CrmAppointmentPhase,
    )
      ? appointment.currentPhase
      : "beforeDeparture",
    checklist,
    ...(session ? { session: normalizeAppointmentSession(session) } : {}),
  };
}

export function copyAppointmentTemplate(
  template: CrmAppointmentChecklistTemplate,
  createId: () => string = () => crypto.randomUUID(),
): Pick<CrmAppointment, "checklist" | "checklistTemplate" | "currentPhase"> {
  return {
    currentPhase: "beforeDeparture",
    checklistTemplate: { id: template.id, name: template.name },
    checklist: template.items.map((item) => ({
      ...item,
      id: createId(),
      completed: false,
    })),
  };
}

export function appointmentDurationMs(
  session: CrmAppointmentSession | undefined,
  now = Date.now(),
): number {
  if (!session) return 0;
  return normalizeAppointmentSession(session).segments.reduce(
    (total, segment) =>
      total +
      Math.max(0, (segment.endedAt ?? (session.paused ? segment.startedAt : now)) - segment.startedAt),
    0,
  );
}

export function appointmentOpenRequiredItems(
  appointment: CrmAppointment,
  phase: CrmAppointmentPhase = normalizeCrmAppointment(appointment).currentPhase ??
    "beforeDeparture",
): CrmAppointmentChecklistItem[] {
  return (normalizeCrmAppointment(appointment).checklist ?? []).filter(
    (item) => item.phase === phase && item.required && !item.completed,
  );
}

export function canAdvanceAppointment(
  appointment: CrmAppointment,
): boolean {
  return appointmentOpenRequiredItems(appointment).length === 0;
}

export function nextAppointmentPhase(
  phase: CrmAppointmentPhase,
): CrmAppointmentPhase | null {
  const index = CRM_APPOINTMENT_PHASES.indexOf(phase);
  return index >= 0 && index < CRM_APPOINTMENT_PHASES.length - 1
    ? CRM_APPOINTMENT_PHASES[index + 1]
    : null;
}

export function canFinishAppointment(appointment: CrmAppointment): boolean {
  const normalized = normalizeCrmAppointment(appointment);
  return (
    normalized.currentPhase === "afterWork" &&
    appointmentOpenRequiredItems(normalized, "afterWork").length === 0
  );
}
