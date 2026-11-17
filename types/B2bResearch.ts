import type { B2bLeadCategory } from "@/types/B2b";

export type B2bResearchStatus = "running" | "stopped" | "completed";

export interface B2bResearchCity {
  name: string;
  distanceKm: number;
}

export interface B2bResearchCityResult {
  city: string;
  found: number;
  withEmail: number;
  imported: number;
  updated: number;
  finishedAt: number;
  error?: string;
}

/** Fortschritt der n8n-Lead-Recherche über alle Orte im Umkreis. */
export interface B2bResearchRun {
  status: B2bResearchStatus;
  categories: B2bLeadCategory[];
  cityCount: number;
  nextCityIndex: number;
  currentCity: string | null;
  stats: {
    found: number;
    withEmail: number;
    imported: number;
    updated: number;
    failedCities: number;
  };
  /** Die letzten Stadt-Ergebnisse, neueste zuerst. */
  cityResults: B2bResearchCityResult[];
  lastError: string | null;
  startedAt: number;
  heartbeatAt: number;
  finishedAt: number | null;
}
