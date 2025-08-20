"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Fetch metrics API types
type ContractStats = {
  views: number;
  purchaseAttempts: number;
  emailClicks: number;
  notifiedCount: number;
};

type ContractEvent = {
  id: string;
  type: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  companyEmail?: string | null;
};

export default function ContractDashboardPage() {
  const params = useParams();
  const contractId = params?.contractId as string;

  const [stats, setStats] = useState<ContractStats | null>(null);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

  const ContractMetricsChart = useMemo(
    () =>
      dynamic(() => import("@/components/charts/ContractMetricsChart"), {
        ssr: false,
        loading: () => (
          <div className='text-sm text-gray-500'>Lade Diagramm…</div>
        ),
      }),
    []
  );

  class ChartErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch() {
      setChartError(true);
    }
    render() {
      if (this.state.hasError) return null;
      return this.props.children as React.ReactElement | null;
    }
  }

  useEffect(() => {
    const load = async () => {
      if (!contractId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/contracts/metrics?contractId=${contractId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success) {
          setStats(data.stats as ContractStats);
          setEvents((data.recentEvents || []) as ContractEvent[]);
        } else {
          setStats(null);
          setEvents([]);
        }
      } catch {
        setStats(null);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contractId]);

  // Build a simple timeseries per day for email clicks and views
  const chartData = useMemo(() => {
    // group events by day
    const byDay = new Map<
      string,
      {
        date: string;
        views: number;
        emailClicks: number;
        purchaseAttempts: number;
      }
    >();
    for (const ev of events) {
      const ts = ev?.createdAt?.seconds
        ? new Date(ev.createdAt.seconds * 1000)
        : new Date();
      const key = ts.toISOString().slice(0, 10);
      if (!byDay.has(key)) {
        byDay.set(key, {
          date: key,
          views: 0,
          emailClicks: 0,
          purchaseAttempts: 0,
        });
      }
      const agg = byDay.get(key)!;
      if (ev?.type === "view") agg.views += 1;
      if (ev?.type === "email_click") agg.emailClicks += 1;
      if (ev?.type === "purchase_attempt") agg.purchaseAttempts += 1;
    }
    return Array.from(byDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [events]);

  const percentData = useMemo(() => {
    const sent = stats?.notifiedCount ?? 0;
    const opened = stats?.emailClicks ?? 0;
    const purchaseAttempts = stats?.purchaseAttempts ?? 0;
    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const purchaseRate = sent > 0 ? (purchaseAttempts / sent) * 100 : 0;
    return { sent, opened, purchaseAttempts, openRate, purchaseRate };
  }, [stats]);

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold'>Auftrags-Dashboard</h1>
        <p className='text-gray-600'>Vertrag: {contractId}</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Öffnungen & Klicks</CardTitle>
            </CardHeader>
            <CardContent>
              {!loading && chartData.length > 0 && !chartError ? (
                <ChartErrorBoundary>
                  {/* dynamic import is typed to accept MetricsPoint[] */}
                  <ContractMetricsChart data={chartData} />
                </ChartErrorBoundary>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='rounded-lg border p-4'>
                    <div className='text-sm text-gray-600 mb-1'>
                      Öffnungsrate
                    </div>
                    <div className='text-2xl font-semibold'>
                      {percentData.openRate.toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-500'>
                      Geöffnet {percentData.opened} von {percentData.sent}{" "}
                      gesendeten E-Mails
                    </div>
                  </div>
                  <div className='rounded-lg border p-4'>
                    <div className='text-sm text-gray-600 mb-1'>
                      Kaufversuch-Rate
                    </div>
                    <div className='text-2xl font-semibold'>
                      {percentData.purchaseRate.toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-500'>
                      Kaufversuche {percentData.purchaseAttempts} von{" "}
                      {percentData.sent} gesendeten E-Mails
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Gesamtmetriken</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='text-sm text-gray-500'>Lade...</div>
              ) : stats ? (
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>Aufrufe:</span> {stats.views}
                  </div>
                  <div>
                    <span className='font-medium'>Kaufversuche:</span>{" "}
                    {stats.purchaseAttempts}
                  </div>
                  <div>
                    <span className='font-medium'>E-Mail Klicks:</span>{" "}
                    {stats.emailClicks}
                  </div>
                  <div>
                    <span className='font-medium'>Benachrichtigungen:</span>{" "}
                    {stats.notifiedCount}
                  </div>
                </div>
              ) : (
                <div className='text-sm text-gray-500'>Keine Daten</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Letzte Ereignisse</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='text-sm text-gray-500'>Lade...</div>
              ) : events.length ? (
                <div className='space-y-2 text-sm'>
                  {events.map((e: ContractEvent) => (
                    <div key={e.id} className='rounded border p-2'>
                      <div className='flex justify-between text-gray-600'>
                        <span>{e.type}</span>
                        <span>
                          {e.createdAt?.seconds
                            ? new Date(
                                e.createdAt.seconds * 1000
                              ).toLocaleString("de-DE")
                            : ""}
                        </span>
                      </div>
                      {e.companyEmail && (
                        <div className='text-gray-700'>{e.companyEmail}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-sm text-gray-500'>Keine Ereignisse</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
