"use client";

import { Button } from "@/components/ui/button";
import {
  appointmentDurationMs,
  CRM_APPOINTMENT_PHASE_LABELS,
} from "@/lib/crmAppointmentWorkflow";
import {
  pauseAppointmentSession,
  resumeAppointmentSession,
  subscribeActiveAppointment,
} from "@/lib/crmAppointmentStore";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { CrmActiveAppointment } from "@/types/Crm";
import { Clock3, LoaderCircle, Pause, Play } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function AppointmentTimerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { companyData } = useCompanyData();
  const [activeAppointment, setActiveAppointment] =
    useState<CrmActiveAppointment | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyData?.id) {
      setActiveAppointment(null);
      return;
    }
    return subscribeActiveAppointment(
      companyData.id,
      (appointment) => {
        setActiveAppointment(appointment);
        setError("");
      },
      (caughtError) => {
        console.error("Aktiver Termin konnte nicht geladen werden.", caughtError);
        setError("Der aktive Termin konnte nicht geladen werden.");
      },
    );
  }, [companyData?.id]);

  useEffect(() => {
    if (!activeAppointment || activeAppointment.paused) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [activeAppointment]);

  async function togglePaused() {
    if (!companyData?.id || !activeAppointment) return;
    setIsSaving(true);
    setError("");
    try {
      await (activeAppointment.paused
        ? resumeAppointmentSession(
            companyData.id,
            activeAppointment.customerId,
            activeAppointment.appointmentId,
          )
        : pauseAppointmentSession(
            companyData.id,
            activeAppointment.customerId,
            activeAppointment.appointmentId,
          ));
    } catch (caughtError) {
      console.error("Termin-Timer konnte nicht geändert werden.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Der Termin-Timer konnte nicht geändert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const duration = activeAppointment
    ? appointmentDurationMs(
        {
          startedAt: activeAppointment.startedAt,
          paused: activeAppointment.paused,
          segments: activeAppointment.segments,
          note: "",
          photos: [],
        },
        now,
      )
    : 0;

  return (
    <>
      {(activeAppointment || error) && (
        <aside className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 mb-4 border-b border-blue-200 bg-blue-50/95 px-3 py-3 shadow-sm backdrop-blur md:top-0 md:rounded-md md:border">
          {activeAppointment && companyData?.id ? (
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
              <Clock3 className="shrink-0 text-blue-700" size={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {activeAppointment.title}
                  <span className="font-normal text-slate-500">
                    {" "}
                    · {activeAppointment.customerName}
                  </span>
                </p>
                <p className="text-xs text-slate-600">
                  {activeAppointment.paused ? "Pausiert" : "Läuft"} ·{" "}
                  {CRM_APPOINTMENT_PHASE_LABELS[activeAppointment.currentPhase]}
                </p>
              </div>
              <span className="font-mono text-lg font-bold text-slate-950">
                {formatDuration(duration)}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void togglePaused()}>
                {isSaving ? (
                  <LoaderCircle className="animate-spin" />
                ) : activeAppointment.paused ? (
                  <Play />
                ) : (
                  <Pause />
                )}
                {activeAppointment.paused ? "Fortsetzen" : "Pause"}
              </Button>
              <Button asChild size="sm">
                <Link
                  href={`/admin/${companyData.id}/crm/customers/${activeAppointment.customerId}/appointments/${activeAppointment.appointmentId}`}>
                  Termin öffnen
                </Link>
              </Button>
            </div>
          ) : null}
          {error && (
            <p className="mx-auto mt-2 max-w-[1500px] text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </aside>
      )}
      {children}
    </>
  );
}
