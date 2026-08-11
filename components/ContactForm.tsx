"use client";

import React, { useState } from "react";
import { createRequest } from "@/actions/requestsActions";

const inputBase =
  "font-body w-full px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const inputDark = `${inputBase} bg-white/90 text-gray-800 placeholder-gray-500`;
const inputLight = `${inputBase} bg-white border border-gray-200 text-gray-800 placeholder-gray-400`;

const ContactForm = ({ dark = false }: { dark?: boolean }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(
    null,
  );

  const inputClass = dark ? inputDark : inputLight;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!email || !message || !name) {
      setStatus({
        ok: false,
        msg: "Bitte fülle Name, E-Mail und Nachricht aus.",
      });
      return;
    }

    setLoading(true);
    try {
      const ownerId = process.env.NEXT_PUBLIC_OWNERID;
      if (!ownerId) throw new Error("Owner-ID nicht konfiguriert.");

      const [emailRes] = await Promise.all([
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "info@umzugshelden.io",
            subject: `Kontaktformular: ${name}`,
            replacements: { name, phone, email, message },
            templatePath: "ContactEmailTemplate.html",
            tracking: false,
          }),
        }),
        createRequest(ownerId, { name, email, phone, message }),
      ]);

      const emailData = await emailRes.json();

      if (emailRes.ok && !emailData.error) {
        setStatus({
          ok: true,
          msg: "Danke — Anfrage erfasst und E-Mail gesendet.",
        });
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        setStatus({
          ok: false,
          msg: `Anfrage gespeichert, aber E-Mail fehlgeschlagen: ${emailData.error || "Unbekannter Fehler"}`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        ok: false,
        msg: "Netzwerkfehler. Bitte versuchen Sie es später erneut.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
      <input
        type='text'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Name'
        required
        className={inputClass}
      />
      <input
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='E-Mail'
        required
        autoComplete='email'
        inputMode='email'
        className={inputClass}
      />
      <input
        type='tel'
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder='Telefonnummer'
        className={inputClass}
      />
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Ihre Nachricht '
        className={`${inputClass} resize-none`}
      />
      <button
        type='submit'
        disabled={loading}
        className='w-full font-sans bg-primary hover:bg-primary/90 text-white py-3 rounded text-sm font-semibold disabled:opacity-60'>
        {loading ? "Senden…" : "Kostenloses Angebot anfordern!"}
      </button>
      {status && (
        <p
          className={`text-sm text-center ${status.ok ? "text-green-600" : "text-red-500"}`}>
          {status.msg}
        </p>
      )}
    </form>
  );
};

export default ContactForm;
