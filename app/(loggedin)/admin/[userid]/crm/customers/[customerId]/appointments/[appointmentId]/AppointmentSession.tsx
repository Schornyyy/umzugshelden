"use client";

import { Button } from "@/components/ui/button";
import { database, storage } from "@/config/firebase";
import type {
  CrmAppointment,
  CrmAppointmentPhoto,
  CrmCustomer,
} from "@/types/Crm";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Play,
  Save,
  Square,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CRM_COLLECTION = "crm_customers_umzugshelden";

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
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAppointment() {
      try {
        const snapshot = await getDoc(
          doc(database, CRM_COLLECTION, customerId),
        );
        if (!snapshot.exists()) throw new Error("Kundenakte nicht gefunden.");
        const storedCustomer = snapshot.data() as CrmCustomer;
        if (storedCustomer.ownerId !== ownerId) {
          throw new Error("Du hast keinen Zugriff auf diesen Termin.");
        }
        const storedAppointment = storedCustomer.appointments?.find(
          (item) => item.id === appointmentId,
        );
        if (!storedAppointment) throw new Error("Termin nicht gefunden.");
        if (!active) return;
        setCustomer({ ...storedCustomer, id: storedCustomer.id || snapshot.id });
        setAppointment(storedAppointment);
        setNote(storedAppointment.session?.note ?? "");
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Der Termin konnte nicht geladen werden.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadAppointment();
    return () => {
      active = false;
      recognitionRef.current?.stop();
    };
  }, [appointmentId, customerId, ownerId]);

  useEffect(() => {
    if (!appointment?.session?.startedAt || appointment.session.endedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [appointment?.session?.endedAt, appointment?.session?.startedAt]);

  async function persistAppointment(updatedAppointment: CrmAppointment) {
    if (!customer) return;
    const appointments = customer.appointments.map((item) =>
      item.id === updatedAppointment.id ? updatedAppointment : item,
    );
    const updatedCustomer = { ...customer, appointments, updatedAt: Date.now() };
    await updateDoc(doc(database, CRM_COLLECTION, customer.id), {
      appointments,
      updatedAt: updatedCustomer.updatedAt,
    });
    setCustomer(updatedCustomer);
    setAppointment(updatedAppointment);
  }

  async function startAppointment() {
    if (!appointment || appointment.session?.startedAt) return;
    setIsSaving(true);
    setError("");
    const startedAt = Date.now();
    try {
      await persistAppointment({
        ...appointment,
        session: { startedAt, note: "", photos: [] },
      });
      setNow(startedAt);
      setFeedback("Tracking wurde gestartet.");
    } catch (caughtError) {
      console.error("Termin konnte nicht gestartet werden.", caughtError);
      setError("Das Tracking konnte nicht gestartet werden.");
    } finally {
      setIsSaving(false);
    }
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
        setNote((current) => `${current}${current.trim() ? " " : ""}${transcript}`);
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
          photos: [...(appointment.session.photos ?? []), ...uploadedPhotos],
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

  async function finishAppointment() {
    if (!appointment?.session || appointment.session.endedAt) return;
    setIsSaving(true);
    setError("");
    recognitionRef.current?.stop();
    try {
      await persistAppointment({
        ...appointment,
        completed: true,
        session: {
          ...appointment.session,
          note: note.trim(),
          endedAt: Date.now(),
        },
      });
      setFeedback("Termin wurde beendet und vollständig gespeichert.");
    } catch (caughtError) {
      console.error("Termin konnte nicht beendet werden.", caughtError);
      setError("Der Termin konnte nicht beendet werden.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" /> Termin wird geladen ...
      </div>
    );
  }
  if (error && !appointment) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>;
  }
  if (!customer || !appointment) return null;

  const session = appointment.session;
  const duration = session?.startedAt
    ? (session.endedAt ?? now) - session.startedAt
    : 0;

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
            Besichtigungstermin
          </p>
          <h1 className="mt-2 text-2xl font-bold">{appointment.title}</h1>
          <p className="mt-1 text-sm text-slate-300">{customer.name}</p>
        </header>

        <div className="space-y-6 p-4 sm:p-7">
          <div className="rounded-lg bg-slate-50 px-4 py-8 text-center ring-1 ring-slate-200">
            <Clock3 className="mx-auto text-blue-600" size={28} />
            <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-slate-950">
              {formatDuration(duration)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {session?.endedAt
                ? "Termin abgeschlossen"
                : session?.startedAt
                  ? "Tracking läuft"
                  : "Noch nicht gestartet"}
            </p>
            {!session?.startedAt && (
              <Button className="mt-5" size="lg" onClick={() => void startAppointment()} disabled={isSaving}>
                {isSaving ? <LoaderCircle className="animate-spin" /> : <Play />}
                Besichtigungstermin starten
              </Button>
            )}
          </div>

          {session?.startedAt && (
            <>
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
                  onChange={(event) => setNote(event.target.value)}
                  readOnly={Boolean(session.endedAt)}
                  rows={7}
                  placeholder="Beobachtungen, Maße und Absprachen festhalten ..."
                  className="w-full rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {!session.endedAt && (
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => void saveNote()} disabled={isSaving}>
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
                      {isUploading ? <LoaderCircle className="animate-spin" size={16} /> : <Camera size={16} />}
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
                {(session.photos ?? []).length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Noch keine Bilder gespeichert.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {(session.photos ?? []).map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
                        <Image src={photo.url} alt={photo.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {!session.endedAt && (
                <div className="border-t border-slate-200 pt-5">
                  <Button variant="destructive" size="lg" className="w-full" onClick={() => void finishAppointment()} disabled={isSaving || isUploading}>
                    {isSaving ? <LoaderCircle className="animate-spin" /> : <Square />}
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}
        </div>
      </section>
    </main>
  );
}
