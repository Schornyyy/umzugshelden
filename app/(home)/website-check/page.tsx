"use client";

import Headings from "@/components/Headings";
import React, { useState } from "react";

type FormValues = {
  siteUrl?: string;
  siteType: "Landingpage" | "Firmen-Website" | "Funnel" | "";
  goal:
    | "Kunden gewinnen"
    | "Mitarbeiter gewinnen"
    | "Reichweite"
    | "Andere"
    | "";
  goalOther: string;
  specialFeatures: string;
  company?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  acceptPrivacy: boolean;
};

const STEPS = [
  "Website-URL",
  "Art der Seite",
  "Ziel der Website",
  "Besondere Funktionen",
  "Kontaktdaten",
];

export default function Page() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [values, setValues] = useState<FormValues>({
    siteUrl: "",
    siteType: "",
    goal: "",
    goalOther: "",
    specialFeatures: "",
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    acceptPrivacy: false,
  });

  function update<K extends keyof FormValues>(key: K, v: FormValues[K]) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function canProceed(nextStep = step + 1) {
    // Steps: 0=siteUrl, 1=siteType, 2=goal, 3=specialFeatures, 4=contact
    if (nextStep === 1) {
      return !!values.siteUrl && values.siteUrl.trim() !== "";
    }
    if (nextStep === 2) {
      return values.siteType !== "";
    }
    if (nextStep === 3) {
      return values.goal !== "";
    }
    return true;
  }

  function goTo(next: number) {
    if (next < 0 || next > STEPS.length - 1) return;
    if (next > step && !canProceed(next)) return;
    setDirection(next > step ? "next" : "prev");
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 320);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!values.contactPerson || !values.email || !values.acceptPrivacy) {
      alert(
        "Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die Datenschutzerklärung."
      );
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "kontakt@gs-creatives.de",
          subject: `Website-Check Anfrage: ${
            values.company || values.contactPerson
          }`,
          replacements: values,
          templatePath: "website-check.html",
          tracking: false,
        }),
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Beim Absenden ist ein Fehler aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className='max-w-5xl mx-auto p-6 py-24'>
      <div className='flex flex-col gap-3 pb-16'>
        <Headings level={1} className='text-center'>
          Dein kostenloser Website-Check für Handwerksbetriebe
        </Headings>
        <p className='text-slate-600'>
          Nach dem Ausfüllen erhälst du von uns eine PDF mit einem Score, wie
          deine Seite im Durschnitt abschneidet. <br />
          Außerdem geben wir dir konkrete Tipps, wie du deine Website verbessern
          kannst, um mehr Kunden zu gewinnen.
        </p>
      </div>

      <h2 className='text-2xl font-bold mb-4'>Website-Check</h2>

      <div className='mb-6'>
        <div className='flex items-center gap-3 mb-2'>
          {STEPS.map((label, i) => (
            <div key={i} className='flex items-center gap-3'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                }`}>
                {i + 1}
              </div>
              <div
                className={`hidden sm:block text-sm ${
                  i <= step ? "text-primary font-medium" : "text-gray-500"
                }`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-primary transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className='relative overflow-hidden h-96'>
        <div className='absolute inset-0'>
          {/* Step 0: Website URL */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              animating
                ? direction === "next"
                  ? "-translate-x-full"
                  : "translate-x-full"
                : step === 0
                ? "translate-x-0"
                : step < 0
                ? "translate-x-full"
                : "-translate-x-full"
            }`}
            style={{ display: step === 0 || animating ? undefined : "none" }}>
            <div className='p-4 bg-white rounded shadow h-full'>
              <h3 className='text-lg font-semibold mb-3'>Website-URL</h3>
              <p className='text-sm text-gray-600 mb-3'>
                Bitte gib die URL deiner aktuellen Website ein (inkl. https://).
              </p>
              <input
                value={values.siteUrl}
                onChange={(e) => update("siteUrl", e.target.value)}
                placeholder='https://deine-website.de'
                className='w-full border p-2 rounded'
              />
            </div>
          </div>

          {/* Step 1: Art der Seite */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              animating
                ? direction === "next"
                  ? "translate-x-full"
                  : "-translate-x-full"
                : step === 1
                ? "translate-x-0"
                : step < 1
                ? "translate-x-full"
                : "-translate-x-full"
            }`}
            style={{ display: step === 1 || animating ? undefined : "none" }}>
            <div className='p-4 bg-white rounded shadow h-full'>
              <h3 className='text-lg font-semibold mb-3'>Art der Seite</h3>
              <div className='flex flex-col gap-2'>
                {(["Landingpage", "Firmen-Website", "Funnel"] as const).map(
                  (opt) => (
                    <label
                      key={opt}
                      className={`p-3 border rounded cursor-pointer ${
                        values.siteType === opt
                          ? "border-primary bg-primary/10"
                          : "border-gray-200"
                      }`}>
                      <input
                        type='radio'
                        name='siteType'
                        value={opt}
                        checked={values.siteType === opt}
                        onChange={() => update("siteType", opt)}
                        className='mr-2'
                      />{" "}
                      {opt}
                    </label>
                  )
                )}
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              animating
                ? direction === "next"
                  ? "translate-x-full"
                  : "-translate-x-full"
                : step === 2
                ? "translate-x-0"
                : step < 2
                ? "translate-x-full"
                : "-translate-x-full"
            }`}
            style={{ display: step === 2 || animating ? undefined : "none" }}>
            <div className='p-4 bg-white rounded shadow h-full'>
              <h3 className='text-lg font-semibold mb-3'>Ziel der Website</h3>
              <div className='flex flex-col gap-2'>
                {(
                  [
                    "Kunden gewinnen",
                    "Mitarbeiter gewinnen",
                    "Reichweite",
                    "Andere",
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt}
                    className={`p-3 border rounded cursor-pointer ${
                      values.goal === opt
                        ? "border-primary bg-primary/10"
                        : "border-gray-200"
                    }`}>
                    <input
                      type='radio'
                      name='goal'
                      value={opt}
                      checked={values.goal === opt}
                      onChange={() => update("goal", opt)}
                      className='mr-2'
                    />{" "}
                    {opt}
                  </label>
                ))}

                {values.goal === "Andere" && (
                  <input
                    value={values.goalOther}
                    onChange={(e) => update("goalOther", e.target.value)}
                    placeholder='Anderes Ziel beschreiben'
                    className='mt-3 border p-2 rounded'
                  />
                )}
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              animating
                ? direction === "next"
                  ? "translate-x-full"
                  : "-translate-x-full"
                : step === 3
                ? "translate-x-0"
                : step < 3
                ? "translate-x-full"
                : "-translate-x-full"
            }`}
            style={{ display: step === 3 || animating ? undefined : "none" }}>
            <div className='p-4 bg-white rounded shadow h-full'>
              <h3 className='text-lg font-semibold mb-3'>
                Besondere Funktionen?
              </h3>
              <p className='text-sm text-gray-600 mb-3'>
                Beschreibe kurz, welche speziellen Features du verwendest (z.B.
                Shop, Buchungssystem, Login).
              </p>
              <textarea
                value={values.specialFeatures}
                onChange={(e) => update("specialFeatures", e.target.value)}
                className='w-full h-36 border p-2 rounded'
              />
            </div>
          </div>

          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              animating
                ? direction === "next"
                  ? "translate-x-full"
                  : "-translate-x-full"
                : step === 4
                ? "translate-x-0"
                : step < 4
                ? "translate-x-full"
                : "-translate-x-full"
            }`}
            style={{ display: step === 4 || animating ? undefined : "none" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className='p-4 bg-white rounded shadow h-full'>
              <h3 className='text-lg font-semibold mb-3'>Kontaktdaten</h3>

              <label className='flex flex-col mb-2'>
                <span className='text-sm font-medium'>Firmenname</span>
                <input
                  value={values.company}
                  onChange={(e) => update("company", e.target.value)}
                  className='border p-2 rounded'
                />
              </label>

              <label className='flex flex-col mb-2'>
                <span className='text-sm font-medium'>Ansprechperson *</span>
                <input
                  value={values.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                  required
                  className='border p-2 rounded'
                />
              </label>

              <label className='flex flex-col mb-2'>
                <span className='text-sm font-medium'>E‑Mail *</span>
                <input
                  type='email'
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  className='border p-2 rounded'
                />
              </label>

              <label className='flex flex-col mb-2'>
                <span className='text-sm font-medium'>Telefonnummer</span>
                <input
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className='border p-2 rounded'
                />
              </label>

              <label className='flex items-start gap-2 mt-3'>
                <input
                  type='checkbox'
                  name='acceptPrivacy'
                  checked={values.acceptPrivacy}
                  onChange={(e) => update("acceptPrivacy", e.target.checked)}
                  required
                  aria-required
                  className='mt-1'
                />
                <span className='text-sm'>
                  Ich akzeptiere die{" "}
                  <a
                    href={"/datenschutz"}
                    target={"_blank"}
                    rel={"noreferrer"}
                    className='text-primary underline'>
                    Datenschutzerklärung
                  </a>{" "}
                  *
                </span>
              </label>
            </form>
          </div>
        </div>
      </div>

      {!submitted ? (
        <div className='mt-6 flex items-center justify-between'>
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className='px-4 py-2 border rounded disabled:opacity-50'>
            Zurück
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => goTo(step + 1)}
              className='px-4 py-2 bg-primary text-white rounded'>
              Weiter
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className='px-4 py-2 bg-primary text-white rounded disabled:opacity-50'>
              {submitting ? "Wird gesendet..." : "Absenden"}
            </button>
          )}
        </div>
      ) : (
        <div className='mt-6 p-4 bg-green-50 text-green-800 rounded'>
          Danke — wir melden uns in Kürze.
        </div>
      )}

      <style jsx>{`
        :root {
          --primary: rgb(70, 147, 221);
        }
      `}</style>
    </div>
  );
}
