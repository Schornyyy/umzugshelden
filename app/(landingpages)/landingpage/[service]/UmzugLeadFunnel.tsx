"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Home,
  House,
  LoaderCircle,
  PackageOpen,
} from "lucide-react";
import { useRef, useState } from "react";

const sizeOptions = [
  { value: "1 Zimmer / bis 40 m²", icon: Home },
  { value: "2–3 Zimmer / bis 80 m²", icon: Building2 },
  { value: "4+ Zimmer / über 80 m²", icon: House },
  { value: "Firmenumzug / individuell", icon: PackageOpen },
];

type LeadData = {
  startLocation: string;
  destination: string;
  moveSize: string;
  moveDate: string;
  name: string;
  phone: string;
  email: string;
  privacyAccepted: boolean;
};

const initialLead: LeadData = {
  startLocation: "",
  destination: "",
  moveSize: "",
  moveDate: "",
  name: "",
  phone: "",
  email: "",
  privacyAccepted: false,
};

function normalizeMoveDate(value: string) {
  return value.trim().replace(/\./g, "/");
}

function isValidMoveDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
    normalizeMoveDate(value),
  );
  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

function formatPickerDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function UmzugLeadFunnel() {
  const datePickerRef = useRef<HTMLInputElement>(null);
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
    if (
      (step === 1 &&
        (!lead.startLocation.trim() || !lead.destination.trim())) ||
      (step === 2 && !lead.moveSize)
    ) {
      setError("Bitte füllen Sie alle Angaben in diesem Schritt aus.");
      return;
    }
    if (step === 3 && !isValidMoveDate(lead.moveDate)) {
      setError(
        "Bitte wählen Sie einen Termin oder geben Sie ihn als DD/MM/YYYY beziehungsweise DD.MM.YYYY ein.",
      );
      return;
    }
    if (step === 3) {
      setLead((current) => ({
        ...current,
        moveDate: normalizeMoveDate(current.moveDate),
      }));
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
      "Google-Ads-Landingpage: Umzug",
      `Start: ${lead.startLocation.trim()}`,
      `Ziel: ${lead.destination.trim()}`,
      `Umzugsgröße: ${lead.moveSize}`,
      `Wunschtermin: ${normalizeMoveDate(lead.moveDate)}`,
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
            Von wo nach wo ziehen Sie?
          </legend>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Startadresse oder Ort
              <input
                value={lead.startLocation}
                onChange={(event) => update("startLocation", event.target.value)}
                autoComplete="street-address"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="z. B. 57462 Olpe"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Zieladresse oder Ort
              <input
                value={lead.destination}
                onChange={(event) => update("destination", event.target.value)}
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="z. B. 57072 Siegen"
              />
            </label>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Wie groß ist Ihr Umzug?
          </legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sizeOptions.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => update("moveSize", value)}
                className={optionClass(lead.moveSize === value)}>
                <Icon size={25} className="shrink-0 text-primary" />
                <span className="font-semibold">{value}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="mt-3">
          <legend className="text-2xl font-bold text-navy">
            Wann möchten Sie umziehen?
          </legend>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Wunschtermin
            <span className="relative mt-1.5 block">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={lead.moveDate}
                onChange={(event) => update("moveDate", event.target.value)}
                placeholder="DD/MM/YYYY oder DD.MM.YYYY"
                className="h-12 w-full rounded-lg border border-slate-300 px-4 pr-14 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                aria-label="Datum im Kalender auswählen"
                onClick={() => {
                  const picker = datePickerRef.current;
                  if (!picker) return;
                  picker.showPicker();
                }}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-primary hover:text-orange-600">
                <CalendarDays size={21} />
              </button>
              <input
                ref={datePickerRef}
                type="date"
                lang="de"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) =>
                  update("moveDate", formatPickerDate(event.target.value))
                }
                className="sr-only"
              />
            </span>
          </label>
          {isValidMoveDate(lead.moveDate) && (
            <p className="mt-2 text-sm font-medium text-slate-700">
              Ausgewählt: {normalizeMoveDate(lead.moveDate)}
            </p>
          )}
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Der Termin ist zunächst unverbindlich. Wir prüfen die Verfügbarkeit
            und stimmen alle Details persönlich mit Ihnen ab.
          </p>
        </fieldset>
      )}

      {step === 4 && (
        <div className="mt-3">
          <h2 className="text-2xl font-bold text-navy">
            Wohin dürfen wir Ihr Angebot senden?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Wir verwenden Ihre Angaben ausschließlich zur Bearbeitung Ihrer
            Umzugsanfrage.
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Name
              <input
                value={lead.name}
                onChange={(event) => update("name", event.target.value)}
                autoComplete="name"
                className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                placeholder="Max Mustermann"
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
              E-Mail
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
            <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={lead.privacyAccepted}
                onChange={(event) =>
                  update("privacyAccepted", event.target.checked)
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
