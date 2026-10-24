"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Home,
  House,
  LoaderCircle,
  Trees,
} from "lucide-react";
import { useState } from "react";

const objectOptions = [
  { value: "Wohnung", label: "Wohnung", icon: Building2 },
  { value: "Haus", label: "Haus", icon: House },
  { value: "Keller / Dachboden", label: "Keller / Dachboden", icon: Home },
  { value: "Gewerbe / Garten", label: "Gewerbe / Garten", icon: Trees },
];
const sizeOptions = ["Bis 50 m²", "50–100 m²", "Über 100 m²"];
const timingOptions = [
  "Schnellstmöglich",
  "In den nächsten 2 Wochen",
  "Später",
];

type LeadData = {
  objectType: string;
  size: string;
  timing: string;
  name: string;
  phone: string;
  email: string;
  privacyAccepted: boolean;
};

const initialLead: LeadData = {
  objectType: "",
  size: "",
  timing: "",
  name: "",
  phone: "",
  email: "",
  privacyAccepted: false,
};

export default function EntruempelungLeadFunnel() {
  const [step, setStep] = useState(1);
  const [lead, setLead] = useState(initialLead);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function choose(field: keyof LeadData, value: string) {
    setLead((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function nextStep() {
    const currentValue =
      step === 1 ? lead.objectType : step === 2 ? lead.size : lead.timing;
    if (!currentValue) {
      setError("Bitte wählen Sie eine Option aus.");
      return;
    }
    setError("");
    setStep((current) => Math.min(4, current + 1));
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!lead.name.trim() || !lead.phone.trim() || !lead.email.trim()) {
      setError("Bitte füllen Sie Name, Telefonnummer und E-Mail aus.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (!lead.privacyAccepted) {
      setError("Bitte stimmen Sie der Verarbeitung Ihrer Daten zu.");
      return;
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
    if (!ownerId) {
      setError("Die Anfrage ist derzeit nicht verfügbar. Bitte rufen Sie uns an.");
      return;
    }

    setIsSubmitting(true);
    const message = [
      "Google-Ads-Landingpage: Entrümpelung",
      `Objekt: ${lead.objectType}`,
      `Fläche: ${lead.size}`,
      `Zeitraum: ${lead.timing}`,
    ].join("\n");

    try {
      await createRequest(ownerId, {
        name: lead.name.trim(),
        email: lead.email.trim(),
        phone: lead.phone.trim(),
        message,
      });

      trackGoogleAnalyticsEvent("generate_lead", {
        service: "entruempelung",
        source: "google_ads_landingpage",
      });
      trackGoogleAnalyticsEvent("Kontakt_formular");

      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "info@umzugshelden.io",
            subject: `Entrümpelungs-Anfrage von ${lead.name.trim()}`,
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
            "Landingpage-Anfrage wurde gespeichert, E-Mail-Versand fehlgeschlagen.",
            emailResult?.error,
          );
        }
      } catch (emailError) {
        console.error(
          "Landingpage-Anfrage wurde gespeichert, E-Mail-Versand fehlgeschlagen.",
          emailError,
        );
      }

      setSubmitted(true);
      setLead(initialLead);
    } catch (caughtError) {
      console.error("Entrümpelungs-Anfrage konnte nicht gespeichert werden.", caughtError);
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
          Vielen Dank. Wir prüfen Ihre Angaben und melden uns schnellstmöglich
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

  const optionClass = (selected: boolean) =>
    `flex min-h-20 items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
      selected
        ? "border-primary bg-orange-50 text-navy shadow-sm"
        : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
    }`;

  return (
    <form
      id="kontakt-formular"
      onSubmit={submitLead}
      className="flex min-h-[480px] flex-col">
      <div className="mb-6 flex gap-2" aria-label={`Schritt ${step} von 4`}>
        {[1, 2, 3, 4].map((item) => (
          <span
            key={item}
            className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Schritt {step} von 4
      </p>

      {step === 1 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Was soll entrümpelt werden?
          </legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {objectOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => choose("objectType", value)}
                className={optionClass(lead.objectType === value)}>
                <Icon size={25} className="shrink-0 text-primary" />
                <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Wie groß ist die Fläche ungefähr?
          </legend>
          <div className="mt-5 grid gap-3">
            {sizeOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => choose("size", value)}
                className={optionClass(lead.size === value)}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-primary">
                  {sizeOptions.indexOf(value) + 1}
                </span>
                <span className="font-semibold">{value}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Wann soll die Entrümpelung stattfinden?
          </legend>
          <div className="mt-5 grid gap-3">
            {timingOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => choose("timing", value)}
                className={optionClass(lead.timing === value)}>
                <span
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    lead.timing === value
                      ? "border-primary bg-primary shadow-[inset_0_0_0_4px_white]"
                      : "border-slate-300"
                  }`}
                />
                <span className="font-semibold">{value}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <div className="mt-3">
          <h2 className="text-2xl font-bold text-navy">
            Wohin dürfen wir Ihr Festpreis-Angebot senden?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Wir verwenden Ihre Angaben ausschließlich zur Bearbeitung dieser
            Anfrage.
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Name
              <input
                value={lead.name}
                onChange={(event) => choose("name", event.target.value)}
                autoComplete="name"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="Max Mustermann"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Telefonnummer
              <input
                value={lead.phone}
                onChange={(event) => choose("phone", event.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="+49 151 ..."
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              E-Mail
              <input
                value={lead.email}
                onChange={(event) => choose("email", event.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="name@beispiel.de"
              />
            </label>
            <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={lead.privacyAccepted}
                onChange={(event) =>
                  setLead((current) => ({
                    ...current,
                    privacyAccepted: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-primary"
              />
              <span>
                Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung der
                Anfrage zu. Hinweise stehen in der{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-navy underline">
                  Datenschutzerklärung
                </a>
                .
              </span>
            </label>
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
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-sans text-sm font-bold text-slate-700 hover:bg-slate-50">
              <ArrowLeft size={17} /> Zurück
            </button>
          )}
          {step < 4 ? (
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
                <Check size={18} />
              )}
              {isSubmitting ? "Wird gesendet ..." : "Kostenloses Angebot anfordern"}
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-slate-500">
          ✓ 100 % unverbindlich &nbsp; ✓ Persönliche Rückmeldung
        </p>
      </div>
    </form>
  );
}
