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
import {
  Check,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
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

const selectableServices = [
  { id: "move", label: "Umzug / Transport" },
  { id: "packing", label: "Kartons ein- und auspacken" },
  { id: "furnitureAssembly", label: "Möbelmontage / Demontage" },
] as const;

const MAX_PDF_COUNT = 3;
const MAX_PDF_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_PDF_SIZE = 12 * 1024 * 1024;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

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
    const measuredItems = draft.rooms.reduce(
      (total, room) =>
        total +
        room.items.filter(
          (item) => item.lengthCm && item.widthCm && item.heightCm
        ).length,
      0
    );
    if (measuredItems) summary.push(`${measuredItems} Positionen mit vollständigen Maßen`);
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
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includeAssembly, setIncludeAssembly] = useState(true);
  const [includeDismantling, setIncludeDismantling] = useState(true);
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
    if ((!text.trim() && pdfFiles.length === 0) || isProcessing) return;
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
      const headers: Record<string, string> = {
        authorization: `Bearer ${idToken}`,
      };
      let body: BodyInit;
      if (pdfFiles.length > 0) {
        const formData = new FormData();
        formData.set("text", text.trim());
        pdfFiles.forEach((file) => formData.append("files", file));
        body = formData;
      } else {
        headers["content-type"] = "application/json";
        body = JSON.stringify({ text: text.trim() });
      }
      const response = await fetch("/api/admin/offer-assistant", {
        method: "POST",
        headers,
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.error || "Die KI-Anfrage ist fehlgeschlagen.");
        return;
      }
      const nextDraft = data.draft as AssistantOfferDraft;
      setDraft(nextDraft);
      const recognizedServices = new Set(nextDraft.services ?? []);
      if (nextDraft.rooms?.length) recognizedServices.add("move");
      if (nextDraft.movingBoxes || nextDraft.unpackingBoxes) {
        recognizedServices.add("packing");
      }
      if (
        nextDraft.rooms?.some((room) =>
          room.items.some(
            (item) => item.assemblyQuantity || item.dismantlingQuantity
          )
        )
      ) {
        recognizedServices.add("furnitureAssembly");
      }
      setSelectedServices(
        selectableServices
          .map((service) => service.id)
          .filter((service) => recognizedServices.has(service))
      );
    } catch {
      setError("Die KI-Anfrage ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsProcessing(false);
    }
  }

  function applyDraft() {
    if (!draft) return;
    onApply({
      ...draft,
      services: selectedServices,
      rooms: draft.rooms?.map((room) => ({
        ...room,
        items: room.items.map((item) => ({
          ...item,
          assemblyQuantity:
            selectedServices.includes("furnitureAssembly") && includeAssembly
              ? item.assemblyQuantity || item.quantity
              : 0,
          dismantlingQuantity:
            selectedServices.includes("furnitureAssembly") && includeDismantling
              ? item.dismantlingQuantity || item.quantity
              : 0,
        })),
      })),
    });
    setIsOpen(false);
    setDraft(null);
    setText("");
    setPdfFiles([]);
  }

  function addPdfFiles(fileList: FileList | null) {
    if (!fileList) return;
    const nextFiles = [...pdfFiles, ...Array.from(fileList)];
    if (nextFiles.length > MAX_PDF_COUNT) {
      setError(`Maximal ${MAX_PDF_COUNT} PDFs pro Analyse.`);
      return;
    }
    if (
      nextFiles.some(
        (file) =>
          file.type !== "application/pdf" ||
          !file.name.toLocaleLowerCase("de-DE").endsWith(".pdf") ||
          file.size === 0 ||
          file.size > MAX_PDF_SIZE
      )
    ) {
      setError("Bitte nur gültige PDFs bis maximal 8 MB je Datei auswählen.");
      return;
    }
    if (
      nextFiles.reduce((total, file) => total + file.size, 0) >
      MAX_TOTAL_PDF_SIZE
    ) {
      setError("Die PDFs dürfen zusammen maximal 12 MB groß sein.");
      return;
    }
    setPdfFiles(nextFiles);
    setDraft(null);
    setError(null);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setError(null);
      setDraft(null);
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
              Lade Inventarlisten als PDF hoch oder beschreibe den Auftrag per
              Sprache beziehungsweise Text. Die KI liest Möbel, Maße, Kartons
              und Leistungen aus.
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
            <div className='rounded-md border border-dashed border-blue-300 bg-blue-50/60 p-4'>
              <label className='flex cursor-pointer items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50'>
                <Upload size={17} />
                PDF-Inventarliste auswählen
                <input
                  type='file'
                  accept='application/pdf,.pdf'
                  multiple
                  className='sr-only'
                  onChange={(event) => {
                    addPdfFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
              <p className='mt-2 text-center text-xs text-blue-700'>
                Bis zu 3 PDFs, jeweils maximal 8 MB und zusammen maximal 12 MB.
              </p>
              {pdfFiles.length > 0 && (
                <div className='mt-3 space-y-2'>
                  {pdfFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className='flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700'>
                      <FileText size={16} className='shrink-0 text-blue-600' />
                      <span className='min-w-0 flex-1 truncate'>{file.name}</span>
                      <span className='text-xs text-slate-500'>{formatFileSize(file.size)}</span>
                      <button
                        type='button'
                        title='PDF entfernen'
                        onClick={() => {
                          setPdfFiles((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index)
                          );
                          setDraft(null);
                        }}
                        className='rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600'>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                disabled={(!text.trim() && pdfFiles.length === 0) || isProcessing}>
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
              <div className='space-y-4 rounded-md border border-emerald-200 bg-emerald-50 p-4'>
                <p className='text-sm font-semibold text-emerald-900'>Ergebnis der Analyse</p>
                <ul className='mt-2 space-y-1 text-sm text-emerald-900'>
                  {summarizeDraft(draft).map((line) => (
                    <li key={line} className='flex items-start gap-2'>
                      <Check size={15} className='mt-0.5 shrink-0' /> {line}
                    </li>
                  ))}
                </ul>
                <div>
                  <p className='text-sm font-semibold text-emerald-950'>
                    Welche Leistungen übernehmen?
                  </p>
                  <div className='mt-2 grid gap-2 sm:grid-cols-3'>
                    {selectableServices.map((service) => (
                      <label key={service.id} className='flex cursor-pointer items-start gap-2 rounded-md border border-emerald-200 bg-white p-3 text-sm text-slate-800'>
                        <input
                          type='checkbox'
                          checked={selectedServices.includes(service.id)}
                          onChange={(event) =>
                            setSelectedServices((current) =>
                              event.target.checked
                                ? [...new Set([...current, service.id])]
                                : current.filter((item) => item !== service.id)
                            )
                          }
                          className='mt-0.5 h-4 w-4 accent-emerald-600'
                        />
                        {service.label}
                      </label>
                    ))}
                  </div>
                  {selectedServices.includes("furnitureAssembly") && (
                    <div className='mt-2 flex flex-wrap gap-4 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm'>
                      <label className='flex items-center gap-2'>
                        <input type='checkbox' checked={includeAssembly} onChange={(event) => setIncludeAssembly(event.target.checked)} className='h-4 w-4 accent-emerald-600' />
                        Möbel aufbauen
                      </label>
                      <label className='flex items-center gap-2'>
                        <input type='checkbox' checked={includeDismantling} onChange={(event) => setIncludeDismantling(event.target.checked)} className='h-4 w-4 accent-emerald-600' />
                        Möbel abbauen
                      </label>
                    </div>
                  )}
                </div>
                {draft.rooms?.some((room) => room.items.length > 0) && (
                  <div>
                    <p className='text-sm font-semibold text-emerald-950'>
                      Erkannte Möbel und Maße
                    </p>
                    <div className='mt-2 max-h-52 overflow-y-auto rounded-md border border-emerald-200 bg-white'>
                      {draft.rooms.flatMap((room) =>
                        room.items.map((item, index) => (
                          <div key={`${room.name}-${item.name}-${index}`} className='grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0'>
                            <span>
                              <strong>{item.quantity}× {item.name}</strong>
                              <span className='ml-2 text-xs text-slate-500'>{room.name}</span>
                            </span>
                            <span className='text-xs tabular-nums text-slate-600'>
                              {item.lengthCm && item.widthCm && item.heightCm
                                ? `${item.lengthCm} × ${item.widthCm} × ${item.heightCm} cm`
                                : `${item.volumeM3.toFixed(2)} m³`}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <p className='text-xs text-emerald-800'>
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
