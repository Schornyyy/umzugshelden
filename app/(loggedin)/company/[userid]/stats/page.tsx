"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatsType } from "@/types/StatsType";

type CompanyStatsAggregate = {
  total: number;
  phone: number;
  email: number;
  website: number;
  adress: number;
  company: number;
  updatedAt?: number;
};

export default function CompanyStatsPage() {
  const { companyData } = useCompanyData();
  const companyId = companyData?.id;
  const [loading, setLoading] = useState(true);
  const [agg, setAgg] = useState<CompanyStatsAggregate | null>(null);
  const [events, setEvents] = useState<Array<StatsType & { id: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!companyId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/company-stats/${companyId}?max=50`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as {
          aggregate: CompanyStatsAggregate;
          events: Array<StatsType & { id: string }>;
        };
        if (!cancelled) {
          setAgg(data.aggregate);
          setEvents(data.events);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Fehler beim Laden der Statistiken");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const countItems = useMemo(
    () => [
      { key: "total" as const, label: "Gesamt" },
      { key: "company" as const, label: "Profil-Aufrufe" },
      { key: "email" as const, label: "E-Mail-Klicks" },
      { key: "phone" as const, label: "Telefon-Klicks" },
      { key: "website" as const, label: "Website-Klicks" },
      { key: "adress" as const, label: "Adresse-Klicks" },
    ],
    []
  );

  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-2xl font-semibold'>Statistiken</h1>
      {loading && <p>Lade Statistiken…</p>}
      {error && <p className='text-red-600'>{error}</p>}

      {!loading && agg && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {countItems.map((c) => (
            <Card key={c.key}>
              <CardHeader>
                <CardTitle className='text-base'>{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>{agg[c.key] ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte Ereignisse</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Keine Ereignisse vorhanden.
              </p>
            ) : (
              <ul className='divide-y'>
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className='py-2 text-sm flex items-center justify-between'>
                    <span className='capitalize'>{ev.clickType}</span>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
