"use client";

import { createRequest } from "@/actions/requestsActions";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import type { LandingPage } from "@/lib/landingPageSettings";
import { Check, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";

type ContactData = {
  name: string;
  phone: string;
  email: string;
};

const initialContact: ContactData = {
  name: "",
  phone: "",
  email: "",
};

export default function GeneratedLandingPageForm({
  page,
}: {
  page: LandingPage;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState(initialContact);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const unanswered = page.questions.some(
      (question) => !answers[question.id]?.trim(),
    );
    if (unanswered) {
      setError("Bitte beantworten Sie alle Fragen.");
      return;
    }
    if (!contact.name.trim() || !contact.phone.trim() || !contact.email.trim()) {
      setError("Bitte füllen Sie Name, Telefonnummer und E-Mail aus.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
    if (!ownerId) {
      setError("Die Anfrage ist derzeit nicht verfügbar.");
      return;
    }

    setSubmitting(true);
    const message = [
      `Landingpage: ${page.serviceName}`,
      ...page.questions.map(
        (question) => `${question.label}: ${answers[question.id]}`,
      ),
    ].join("\n");

    try {
      await createRequest(ownerId, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        message,
      });
      trackGoogleAnalyticsEvent("generate_lead", {
        service: page.serviceKey,
        source: "generated_landingpage",
      });
      trackGoogleAnalyticsEvent("Kontakt_formular");
      setSubmitted(true);
      setAnswers({});
      setContact(initialContact);
    } catch (caughtError) {
      console.error("Landingpage-Anfrage konnte nicht gespeichert werden:", caughtError);
      setError(
        "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={32} strokeWidth={3} />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-navy">Anfrage erhalten</h2>
        <p className="mt-2 max-w-sm text-slate-600">
          Vielen Dank. Wir prüfen Ihre Angaben und melden uns persönlich bei
          Ihnen.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-orange-100";

  return (
    <form onSubmit={submit}>
      <h2 className="text-2xl font-bold text-navy">{page.formTitle}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Kostenlos und unverbindlich – wir melden uns persönlich bei Ihnen.
      </p>

      <div className="mt-6 grid gap-4">
        {page.questions.map((question) => (
          <label
            key={question.id}
            className="text-sm font-semibold text-slate-800">
            {question.label}
            {question.type === "select" ? (
              <select
                required
                value={answers[question.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className={inputClass}>
                <option value="">Bitte auswählen</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                type={question.type}
                placeholder={question.placeholder}
                value={answers[question.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className={inputClass}
              />
            )}
          </label>
        ))}
      </div>

      <div className="my-6 border-t border-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
          Name
          <input
            required
            autoComplete="name"
            value={contact.name}
            onChange={(event) =>
              setContact((current) => ({ ...current, name: event.target.value }))
            }
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Telefonnummer
          <input
            required
            type="tel"
            autoComplete="tel"
            value={contact.phone}
            onChange={(event) =>
              setContact((current) => ({ ...current, phone: event.target.value }))
            }
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          E-Mail
          <input
            required
            type="email"
            autoComplete="email"
            value={contact.email}
            onChange={(event) =>
              setContact((current) => ({ ...current, email: event.target.value }))
            }
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <Send size={18} />
        )}
        Anfrage absenden
      </button>
    </form>
  );
}
