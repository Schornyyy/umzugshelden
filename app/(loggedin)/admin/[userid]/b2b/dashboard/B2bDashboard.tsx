"use client";

import { database } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { B2bLead } from "@/types/B2b";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const LEAD_COLLECTION = "b2b_leads_umzugshelden";
const CLOSED_STATUSES = new Set<B2bLead["status"]>(["won", "lost"]);

function formatDueDate(timestamp: number, overdue: boolean) {
  if (overdue) {
    return `Überfällig seit ${new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
    }).format(timestamp)}`;
  }
  return `Heute, ${new Intl.DateTimeFormat("de-DE", {
    timeStyle: "short",
  }).format(timestamp)}`;
}

export default function B2bDashboard() {
  const { companyData } = useCompanyData();
  const { userid } = useParams<{ userid: string }>();
  const [leads, setLeads] = useState<B2bLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!companyData?.id) return;
    const leadsQuery = query(
      collection(database, LEAD_COLLECTION),
      where("ownerId", "==", companyData.id),
    );
    return onSnapshot(
      leadsQuery,
      (snapshot) => {
        setLeads(
          snapshot.docs.map(
            (entry) => ({ id: entry.id, ...entry.data() }) as B2bLead,
          ),
        );
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error("B2B dashboard leads could not be loaded", snapshotError);
        setError("Die B2B-Kennzahlen konnten nicht geladen werden.");
        setLoading(false);
      },
    );
  }, [companyData?.id]);

  const dashboard = useMemo(() => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const start = startOfToday.getTime();
    const end = startOfTomorrow.getTime();
    const openLeads = leads.filter(
      (lead) => !CLOSED_STATUSES.has(lead.status),
    );
    const overdue = openLeads.filter(
      (lead) =>
        lead.nextFollowUpAt !== null && lead.nextFollowUpAt < start,
    );
    const dueToday = openLeads.filter(
      (lead) =>
        lead.nextFollowUpAt !== null &&
        lead.nextFollowUpAt >= start &&
        lead.nextFollowUpAt < end,
    );
    const dueLeads = [...overdue, ...dueToday].sort(
      (first, second) =>
        (first.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER) -
        (second.nextFollowUpAt ?? Number.MAX_SAFE_INTEGER),
    );
    return {
      total: leads.length,
      open: openLeads.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      dueLeads,
      startOfToday: start,
    };
  }, [leads, now]);

  if (loading) {
    return (
      <div className='flex items-center gap-2 rounded-xl bg-white p-8 text-slate-600'>
        <LoaderCircle className='h-5 w-5 animate-spin' />
        B2B-Dashboard wird geladen ...
      </div>
    );
  }

  return (
    <main className='space-y-5 pb-12'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
          B2B
        </p>
        <h1 className='mt-2 text-3xl font-bold text-slate-950'>Dashboard</h1>
        <p className='mt-2 text-sm text-slate-600'>
          Kontakte und anstehende Follow-ups auf einen Blick.
        </p>
      </header>

      {error && (
        <p
          role='alert'
          className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      )}

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[
          {
            label: "Kontakte gesamt",
            value: dashboard.total,
            detail: "Alle vorhandenen B2B-Leads",
            icon: UsersRound,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Offene Kontakte",
            value: dashboard.open,
            detail: "Noch nicht gewonnen oder verloren",
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Heute fällig",
            value: dashboard.dueToday,
            detail: "Follow-ups bis Tagesende",
            icon: CalendarClock,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "Überfällig",
            value: dashboard.overdue,
            detail: "Follow-ups aus vergangenen Tagen",
            icon: AlertTriangle,
            color: "bg-amber-50 text-amber-700",
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.color}`}>
                <Icon className='h-5 w-5' />
              </div>
              <p className='mt-4 text-sm font-medium text-slate-600'>
                {metric.label}
              </p>
              <p className='mt-1 text-3xl font-bold text-slate-950'>
                {metric.value}
              </p>
              <p className='mt-2 text-xs text-slate-500'>{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <section className='rounded-xl border border-slate-200 bg-white shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5'>
          <div>
            <h2 className='text-lg font-bold text-slate-950'>
              Heute zu erledigen
            </h2>
            <p className='mt-1 text-sm text-slate-500'>
              Überfällige und heute anstehende Follow-ups.
            </p>
          </div>
          <Link
            href={`/admin/${userid}/b2b/crm`}
            className='flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800'>
            Zum B2B-CRM
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        <div className='divide-y divide-slate-100'>
          {dashboard.dueLeads.map((lead) => {
            const followUpAt = lead.nextFollowUpAt as number;
            const overdue = followUpAt < dashboard.startOfToday;
            return (
              <Link
                key={lead.id}
                href={`/admin/${userid}/b2b/crm?lead=${encodeURIComponent(lead.id)}`}
                className='flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-slate-50'>
                <div>
                  <p className='font-semibold text-slate-950'>
                    {lead.companyName}
                  </p>
                  <p className='mt-1 text-sm text-slate-500'>
                    {lead.contactName || lead.email}
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      overdue
                        ? "bg-amber-100 text-amber-800"
                        : "bg-violet-100 text-violet-800"
                    }`}>
                    {formatDueDate(followUpAt, overdue)}
                  </span>
                  <ArrowRight className='h-4 w-4 text-slate-400' />
                </div>
              </Link>
            );
          })}
          {!dashboard.dueLeads.length && (
            <div className='p-8 text-center'>
              <CheckCircle2 className='mx-auto h-9 w-9 text-emerald-600' />
              <p className='mt-3 font-semibold text-slate-900'>
                Alle Follow-ups erledigt
              </p>
              <p className='mt-1 text-sm text-slate-500'>
                Für heute sind keine offenen Kontakte eingeplant.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
