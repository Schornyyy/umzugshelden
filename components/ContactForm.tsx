"use client";

import React, { useState } from "react";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(
    null
  );

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
      // Fire both operations (email + request creation) in parallel
      const [emailRes, requestRes] = await Promise.all([
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "info@weiss-hausmeisterservice.de",
            subject: `Kontaktformular: ${name}`,
            replacements: { name, phone, email, message },
            templatePath: "ContactEmailTemplate.html",
            tracking: false,
          }),
        }),
        fetch("/api/requests/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, message }),
        }),
      ]);

      const emailData = await emailRes.json();
      const requestData = await requestRes.json();

      const emailOk = emailRes.ok && !emailData.error;
      const requestOk = requestRes.ok && !requestData.error;

      if (emailOk && requestOk) {
        setStatus({
          ok: true,
          msg: "Danke — Anfrage erfasst und E-Mail gesendet.",
        });
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else if (emailOk && !requestOk) {
        setStatus({
          ok: false,
          msg: `E-Mail gesendet, aber Anfrage konnte nicht gespeichert werden: ${
            requestData.error || "Unbekannter Fehler"
          }`,
        });
      } else if (!emailOk && requestOk) {
        setStatus({
          ok: false,
          msg: `Anfrage gespeichert, aber E-Mail fehlgeschlagen: ${
            emailData.error || "Unbekannter Fehler"
          }`,
        });
      } else {
        setStatus({
          ok: false,
          msg: `Fehler: E-Mail und Anfrage fehlgeschlagen. (${
            emailData.error || "Email"
          }; ${requestData.error || "Request"})`,
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
    <form onSubmit={handleSubmit} className='grid gap-4 w-full'>
      <label className='flex flex-col'>
        <span className='font-medium'>Name *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='border p-2 rounded'
          placeholder='Dein Name'
          required
        />
      </label>

      <label className='flex flex-col'>
        <span className='font-medium'>Telefonnummer</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className='border p-2 rounded'
          placeholder='+49 170 0000000'
        />
      </label>

      <label className='flex flex-col'>
        <span className='font-medium'>E‑Mail *</span>
        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='border p-2 rounded'
          placeholder='name@beispiel.de'
          required
        />
      </label>

      <label className='flex flex-col'>
        <span className='font-medium'>Nachricht *</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className='border p-2 rounded h-32'
          placeholder='Worum geht es?'
          required
        />
      </label>

      <div className='flex items-center gap-4'>
        <button
          type='submit'
          disabled={loading}
          className='bg-primary text-white px-4 py-2 rounded disabled:opacity-60'>
          {loading ? "Senden…" : "Nachricht senden"}
        </button>
        {status && (
          <div
            className={`text-sm ${
              status.ok ? "text-green-600" : "text-red-600"
            }`}>
            {status.msg}
          </div>
        )}
      </div>
    </form>
  );
};

export default ContactForm;
