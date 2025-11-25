/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Application } from "@/types/Applications";
import { Button } from "@/components/ui/button";
import Headings from "@/components/Headings";
import Link from "next/link";

const statuses: Application["status"][] = [
  "pending",
  "in_review",
  "accepted",
  "rejected",
];

export default function ApplicationDetailClient({
  initialApplication,
  userid,
}: {
  initialApplication: Application;
  userid: string;
}) {
  const [app, setApp] = useState<Application>(initialApplication);
  const router = useRouter();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [fieldsUpdating, setFieldsUpdating] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteTitel, setNoteTitel] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [fieldsMsg, setFieldsMsg] = useState<string | null>(null);
  const [noteMsgState, setNoteMsgState] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState(app.message);
  const [editSalary, setEditSalary] = useState(app.salary);
  const [editAvailableAt, setEditAvailableAt] = useState(app.availableAt);

  function statusLabel(code: Application["status"]): string {
    switch (code) {
      case "pending":
        return "Offen";
      case "in_review":
        return "In Prüfung";
      case "accepted":
        return "Angenommen";
      case "rejected":
        return "Abgelehnt";
      default:
        return code;
    }
  }

  async function updateStatus(newStatus: Application["status"]) {
    setStatusMsg(null);
    setStatusUpdating(true);
    try {
      const res = await fetch("/api/applications/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          ownerId: userid,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error && data.application) {
        setApp(data.application as Application);
        setStatusMsg("Status aktualisiert.");
      } else {
        setStatusMsg(data.error || "Fehler beim Aktualisieren des Status.");
      }
    } catch (e) {
      setStatusMsg("Netzwerkfehler.");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function updateFields() {
    setFieldsMsg(null);
    setFieldsUpdating(true);
    try {
      const res = await fetch("/api/applications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          ownerId: userid,
          message: editMessage,
          salary: editSalary,
          availableAt: editAvailableAt,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error && data.application) {
        setApp(data.application as Application);
        setFieldsMsg("Felder gespeichert.");
      } else {
        setFieldsMsg(data.error || "Fehler beim Speichern.");
      }
    } catch (e) {
      setFieldsMsg("Netzwerkfehler.");
    } finally {
      setFieldsUpdating(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteMsgState(null);
    if (!noteTitel || !noteMsg) {
      setNoteMsgState("Titel und Nachricht erforderlich.");
      return;
    }
    setNoteLoading(true);
    try {
      const res = await fetch("/api/applications/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          ownerId: userid,
          titel: noteTitel,
          msg: noteMsg,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error && data.application) {
        setApp(data.application as Application);
        setNoteTitel("");
        setNoteMsg("");
        setNoteMsgState("Notiz hinzugefügt.");
      } else {
        setNoteMsgState(data.error || "Fehler beim Speichern.");
      }
    } catch (e) {
      setNoteMsgState("Netzwerkfehler.");
    } finally {
      setNoteLoading(false);
    }
  }

  async function deleteApplication() {
    const ok = window.confirm(
      "Bewerbung wirklich löschen? Dies kann nicht rückgängig gemacht werden."
    );
    if (!ok) return;
    try {
      const res = await fetch("/api/applications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, ownerId: userid }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        router.push(`/admin/${userid}/applications`);
      } else {
        alert(data.error || "Fehler beim Löschen.");
      }
    } catch (e) {
      alert("Netzwerkfehler beim Löschen.");
    }
  }

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex items-center justify-between'>
        <Link
          href={`/admin/${userid}/applications`}
          className='text-sm underline underline-offset-4 hover:text-primary'>
          Zurück zur Liste
        </Link>
        <span className='text-xs font-mono text-muted-foreground'>
          Erstellt: {new Date(app.createdAt).toLocaleString("de-DE")}
        </span>
      </div>

      {/* Status */}
      <div className='flex flex-col gap-4'>
        <Headings level={4}>Status</Headings>
        <div className='flex flex-wrap gap-2'>
          {statuses.map((s) => (
            <Button
              key={s}
              type='button'
              variant={app.status === s ? "default" : "outline"}
              size='sm'
              disabled={statusUpdating}
              onClick={() => updateStatus(s)}>
              {statusLabel(s)}
            </Button>
          ))}
        </div>
        {statusMsg && (
          <span className='text-xs mt-1 text-muted-foreground'>
            {statusMsg}
          </span>
        )}
      </div>

      {/* Grunddaten */}
      <div className='grid gap-4 text-sm'>
        <div>
          <span className='font-medium'>Name:</span> {app.name}
        </div>
        <div>
          <span className='font-medium'>E-Mail:</span> {app.email}
        </div>
        <div>
          <span className='font-medium'>Telefon:</span> {app.phone || "—"}
        </div>
        <div>
          <span className='font-medium'>Stelle:</span> {app.jobTitel || "—"}
        </div>
        <div>
          <span className='font-medium'>Verfügbar ab:</span> {app.availableAt}
        </div>
        <div>
          <span className='font-medium'>Gehaltsvorstellung:</span> {app.salary}
        </div>
        <div>
          <span className='font-medium'>Aktualisiert:</span>{" "}
          {new Date(app.updatedAt).toLocaleString("de-DE")}
        </div>
      </div>

      {/* Editierbare Felder */}
      <div className='flex flex-col gap-4'>
        <Headings level={4}>Inhalt bearbeiten</Headings>
        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium'>Nachricht / Motivation</label>
          <textarea
            rows={6}
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className='border rounded px-3 py-2 text-sm'
            disabled={fieldsUpdating}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium'>Verfügbar ab</label>
          <input
            type='text'
            value={editAvailableAt}
            onChange={(e) => setEditAvailableAt(e.target.value)}
            className='border rounded px-3 py-2 text-sm'
            disabled={fieldsUpdating}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium'>Gehaltsvorstellung</label>
          <input
            type='text'
            value={editSalary}
            onChange={(e) => setEditSalary(e.target.value)}
            className='border rounded px-3 py-2 text-sm'
            disabled={fieldsUpdating}
          />
        </div>
        <div className='flex gap-3'>
          <Button
            type='button'
            disabled={fieldsUpdating}
            onClick={updateFields}>
            {fieldsUpdating ? "Speichert…" : "Änderungen speichern"}
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={deleteApplication}>
            Bewerbung löschen
          </Button>
        </div>
        {fieldsMsg && (
          <span className='text-xs text-muted-foreground'>{fieldsMsg}</span>
        )}
      </div>

      {/* Dateien */}
      <div className='flex flex-col gap-4'>
        <Headings level={4}>Dateien</Headings>
        {app.files.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Keine Dateien hochgeladen.
          </p>
        ) : (
          <ul className='flex flex-col gap-2 text-sm'>
            {app.files.map((file, idx) => (
              <li key={idx} className='flex items-center justify-between'>
                <a
                  href={file}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline underline-offset-4'>
                  Datei {idx + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notizen */}
      <div className='flex flex-col gap-6'>
        <Headings level={4}>Notizen</Headings>
        {app.notes.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Keine Notizen vorhanden.
          </p>
        ) : (
          <ul className='flex flex-col gap-3'>
            {app.notes
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((n, idx) => (
                <li
                  key={idx}
                  className='border rounded-md p-4 bg-card/50 flex flex-col gap-1 text-sm'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='font-semibold'>{n.titel}</span>
                    <span className='text-muted-foreground font-mono'>
                      {new Date(n.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <p className='whitespace-pre-line'>{n.msg}</p>
                </li>
              ))}
          </ul>
        )}
        <form onSubmit={addNote} className='grid gap-4 max-w-xl'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Notiz Titel *</label>
            <input
              value={noteTitel}
              onChange={(e) => setNoteTitel(e.target.value)}
              className='border rounded px-3 py-2 text-sm'
              placeholder='Kurzer Titel'
              required
              disabled={noteLoading}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Notiz Text *</label>
            <textarea
              value={noteMsg}
              onChange={(e) => setNoteMsg(e.target.value)}
              className='border rounded px-3 py-2 text-sm h-32'
              placeholder='Details zum Bewerbungsprozess'
              required
              disabled={noteLoading}
            />
          </div>
          <div className='flex items-center gap-4'>
            <Button type='submit' disabled={noteLoading}>
              {noteLoading ? "Speichert…" : "Notiz hinzufügen"}
            </Button>
            {noteMsgState && (
              <span
                className={`text-sm ${
                  noteMsgState.includes("hinzu")
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                {noteMsgState}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
