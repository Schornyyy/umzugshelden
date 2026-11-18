import type { CityServiceKey } from "@/types/city/CityServicePage";

/** "stadt" = Stadt-Übersichtsseite, sonst die Stadt-Service-Seite. */
export type CityPageKind = "stadt" | CityServiceKey;

export interface CityLocalizationSettings {
  /** Bilder-Pool je Dienstleistung (Stadtseiten nutzen alle Pools zusammen). */
  imagePools: Partial<Record<CityServiceKey, string[]>>;
  /** Maximal erlaubte Übereinstimmung (0–1) mit Vorlage oder anderen Städten. */
  similarityThreshold: number;
}

export interface CityDuplicateRow {
  key: string;
  kind: CityPageKind;
  cityName: string;
  path: string;
  status: "template" | "individual" | "localized";
  similarityToTemplate: number;
  maxSimilarityToOthers: number;
  wordCount: number;
  imageCount: number;
}

export interface CityDuplicateReport {
  threshold: number;
  generatedAt: number;
  totalPages: number;
  duplicatePages: number;
  averageSimilarity: number;
  rows: CityDuplicateRow[];
}

export interface CityLocalizationResult {
  key: string;
  cityName: string;
  kind: CityPageKind;
  status: "localized" | "skipped" | "too_similar" | "failed";
  similarity?: number;
  error?: string;
  finishedAt: number;
}

export interface CityLocalizationRun {
  status: "running" | "stopped" | "completed";
  total: number;
  cursor: number;
  stats: { localized: number; skipped: number; tooSimilar: number; failed: number };
  /** Letzte Ergebnisse, neueste zuerst. */
  results: CityLocalizationResult[];
  lastError: string | null;
  startedAt: number;
  heartbeatAt: number;
  finishedAt: number | null;
}
