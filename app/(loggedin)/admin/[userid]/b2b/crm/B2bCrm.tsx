"use client";

import { SimpleRichTextEditor } from "@/components/RichTextEditor";
import { auth, database } from "@/config/firebase";
import {
  defaultEmailDraft,
  markdownEmailDraft,
} from "@/lib/b2bEmailDraft";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type {
  B2bEmailActivity,
  B2bLead,
  B2bLeadCategory,
  B2bLeadStatus,
} from "@/types/B2b";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Building2,
  CalendarClock,
  ExternalLink,
  LoaderCircle,
  Mail,
  Save,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const LEAD_COLLECTION = "b2b_leads_umzugshelden";
const ACTIVITY_COLLECTION = "b2b_email_activities_umzugshelden";

const statusOptions: Array<{ value: B2bLeadStatus; label: string }> = [
  { value: "new", label: "Neu" },
  { value: "contacted", label: "Kontaktiert" },
  { value: "interested", label: "Interessiert" },
  { value: "follow_up", label: "Follow-up" },
  { value: "won", label: "Gewonnen" },
  { value: "lost", label: "Verloren" },
];

const categoryLabels: Record<B2bLead["category"], string> = {
  real_estate_agent: "Immobilienmakler",
  property_management: "Immobilienverwaltung",
  housing_company: "Wohnungsbaugesellschaft",
  senior_care: "Senioren-/Pflegeheim",
};

function dateTimeInputValue(timestamp: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "Noch kein Kontakt";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export default function B2bCrm() {
  const { companyData } = useCompanyData();
  const [leads, setLeads] = useState<B2bLead[]>([]);
  const [activities, setActivities] = useState<B2bEmailActivity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    B2bLeadCategory | "all"
  >("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(defaultEmailDraft);
  const [editorVersion, setEditorVersion] = useState(0);
  const initializedLeadId = useRef("");
  const [edit, setEdit] = useState({
    contactName: "",
    email: "",
    phone: "",
    website: "",
    category: "real_estate_agent" as B2bLeadCategory,
    status: "new" as B2bLeadStatus,
    nextFollowUpAt: "",
  });

  useEffect(() => {
    if (!companyData?.id) return;
    const leadsQuery = query(
      collection(database, LEAD_COLLECTION),
      where("ownerId", "==", companyData.id),
    );
    const activitiesQuery = query(
      collection(database, ACTIVITY_COLLECTION),
      where("ownerId", "==", companyData.id),
    );
    const unsubscribeLeads = onSnapshot(
      leadsQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }) as B2bLead)
          .sort((a, b) => {
            const first = a.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER;
            const second = b.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER;
            return first - second || b.updatedAt - a.updatedAt;
          });
        setLeads(next);
        setSelectedId((current) => {
          if (current && next.some((lead) => lead.id === current)) {
            return current;
          }
          const requestedLeadId = new URLSearchParams(
            window.location.search,
          ).get("lead");
          return requestedLeadId &&
            next.some((lead) => lead.id === requestedLeadId)
            ? requestedLeadId
            : next[0]?.id ?? "";
        });
        setLoading(false);
      },
      (snapshotError) => {
        console.error("B2B leads could not be loaded", snapshotError);
        setError("Die B2B-Leads konnten nicht geladen werden.");
        setLoading(false);
      },
    );
    const unsubscribeActivities = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        setActivities(
          snapshot.docs
            .map(
              (entry) =>
                ({ id: entry.id, ...entry.data() }) as B2bEmailActivity,
            )
            .sort((a, b) => b.sentAt - a.sentAt),
        );
      },
      (snapshotError) => {
        console.error("B2B activities could not be loaded", snapshotError);
        setError("Die E-Mail-Historie konnte nicht geladen werden.");
      },
    );
    return () => {
      unsubscribeLeads();
      unsubscribeActivities();
    };
  }, [companyData?.id]);

  const selectedLead = leads.find((lead) => lead.id === selectedId);
  const selectedActivities = activities.filter(
    (activity) => activity.leadId === selectedId,
  );
  const filteredLeads = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("de-DE");
    return leads.filter((lead) => {
      if (categoryFilter !== "all" && lead.category !== categoryFilter) {
        return false;
      }
      if (!term) return true;
      return [lead.companyName, lead.email, lead.address, lead.contactName]
        .join(" ")
        .toLocaleLowerCase("de-DE")
        .includes(term);
    });
  }, [categoryFilter, leads, search]);

  useEffect(() => {
    if (!selectedLead) return;
    if (initializedLeadId.current === selectedLead.id) return;
    initializedLeadId.current = selectedLead.id;
    setEdit({
      contactName: selectedLead.contactName,
      email: selectedLead.email,
      phone: selectedLead.phone,
      website: selectedLead.website,
      category: selectedLead.category,
      status: selectedLead.status,
      nextFollowUpAt: dateTimeInputValue(selectedLead.nextFollowUpAt),
    });
    setSubject(`Kooperationsanfrage an ${selectedLead.companyName}`);
    setContent(defaultEmailDraft());
    setEditorVersion((value) => value + 1);
    setMessage("");
    setError("");
  }, [selectedLead]);

  async function saveLead() {
    if (!selectedLead) return false;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (
        !edit.category ||
        !edit.contactName.trim() ||
        !edit.website.trim() ||
        !edit.email.trim()
      ) {
        throw new Error(
          "Branche, Ansprechpartner, Website und E-Mail müssen ausgefüllt sein.",
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.email.trim())) {
        throw new Error("Bitte eine gültige E-Mail-Adresse angeben.");
      }
      let website: URL;
      try {
        website = new URL(edit.website.trim());
      } catch {
        throw new Error("Bitte eine gültige Website inklusive https:// angeben.");
      }
      if (!["http:", "https:"].includes(website.protocol)) {
        throw new Error("Die Website muss mit http:// oder https:// beginnen.");
      }
      await updateDoc(doc(database, LEAD_COLLECTION, selectedLead.id), {
        contactName: edit.contactName.trim(),
        email: edit.email.trim().toLowerCase(),
        phone: edit.phone.trim(),
        website: website.toString(),
        category: edit.category,
        status: edit.status,
        nextFollowUpAt: edit.nextFollowUpAt
          ? new Date(edit.nextFollowUpAt).getTime()
          : null,
        updatedAt: Date.now(),
      });
      setMessage("Lead gespeichert.");
      return true;
    } catch (saveError) {
      console.error("B2B lead save failed", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Der Lead konnte nicht gespeichert werden.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function sendEmail() {
    if (!selectedLead || !companyData?.id) return;
    setSending(true);
    setError("");
    setMessage("");
    try {
      if (!(await saveLead())) return;
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Bitte erneut anmelden.");
      const response = await fetch("/api/admin/b2b/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: companyData.id,
          leadId: selectedLead.id,
          subject,
          content,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        nextFollowUpAt?: number;
        followUpDays?: number;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Die E-Mail konnte nicht versendet werden.");
      }
      setMessage(
        `E-Mail wurde über Brevo versendet. Nächstes Follow-up in ${
          payload.followUpDays ?? 7
        } Tagen.`,
      );
      if (payload.nextFollowUpAt) {
        setEdit((current) => ({
          ...current,
          nextFollowUpAt: dateTimeInputValue(payload.nextFollowUpAt ?? null),
        }));
      }
      setContent(defaultEmailDraft());
      setEditorVersion((value) => value + 1);
    } catch (sendError) {
      console.error("B2B email send failed", sendError);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Die E-Mail konnte nicht versendet werden.",
      );
    } finally {
      setSending(false);
    }
  }

  async function generateEmail() {
    if (!selectedLead || !companyData?.id) return;
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      if (!(await saveLead())) return;
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Bitte erneut anmelden.");
      const response = await fetch("/api/admin/b2b/generate-email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: companyData.id,
          leadId: selectedLead.id,
        }),
      });
      const payload = (await response.json()) as {
        subject?: string;
        body?: string;
        error?: string;
      };
      if (!response.ok || !payload.subject || !payload.body) {
        throw new Error(
          payload.error || "Der E-Mail-Entwurf konnte nicht erstellt werden.",
        );
      }
      setSubject(payload.subject);
      setContent(markdownEmailDraft(payload.body));
      setEditorVersion((value) => value + 1);
      setMessage("KI-Entwurf erstellt. Bitte vor dem Versand prüfen.");
    } catch (generationError) {
      console.error("B2B email generation failed", generationError);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Der E-Mail-Entwurf konnte nicht erstellt werden.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center gap-2 rounded-xl bg-white p-8 text-slate-600'>
        <LoaderCircle className='h-5 w-5 animate-spin' />
        B2B CRM wird geladen ...
      </div>
    );
  }

  return (
    <main className='space-y-5 pb-12'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
          B2B
        </p>
        <h1 className='mt-2 text-3xl font-bold text-slate-950'>CRM & E-Mail-Verlauf</h1>
        <p className='mt-2 text-sm text-slate-600'>
          Leads bearbeiten, Follow-ups planen und personalisierte E-Mails direkt über
          Brevo versenden.
        </p>
      </header>

      {error && (
        <p role='alert' className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      )}
      {message && (
        <p role='status' className='rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
          {message}
        </p>
      )}

      <div className='grid min-h-[720px] gap-5 lg:grid-cols-[360px_minmax(0,1fr)]'>
        <section className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-200 p-4'>
            <label className='relative block'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-slate-400' />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Firma, Ort oder E-Mail suchen'
                className='w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm'
              />
            </label>
            <label className='mt-3 block text-xs font-medium text-slate-600'>
              Branche
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as B2bLeadCategory | "all",
                  )
                }
                className='mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700'>
                <option value='all'>Alle Branchen</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p className='mt-3 text-xs text-slate-500'>{filteredLeads.length} Leads</p>
          </div>
          <div className='max-h-[650px] overflow-y-auto'>
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                type='button'
                onClick={() => setSelectedId(lead.id)}
                className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                  selectedId === lead.id ? "bg-blue-50" : ""
                }`}>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold text-slate-950'>{lead.companyName}</p>
                    <p className='mt-1 truncate text-xs text-slate-500'>
                      {categoryLabels[lead.category]}
                    </p>
                  </div>
                  <span className='rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600'>
                    {statusOptions.find((option) => option.value === lead.status)?.label}
                  </span>
                </div>
                <p className='mt-3 flex items-center gap-1 text-xs text-slate-600'>
                  <CalendarClock className='h-3.5 w-3.5' />
                  {lead.nextFollowUpAt
                    ? `Follow-up ${formatDate(lead.nextFollowUpAt)}`
                    : "Kein Follow-up geplant"}
                </p>
              </button>
            ))}
            {!filteredLeads.length && (
              <p className='p-6 text-center text-sm text-slate-500'>
                Noch keine passenden Leads vorhanden.
              </p>
            )}
          </div>
        </section>

        {selectedLead ? (
          <div className='space-y-5'>
            <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-2'>
                    <Building2 className='h-5 w-5 text-blue-700' />
                    <h2 className='text-xl font-bold text-slate-950'>
                      {selectedLead.companyName}
                    </h2>
                  </div>
                  <p className='mt-2 text-sm text-slate-600'>{selectedLead.address}</p>
                  {selectedLead.aiOfferAngle && (
                    <p className='mt-3 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800'>
                      KI-Ansatz: {selectedLead.aiOfferAngle}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  {selectedLead.website && (
                    <a
                      href={selectedLead.website}
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-1 text-sm font-semibold text-blue-700'>
                      Website <ExternalLink className='h-4 w-4' />
                    </a>
                  )}
                  {selectedLead.googleMapsUrl && (
                    <a
                      href={selectedLead.googleMapsUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-1 text-sm font-semibold text-blue-700'>
                      Maps <ExternalLink className='h-4 w-4' />
                    </a>
                  )}
                </div>
              </div>

              <div className='mt-5 grid gap-4 md:grid-cols-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Ansprechpartner *
                  <input
                    value={edit.contactName}
                    onChange={(event) =>
                      setEdit((current) => ({ ...current, contactName: event.target.value }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Branche *
                  <select
                    required
                    value={edit.category}
                    onChange={(event) =>
                      setEdit((current) => ({
                        ...current,
                        category: event.target.value as B2bLeadCategory,
                      }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  E-Mail *
                  <input
                    type='email'
                    required
                    value={edit.email}
                    onChange={(event) =>
                      setEdit((current) => ({ ...current, email: event.target.value }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Telefon
                  <input
                    value={edit.phone}
                    onChange={(event) =>
                      setEdit((current) => ({ ...current, phone: event.target.value }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Website *
                  <input
                    type='url'
                    required
                    value={edit.website}
                    onChange={(event) =>
                      setEdit((current) => ({ ...current, website: event.target.value }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                    placeholder='https://...'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Lead-Status
                  <select
                    value={edit.status}
                    onChange={(event) =>
                      setEdit((current) => ({
                        ...current,
                        status: event.target.value as B2bLeadStatus,
                      }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='text-sm font-medium text-slate-700 md:col-span-2'>
                  Nächstes Follow-up
                  <input
                    type='datetime-local'
                    value={edit.nextFollowUpAt}
                    onChange={(event) =>
                      setEdit((current) => ({
                        ...current,
                        nextFollowUpAt: event.target.value,
                      }))
                    }
                    className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                  />
                </label>
              </div>
              <button
                type='button'
                onClick={saveLead}
                disabled={saving}
                className='mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
                {saving ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                Lead speichern
              </button>
            </section>

            <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h2 className='flex items-center gap-2 text-lg font-bold text-slate-950'>
                <Mail className='h-5 w-5 text-blue-700' />
                E-Mail über Brevo senden
              </h2>
              <button
                type='button'
                onClick={generateEmail}
                disabled={
                  generating ||
                  sending ||
                  !edit.category ||
                  !edit.contactName.trim() ||
                  !edit.website.trim() ||
                  !edit.email.trim()
                }
                className='mt-4 flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
                {generating ? (
                  <LoaderCircle className='h-4 w-4 animate-spin' />
                ) : (
                  <Sparkles className='h-4 w-4' />
                )}
                Cold-Outreach mit KI erstellen
              </button>
              <label className='mt-4 block text-sm font-medium text-slate-700'>
                Betreff
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className='mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2'
                />
              </label>
              <div className='mt-4'>
                <SimpleRichTextEditor
                  key={editorVersion}
                  value={content}
                  onChange={setContent}
                />
              </div>
              <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                <p className='text-xs text-slate-500'>
                  Versand an {edit.email || "keine E-Mail hinterlegt"} über
                  info@umzugshelden.io. Follow-up automatisch nach 3 Tagen, danach
                  wöchentlich.
                </p>
                <button
                  type='button'
                  onClick={sendEmail}
                  disabled={
                    sending ||
                    !edit.email ||
                    !edit.category ||
                    !edit.contactName.trim() ||
                    !edit.website.trim() ||
                    !subject.trim()
                  }
                  className='flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
                  {sending ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                  E-Mail senden
                </button>
              </div>
            </section>

            <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h2 className='text-lg font-bold text-slate-950'>E-Mail-Historie</h2>
              <p className='mt-1 text-sm text-slate-500'>
                Letzter Kontakt: {formatDate(selectedLead.lastContactAt)}
              </p>
              <div className='mt-4 space-y-3'>
                {selectedActivities.map((activity) => (
                  <details key={activity.id} className='rounded-lg border border-slate-200 p-4'>
                    <summary className='cursor-pointer list-none'>
                      <div className='flex flex-wrap justify-between gap-3'>
                        <div>
                          <p className='font-semibold text-slate-900'>{activity.subject}</p>
                          <p className='mt-1 text-xs text-slate-500'>
                            An {activity.to} via Brevo
                          </p>
                        </div>
                        <time className='text-xs text-slate-500'>
                          {formatDate(activity.sentAt)}
                        </time>
                      </div>
                    </summary>
                    <iframe
                      title={`Inhalt: ${activity.subject}`}
                      sandbox=''
                      srcDoc={activity.htmlContent}
                      className='mt-4 h-64 w-full rounded border border-slate-200 bg-white'
                    />
                  </details>
                ))}
                {!selectedActivities.length && (
                  <p className='rounded-lg bg-slate-50 p-4 text-sm text-slate-500'>
                    Noch keine E-Mail an diesen Lead gesendet.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <section className='flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500'>
            Führe zuerst eine Lead-Recherche aus oder wähle einen vorhandenen Lead.
          </section>
        )}
      </div>
    </main>
  );
}
