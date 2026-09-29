"use client";

import SignaturePadField from "@/components/crm/SignaturePadField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HANDOVER_COMPLETION_FIELDS,
  HANDOVER_DECLARATION_TEXT,
} from "@/lib/crmHandoverDocument";
import type {
  CrmHandoverIssue,
  CrmHandoverIssueType,
  CrmHandoverObservation,
  CrmHandoverProtocol,
} from "@/types/Crm";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Download,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type CustomerProtocol = Omit<
  CrmHandoverProtocol,
  "ownerId" | "customerAccess"
>;

const observationOptions: Array<{
  value: CrmHandoverObservation;
  label: string;
}> = [
  { value: "notRecorded", label: "Bitte auswählen" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "notConfirmed", label: "Nicht bestätigt / abweichend" },
  { value: "notApplicable", label: "Nicht zutreffend" },
];

const issueTypeOptions: Array<{
  value: CrmHandoverIssueType;
  label: string;
}> = [
  { value: "preexisting", label: "Vorbestehender Zustand" },
  { value: "transportDamage", label: "Transportschaden" },
  { value: "propertyDamage", label: "Sachschaden am Objekt" },
  { value: "missing", label: "Fehlteil" },
  { value: "other", label: "Sonstige Abweichung" },
];

const inputClassName =
  "mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const textareaClassName =
  "mt-1.5 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("de-DE");
}

function formatExpiry(value: number) {
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HandoverCustomerForm({ token }: { token: string }) {
  const [protocol, setProtocol] = useState<CustomerProtocol | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProtocol() {
      try {
        const response = await fetch(`/api/handover/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || "Das Protokoll konnte nicht geladen werden.");
        }
        if (active) {
          setProtocol(result.protocol as CustomerProtocol);
          setExpiresAt(Number(result.expiresAt) || 0);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Das Protokoll konnte nicht geladen werden."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProtocol();
    return () => {
      active = false;
    };
  }, [token]);

  function updateProtocol(
    patch: Partial<CustomerProtocol>,
    options: { preserveSignature?: boolean } = {}
  ) {
    setProtocol((current) => {
      if (!current || current.status === "finalized") return current;
      const invalidateSignature =
        !options.preserveSignature && Boolean(current.customerSignature.dataUrl);
      return {
        ...current,
        ...(invalidateSignature
          ? {
              customerSignature: { name: "", dataUrl: "", signedAt: "" },
              accuracyConfirmed: false,
            }
          : {}),
        ...patch,
      };
    });
    setError("");
  }

  function updateIssue(id: string, patch: Partial<CrmHandoverIssue>) {
    if (!protocol) return;
    updateProtocol({
      issues: protocol.issues.map((issue) =>
        issue.id === id ? { ...issue, ...patch } : issue
      ),
    });
  }

  function addIssue() {
    if (!protocol) return;
    updateProtocol({
      issues: [
        ...protocol.issues,
        {
          id: crypto.randomUUID(),
          type: "other",
          subject: "",
          description: "",
          actionTaken: "",
        },
      ],
    });
  }

  function removeIssue(id: string) {
    if (!protocol) return;
    updateProtocol({
      issues: protocol.issues.filter((issue) => issue.id !== id),
    });
  }

  function updateSignatureName(name: string) {
    if (!protocol) return;
    const signatureChanged =
      name !== protocol.customerSignature.name &&
      Boolean(protocol.customerSignature.dataUrl);
    updateProtocol(
      {
        customerSignature: {
          ...protocol.customerSignature,
          name,
          ...(signatureChanged ? { dataUrl: "", signedAt: "" } : {}),
        },
        ...(signatureChanged ? { accuracyConfirmed: false } : {}),
      },
      { preserveSignature: true }
    );
  }

  function updateSignatureData(dataUrl: string) {
    if (!protocol) return;
    updateProtocol(
      {
        customerSignature: {
          ...protocol.customerSignature,
          dataUrl,
          signedAt: "",
        },
        accuracyConfirmed: false,
      },
      { preserveSignature: true }
    );
  }

  async function downloadPdf() {
    if (!protocol) return;
    setIsDownloading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/handover/${encodeURIComponent(token)}/pdf`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.error || "Die PDF-Datei konnte nicht erstellt werden."
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Uebergabeprotokoll-${protocol.protocolNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setCompletedMessage(
        "Die PDF wurde heruntergeladen und zusätzlich per E-Mail versendet."
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Die PDF-Datei konnte nicht erstellt werden."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function completeProtocol() {
    if (!protocol || protocol.status === "finalized") return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/handover/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            servicesCompleted: protocol.servicesCompleted,
            inventoryDelivered: protocol.inventoryDelivered,
            visibleInspectionCompleted: protocol.visibleInspectionCompleted,
            keysReturned: protocol.keysReturned,
            siteLeftClean: protocol.siteLeftClean,
            reservations: protocol.reservations,
            notes: protocol.notes,
            issues: protocol.issues,
            accuracyConfirmed: protocol.accuracyConfirmed,
            customerSignature: {
              name: protocol.customerSignature.name,
              dataUrl: protocol.customerSignature.dataUrl,
            },
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Das Protokoll konnte nicht abgeschlossen werden.");
      }
      setProtocol(result.protocol as CustomerProtocol);
      await downloadPdf();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Das Protokoll konnte nicht abgeschlossen werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-600">
        <span className="flex items-center gap-2 text-sm">
          <LoaderCircle className="animate-spin" size={18} /> Protokoll wird geladen ...
        </span>
      </main>
    );
  }

  if (!protocol) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="w-full max-w-xl border-l-4 border-amber-500 bg-white p-6 shadow-sm">
          <AlertTriangle className="text-amber-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-950">
            Protokoll nicht verfügbar
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
        </section>
      </main>
    );
  }

  const isFinalized = protocol.status === "finalized";
  const formIsComplete =
    HANDOVER_COMPLETION_FIELDS.every(
      (field) => protocol[field.key] !== "notRecorded"
    ) &&
    protocol.issues.every(
      (issue) => issue.subject.trim() && issue.description.trim()
    ) &&
    protocol.customerSignature.name.trim() &&
    protocol.customerSignature.dataUrl &&
    protocol.accuracyConfirmed;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef3f8_0,#f8fafc_18rem,#ffffff_18rem)] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="border-b-4 border-orange-600 bg-slate-950 px-5 py-6 text-white shadow-sm sm:px-8">
          <p className="text-xs font-bold uppercase text-orange-300">
            {protocol.contractor.companyName}
          </p>
          <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Übergabeprotokoll</h1>
              <p className="mt-1 text-sm text-slate-300">{protocol.protocolNumber}</p>
            </div>
            <p className="text-xs text-slate-300">
              Link gültig bis {formatExpiry(expiresAt)}
            </p>
          </div>
        </header>

        <div className="bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          {isFinalized && (
            <section className="mb-8 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-4">
              <p className="flex items-center gap-2 font-semibold text-emerald-800">
                <Check size={18} /> Protokoll abgeschlossen
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Die unterzeichnete Ausfertigung steht zum Download bereit.
              </p>
              <Button
                className="mt-4"
                onClick={() => void downloadPdf()}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Download />
                )}
                PDF herunterladen
              </Button>
            </section>
          )}

          <section className="border-b border-slate-200 pb-7">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <ClipboardCheck size={18} className="text-blue-700" /> Auftragsdaten
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Kunde</dt><dd className="mt-1 font-medium">{protocol.customerCompany || protocol.customerName}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Umzugsdatum</dt><dd className="mt-1 font-medium">{formatDate(protocol.moveDate)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Teamleitung</dt><dd className="mt-1 font-medium">{protocol.crewLeader}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Kundennummer</dt><dd className="mt-1 font-medium">{protocol.customerNumber}</dd></div>
            </dl>
          </section>

          <section className="border-b border-slate-200 py-7">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <MapPin size={18} className="text-blue-700" /> Route
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="border-l-4 border-blue-700 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase text-slate-500">Abholort</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{protocol.pickupAddress}</p></div>
              <div className="border-l-4 border-orange-600 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase text-slate-500">Zielort</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{protocol.deliveryAddress}</p></div>
            </div>
          </section>

          <section className="border-b border-slate-200 py-7">
            <h2 className="text-sm font-bold text-slate-950">Feststellungen zur Durchführung</h2>
            <div className="mt-4 space-y-3">
              {HANDOVER_COMPLETION_FIELDS.map((field) => (
                <label key={field.key} className="block text-sm font-medium text-slate-700 sm:grid sm:grid-cols-[minmax(0,1fr)_18rem] sm:items-center sm:gap-5">
                  <span>{field.label}</span>
                  <select
                    value={protocol[field.key]}
                    onChange={(event) =>
                      updateProtocol({
                        [field.key]: event.target.value as CrmHandoverObservation,
                      })
                    }
                    disabled={isFinalized}
                    className={inputClassName}
                  >
                    {observationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className="border-b border-slate-200 py-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-950">Abweichungen und Schäden</h2>
              {!isFinalized && <Button type="button" variant="outline" size="sm" onClick={addIssue}><Plus /> Abweichung ergänzen</Button>}
            </div>
            {protocol.issues.length === 0 ? (
              <p className="mt-4 border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">Keine Abweichungen aufgenommen.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {protocol.issues.map((issue, index) => (
                  <article key={issue.id} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">Abweichung {index + 1}</p>{!isFinalized && <Button type="button" variant="ghost" size="icon" title="Abweichung entfernen" onClick={() => removeIssue(issue.id)}><Trash2 size={17} /></Button>}</div>
                    <div className="mt-2 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-slate-700">Art<select value={issue.type} onChange={(event) => updateIssue(issue.id, { type: event.target.value as CrmHandoverIssueType })} disabled={isFinalized} className={inputClassName}>{issueTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                      <label className="text-sm font-medium text-slate-700">Gegenstand oder Ort *<input value={issue.subject} onChange={(event) => updateIssue(issue.id, { subject: event.target.value })} disabled={isFinalized} className={inputClassName} /></label>
                      <label className="text-sm font-medium text-slate-700">Feststellung *<textarea value={issue.description} onChange={(event) => updateIssue(issue.id, { description: event.target.value })} disabled={isFinalized} className={textareaClassName} /></label>
                      <label className="text-sm font-medium text-slate-700">Aufgenommene Maßnahme<textarea value={issue.actionTaken} onChange={(event) => updateIssue(issue.id, { actionTaken: event.target.value })} disabled={isFinalized} className={textareaClassName} /></label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="border-b border-slate-200 py-7">
            <h2 className="text-sm font-bold text-slate-950">Vorbehalte und Notizen</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Vorbehalte<textarea value={protocol.reservations} onChange={(event) => updateProtocol({ reservations: event.target.value })} disabled={isFinalized} className={textareaClassName} /></label>
              <label className="text-sm font-medium text-slate-700">Weitere Notizen<textarea value={protocol.notes} onChange={(event) => updateProtocol({ notes: event.target.value })} disabled={isFinalized} className={textareaClassName} /></label>
            </div>
          </section>

          {protocol.photos.length > 0 && (
            <section className="border-b border-slate-200 py-7">
              <h2 className="text-sm font-bold text-slate-950">Fotodokumentation</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {protocol.photos.map((photo) => <figure key={photo.id}><div className="relative aspect-[4/3] overflow-hidden border border-slate-200 bg-slate-100"><Image src={photo.url} alt={photo.caption} fill unoptimized className="object-contain" /></div><figcaption className="mt-2 text-xs leading-5 text-slate-600">{photo.caption}</figcaption></figure>)}
              </div>
            </section>
          )}

          {!isFinalized && (
            <section className="pt-7">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950"><ShieldCheck size={18} className="text-blue-700" /> Unterschrift und Abschluss</h2>
              <label className="mt-4 block text-sm font-medium text-slate-700">Name Kundin / Kunde<input value={protocol.customerSignature.name} onChange={(event) => updateSignatureName(event.target.value)} className={inputClassName} /></label>
              <div className="mt-5"><SignaturePadField label="Unterschrift Kundin / Kunde" value={protocol.customerSignature.dataUrl} onChange={updateSignatureData} /></div>
              <label className="mt-5 flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><Checkbox checked={protocol.accuracyConfirmed} onCheckedChange={(checked) => updateProtocol({ accuracyConfirmed: checked === true }, { preserveSignature: true })} className="mt-1" /><span>{HANDOVER_DECLARATION_TEXT}</span></label>
              {error && <p className="mt-4 flex items-start gap-2 text-sm font-medium text-red-700"><AlertTriangle className="mt-0.5 shrink-0" size={17} /> {error}</p>}
              <Button className="mt-5 w-full sm:w-auto" onClick={() => void completeProtocol()} disabled={isSubmitting || !formIsComplete}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Verbindlich abschließen & PDF herunterladen</Button>
            </section>
          )}

          {completedMessage && <p className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-700"><Check size={17} /> {completedMessage}</p>}
          {isFinalized && error && <p className="mt-5 flex items-start gap-2 text-sm font-medium text-red-700"><AlertTriangle className="mt-0.5 shrink-0" size={17} /> {error}</p>}
        </div>
      </div>
    </main>
  );
}