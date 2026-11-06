import assert from "node:assert/strict";
import test from "node:test";
import type {
  CrmAppointment,
  CrmAppointmentChecklistTemplate,
} from "@/types/Crm";
import {
  appointmentDurationMs,
  canAdvanceAppointment,
  canFinishAppointment,
  copyAppointmentTemplate,
  nextAppointmentPhase,
  normalizeCrmAppointment,
} from "./crmAppointmentWorkflow";

const appointment = (overrides: Partial<CrmAppointment> = {}): CrmAppointment => ({
  id: "appointment",
  title: "Umzug",
  startAt: "2026-11-02T08:00",
  type: "move",
  details: "",
  completed: false,
  createdAt: 1,
  ...overrides,
});

test("old appointment sessions are normalized without losing their duration", () => {
  const normalized = normalizeCrmAppointment(
    appointment({
      session: {
        startedAt: 1_000,
        endedAt: 6_000,
        paused: true,
        segments: [],
        note: "",
        photos: [],
      },
    }),
  );

  assert.equal(normalized.currentPhase, "beforeDeparture");
  assert.deepEqual(normalized.checklist, []);
  assert.deepEqual(normalized.session?.segments, [
    { startedAt: 1_000, endedAt: 6_000 },
  ]);
  assert.equal(appointmentDurationMs(normalized.session, 10_000), 5_000);
});

test("template assignment creates an independent checklist snapshot", () => {
  const template: CrmAppointmentChecklistTemplate = {
    id: "template",
    name: "Standard",
    description: "",
    createdAt: 1,
    updatedAt: 1,
    items: [
      {
        id: "source",
        phase: "arrival",
        title: "Kunden begrüßen",
        details: "Ansprechpartner prüfen",
        required: true,
      },
    ],
  };

  const copied = copyAppointmentTemplate(template, () => "copy");
  assert.deepEqual(copied.checklistTemplate, {
    id: "template",
    name: "Standard",
  });
  assert.deepEqual(copied.checklist, [
    {
      ...template.items[0],
      id: "copy",
      completed: false,
    },
  ]);
});

test("duration only includes running segments and excludes pauses", () => {
  assert.equal(
    appointmentDurationMs(
      {
        startedAt: 1_000,
        paused: false,
        segments: [
          { startedAt: 1_000, endedAt: 4_000 },
          { startedAt: 8_000 },
        ],
        note: "",
        photos: [],
      },
      13_000,
    ),
    8_000,
  );
});

test("required items block advancing and finishing the workflow", () => {
  const blocked = appointment({
    currentPhase: "beforeDeparture",
    checklist: [
      {
        id: "required",
        phase: "beforeDeparture",
        title: "Fahrzeug prüfen",
        details: "",
        required: true,
        completed: false,
      },
    ],
  });
  assert.equal(canAdvanceAppointment(blocked), false);
  assert.equal(canAdvanceAppointment({
    ...blocked,
    checklist: blocked.checklist?.map((item) => ({
      ...item,
      completed: true,
    })),
  }), true);
  assert.equal(canFinishAppointment(blocked), false);
  assert.equal(
    canFinishAppointment(
      appointment({ currentPhase: "afterWork", checklist: [] }),
    ),
    true,
  );
  assert.equal(nextAppointmentPhase("work"), "afterWork");
  assert.equal(nextAppointmentPhase("afterWork"), null);
});
