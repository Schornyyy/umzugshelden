"use client";

import React, { useState } from "react";

const ContactPage = () => {
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
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "kontakt@gs-creatives.de",
          subject: `Kontaktformular: ${name}`,
          replacements: { name, phone, email, message },
          templatePath: "ContactEmailTemplate.html",
          tracking: false,
        }),
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setStatus({ ok: true, msg: "Danke — Ihre Nachricht wurde gesendet." });
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        setStatus({
          ok: false,
          msg:
            data.error || data.message || "Fehler beim Senden der Nachricht.",
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
    <div className='container mx-auto py-12 px-4 max-w-2xl'>
      <h1 className='text-3xl font-bold mb-4'>Kontakt</h1>
      <p className='text-gray-600 mb-6'>
        Schreib uns eine Nachricht — wir melden uns innerhalb von 24 Stunden.
      </p>

      <form onSubmit={handleSubmit} className='grid gap-4'>
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
    </div>
  );
};

export default ContactPage;
