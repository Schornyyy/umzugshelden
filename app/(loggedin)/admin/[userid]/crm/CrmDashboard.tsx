"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { database } from "@/config/firebase";
import { createCustomerNumber } from "@/lib/crmIdentifiers";
import type { CrmOfferDocument } from "@/lib/crmOfferDocument";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type {
  CrmAppointment,
  CrmAppointmentType,
  CrmCustomer,
  CrmCustomerStatus,
  CrmNote,
} from "@/types/Crm";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Plus,
  ReceiptText,
  Save,
  Search,
  Send,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { downloadAppointmentCalendar } from "./crmCalendar";

const CRM_COLLECTION = "crm_customers_umzugshelden";
const OFFER_COLLECTION = "offer_calculators_umzugshelden";

const statusOptions: Array<{
  value: CrmCustomerStatus;
  label: string;
  className: string;
}> = [
  { value: "lead", label: "Neue Anfrage", className: "bg-sky-50 text-sky-700" },
  { value: "qualified", label: "Qualifiziert", className: "bg-amber-50 text-amber-700" },
  { value: "offer", label: "Angebot", className: "bg-violet-50 text-violet-700" },
  { value: "customer", label: "Kunde", className: "bg-emerald-50 text-emerald-700" },
  { value: "inactive", label: "Inaktiv", className: "bg-slate-100 text-slate-600" },
];

const appointmentTypes: Array<{
  value: CrmAppointmentType;
  label: string;
}> = [
  { value: "call", label: "Telefonat" },
  { value: "visit", label: "Besichtigung" },
  { value: "move", label: "Auftrag / Umzug" },
  { value: "task", label: "Aufgabe" },
];

type SavedOfferSummary = CrmOfferDocument;

type NewCustomerForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
};

type AppointmentForm = {
  title: string;
  startAt: string;
  endAt: string;
  type: CrmAppointmentType;
  details: string;
};

type OfferEmailForm = {
  to: string;
  subject: string;
  message: string;
};

const emptyNewCustomer: NewCustomerForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
};

function dateTimeInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function createEmptyAppointment(): AppointmentForm {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  return {
    title: "",
    startAt: dateTimeInputValue(start),
    endAt: dateTimeInputValue(new Date(start.getTime() + 60 * 60 * 1000)),
    type: "call",
    details: "",
  };
}

const emptyOfferEmail: OfferEmailForm = {
  to: "",
  subject: "",
  message: "",
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

function formatAppointmentDate(value: string, endValue?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Termin offen";
  const startLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  if (!endValue) return startLabel;

  const end = new Date(endValue);
  if (Number.isNaN(end.getTime())) return startLabel;
  const sameDay = date.toDateString() === end.toDateString();
  const endLabel = new Intl.DateTimeFormat(
    "de-DE",
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
  ).format(end);
  return `${startLabel} - ${endLabel}`;
}

function appointmentEndTimestamp(appointment: CrmAppointment) {
  return new Date(appointment.endAt || appointment.startAt).getTime();
}

function getStatus(status: CrmCustomerStatus) {
  return statusOptions.find((option) => option.value === status) ?? statusOptions[0];
}

function getAppointmentType(type: CrmAppointmentType) {
  return appointmentTypes.find((option) => option.value === type)?.label ?? "Termin";
}

function CustomerField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className='h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
      />
    </label>
  );
}

type CrmDashboardProps = {
  view: "dashboard" | "customers" | "customer";
  customerId?: string;
};

export default function CrmDashboard({ view, customerId }: CrmDashboardProps) {
  const { companyData } = useCompanyData();
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [offers, setOffers] = useState<SavedOfferSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customerId ?? null
  );
  const [draft, setDraft] = useState<CrmCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CrmCustomerStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "saved" | "error">("idle");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>(emptyNewCustomer);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>(
    createEmptyAppointment
  );
  const [appointmentError, setAppointmentError] = useState("");
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [selectedOfferForEmail, setSelectedOfferForEmail] =
    useState<SavedOfferSummary | null>(null);
  const [offerEmailForm, setOfferEmailForm] =
    useState<OfferEmailForm>(emptyOfferEmail);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [offerEmailFeedback, setOfferEmailFeedback] = useState<"idle" | "sent">("idle");
  const [offerEmailError, setOfferEmailError] = useState("");
  const [noteText, setNoteText] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("de-DE"));

  useEffect(() => {
    const ownerId = companyData?.id;
    if (!ownerId) return;
    let active = true;

    async function loadCrm(companyId: string) {
      setIsLoading(true);
      try {
        const [customerSnapshot, offerSnapshot] = await Promise.all([
          getDocs(query(collection(database, CRM_COLLECTION), where("ownerId", "==", companyId))),
          getDoc(doc(database, OFFER_COLLECTION, companyId)),
        ]);
        if (!active) return;

        const loadedCustomers = customerSnapshot.docs
          .map((customerDoc) => {
            const customer = customerDoc.data() as CrmCustomer;
            return {
              ...customer,
              customerNumber:
                customer.customerNumber ||
                createCustomerNumber(customer.id, customer.createdAt),
              tags: customer.tags ?? [],
              notes: customer.notes ?? [],
              appointments: customer.appointments ?? [],
            };
          })
          .sort((left, right) => right.updatedAt - left.updatedAt);
        const savedCalculations = (offerSnapshot.data()?.savedCalculations ?? []) as SavedOfferSummary[];
        setCustomers(loadedCustomers);
        setOffers(savedCalculations);
        setSelectedCustomerId(
          (current) => current ?? customerId ?? loadedCustomers[0]?.id ?? null
        );
        setFeedback("idle");
      } catch {
        if (active) setFeedback("error");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCrm(ownerId);
    return () => {
      active = false;
    };
  }, [companyData?.id, customerId]);

  useEffect(() => {
    const customer = customers.find((item) => item.id === selectedCustomerId) ?? null;
    setDraft(customer ? { ...customer, tags: [...customer.tags] } : null);
  }, [customers, selectedCustomerId]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    const haystack = [customer.name, customer.company, customer.email, customer.phone, customer.city]
      .join(" ")
      .toLocaleLowerCase("de-DE");
    return matchesStatus && (!deferredSearch || haystack.includes(deferredSearch));
  });
  const selectedOffers = offers
    .filter((offer) => offer.customerId === selectedCustomerId)
    .sort((left, right) => right.createdAt - left.createdAt);
  const appointmentEntries = customers.flatMap((customer) =>
    customer.appointments
      .filter((appointment) => !appointment.completed)
      .map((appointment) => ({ customer, appointment }))
  );
  const upcomingAppointments = appointmentEntries
    .filter(({ appointment }) => new Date(appointment.startAt).getTime() >= Date.now())
    .sort(
      (left, right) =>
        new Date(left.appointment.startAt).getTime() -
        new Date(right.appointment.startAt).getTime()
    );
  const overdueAppointments = appointmentEntries
    .filter(({ appointment }) => appointmentEndTimestamp(appointment) < Date.now())
    .sort(
      (left, right) =>
        new Date(right.appointment.startAt).getTime() -
        new Date(left.appointment.startAt).getTime()
    );
  const offerVolume = offers.reduce((total, offer) => total + (offer.grossTotal ?? 0), 0);
  const appointmentRangeValid =
    Boolean(appointmentForm.startAt && appointmentForm.endAt) &&
    new Date(appointmentForm.endAt).getTime() >
      new Date(appointmentForm.startAt).getTime();

  function replaceCustomer(updatedCustomer: CrmCustomer) {
    setCustomers((current) =>
      current
        .map((customer) => customer.id === updatedCustomer.id ? updatedCustomer : customer)
        .sort((left, right) => right.updatedAt - left.updatedAt)
    );
  }

  async function createCustomer() {
    const ownerId = companyData?.id;
    const name = newCustomer.name.trim();
    if (!ownerId || !name) return;

    const now = Date.now();
    const id = crypto.randomUUID();
    const customer: CrmCustomer = {
      id,
      ownerId,
      customerNumber: createCustomerNumber(id, now),
      name,
      company: newCustomer.company.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim(),
      street: "",
      postalCode: "",
      city: "",
      status: "lead",
      source: "",
      tags: [],
      notes: [],
      appointments: [],
      createdAt: now,
      updatedAt: now,
    };

    setIsSaving(true);
    try {
      await setDoc(doc(database, CRM_COLLECTION, customer.id), customer);
      setCustomers((current) => [customer, ...current]);
      setSelectedCustomerId(customer.id);
      setNewCustomer(emptyNewCustomer);
      setIsCustomerDialogOpen(false);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveProfile() {
    if (!draft || !draft.name.trim()) return;
    const updatedCustomer = {
      ...draft,
      customerNumber:
        draft.customerNumber?.trim() ||
        createCustomerNumber(draft.id, draft.createdAt),
      name: draft.name.trim(),
      updatedAt: Date.now(),
    };
    setIsSaving(true);
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), { ...updatedCustomer });
      replaceCustomer(updatedCustomer);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveCustomer() {
    if (!draft) return;
    const updatedCustomer = { ...draft, status: "inactive" as const, updatedAt: Date.now() };
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        status: updatedCustomer.status,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    }
  }

  async function addNote() {
    if (!draft || !noteText.trim()) return;
    const note: CrmNote = {
      id: crypto.randomUUID(),
      text: noteText.trim(),
      createdAt: Date.now(),
    };
    const updatedCustomer = {
      ...draft,
      notes: [note, ...draft.notes],
      updatedAt: Date.now(),
    };
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        notes: updatedCustomer.notes,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
      setNoteText("");
      setFeedback("saved");
    } catch {
      setFeedback("error");
    }
  }

  async function deleteNote(noteId: string) {
    if (!draft) return;
    const updatedCustomer = {
      ...draft,
      notes: draft.notes.filter((note) => note.id !== noteId),
      updatedAt: Date.now(),
    };
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        notes: updatedCustomer.notes,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
    } catch {
      setFeedback("error");
    }
  }

  function openAppointmentDialog() {
    setAppointmentForm(createEmptyAppointment());
    setAppointmentError("");
    setIsAppointmentDialogOpen(true);
  }

  function updateAppointmentStart(startAt: string) {
    const previousStart = new Date(appointmentForm.startAt).getTime();
    const previousEnd = new Date(appointmentForm.endAt).getTime();
    const duration = Math.max(15 * 60_000, previousEnd - previousStart || 60 * 60_000);
    const nextStart = new Date(startAt);
    setAppointmentForm({
      ...appointmentForm,
      startAt,
      endAt: Number.isNaN(nextStart.getTime())
        ? appointmentForm.endAt
        : dateTimeInputValue(new Date(nextStart.getTime() + duration)),
    });
    setAppointmentError("");
  }

  async function addAppointment(addToCalendar = false) {
    if (!draft || !appointmentForm.title.trim() || !appointmentRangeValid) {
      setAppointmentError("Bitte einen gültigen Zeitraum mit Start und Ende angeben.");
      return;
    }
    const appointment: CrmAppointment = {
      id: crypto.randomUUID(),
      title: appointmentForm.title.trim(),
      startAt: appointmentForm.startAt,
      endAt: appointmentForm.endAt,
      type: appointmentForm.type,
      details: appointmentForm.details.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    const updatedCustomer = {
      ...draft,
      appointments: [...draft.appointments, appointment],
      updatedAt: Date.now(),
    };
    setIsSavingAppointment(true);
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        appointments: updatedCustomer.appointments,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
      if (addToCalendar) downloadAppointmentCalendar(updatedCustomer, appointment);
      setAppointmentForm(createEmptyAppointment());
      setIsAppointmentDialogOpen(false);
      setFeedback("saved");
    } catch {
      setAppointmentError("Der Termin konnte nicht gespeichert werden.");
      setFeedback("error");
    } finally {
      setIsSavingAppointment(false);
    }
  }

  function openOfferEmailDialog(offer: SavedOfferSummary) {
    if (!draft) return;
    setSelectedOfferForEmail(offer);
    setOfferEmailForm({
      to: draft.email,
      subject: `Ihr Angebot: ${offer.title || "Umzugshelden"}`,
      message: "vielen Dank für Ihr Interesse. Nachfolgend erhalten Sie unser persönliches Angebot. Bei Rückfragen melden Sie sich gerne bei uns.",
    });
    setOfferEmailError("");
    setOfferEmailFeedback("idle");
  }

  async function sendOfferEmail() {
    if (!draft || !selectedOfferForEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offerEmailForm.to.trim())) {
      setOfferEmailError("Bitte eine gültige Empfängeradresse angeben.");
      return;
    }
    if (!offerEmailForm.subject.trim() || !offerEmailForm.message.trim()) {
      setOfferEmailError("Betreff und Nachricht dürfen nicht leer sein.");
      return;
    }

    setIsSendingOffer(true);
    setOfferEmailError("");
    try {
      const response = await fetch("/api/crm/send-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: offerEmailForm.to.trim(),
          subject: offerEmailForm.subject.trim(),
          message: offerEmailForm.message.trim(),
          offer: selectedOfferForEmail,
          customer: {
            name: draft.name,
            company: draft.company,
            customerNumber: draft.customerNumber,
            email: draft.email,
            phone: draft.phone,
            street: draft.street,
            postalCode: draft.postalCode,
            city: draft.city,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Das Angebot konnte nicht versendet werden.");
      }
      setSelectedOfferForEmail(null);
      setOfferEmailFeedback("sent");
    } catch (error) {
      setOfferEmailError(
        error instanceof Error ? error.message : "Das Angebot konnte nicht versendet werden."
      );
    } finally {
      setIsSendingOffer(false);
    }
  }

  async function toggleAppointment(appointmentId: string) {
    if (!draft) return;
    const updatedCustomer = {
      ...draft,
      appointments: draft.appointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, completed: !appointment.completed }
          : appointment
      ),
      updatedAt: Date.now(),
    };
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        appointments: updatedCustomer.appointments,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
    } catch {
      setFeedback("error");
    }
  }

  async function removeAppointment(appointmentId: string) {
    if (!draft) return;
    const updatedCustomer = {
      ...draft,
      appointments: draft.appointments.filter((appointment) => appointment.id !== appointmentId),
      updatedAt: Date.now(),
    };
    try {
      await updateDoc(doc(database, CRM_COLLECTION, draft.id), {
        appointments: updatedCustomer.appointments,
        updatedAt: updatedCustomer.updatedAt,
      });
      replaceCustomer(updatedCustomer);
    } catch {
      setFeedback("error");
    }
  }

  async function permanentlyDeleteCustomer() {
    if (!draft || draft.status !== "inactive") return;
    try {
      await deleteDoc(doc(database, CRM_COLLECTION, draft.id));
      const remaining = customers.filter((customer) => customer.id !== draft.id);
      setCustomers(remaining);
      setSelectedCustomerId(remaining[0]?.id ?? null);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-72 items-center justify-center text-sm text-slate-500'>
        CRM wird geladen ...
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <main className='pb-4'>
        <header className='mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end'>
          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>Kunden & Vertrieb</p>
            <h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>CRM Dashboard</h1>
            <p className='mt-2 text-sm text-slate-600'>Die nächsten Kundentermine, Aufgaben und Vertriebszahlen auf einen Blick.</p>
          </div>
          <Button asChild><Link href={`/admin/${companyData?.id}/crm/customers`}><UsersRound /> Kunden öffnen</Link></Button>
        </header>

        <section className='mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4' aria-label='CRM Kennzahlen'>
          <div className='border-l-4 border-blue-600 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'><div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Kontakte</span><UsersRound size={17} /></div><p className='mt-2 text-2xl font-bold text-slate-950'>{customers.length}</p></div>
          <div className='border-l-4 border-amber-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'><div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Kommende Termine</span><CalendarDays size={17} /></div><p className='mt-2 text-2xl font-bold text-slate-950'>{upcomingAppointments.length}</p></div>
          <div className='border-l-4 border-violet-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'><div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Angebote</span><BriefcaseBusiness size={17} /></div><p className='mt-2 text-2xl font-bold text-slate-950'>{offers.length}</p></div>
          <div className='border-l-4 border-emerald-600 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'><div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Angebotsvolumen</span><CircleDollarSign size={17} /></div><p className='mt-2 truncate text-2xl font-bold text-slate-950'>{currencyFormatter.format(offerVolume)}</p></div>
        </section>

        <div className='grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]'>
          <section className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
            <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5'><div><h2 className='font-semibold text-slate-950'>Kommende Termine</h2><p className='mt-0.5 text-xs text-slate-500'>Chronologisch nach Datum und Uhrzeit</p></div><CalendarDays className='text-blue-600' size={20} /></div>
            {upcomingAppointments.length === 0 ? <div className='px-5 py-14 text-center'><p className='text-sm font-medium text-slate-700'>Keine kommenden Termine</p><p className='mt-1 text-sm text-slate-500'>Termine legst du direkt in einer Kundenakte an.</p></div> : <div className='divide-y divide-slate-200'>{upcomingAppointments.slice(0, 10).map(({ customer, appointment }) => <Link key={`${customer.id}-${appointment.id}`} href={`/admin/${companyData?.id}/crm/customers/${customer.id}`} className='grid gap-3 px-4 py-4 transition hover:bg-slate-50 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center sm:px-5'><span className='text-sm font-semibold text-blue-700'>{formatAppointmentDate(appointment.startAt)}</span><span className='min-w-0'><span className='block truncate text-sm font-medium text-slate-950'>{appointment.title}</span><span className='mt-1 block truncate text-xs text-slate-500'>{customer.name} · {getAppointmentType(appointment.type)}</span></span><ChevronRight size={17} className='hidden text-slate-400 sm:block' /></Link>)}</div>}
          </section>

          <div className='space-y-5'>
            <section className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
              <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'><h2 className='font-semibold text-slate-950'>Zu erledigen</h2><span className={`rounded px-2 py-0.5 text-xs font-semibold ${overdueAppointments.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{overdueAppointments.length} überfällig</span></div>
              {overdueAppointments.length === 0 ? <p className='px-4 py-8 text-center text-sm text-slate-500'>Keine überfälligen Aufgaben.</p> : <div className='divide-y divide-slate-200'>{overdueAppointments.slice(0, 5).map(({ customer, appointment }) => <Link key={`${customer.id}-${appointment.id}`} href={`/admin/${companyData?.id}/crm/customers/${customer.id}`} className='block px-4 py-3 hover:bg-slate-50'><span className='block truncate text-sm font-medium text-slate-950'>{appointment.title}</span><span className='mt-1 block text-xs text-red-600'>{customer.name} · {formatAppointmentDate(appointment.startAt)}</span></Link>)}</div>}
            </section>
            <section className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
              <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'><h2 className='font-semibold text-slate-950'>Zuletzt bearbeitet</h2><Link href={`/admin/${companyData?.id}/crm/customers`} className='text-xs font-medium text-blue-700 hover:underline'>Alle Kunden</Link></div>
              {customers.slice(0, 5).map((customer) => { const status = getStatus(customer.status); return <Link key={customer.id} href={`/admin/${companyData?.id}/crm/customers/${customer.id}`} className='flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50'><span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700'>{customer.name.slice(0, 1).toUpperCase()}</span><span className='min-w-0 flex-1'><span className='block truncate text-sm font-medium text-slate-950'>{customer.name}</span><span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span></span><ChevronRight size={16} className='text-slate-400' /></Link>; })}
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (view === "customers") {
    return (
      <main className='pb-4'>
        <header className='mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end'>
          <div><p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>Kunden & Vertrieb</p><h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>Kundenübersicht</h1><p className='mt-2 text-sm text-slate-600'>{customers.length} Kundenakten durchsuchen und verwalten.</p></div>
          <Button onClick={() => setIsCustomerDialogOpen(true)}><Plus /> Kunde anlegen</Button>
        </header>

        <section className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
          <div className='grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_240px]'>
            <label className='relative block'><Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Name, Firma, E-Mail, Telefon oder Ort ...' className='h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100' /></label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CrmCustomerStatus | "all")} className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500'><option value='all'>Alle Vertriebsphasen</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </div>
          {filteredCustomers.length === 0 ? <div className='px-6 py-16 text-center'><UsersRound className='mx-auto text-slate-300' size={30} /><p className='mt-3 text-sm font-medium text-slate-700'>Keine passenden Kunden gefunden</p></div> : <div className='divide-y divide-slate-200'>{filteredCustomers.map((customer) => { const status = getStatus(customer.status); const pending = customer.appointments.filter((appointment) => !appointment.completed).length; return <Link key={customer.id} href={`/admin/${companyData?.id}/crm/customers/${customer.id}`} className='grid gap-3 px-4 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(180px,1.2fr)_minmax(160px,1fr)_150px_100px_20px] sm:items-center sm:px-5'><span className='flex min-w-0 items-center gap-3'><span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700'>{customer.name.slice(0, 1).toUpperCase()}</span><span className='min-w-0'><span className='block truncate text-sm font-semibold text-slate-950'>{customer.name}</span><span className='mt-1 block truncate text-xs text-slate-500'>{customer.company || "Privatkunde"}</span></span></span><span className='min-w-0 text-sm text-slate-600'><span className='block truncate'>{customer.email || "Keine E-Mail"}</span><span className='mt-1 block truncate text-xs'>{customer.phone || "Keine Telefonnummer"}</span></span><span><span className={`rounded px-2 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></span><span className='text-xs text-slate-500'>{pending ? `${pending} offen` : "Aktuell"}</span><ChevronRight size={17} className='text-slate-400' /></Link>; })}</div>}
        </section>

        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className='sm:max-w-lg'><DialogHeader><DialogTitle>Neuen Kunden anlegen</DialogTitle><DialogDescription>Die Kontaktdaten werden als neue Kundenakte gespeichert.</DialogDescription></DialogHeader><div className='grid gap-4 py-2 sm:grid-cols-2'><div className='sm:col-span-2'><CustomerField label='Name / Ansprechpartner *' value={newCustomer.name} onChange={(value) => setNewCustomer({ ...newCustomer, name: value })} /></div><CustomerField label='Firma' value={newCustomer.company} onChange={(value) => setNewCustomer({ ...newCustomer, company: value })} /><CustomerField label='Telefon' type='tel' value={newCustomer.phone} onChange={(value) => setNewCustomer({ ...newCustomer, phone: value })} /><div className='sm:col-span-2'><CustomerField label='E-Mail' type='email' value={newCustomer.email} onChange={(value) => setNewCustomer({ ...newCustomer, email: value })} /></div></div><DialogFooter><Button variant='outline' onClick={() => setIsCustomerDialogOpen(false)}>Abbrechen</Button><Button onClick={() => void createCustomer()} disabled={isSaving || !newCustomer.name.trim()}><Plus /> Kundenakte anlegen</Button></DialogFooter></DialogContent>
        </Dialog>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-[1500px] pb-4'>
      <header className='mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end'>
        <div>
          <Link href={`/admin/${companyData?.id}/crm/customers`} className='mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700'><ArrowLeft size={16} /> Zur Kundenübersicht</Link>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
            Kundenakte
          </p>
          <h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>{draft?.name || "Kunde"}</h1>
          <p className='mt-2 text-sm text-slate-600'>
            Kontaktdaten, Termine, Notizen und Angebote an einem Ort.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {feedback === "saved" && <span className='flex items-center gap-1.5 text-sm text-emerald-700'><Check size={16} /> Gespeichert</span>}
          {feedback === "error" && <span className='text-sm font-medium text-red-600'>Aktion fehlgeschlagen</span>}
          {draft && <Button asChild><Link href={`/admin/${companyData?.id}/crm/calculator?customerId=${draft.id}`}><CircleDollarSign /> Angebot erstellen</Link></Button>}
        </div>
      </header>

      <section className='hidden' aria-label='CRM Kennzahlen'>
        <div className='border-l-4 border-blue-600 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'>
          <div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Kontakte</span><UsersRound size={17} /></div>
          <p className='mt-2 text-2xl font-bold text-slate-950'>{customers.length}</p>
        </div>
        <div className='border-l-4 border-amber-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'>
          <div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Offene Termine</span><CalendarDays size={17} /></div>
          <p className='mt-2 text-2xl font-bold text-slate-950'>{upcomingAppointments.length}</p>
        </div>
        <div className='border-l-4 border-violet-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'>
          <div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Angebote</span><BriefcaseBusiness size={17} /></div>
          <p className='mt-2 text-2xl font-bold text-slate-950'>{offers.length}</p>
        </div>
        <div className='border-l-4 border-emerald-600 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200'>
          <div className='flex items-center justify-between text-slate-500'><span className='text-xs font-medium uppercase'>Angebotsvolumen</span><CircleDollarSign size={17} /></div>
          <p className='mt-2 truncate text-2xl font-bold text-slate-950'>{currencyFormatter.format(offerVolume)}</p>
        </div>
      </section>

      <div className='min-h-[680px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
        <aside className='hidden'>
          <div className='space-y-3 border-b border-slate-200 p-3'>
            <label className='relative block'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Kunden durchsuchen ...' className='h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100' />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CrmCustomerStatus | "all")} className='h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-500'>
              <option value='all'>Alle Vertriebsphasen</option>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className='max-h-[520px] divide-y divide-slate-200 overflow-y-auto xl:max-h-[760px]'>
            {filteredCustomers.length === 0 ? (
              <div className='px-5 py-12 text-center text-sm text-slate-500'>Keine passenden Kunden gefunden.</div>
            ) : filteredCustomers.map((customer) => {
              const status = getStatus(customer.status);
              const active = customer.id === selectedCustomerId;
              const pending = customer.appointments.filter((appointment) => !appointment.completed).length;
              return (
                <button key={customer.id} type='button' onClick={() => setSelectedCustomerId(customer.id)} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${active ? "bg-blue-50 shadow-[inset_3px_0_0_#2563eb]" : "hover:bg-white"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>{customer.name.slice(0, 1).toUpperCase()}</span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-semibold text-slate-950'>{customer.name}</span>
                    <span className='mt-1 flex items-center gap-2'><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>{pending > 0 && <span className='text-[11px] text-slate-500'>{pending} offen</span>}</span>
                  </span>
                  <ChevronRight size={16} className='shrink-0 text-slate-400' />
                </button>
              );
            })}
          </div>
        </aside>

        {draft ? (
          <section className='min-w-0'>
            <div className='flex flex-col justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center'>
              <div className='flex min-w-0 items-center gap-3'>
                <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white'>{draft.name.slice(0, 1).toUpperCase()}</span>
                <div className='min-w-0'><h2 className='truncate text-xl font-bold text-slate-950'>{draft.name}</h2><p className='mt-1 text-sm text-slate-500'>Kunde seit {formatDate(draft.createdAt)}</p></div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Button variant='outline' onClick={openAppointmentDialog}><CalendarDays /> Termin</Button>
                <Button asChild><Link href={`/admin/${companyData?.id}/crm/calculator?customerId=${draft.id}`}><CircleDollarSign /> Angebot erstellen</Link></Button>
              </div>
            </div>

            <div className='grid gap-6 p-4 sm:p-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]'>
              <div className='space-y-6'>
                <section>
                  <div className='mb-3 flex items-center justify-between gap-3'><h3 className='flex items-center gap-2 text-sm font-semibold text-slate-950'><UserRound size={17} /> Stammdaten</h3><Button size='sm' onClick={() => void saveProfile()} disabled={isSaving || !draft.name.trim()}><Save /> Speichern</Button></div>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <CustomerField label='Kundennummer' value={draft.customerNumber ?? ""} onChange={(value) => setDraft({ ...draft, customerNumber: value })} />
                    <CustomerField label='Name / Ansprechpartner' value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
                    <CustomerField label='Firma' value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
                    <CustomerField label='E-Mail' type='email' value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
                    <CustomerField label='Telefon' type='tel' value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
                    <CustomerField label='Straße und Hausnummer' value={draft.street} onChange={(value) => setDraft({ ...draft, street: value })} />
                    <div className='grid grid-cols-[110px_minmax(0,1fr)] gap-3'><CustomerField label='PLZ' value={draft.postalCode} onChange={(value) => setDraft({ ...draft, postalCode: value })} /><CustomerField label='Ort' value={draft.city} onChange={(value) => setDraft({ ...draft, city: value })} /></div>
                    <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Vertriebsphase<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CrmCustomerStatus })} className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <CustomerField label='Quelle' value={draft.source} onChange={(value) => setDraft({ ...draft, source: value })} placeholder='z. B. Website, Empfehlung' />
                    <div className='sm:col-span-2'><CustomerField label='Schlagwörter (kommagetrennt)' value={draft.tags.join(", ")} onChange={(value) => setDraft({ ...draft, tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder='Privatumzug, Stammkunde' /></div>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm'>
                    {draft.phone && <a href={`tel:${draft.phone}`} className='flex items-center gap-1.5 text-blue-700 hover:underline'><Phone size={15} /> {draft.phone}</a>}
                    {draft.email && <a href={`mailto:${draft.email}`} className='flex items-center gap-1.5 text-blue-700 hover:underline'><Mail size={15} /> {draft.email}</a>}
                    {(draft.street || draft.city) && <span className='flex items-center gap-1.5 text-slate-600'><MapPin size={15} /> {[draft.street, `${draft.postalCode} ${draft.city}`.trim()].filter(Boolean).join(", ")}</span>}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-5'>
                  <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950'><Tag size={17} /> Verwaltung</h3>
                  <div className='flex flex-wrap gap-2'>
                    {draft.status !== "inactive" ? <Button variant='outline' size='sm' onClick={() => void archiveCustomer()}><Archive /> Archivieren</Button> : <Button variant='destructive' size='sm' onClick={() => void permanentlyDeleteCustomer()}><Trash2 /> Endgültig löschen</Button>}
                  </div>
                </section>
              </div>

              <div className='space-y-6'>
                <section>
                  <div className='mb-3 flex items-center justify-between'><h3 className='flex items-center gap-2 text-sm font-semibold text-slate-950'><CalendarDays size={17} /> Termine & Aufgaben</h3><Button variant='outline' size='sm' onClick={openAppointmentDialog}><Plus /> Neu</Button></div>
                  {draft.appointments.length === 0 ? <div className='rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500'>Noch keine Termine oder Aufgaben vorhanden.</div> : <div className='divide-y divide-slate-200 rounded-md border border-slate-200'>{[...draft.appointments].sort((left, right) => left.startAt.localeCompare(right.startAt)).map((appointment) => <div key={appointment.id} className={`flex items-start gap-3 p-3 ${appointment.completed ? "bg-slate-50 opacity-65" : "bg-white"}`}><button type='button' onClick={() => void toggleAppointment(appointment.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${appointment.completed ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-transparent hover:border-emerald-500"}`} title={appointment.completed ? "Als offen markieren" : "Erledigen"}><Check size={13} /></button><div className='min-w-0 flex-1'><p className={`text-sm font-medium text-slate-950 ${appointment.completed ? "line-through" : ""}`}>{appointment.title}</p><p className='mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500'><span>{getAppointmentType(appointment.type)}</span><span>·</span><span>{formatAppointmentDate(appointment.startAt, appointment.endAt)}</span></p>{appointment.details && <p className='mt-2 text-sm leading-5 text-slate-600'>{appointment.details}</p>}</div><Button variant='ghost' size='icon' className='h-8 w-8 shrink-0 text-blue-700' title='In Kalender eintragen' onClick={() => downloadAppointmentCalendar(draft, appointment)}><CalendarPlus size={16} /></Button><Button variant='ghost' size='icon' className='h-8 w-8 shrink-0' title='Termin löschen' onClick={() => void removeAppointment(appointment.id)}><Trash2 size={15} className='text-red-600' /></Button></div>)}</div>}
                </section>

                <section className='border-t border-slate-200 pt-5'>
                  <div className='mb-3 flex items-center justify-between'><h3 className='flex items-center gap-2 text-sm font-semibold text-slate-950'><BriefcaseBusiness size={17} /> Angebote</h3><span className={`text-xs ${offerEmailFeedback === "sent" ? "font-medium text-emerald-700" : "text-slate-500"}`}>{offerEmailFeedback === "sent" ? "E-Mail versendet" : `${selectedOffers.length} gespeichert`}</span></div>
                  {selectedOffers.length === 0 ? <div className='rounded-md border border-dashed border-slate-300 px-4 py-7 text-center'><p className='text-sm text-slate-500'>Für diesen Kunden ist noch kein Angebot gespeichert.</p><Button asChild size='sm' className='mt-3'><Link href={`/admin/${companyData?.id}/crm/calculator?customerId=${draft.id}`}><Plus /> Erstes Angebot</Link></Button></div> : <div className='divide-y divide-slate-200 rounded-md border border-slate-200'>{selectedOffers.map((offer) => { const isMoveOffer = offer.planning?.serviceTypes?.some((service) => service === "move" || service === "seniorMove") ?? false; return <div key={offer.id} className='flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between'><span className='min-w-0'><span className='block truncate text-sm font-medium text-slate-950'>{offer.title || "Unbenanntes Angebot"}</span><span className='mt-1 block text-xs text-slate-500'>{formatDate(offer.createdAt)}{typeof offer.grossTotal === "number" ? ` · ${currencyFormatter.format(offer.grossTotal)}` : ""}</span></span><span className='flex shrink-0 flex-wrap gap-2'><Button variant='outline' size='sm' onClick={() => openOfferEmailDialog(offer)}><Mail /> E-Mail</Button><Button asChild variant='outline' size='sm'><Link href={`/admin/${companyData?.id}/crm/calculator?customerId=${draft.id}&offerId=${offer.id}`}>Öffnen</Link></Button>{isMoveOffer && <Button asChild variant='outline' size='sm'><Link href={`/admin/${companyData?.id}/crm/protocols?customerId=${draft.id}&offerId=${offer.id}`}><ClipboardCheck /> Übergabe</Link></Button>}<Button asChild size='sm'><Link href={`/admin/${companyData?.id}/crm/invoices?customerId=${draft.id}&offerId=${offer.id}`}><ReceiptText /> Rechnung</Link></Button></span></div>; })}</div>}
                </section>

                <section className='border-t border-slate-200 pt-5'>
                  <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950'><NotebookPen size={17} /> Notizen</h3>
                  <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={3} placeholder='Gespräch, Kundenwunsch oder interne Information festhalten ...' className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100' />
                  <div className='mt-2 flex justify-end'><Button size='sm' onClick={() => void addNote()} disabled={!noteText.trim()}><Plus /> Notiz speichern</Button></div>
                  {draft.notes.length > 0 && <div className='mt-4 space-y-3'>{draft.notes.map((note) => <article key={note.id} className='group border-l-2 border-blue-500 bg-slate-50 px-3 py-2.5'><div className='flex items-start justify-between gap-3'><p className='whitespace-pre-wrap text-sm leading-5 text-slate-700'>{note.text}</p><Button variant='ghost' size='icon' className='h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100' title='Notiz löschen' onClick={() => void deleteNote(note.id)}><Trash2 size={14} className='text-red-600' /></Button></div><p className='mt-2 flex items-center gap-1 text-[11px] text-slate-400'><Clock3 size={12} /> {formatDate(note.createdAt)}</p></article>)}</div>}
                </section>
              </div>
            </div>
          </section>
        ) : (
          <section className='flex min-h-96 flex-col items-center justify-center px-6 text-center'><span className='flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500'><UserRound size={25} /></span><h2 className='mt-4 text-lg font-semibold text-slate-950'>Kundenakte auswählen</h2><p className='mt-1 max-w-sm text-sm text-slate-500'>Wähle links einen Kunden aus oder lege den ersten Kontakt an.</p><Button className='mt-4' onClick={() => setIsCustomerDialogOpen(true)}><Plus /> Kunde anlegen</Button></section>
        )}
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader><DialogTitle>Neuen Kunden anlegen</DialogTitle><DialogDescription>Die Kontaktdaten werden als neue Kundenakte gespeichert.</DialogDescription></DialogHeader>
          <div className='grid gap-4 py-2 sm:grid-cols-2'><div className='sm:col-span-2'><CustomerField label='Name / Ansprechpartner *' value={newCustomer.name} onChange={(value) => setNewCustomer({ ...newCustomer, name: value })} /></div><CustomerField label='Firma' value={newCustomer.company} onChange={(value) => setNewCustomer({ ...newCustomer, company: value })} /><CustomerField label='Telefon' type='tel' value={newCustomer.phone} onChange={(value) => setNewCustomer({ ...newCustomer, phone: value })} /><div className='sm:col-span-2'><CustomerField label='E-Mail' type='email' value={newCustomer.email} onChange={(value) => setNewCustomer({ ...newCustomer, email: value })} /></div></div>
          <DialogFooter><Button variant='outline' onClick={() => setIsCustomerDialogOpen(false)}>Abbrechen</Button><Button onClick={() => void createCustomer()} disabled={isSaving || !newCustomer.name.trim()}><Plus /> Kundenakte anlegen</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader><DialogTitle>Termin oder Aufgabe</DialogTitle><DialogDescription>Lege Start und Ende fest und übertrage den Eintrag bei Bedarf direkt in deinen Kalender.</DialogDescription></DialogHeader>
          <div className='space-y-4 py-2'>
            <CustomerField label='Titel *' value={appointmentForm.title} onChange={(value) => setAppointmentForm({ ...appointmentForm, title: value })} placeholder='z. B. Vor-Ort-Besichtigung' />
            <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Art<select value={appointmentForm.type} onChange={(event) => setAppointmentForm({ ...appointmentForm, type: event.target.value as CrmAppointmentType })} className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm'>{appointmentTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <div className='grid gap-4 sm:grid-cols-2'><label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Beginn *<input type='datetime-local' value={appointmentForm.startAt} onChange={(event) => updateAppointmentStart(event.target.value)} className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm' /></label><label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Ende *<input type='datetime-local' min={appointmentForm.startAt} value={appointmentForm.endAt} onChange={(event) => { setAppointmentForm({ ...appointmentForm, endAt: event.target.value }); setAppointmentError(""); }} className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm' /></label></div>
            <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Details<textarea value={appointmentForm.details} onChange={(event) => setAppointmentForm({ ...appointmentForm, details: event.target.value })} rows={3} className='rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500' /></label>
            {appointmentError && <p className='text-sm font-medium text-red-600'>{appointmentError}</p>}
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setIsAppointmentDialogOpen(false)}>Abbrechen</Button><Button variant='outline' onClick={() => void addAppointment()} disabled={isSavingAppointment || !appointmentForm.title.trim() || !appointmentRangeValid}>Speichern</Button><Button onClick={() => void addAppointment(true)} disabled={isSavingAppointment || !appointmentForm.title.trim() || !appointmentRangeValid}>{isSavingAppointment ? <LoaderCircle className='animate-spin' /> : <CalendarPlus />} Speichern & Kalender</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedOfferForEmail)} onOpenChange={(open) => { if (!open) setSelectedOfferForEmail(null); }}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader><DialogTitle>Angebot per E-Mail senden</DialogTitle><DialogDescription>Der vollständige Kostenvoranschlag wird als PDF erstellt und an diese E-Mail angehängt.</DialogDescription></DialogHeader>
          <div className='space-y-4 py-2'>
            <CustomerField label='Empfänger *' type='email' value={offerEmailForm.to} onChange={(value) => setOfferEmailForm({ ...offerEmailForm, to: value })} />
            <CustomerField label='Betreff *' value={offerEmailForm.subject} onChange={(value) => setOfferEmailForm({ ...offerEmailForm, subject: value })} />
            <label className='flex flex-col gap-1.5 text-sm font-medium text-slate-700'>Nachricht *<textarea value={offerEmailForm.message} onChange={(event) => setOfferEmailForm({ ...offerEmailForm, message: event.target.value })} rows={6} className='rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100' /></label>
            <div className='rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600'>Mit freundlichen Grüßen<br /><span className='font-medium text-slate-950'>Lukas Schornstein</span></div>
            {offerEmailError && <p className='text-sm font-medium text-red-600'>{offerEmailError}</p>}
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setSelectedOfferForEmail(null)}>Abbrechen</Button><Button onClick={() => void sendOfferEmail()} disabled={isSendingOffer || !offerEmailForm.to.trim() || !offerEmailForm.subject.trim() || !offerEmailForm.message.trim()}>{isSendingOffer ? <LoaderCircle className='animate-spin' /> : <Send />} PDF-Angebot senden</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}