"use client";

import { Button } from "@/components/ui/button";
import { database, storage } from "@/config/firebase";
import {
  appointmentDurationMs,
  appointmentOpenRequiredItems,
  canFinishAppointment,
  CRM_APPOINTMENT_PHASE_LABELS,
  CRM_APPOINTMENT_PHASES,
  nextAppointmentPhase,
  normalizeCrmAppointment,
} from "@/lib/crmAppointmentWorkflow";
import {
  ActiveAppointmentConflictError,
  CRM_CUSTOMER_COLLECTION,
  finishAppointmentSession,
  pauseAppointmentSession,
  resumeAppointmentSession,
  saveAppointmentWorkflow,
  startAppointmentSession,
} from "@/lib/crmAppointmentStore";
import type {
  CrmActiveAppointment,
  CrmAppointment,
  CrmAppointmentPhoto,
  CrmAppointmentType,
  CrmCustomer,
} from "@/types/Crm";
import { doc, onSnapshot } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Pause,
  Play,
  Save,
  Square,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultEvent {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

type AppointmentSessionProps = {
  ownerId: string;
  customerId: string;
  appointmentId: string;
};

const appointmentTypeLabels: Record<CrmAppointmentType, string> = {
  call: "Telefonat",
  visit: "Besichtigung",
  move: "Auftrag / Umzug",
  task: "Aufgabe",
};

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function AppointmentSession({
  ownerId,
  customerId,
  appointmentId,
}: AppointmentSessionProps) {
  const [customer, setCustomer] = useState<CrmCustomer | null>(null);
  const [appointment, setAppointment] = useState<CrmAppointment | null>(null);
  const [note, setNote] = useState("");
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<CrmActiveAppointment | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const noteDirtyRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(database, CRM_CUSTOMER_COLLECTION, customerId),
      (snapshot) => {
        try {
          if (!snapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
          const storedCustomer = {
            ...(snapshot.data() as CrmCustomer),
            id: snapshot.id,
          };
          const configuredOwnerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
          if (
            storedCustomer.ownerId !== ownerId &&
            storedCustomer.ownerId !== configuredOwnerId
          ) {
            throw new Error("Du hast keinen Zugriff auf diesen Termin.");
          }
          const storedAppointment = storedCustomer.appointments?.find(
            (item) => item.id === appointmentId,
          );
          if (!storedAppointment) throw new Error("Termin nicht gefunden.");
          const normalized = normalizeCrmAppointment(storedAppointment);
          setCustomer(storedCustomer);
          setAppointment(normalized);
          if (!noteDirtyRef.current) setNote(normalized.session?.note ?? "");
          setError("");
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Der Termin konnte nicht geladen werden.",
          );
        } finally {
          setIsLoading(false);
        }
      },
      (caughtError) => {
        console.error("Termin konnte nicht geladen werden.", caughtError);
        setError("Der Termin konnte nicht geladen werden.");
        setIsLoading(false);
      },
    );
    return () => {
      unsubscribe();
      recognitionRef.current?.stop();
    };
  }, [appointmentId, customerId, ownerId]);

  useEffect(() => {
    if (!appointment?.session || appointment.session.endedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [appointment?.session]);

  async function runSessionAction(
    action: () => Promise<CrmAppointment>,
    successMessage: string,
  ) {
    setIsSaving(true);
    setError("");
    setFeedback("");
    setConflict(null);
    try {
      const updated = await action();
      setAppointment(updated);
      setNow(Date.now());
      setFeedback(successMessage);
    } catch (caughtError) {
      console.error("Terminaktion fehlgeschlagen.", caughtError);
      if (caughtError instanceof ActiveAppointmentConflictError) {
        setConflict(caughtError.activeAppointment);
        setError("Es läuft bereits ein anderer Termin.");
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Die Terminaktion ist fehlgeschlagen.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function persistAppointment(updatedAppointment: CrmAppointment) {
    const saved = await saveAppointmentWorkflow(
      ownerId,
      customerId,
      updatedAppointment,
    );
    setAppointment(saved);
    return saved;
  }

  async function saveNote() {
    if (!appointment?.session) return;
    setIsSaving(true);
    setError("");
    try {
      await persistAppointment({
        ...appointment,
        session: { ...appointment.session, note: note.trim() },
      });
      noteDirtyRef.current = false;
      setFeedback("Notiz wurde gespeichert.");
    } catch (caughtError) {
      console.error("Terminnotiz konnte nicht gespeichert werden.", caughtError);
      setError("Die Notiz konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleDictation() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Die Spracheingabe wird von diesem Browser nicht unterstützt.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (transcript) {
        noteDirtyRef.current = true;
        setNote(
          (current) => `${current}${current.trim() ? " " : ""}${transcript}`,
        );
      }
    };
    recognition.onerror = (event) => {
      console.error("Spracheingabe fehlgeschlagen.", event.error);
      setError(`Spracheingabe fehlgeschlagen: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setError("");
    setIsListening(true);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!appointment?.session || !files?.length) return;
    setIsUploading(true);
    setError("");
    try {
      const uploadedPhotos: CrmAppointmentPhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} ist keine Bilddatei.`);
        }
        if (file.size > 15 * 1024 * 1024) {
          throw new Error(`${file.name} ist größer als 15 MB.`);
        }
        const id = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storageRef = ref(
          storage,
          `crm-appointments/${ownerId}/${customerId}/${appointment.id}/${id}-${safeName}`,
        );
        await uploadBytes(storageRef, file, { contentType: file.type });
        uploadedPhotos.push({
          id,
          url: await getDownloadURL(storageRef),
          name: file.name,
          uploadedAt: Date.now(),
        });
      }
      await persistAppointment({
        ...appointment,
        session: {
          ...appointment.session,
          photos: [...appointment.session.photos, ...uploadedPhotos],
        },
      });
      setFeedback(
        `${uploadedPhotos.length} ${uploadedPhotos.length === 1 ? "Bild wurde" : "Bilder wurden"} gespeichert.`,
      );
    } catch (caughtError) {
      console.error("Terminbilder konnten nicht gespeichert werden.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Die Bilder konnten nicht gespeichert werden.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function toggleChecklistItem(itemId: string) {
    if (!appointment?.session || appointment.session.endedAt) return;
    const updated = {
      ...appointment,
      checklist: (appointment.checklist ?? []).map((item) => {
        if (item.id !== itemId) return item;
        if (!item.completed) {
          return { ...item, completed: true, completedAt: Date.now() };
        }
        const updatedItem = { ...item, completed: false };
        delete updatedItem.completedAt;
        return updatedItem;
      }),
    };
    setIsSaving(true);
    setError("");
    try {
      await persistAppointment(updated);
    } catch (caughtError) {
      console.error("Checklistenpunkt konnte nicht gespeichert werden.", caughtError);
      setError("Der Checklistenpunkt konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  async function changePhase(direction: "back" | "next") {
    if (!appointment) return;
    const currentPhase = appointment.currentPhase ?? "beforeDeparture";
    const currentIndex = CRM_APPOINTMENT_PHASES.indexOf(currentPhase);
    const target =
      direction === "back"
        ? CRM_APPOINTMENT_PHASES[currentIndex - 1]
        : nextAppointmentPhase(currentPhase);
    if (!target) return;
    if (direction === "next") {
      const openItems = appointmentOpenRequiredItems(appointment, currentPhase);
      if (openItems.length > 0) {
        setError(
          `Bitte zuerst erledigen: ${openItems.map((item) => item.title).join(", ")}`,
        );
        return;
      }
    }
    setIsSaving(true);
    setError("");
    try {
      await persistAppointment({ ...appointment, currentPhase: target });
      setFeedback(`${CRM_APPOINTMENT_PHASE_LABELS[target]} ist jetzt aktiv.`);
    } catch (caughtError) {
      console.error("Terminphase konnte nicht geändert werden.", caughtError);
      setError("Die Terminphase konnte nicht geändert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  async function finishAppointment() {
    if (!appointment?.session || appointment.session.endedAt) return;
    if (!canFinishAppointment(appointment)) {
      const openItems = appointmentOpenRequiredItems(appointment, "afterWork");
      setError(
        appointment.currentPhase !== "afterWork"
          ? "Wechsle zuerst in die Phase „Nach der Arbeit“."
          : `Bitte zuerst erledigen: ${openItems.map((item) => item.title).join(", ")}`,
      );
      return;
    }
    recognitionRef.current?.stop();
    await runSessionAction(
      () =>
        finishAppointmentSession(
          ownerId,
          customerId,
          appointment.id,
          note,
        ),
      "Termin wurde beendet und vollständig gespeichert.",
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" /> Termin wird geladen ...
      </div>
    );
  }
  if (error && !appointment) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }
  if (!customer || !appointment) return null;

  const session = appointment.session;
  const duration = appointmentDurationMs(session, now);
  const currentPhase = appointment.currentPhase ?? "beforeDeparture";
  const currentPhaseIndex = CRM_APPOINTMENT_PHASES.indexOf(currentPhase);
  const currentItems = (appointment.checklist ?? []).filter(
    (item) => item.phase === currentPhase,
  );
  const completedItems = (appointment.checklist ?? []).filter(
    (item) => item.completed,
  ).length;

  return (
    <main className="pb-8">
      <Link
        href={`/admin/${ownerId}/crm/customers/${customerId}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline">
        <ArrowLeft size={16} /> Zurück zur Kundenakte
      </Link>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
            {appointmentTypeLabels[appointment.type]}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{appointment.title}</h1>
          <p className="mt-1 text-sm text-slate-300">{customer.name}</p>
        </header>

        <div className="space-y-6 p-4 sm:p-7">
          <div className="rounded-lg bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-200">
            <Clock3 className="mx-auto text-blue-600" size={28} />
            <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {formatDuration(duration)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {session?.endedAt
                ? "Termin abgeschlossen"
                : session?.paused
                  ? "Tracking pausiert"
                  : session?.startedAt
                    ? "Tracking läuft"
                    : "Noch nicht gestartet"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {!session?.startedAt && (
                <Button
                  size="lg"
                  onClick={() =>
                    void runSessionAction(
                      () =>
                        startAppointmentSession(
                          ownerId,
                          customerId,
                          appointment.id,
                        ),
                      "Tracking wurde gestartet.",
                    )
                  }
                  disabled={isSaving}>
                  {isSaving ? <LoaderCircle className="animate-spin" /> : <Play />}
                  Termin starten
                </Button>
              )}
              {session?.startedAt && !session.endedAt && (
                <Button
                  size="lg"
                  variant={session.paused ? "default" : "outline"}
                  onClick={() =>
                    void runSessionAction(
                      () =>
                        session.paused
                          ? resumeAppointmentSession(
                              ownerId,
                              customerId,
                              appointment.id,
                            )
                          : pauseAppointmentSession(
                              ownerId,
                              customerId,
                              appointment.id,
                            ),
                      session.paused
                        ? "Tracking wird fortgesetzt."
                        : "Tracking wurde pausiert.",
                    )
                  }
                  disabled={isSaving}>
                  {session.paused ? <Play /> : <Pause />}
                  {session.paused ? "Fortsetzen" : "Pausieren"}
                </Button>
              )}
            </div>
          </div>

          {conflict && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">{conflict.title} läuft bereits.</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link
                  href={`/admin/${ownerId}/crm/customers/${conflict.customerId}/appointments/${conflict.appointmentId}`}>
                  Laufenden Termin öffnen
                </Link>
              </Button>
            </div>
          )}

          {session?.startedAt && (
            <>
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">Ablauf</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {completedItems} von {appointment.checklist?.length ?? 0} Punkten erledigt
                    </p>
                  </div>
                </div>
                <ol className="grid gap-2 sm:grid-cols-4">
                  {CRM_APPOINTMENT_PHASES.map((phase, index) => (
                    <li
                      key={phase}
                      className={`rounded-md border px-3 py-3 text-sm font-medium ${
                        phase === currentPhase
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : index < currentPhaseIndex
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-500"
                      }`}>
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">
                        {index + 1}
                      </span>
                      {CRM_APPOINTMENT_PHASE_LABELS[phase]}
                    </li>
                  ))}
                </ol>

                <div className="mt-4 rounded-lg border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {CRM_APPOINTMENT_PHASE_LABELS[currentPhase]}
                  </h3>
                  <div className="mt-4 space-y-2">
                    {currentItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={Boolean(session.endedAt) || isSaving}
                        onClick={() => void toggleChecklistItem(item.id)}
                        className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                          item.completed
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            item.completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300"
                          }`}>
                          {item.completed && <Check size={14} />}
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium text-slate-950">
                            {item.title}
                            {item.required && (
                              <span className="ml-2 text-xs font-semibold text-red-600">
                                Pflicht
                              </span>
                            )}
                          </span>
                          {item.details && (
                            <span className="mt-1 block text-sm text-slate-600">
                              {item.details}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                    {currentItems.length === 0 && (
                      <p className="rounded-md border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">
                        Für diese Phase sind keine Punkte hinterlegt.
                      </p>
                    )}
                  </div>
                  {!session.endedAt && (
                    <div className="mt-4 flex justify-between gap-3 border-t border-slate-200 pt-4">
                      <Button
                        variant="outline"
                        disabled={currentPhaseIndex === 0 || isSaving}
                        onClick={() => void changePhase("back")}>
                        <ChevronLeft /> Zurück
                      </Button>
                      {currentPhaseIndex < CRM_APPOINTMENT_PHASES.length - 1 && (
                        <Button
                          disabled={isSaving}
                          onClick={() => void changePhase("next")}>
                          Weiter <ChevronRight />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-950">Terminnotiz</h2>
                  {!session.endedAt && (
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleDictation}>
                      {isListening ? <MicOff /> : <Mic />}
                      {isListening ? "Diktat stoppen" : "Notiz einsprechen"}
                    </Button>
                  )}
                </div>
                <textarea
                  value={note}
                  onChange={(event) => {
                    noteDirtyRef.current = true;
                    setNote(event.target.value);
                  }}
                  readOnly={Boolean(session.endedAt)}
                  rows={6}
                  placeholder="Beobachtungen, Maße und Absprachen festhalten ..."
                  className="w-full rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {!session.endedAt && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void saveNote()}
                      disabled={isSaving}>
                      <Save /> Notiz speichern
                    </Button>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-950">Bilder</h2>
                  {!session.endedAt && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                      {isUploading ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <Camera size={16} />
                      )}
                      {isUploading ? "Wird hochgeladen ..." : "Bilder aufnehmen"}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          void uploadPhotos(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                {session.photos.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Noch keine Bilder gespeichert.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {session.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
                        <Image
                          src={photo.url}
                          alt={photo.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {!session.endedAt && (
                <div className="border-t border-slate-200 pt-5">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    onClick={() => void finishAppointment()}
                    disabled={isSaving || isUploading}>
                    {isSaving ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Square />
                    )}
                    Termin beenden und speichern
                  </Button>
                </div>
              )}
            </>
          )}

          {feedback && (
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={17} /> {feedback}
            </p>
          )}
          {error && appointment && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
