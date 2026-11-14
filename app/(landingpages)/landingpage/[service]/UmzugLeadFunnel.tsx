"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  LockKeyhole,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";

type LeadData = {
  startLocation: string;
  destination: string;
  moveSize: string;
  moveDate: string;
  name: string;
  phone: string;
  email: string;
};

const initialLead: LeadData = {
  startLocation: "",
  destination: "",
  moveSize: "",
  moveDate: "",
  name: "",
  phone: "",
  email: "",
};

export default function UmzugLeadFunnel() {
  const [step, setStep] = useState(1);
  const [lead, setLead] = useState(initialLead);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof LeadData>(field: K, value: LeadData[K]) {
    setLead((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function nextStep() {
    if (!lead.startLocation.trim() || !lead.destination.trim()) {
      setError("Bitte geben Sie Start und Ziel Ihres Umzugs an.");
      return;
    }
    setError("");
    trackGoogleAnalyticsEvent("umzug_funnel_step_completed", {
      step: 1,
      source: "google_ads_landingpage",
    });
    setStep(2);
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!lead.name.trim() || !lead.phone.trim()) {
      setError("Bitte geben Sie Ihren Vornamen und Ihre Telefonnummer an.");
      return;
    }
    if (
      lead.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())
    ) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
    if (!ownerId) {
      setError("Die Anfrage ist derzeit nicht verfügbar. Bitte rufen Sie uns an.");
      return;
    }

    setIsSubmitting(true);
    const message = [
      "Google-Ads-Landingpage: Umzug",
      `Start: ${lead.startLocation.trim()}`,
      `Ziel: ${lead.destination.trim()}`,
      `Umzugsgröße: ${lead.moveSize || "Noch offen"}`,
      `Wunschtermin: ${lead.moveDate || "Noch offen"}`,
    ].join("\n");

    try {
      await createRequest(ownerId, {
        name: lead.name.trim(),
        email: lead.email.trim(),
        phone: lead.phone.trim(),
        message,
      });

      trackGoogleAnalyticsEvent("generate_lead", {
        service: "umzug",
        source: "google_ads_landingpage",
      });
      trackGoogleAnalyticsEvent("Kontakt_formular");

      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "info@umzugshelden.io",
            subject: `Umzugs-Anfrage von ${lead.name.trim()}`,
            replacements: {
              name: lead.name.trim(),
              phone: lead.phone.trim(),
              email: lead.email.trim(),
              message,
            },
            templatePath: "ContactEmailTemplate.html",
            tracking: false,
          }),
        });
        const emailResult = (await emailResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!emailResponse.ok || emailResult?.error) {
          console.error(
            "Umzugsanfrage wurde gespeichert, E-Mail-Versand fehlgeschlagen.",
            emailResult?.error,
          );
        }
      } catch (emailError) {
        console.error(
          "Umzugsanfrage wurde gespeichert, E-Mail-Versand fehlgeschlagen.",
          emailError,
        );
      }

      setSubmitted(true);
      setLead(initialLead);
    } catch (caughtError) {
      console.error("Umzugsanfrage konnte nicht gespeichert werden.", caughtError);
      setError(
        "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={32} strokeWidth={3} />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-navy">Anfrage erhalten</h2>
        <p className="mt-2 max-w-sm text-slate-600">
          Vielen Dank. Wir prüfen Ihre Umzugsdaten und melden uns schnellstmöglich
          persönlich bei Ihnen.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setStep(1);
          }}
          className="mt-6 text-sm font-semibold text-primary hover:underline">
          Weitere Anfrage stellen
        </button>
      </div>
    );
  }

  return (
    <form
      id="kontakt-formular"
      onSubmit={submitLead}
      className="flex min-h-[420px] flex-col">
      <div className="mb-5 flex gap-2" aria-label={`Schritt ${step} von 2`}>
        {[1, 2].map((item) => (
          <span
            key={item}
            className={`h-1.5 flex-1 rounded-full ${
              item <= step ? "bg-primary" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Schritt {step} von 2
      </p>

      {step === 1 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Wohin geht Ihr Umzug?
          </legend>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Straße oder Ort reichen zunächst völlig aus.
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Von
              <input
                value={lead.startLocation}
                onChange={(event) => update("startLocation", event.target.value)}
                autoComplete="street-address"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="z. B. Olpe"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Nach
              <input
                value={lead.destination}
                onChange={(event) => update("destination", event.target.value)}
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="z. B. Siegen"
              />
            </label>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <div className="mt-3">
          <h2 className="text-2xl font-bold text-navy">
            Wie erreichen wir Sie?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Wir melden uns persönlich, klären Termin und Umfang und erstellen
            danach Ihr unverbindliches Angebot.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-navy">
            <Check size={17} className="shrink-0 text-primary" />
            {lead.startLocation} → {lead.destination}
          </div>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Vorname
              <input
                value={lead.name}
                onChange={(event) => update("name", event.target.value)}
                autoComplete="given-name"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="Ihr Vorname"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Telefonnummer
              <input
                value={lead.phone}
                onChange={(event) => update("phone", event.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="+49 151 ..."
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              E-Mail{" "}
              <span className="font-normal text-slate-500">(optional)</span>
              <input
                value={lead.email}
                onChange={(event) => update("email", event.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="name@beispiel.de"
              />
            </label>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <LockKeyhole size={15} className="mt-0.5 shrink-0 text-emerald-700" />
            Ihre Daten werden nur für Ihre Umzugsanfrage verwendet und nicht
            weitergegeben.
          </div>
        </div>
      )}

      <div className="mt-auto pt-6">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(1);
              }}
              aria-label="Zurück zu Start und Ziel"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-sans text-sm font-bold text-slate-700 hover:bg-slate-50">
              <ArrowLeft size={17} />
              <span className="hidden sm:inline">Zurück</span>
            </button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600">
              Weiter <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <PhoneCall size={18} />
              )}
              {isSubmitting
                ? "Wird gesendet ..."
                : "Kostenlose Rückmeldung anfordern"}
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-slate-500">
          ✓ 100 % unverbindlich &nbsp; ✓ Kein Newsletter
        </p>
      </div>
    </form>
  );
}
