"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { CALLBACK_PROMISE, LEAD_PHONE_HREF } from "@/lib/leadContact";
import { Check, Clock3, LoaderCircle, LockKeyhole, Phone, PhoneCall } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";


type Props = {
  /** Herkunft für Anfrage-Nachricht und Tracking, z. B. "Stadtseite Olpe – Umzugsservice". */
  source: string;
  trackingSource: string;
  serviceLabel: string;
  cityName?: string;
  title?: string;
  description?: string;
  variant?: "light" | "dark";
};

/** Schickt die Benachrichtigung im Hintergrund, ohne den Abschluss zu blockieren. */
function sendNotificationEmail(name: string, phone: string, subject: string, message: string) {
  void fetch("/api/send-email", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "info@umzugshelden.io",
      subject,
      replacements: { name, phone, email: "", message },
      templatePath: "ContactEmailTemplate.html",
      tracking: false,
    }),
  })
    .then(async (response) => {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || result?.error) {
        console.error("Rückruf-Anfrage gespeichert, E-Mail-Versand fehlgeschlagen.", result?.error);
      }
    })
    .catch((error) => console.error("Rückruf-Anfrage gespeichert, E-Mail-Versand fehlgeschlagen.", error));
}

/** Kürzestes Anfrageformular: Name + Telefon für einen Rückruf. */
export default function CallbackLeadForm({
  source,
  trackingSource,
  serviceLabel,
  cityName,
  title = "Kostenlosen Rückruf anfordern",
  description = "Wir klären alle Details am Telefon und erstellen danach Ihr unverbindliches Angebot.",
  variant = "light",
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);
  const dark = variant === "dark";

  const inputClass = `mt-1.5 h-12 w-full rounded-lg border px-4 text-base font-normal text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100 ${
    dark ? "border-white/20 bg-white" : "border-slate-300 bg-white"
  }`;
  const labelClass = `text-sm font-semibold ${dark ? "text-gray-200" : "text-slate-700"}`;

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackGoogleAnalyticsEvent("lead_form_started", { source: trackingSource, service: serviceLabel });
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setError("Bitte geben Sie Ihren Namen und Ihre Telefonnummer an.");
      return;
    }
    if (trimmedPhone.replace(/\D/g, "").length < 6) {
      setError("Bitte prüfen Sie Ihre Telefonnummer.");
      return;
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
    if (!ownerId) {
      setError("Die Anfrage ist derzeit nicht verfügbar. Bitte rufen Sie uns an.");
      return;
    }

    setIsSubmitting(true);
    const message = [
      source,
      `Leistung: ${serviceLabel}`,
      ...(cityName ? [`Ort: ${cityName}`] : []),
      `${CALLBACK_PROMISE} gewünscht`,
    ].join("\n");
    try {
      await createRequest(ownerId, { name: trimmedName, email: "", phone: trimmedPhone, message });
      trackGoogleAnalyticsEvent("generate_lead", { service: serviceLabel, source: trackingSource });
      trackGoogleAnalyticsEvent("Kontakt_formular");
      sendNotificationEmail(
        trimmedName,
        trimmedPhone,
        `Rückruf-Anfrage (${serviceLabel}${cityName ? `, ${cityName}` : ""}) von ${trimmedName}`,
        message,
      );
      setSubmitted(true);
      setName("");
      setPhone("");
    } catch (caughtError) {
      console.error("Rückruf-Anfrage konnte nicht gespeichert werden.", caughtError);
      setError("Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div role='status' className='flex flex-col items-center px-2 py-6 text-center'>
        <span className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'>
          <Check size={32} strokeWidth={3} />
        </span>
        <h2 className={`mt-5 text-2xl font-bold ${dark ? "text-white" : "text-navy"}`}>Danke – wir rufen Sie zurück!</h2>
        <p className={`mt-2 max-w-sm ${dark ? "text-gray-300" : "text-slate-600"}`}>
          Wir melden uns innerhalb von 60 Minuten telefonisch bei Ihnen und besprechen Ihr
          Vorhaben persönlich.
        </p>
        <a
          href={LEAD_PHONE_HREF}
          data-analytics-label='Rückruf-Formular Erfolg Anruf'
          className='mt-6 inline-flex h-12 items-center gap-2 rounded-lg border-2 border-primary px-5 font-sans text-sm font-bold text-primary'>
          <Phone size={17} /> Lieber sofort? Jetzt anrufen
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submitLead} noValidate>
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${dark ? "bg-white/10 text-white" : "bg-orange-50 text-navy"}`}>
        <Clock3 size={18} className='shrink-0 text-primary' />
        {CALLBACK_PROMISE}
      </div>
      <h2 className={`mt-4 text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-navy"}`}>{title}</h2>
      <p className={`mt-1 text-sm ${dark ? "text-gray-300" : "text-slate-600"}`}>{description}</p>

      <div className='mt-4 grid gap-3'>
        <label className={labelClass}>
          Name
          <input
            value={name}
            onChange={(event) => {
              markStarted();
              setName(event.target.value);
              setError("");
            }}
            autoComplete='name'
            enterKeyHint='next'
            className={inputClass}
            placeholder='Ihr Name'
          />
        </label>
        <label className={labelClass}>
          Telefonnummer
          <input
            value={phone}
            onChange={(event) => {
              markStarted();
              setPhone(event.target.value);
              setError("");
            }}
            type='tel'
            inputMode='tel'
            autoComplete='tel'
            enterKeyHint='send'
            className={inputClass}
            placeholder='0151 …'
          />
        </label>
      </div>

      {error && (
        <p role='alert' className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700'>
          {error}
        </p>
      )}

      <button
        type='submit'
        disabled={isSubmitting}
        className='mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-sans text-base font-bold text-white shadow-lg shadow-black/10 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'>
        {isSubmitting ? <LoaderCircle size={19} className='animate-spin' /> : <PhoneCall size={19} />}
        {isSubmitting ? "Wird gesendet …" : "Jetzt Rückruf anfordern"}
      </button>

      <p className={`mt-3 flex items-start justify-center gap-2 text-center text-xs leading-5 ${dark ? "text-gray-400" : "text-slate-500"}`}>
        <LockKeyhole size={14} className='mt-0.5 shrink-0 text-emerald-500' />
        Kostenlos & unverbindlich. Ihre Nummer nutzen wir nur für den Rückruf.
      </p>
    </form>
  );
}
