"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { authorizeAdminIdToken } from "@/lib/adminApiAuth";
import { cleanCityContentLinks, type CityLinkCleanupResult } from "@/lib/cityInternalLinks";
import {
  buildCityDuplicateReport,
  CITY_PAGE_KINDS,
  CITY_LOCALIZATION_SETTINGS_COLLECTION,
  cityLocalizationRunReference,
  duplicateIndividualKeys,
  pendingLocalizationKeys,
  readCityLocalizationSettings,
} from "@/lib/cityLocalization";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";
import type {
  CityDuplicateReport,
  CityPageKind,
  CityLocalizationRun,
  CityLocalizationSettings,
} from "@/types/city/CityLocalization";

const authSchema = z.object({
  token: z.string().min(1),
  ownerId: z.string().trim().min(1).max(200),
});
const settingsSchema = authSchema.extend({
  settings: z.object({
    imagePools: z.record(z.enum(CITY_SERVICE_KEYS), z.array(z.string().trim().min(1).max(2_048)).max(60)),
    similarityThreshold: z.number().min(0.2).max(0.8),
  }),
});

const kindSchema = z.enum(CITY_PAGE_KINDS as [CityPageKind, ...CityPageKind[]]);

/** Basis-URL dieser Anfrage, um die ausgelieferten Seiten selbst abzurufen. */
async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("Host der Anfrage unbekannt.");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function kindOfKey(key: string) {
  return key.slice(key.lastIndexOf("/") + 1) as CityPageKind;
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function authorize(input: z.infer<typeof authSchema>) {
  if (!(await authorizeAdminIdToken(input.token, input.ownerId))) throw new Error("Keine Berechtigung.");
}

function failure(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof z.ZodError) return { success: false, error: error.issues[0]?.message ?? fallback };
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function serializeRun(data: FirebaseFirestore.DocumentData): CityLocalizationRun {
  return {
    status: data.status,
    total: Array.isArray(data.queue) ? data.queue.length : 0,
    cursor: Number(data.cursor || 0),
    stats: {
      localized: Number(data.stats?.localized || 0),
      skipped: Number(data.stats?.skipped || 0),
      tooSimilar: Number(data.stats?.tooSimilar || 0),
      failed: Number(data.stats?.failed || 0),
    },
    results: Array.isArray(data.results) ? data.results.slice(-20).reverse() : [],
    lastError: data.lastError ?? null,
    startedAt: Number(data.startedAt || 0),
    heartbeatAt: Number(data.heartbeatAt || 0),
    finishedAt: data.finishedAt ? Number(data.finishedAt) : null,
  };
}

export async function getCityLocalizationOverview(
  input: z.infer<typeof authSchema>,
): Promise<ActionResult<{
  run: CityLocalizationRun | null;
  settings: CityLocalizationSettings;
  pendingCount: number;
  pendingByKind: Partial<Record<CityPageKind, number>>;
  individualDuplicateCount: number;
}>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const settings = await readCityLocalizationSettings(parsed.ownerId);
    const [run, pending, individualDuplicates] = await Promise.all([
      cityLocalizationRunReference(parsed.ownerId).get(),
      pendingLocalizationKeys(parsed.ownerId),
      duplicateIndividualKeys(parsed.ownerId, settings.similarityThreshold),
    ]);
    return {
      success: true,
      data: {
        run: run.exists ? serializeRun(run.data()!) : null,
        settings,
        pendingCount: pending.length,
        pendingByKind: pending.reduce<Partial<Record<CityPageKind, number>>>((counts, key) => {
          const kind = kindOfKey(key);
          counts[kind] = (counts[kind] ?? 0) + 1;
          return counts;
        }, {}),
        individualDuplicateCount: individualDuplicates.length,
      },
    };
  } catch (error) {
    return failure(error, "Status konnte nicht geladen werden.");
  }
}

/** Prüft einen Seitentyp anhand der ausgelieferten Seiten (inkl. vom Renderer ergänzter Texte). */
export async function getCityDuplicateReport(
  input: z.infer<typeof authSchema> & { kind: CityPageKind },
): Promise<ActionResult<CityDuplicateReport>> {
  try {
    const parsed = authSchema.extend({ kind: kindSchema }).parse(input);
    await authorize(parsed);
    const settings = await readCityLocalizationSettings(parsed.ownerId);
    return {
      success: true,
      data: await buildCityDuplicateReport(parsed.ownerId, settings.similarityThreshold, {
        kind: parsed.kind,
        origin: await requestOrigin(),
      }),
    };
  } catch (error) {
    return failure(error, "Duplikat-Prüfung fehlgeschlagen.");
  }
}

export async function saveCityLocalizationSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult<null>> {
  try {
    const parsed = settingsSchema.parse(input);
    await authorize(parsed);
    await getAdminDatabase()
      .collection(CITY_LOCALIZATION_SETTINGS_COLLECTION)
      .doc(parsed.ownerId)
      .set({ ...parsed.settings, ownerId: parsed.ownerId, updatedAt: Date.now() });
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Einstellungen konnten nicht gespeichert werden.");
  }
}

/** Startet einen Lauf über alle Seiten, die noch die Vorlage erben (optional auch zu ähnliche individuelle). */
export async function startCityLocalization(
  input: z.infer<typeof authSchema> & { includeIndividualDuplicates: boolean; kinds?: CityPageKind[] },
): Promise<ActionResult<number>> {
  try {
    const parsed = authSchema
      .extend({ includeIndividualDuplicates: z.boolean(), kinds: z.array(kindSchema).min(1).optional() })
      .parse(input);
    await authorize(parsed);
    const reference = cityLocalizationRunReference(parsed.ownerId);
    const existing = await reference.get();
    if (existing.get("status") === "running" && Number(existing.get("lockedUntil") || 0) > Date.now()) {
      throw new Error("Es läuft bereits ein Schritt. Bitte kurz warten.");
    }
    const settings = await readCityLocalizationSettings(parsed.ownerId);
    const queue = [
      ...(await pendingLocalizationKeys(parsed.ownerId)),
      ...(parsed.includeIndividualDuplicates
        ? await duplicateIndividualKeys(parsed.ownerId, settings.similarityThreshold)
        : []),
    ].filter((key) => !parsed.kinds || parsed.kinds.includes(kindOfKey(key)));
    if (!queue.length) throw new Error("Keine Seite muss neu geschrieben werden.");
    const now = Date.now();
    await reference.set({
      ownerId: parsed.ownerId,
      status: "running",
      queue,
      includeIndividualDuplicates: parsed.includeIndividualDuplicates,
      cursor: 0,
      stats: { localized: 0, skipped: 0, tooSimilar: 0, failed: 0 },
      results: [],
      lastError: null,
      lockedUntil: 0,
      startedAt: now,
      heartbeatAt: now,
      finishedAt: null,
    });
    return { success: true, data: queue.length };
  } catch (error) {
    return failure(error, "Lauf konnte nicht gestartet werden.");
  }
}

export async function setCityLocalizationRunning(
  input: z.infer<typeof authSchema> & { running: boolean },
): Promise<ActionResult<null>> {
  try {
    const parsed = authSchema.extend({ running: z.boolean() }).parse(input);
    await authorize(parsed);
    const reference = cityLocalizationRunReference(parsed.ownerId);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.get("status") === "completed") throw new Error("Kein offener Lauf vorhanden.");
    await reference.update({ status: parsed.running ? "running" : "stopped", heartbeatAt: Date.now() });
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Status konnte nicht geändert werden.");
  }
}

/** Prüft (dryRun) bzw. entfernt Links, die nicht auf eine veröffentlichte eigene Seite zeigen. */
export async function cleanCityLinks(
  input: z.infer<typeof authSchema> & { dryRun: boolean },
): Promise<ActionResult<CityLinkCleanupResult>> {
  try {
    const parsed = authSchema.extend({ dryRun: z.boolean() }).parse(input);
    await authorize(parsed);
    return { success: true, data: await cleanCityContentLinks(parsed.ownerId, { dryRun: parsed.dryRun }) };
  } catch (error) {
    return failure(error, "Links konnten nicht geprüft werden.");
  }
}
