"use client";
import { useState } from "react";
import { Request } from "@/types/Request";
import { Button } from "@/components/ui/button";
import Headings from "@/components/Headings";
import Link from "next/link";

export default function RequestDetailClient({
  initialRequest,
  userid,
}: {
  initialRequest: Request;
  userid: string;
}) {
  const [request, setRequest] = useState<Request>(initialRequest);
  const [titel, setTitel] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; text: string }>(
    null,
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<null | {
    ok: boolean;
    text: string;
  }>(null);

  async function addNotice(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!titel || !msg) {
      setStatus({ ok: false, text: "Titel und Nachricht erforderlich." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/requests/add-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          ownerId: process.env.NEXT_PUBLIC_OWNERID,
          titel,
          msg,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error && data.request) {
        setRequest(data.request as Request);
        setTitel("");
        setMsg("");
        setStatus({ ok: true, text: "Notiz hinzugefügt." });
      } else {
        setStatus({ ok: false, text: data.error || "Fehler beim Speichern." });
      }
    } catch (err) {
      console.error(err);
      setStatus({ ok: false, text: "Netzwerkfehler." });
    } finally {
      setLoading(false);
    }
  }

  async function requestReview() {
    setReviewStatus(null);
    setReviewLoading(true);
    try {
      const res = await fetch("/api/requests/request-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          ownerId: process.env.NEXT_PUBLIC_OWNERID,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error && data.request) {
        setRequest(data.request as Request);
        setReviewStatus({ ok: true, text: "Bewertungs-E-Mail gesendet." });
      } else {
        setReviewStatus({
          ok: false,
          text: data.error || "Fehler beim Senden.",
        });
      }
    } catch (err) {
      console.error(err);
      setReviewStatus({ ok: false, text: "Netzwerkfehler." });
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <Headings level={4}>Basisdaten</Headings>
          <Link
            href={`/admin/${userid}/requests`}
            className='text-sm underline underline-offset-4 hover:text-primary'>
            Zurück zur Liste
          </Link>
        </div>
        <div className='flex flex-wrap gap-3 mt-2'>
          <Button
            type='button'
            onClick={requestReview}
            disabled={reviewLoading}
            variant='outline'>
            {reviewLoading ? "Sendet…" : "Bewertung anfragen"}
          </Button>
          {reviewStatus && (
            <span
              className={`text-sm ${
                reviewStatus.ok ? "text-green-600" : "text-red-600"
              }`}>
              {reviewStatus.text}
            </span>
          )}
        </div>
        <div className='grid gap-4 text-sm'>
          <div>
            <span className='font-medium'>Name:</span> {request.name}
          </div>
          <div>
            <span className='font-medium'>E-Mail:</span> {request.email}
          </div>
          <div>
            <span className='font-medium'>Telefon:</span> {request.phone || "—"}
          </div>
          <div>
            <span className='font-medium'>Eingegangen:</span>{" "}
            {new Date(request.createdAt).toLocaleString("de-DE")}
          </div>
          <div>
            <span className='font-medium'>Nachricht:</span>
            <p className='mt-1 whitespace-pre-line leading-relaxed'>
              {request.message}
            </p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-6'>
        <Headings level={4}>Notizen</Headings>
        {request.notices.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Keine Notizen vorhanden.
          </p>
        ) : (
          <ul className='flex flex-col gap-3'>
            {request.notices
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((n, idx) => (
                <li
                  key={idx}
                  className='border rounded-md p-4 bg-card/50 flex flex-col gap-1'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='font-semibold'>{n.titel}</span>
                    <span className='text-muted-foreground font-mono'>
                      {new Date(n.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <p className='text-sm whitespace-pre-line'>{n.msg}</p>
                </li>
              ))}
          </ul>
        )}

        <form onSubmit={addNotice} className='grid gap-4 max-w-xl'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Notiz Titel *</label>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              className='border rounded px-3 py-2 text-sm'
              placeholder='Kurzer Titel'
              required
              disabled={loading}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Notiz Text *</label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className='border rounded px-3 py-2 text-sm h-32'
              placeholder='Details zur Bearbeitung / Rückruf etc.'
              required
              disabled={loading}
            />
          </div>
          <div className='flex items-center gap-4'>
            <Button type='submit' disabled={loading}>
              {loading ? "Speichert…" : "Notiz hinzufügen"}
            </Button>
            {status && (
              <span
                className={`text-sm ${
                  status.ok ? "text-green-600" : "text-red-600"
                }`}>
                {status.text}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
