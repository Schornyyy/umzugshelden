"use server";

import { database } from "@/config/firebase";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS } from "@/lib/cache";
import { StatsType } from "@/types/StatsType";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";

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
