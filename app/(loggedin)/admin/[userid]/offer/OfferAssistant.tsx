"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth } from "@/config/firebase";
import type { AssistantOfferDraft } from "@/types/OfferAssistant";
import { Check, LoaderCircle, Mic, MicOff, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const exampleText =
  "z. B.: Umzug für Familie Müller am 15.10. von der Hauptstraße 12 in Köln, 3. OG ohne Aufzug, in die Gartenstraße 5, EG. Wohnzimmer: Sofa, zwei Regale, Fernseher. Schlafzimmer: Doppelbett, Kleiderschrank. Etwa 30 Kartons, Einpackservice gewünscht, Halteverbotszone nötig.";

function summarizeDraft(draft: AssistantOfferDraft): string[] {
  const summary: string[] = [];
  if (draft.services?.length) summary.push(`${draft.services.length} Dienstleistung(en) erkannt`);
  if (draft.rooms?.length) {
    const itemCount = draft.rooms.reduce((total, room) => total + room.items.length, 0);
    const volume = draft.rooms.reduce(
      (total, room) =>
        total + room.items.reduce((roomTotal, item) => roomTotal + item.quantity * item.volumeM3, 0),
      0
    );
    summary.push(`${draft.rooms.length} Raum/Räume mit ${itemCount} Positionen (~${volume.toFixed(1)} m³)`);
  }
  if (draft.oldAddress || draft.newAddress) summary.push("Adressen erkannt");
  if (draft.contactName || draft.customer) summary.push(`Kunde: ${draft.customer || draft.contactName}`);
  if (draft.date) summary.push(`Termin: ${draft.date}`);
  if (draft.movingBoxes) summary.push(`${draft.movingBoxes} Kartons`);
  if (draft.disposalVolumeM3) summary.push(`${draft.disposalVolumeM3} m³ Entsorgung`);
  if (draft.paintAreaM2) summary.push(`${draft.paintAreaM2} m² Malerfläche`);
  if (draft.storageVolumeM3) summary.push(`${draft.storageVolumeM3} m³ Einlagerung`);
  return summary.length ? summary : ["Keine strukturierten Daten erkannt"];
}

export default function OfferAssistant({
  onApply,
}: {
  onApply: (draft: AssistantOfferDraft) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssistantOfferDraft | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = getSpeechRecognition() !== null;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError("Spracheingabe wird von diesem Browser nicht unterstützt. Bitte Text eingeben.");
      return;
    }
    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) transcript += result[0].transcript;
      }
      if (transcript.trim()) {
        setText((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${transcript.trim()}`);
      }
    };
    recognition.onerror = () => {
      setError("Spracheingabe fehlgeschlagen. Bitte erneut versuchen oder Text eingeben.");
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function analyze() {
    if (!text.trim() || isProcessing) return;
    stopListening();
    setIsProcessing(true);
    setError(null);
    setDraft(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setError("Keine aktive Anmeldung gefunden. Bitte neu einloggen.");
        return;
      }
      const response = await fetch("/api/admin/offer-assistant", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.error || "Die KI-Anfrage ist fehlgeschlagen.");
        return;
      }
      setDraft(data.draft as AssistantOfferDraft);
    } catch {
      setError("Die KI-Anfrage ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsProcessing(false);
    }
  }

  function applyDraft() {
    if (!draft) return;
    onApply(draft);
    setIsOpen(false);
    setDraft(null);
    setText("");
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setError(null);
    }
  }

  return (
    <>
      <Button variant='outline' className='flex-1 sm:flex-none' onClick={() => setIsOpen(true)}>
        <Sparkles /> KI-Assistent
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Sparkles size={18} className='text-blue-600' /> KI-Angebotsassistent
            </DialogTitle>
            <DialogDescription>
              Beschreibe den Auftrag per Sprache oder Text. Die KI erstellt daraus Inventar,
              Leistungen und die Angebotsdaten.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              placeholder={exampleText}
              className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
            />
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleListening}
                disabled={!speechSupported && !isListening}
                title={speechSupported ? undefined : "Spracheingabe wird von diesem Browser nicht unterstützt"}>
                {isListening ? <MicOff /> : <Mic />}
                {isListening ? "Aufnahme stoppen" : "Spracheingabe"}
              </Button>
              {isListening && (
                <span className='flex items-center gap-2 text-sm font-medium text-red-600'>
                  <span className='h-2 w-2 animate-pulse rounded-full bg-red-600' /> Aufnahme läuft ...
                </span>
              )}
              <Button
                type='button'
                className='ml-auto'
                onClick={() => void analyze()}
                disabled={!text.trim() || isProcessing}>
                {isProcessing ? <LoaderCircle className='animate-spin' /> : <Sparkles />}
                {isProcessing ? "Wird analysiert ..." : "Angebot erstellen"}
              </Button>
            </div>
            {error && (
              <p className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {error}
              </p>
            )}
            {draft && (
              <div className='rounded-md border border-emerald-200 bg-emerald-50 p-4'>
                <p className='text-sm font-semibold text-emerald-900'>Ergebnis der Analyse</p>
                <ul className='mt-2 space-y-1 text-sm text-emerald-900'>
                  {summarizeDraft(draft).map((line) => (
                    <li key={line} className='flex items-start gap-2'>
                      <Check size={15} className='mt-0.5 shrink-0' /> {line}
                    </li>
                  ))}
                </ul>
                <p className='mt-3 text-xs text-emerald-800'>
                  Beim Übernehmen werden erkannte Werte in die Planung eingetragen. Vorhandenes
                  Inventar wird ersetzt, alle Werte bleiben danach manuell anpassbar.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => handleOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type='button' onClick={applyDraft} disabled={!draft}>
              <Check /> In Planung übernehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
