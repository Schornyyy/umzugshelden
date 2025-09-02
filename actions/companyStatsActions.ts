"use server";

import { database } from "@/config/firebase";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS } from "@/lib/cache";
import { StatsType } from "@/types/StatsType";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { getAllCompanies } from "./companyActions";
import { getAllContracts } from "./contractActions";

export type CompanyStatsAggregate = {
  total: number;
  phone: number;
  email: number;
  website: number;
  adress: number;
  company: number;
  updatedAt?: number;
};

// Get cached aggregates for a company (reads from company_stats/{companyId})
export async function getCompanyStats(companyId: string, useCache: boolean = true): Promise<CompanyStatsAggregate> {
  const fetcher = async () => {
    const ref = doc(database, "company_stats", companyId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    return {
      total: (data.total as number) || 0,
      phone: (data.phone as number) || 0,
      email: (data.email as number) || 0,
      website: (data.website as number) || 0,
      adress: (data.adress as number) || 0,
      company: (data.company as number) || 0,
      updatedAt: (data.updatedAt as number) || undefined,
    } satisfies CompanyStatsAggregate;
  };

  if (!useCache) return fetcher();
  return cacheManager.getOrFetch(CACHE_KEYS.COMPANY_STATS(companyId), fetcher, CACHE_OPTIONS.COMPANY_STATS);
}

// Get recent company events from stats collection for drilldown
export async function getCompanyRecentEvents(companyId: string, max: number = 50, useCache: boolean = true): Promise<Array<StatsType & { id: string }>> {
  const fetcher = async () => {
    const col = collection(database, "stats");
    let q;
    try {
      q = query(col, where("companyId", "==", companyId), orderBy("timestamp", "desc"), limit(max));
    } catch {
      q = query(col, where("companyId", "==", companyId), limit(max));
    }
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as StatsType) }));
    rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return rows.slice(0, max);
  };

  if (!useCache) return fetcher();
  return cacheManager.getOrFetch(CACHE_KEYS.COMPANY_EVENTS(companyId), fetcher, CACHE_OPTIONS.COMPANY_EVENTS);
}

// Zeitraum Hilfsfunktionen
function periodRange(period: 'month' | 'quarter' | 'year', date: Date = new Date()) {
  const start = new Date(date);
  if (period === 'month') {
    start.setDate(1); start.setHours(0,0,0,0);
  } else if (period === 'quarter') {
    const qStartMonth = Math.floor(start.getMonth()/3)*3; // 0,3,6,9
    start.setMonth(qStartMonth, 1); start.setHours(0,0,0,0);
  } else if (period === 'year') {
    start.setMonth(0,1); start.setHours(0,0,0,0);
  }
  return { start: start.getTime(), end: date.getTime() };
}

export type CompanyPerformance = {
  companyId: string;
  name?: string;
  clicksTotal: number;
  clicksByType: Record<string, number>;
  updatedAt?: number;
};

// Aggregiere Top N Unternehmen nach total Klicks (aus company_stats collection)
export async function getTopCompanies(limitCount: number = 10): Promise<CompanyPerformance[]> {
  // Kein server-seitiges OrderBy auf dynamischen Summen -> load subset of all stats docs
  const col = collection(database, 'company_stats');
  const snap = await getDocs(col);
  const companies = await getAllCompanies();
  const nameMap = new Map(companies.map(c => [c.id, c.companyName || '']));
  const rows: CompanyPerformance[] = [];
  snap.forEach(d => {
    const data = d.data() as Record<string, unknown>;
    const perf: CompanyPerformance = {
      companyId: d.id,
      name: nameMap.get(d.id),
      clicksTotal: typeof data.total === 'number' ? data.total : 0,
      clicksByType: {
        phone: (data.phone as number) || 0,
        email: (data.email as number) || 0,
        website: (data.website as number) || 0,
        adress: (data.adress as number) || 0,
        company: (data.company as number) || 0,
      },
      updatedAt: data.updatedAt as number | undefined
    };
    rows.push(perf);
  });
  rows.sort((a,b) => b.clicksTotal - a.clicksTotal);
  return rows.slice(0, limitCount);
}

export interface TimelineBucket {
  periodStart: number;
  periodLabel: string;
  clicks: number;
  newCompanies: number;
  events: number;
}

// Hole zusammengefasste Kennzahlen für ausgewählten Zeitraum
export interface AggregateOverviewResult {
  period: 'month' | 'quarter' | 'year';
  range: { start: number; end: number };
  totalClicks: number;
  clicksByType: Record<string, number>;
  totalEvents: number;
  newCompanies: number;
  newCompanyList: { id: string; name: string }[];
  newContracts: number;
}

export async function getAggregateOverview(period: 'month' | 'quarter' | 'year'): Promise<AggregateOverviewResult> {
  const { start, end } = periodRange(period);
  const statsCol = collection(database, 'stats');
  // Firestore kann nur >= / <=; wir holen per where >= start und sortieren clientseitig
  let qRef;
  try {
    qRef = query(statsCol, where('timestamp', '>=', start));
  } catch {
    qRef = statsCol; // fallback - später gefiltert
  }
  const snap = await getDocs(qRef);
  const events = snap.docs
    .map(d => d.data() as StatsType)
    .filter(s => (s.timestamp || 0) >= start && (s.timestamp || 0) <= end);

  const companies = await getAllCompanies();
  const newCompanies = companies.filter(c => {
    const createdRaw = (c as unknown as { createdAt?: number }).createdAt;
    return typeof createdRaw === 'number' && createdRaw >= start && createdRaw <= end;
  });

  // Aufträge (Contracts) im Zeitraum
  let contractsWithin: number = 0;
  try {
    const allContracts = await getAllContracts();
    contractsWithin = allContracts.filter(ct => {
      const created = (ct as unknown as { createdAt?: number }).createdAt;
      return typeof created === 'number' && created >= start && created <= end;
    }).length;
  } catch (e) {
    // still return 0 if contract fetch fails to not break stats page
    console.error('Fehler beim Laden der Contracts für Aggregation:', e);
  }

  const clickSum = events.length;
  const byType: Record<string, number> = {};
  events.forEach(e => { byType[e.clickType] = (byType[e.clickType] || 0) + 1; });

  return {
    period,
    range: { start, end },
    totalClicks: clickSum,
    clicksByType: byType,
    totalEvents: events.length,
    newCompanies: newCompanies.length,
  newCompanyList: newCompanies.slice(0,25).map(c => ({ id: c.id || 'unknown', name: c.companyName || '' })),
  newContracts: contractsWithin,
  } satisfies AggregateOverviewResult;
}

// Letzte X globalen Events (für Aktivitäten-Feed)
export async function getRecentGlobalEvents(max: number = 50): Promise<Array<StatsType & { id: string }>> {
  const col = collection(database, 'stats');
  let qRef;
  try {
    qRef = query(col, orderBy('timestamp', 'desc'), limit(max));
  } catch {
    qRef = query(col, limit(max));
  }
  const snap = await getDocs(qRef);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as StatsType) }));
  rows.sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
  return rows.slice(0,max);
}
