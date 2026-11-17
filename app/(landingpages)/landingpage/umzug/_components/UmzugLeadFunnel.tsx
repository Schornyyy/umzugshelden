"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { Check, Clock3, LoaderCircle, LockKeyhole, Phone, PhoneCall } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

const PHONE_HREF = "tel:+4915168567708";
const TRACKING_SOURCE = "google_ads_landingpage";
const CALLBACK_PROMISE = "Rückruf innerhalb von 60 Minuten";

const inputClass =
  "mt-1.5 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100";

/** Schickt die Benachrichtigung im Hintergrund, ohne den Abschluss zu blockieren. */
function sendNotificationEmail(name: string, phone: string, message: string) {
  void fetch("/api/send-email", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "info@umzugshelden.io",
      subject: `Rückruf-Anfrage (Umzug) von ${name}`,
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

export default function UmzugLeadFunnel() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackGoogleAnalyticsEvent("umzug_funnel_started", { source: TRACKING_SOURCE });
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
    const message = ["Google-Ads-Landingpage: Umzug", `${CALLBACK_PROMISE} gewünscht`].join("\n");
    try {
      await createRequest(ownerId, { name: trimmedName, email: "", phone: trimmedPhone, message });
      trackGoogleAnalyticsEvent("generate_lead", { service: "umzug", source: TRACKING_SOURCE });
      trackGoogleAnalyticsEvent("Kontakt_formular");
      sendNotificationEmail(trimmedName, trimmedPhone, message);
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
        <h2 className='mt-5 text-2xl font-bold text-navy'>Danke – wir rufen Sie zurück!</h2>
        <p className='mt-2 max-w-sm text-slate-600'>
          Wir melden uns innerhalb von 60 Minuten telefonisch bei Ihnen und besprechen
          Ihren Umzug persönlich.
        </p>
        <a
          href={PHONE_HREF}
          data-analytics-label='Umzug Funnel Erfolg Anruf'
          className='mt-6 inline-flex h-12 items-center gap-2 rounded-lg border-2 border-primary px-5 font-sans text-sm font-bold text-primary'>
          <Phone size={17} /> Lieber sofort? Jetzt anrufen
        </a>
      </div>
    );
  }

  return (
    <form id='kontakt-formular' onSubmit={submitLead} noValidate>
      <div className='flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-navy'>
        <Clock3 size={18} className='shrink-0 text-primary' />
        {CALLBACK_PROMISE}
      </div>
      <h2 className='mt-4 text-xl font-bold text-navy sm:text-2xl'>Kostenlosen Rückruf anfordern</h2>
      <p className='mt-1 text-sm text-slate-600'>
        Wir klären alle Details am Telefon und erstellen danach Ihr unverbindliches Angebot.
      </p>

      <div className='mt-4 grid gap-3'>
        <label className='text-sm font-semibold text-slate-700'>
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
        <label className='text-sm font-semibold text-slate-700'>
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
        className='mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-sans text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'>
        {isSubmitting ? <LoaderCircle size={19} className='animate-spin' /> : <PhoneCall size={19} />}
        {isSubmitting ? "Wird gesendet …" : "Jetzt Rückruf anfordern"}
      </button>

      <p className='mt-3 flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500'>
        <LockKeyhole size={14} className='mt-0.5 shrink-0 text-emerald-700' />
        Kostenlos & unverbindlich. Ihre Nummer nutzen wir nur für den Rückruf.
      </p>
    </form>
  );
}
