"use server";

import { after } from "next/server";
import { z } from "zod";
import { authorizeAdminIdToken } from "@/lib/adminApiAuth";
import { B2B_CATEGORY_VALUES } from "@/lib/b2bCategories";
import {
  B2B_RESEARCH_CENTER,
  B2B_RESEARCH_RADIUS_KM,
  B2B_RESEARCH_STALE_MS,
  b2bResearchRunReference,
  getB2bResearchCities,
  processB2bResearchRun,
  serializeB2bResearchRun,
} from "@/lib/b2bN8nResearch";
import type { B2bResearchCity, B2bResearchRun } from "@/types/B2bResearch";

const authSchema = z.object({
  token: z.string().min(1),
  ownerId: z.string().trim().min(1).max(200),
});
const startSchema = authSchema.extend({
  categories: z
    .array(z.enum(B2B_CATEGORY_VALUES as [string, ...string[]]))
    .min(1, "Bitte mindestens eine Zielgruppe auswählen."),
});

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function authorize(input: z.infer<typeof authSchema>) {
  if (!(await authorizeAdminIdToken(input.token, input.ownerId))) {
    throw new Error("Keine Berechtigung.");
  }
}

function failure(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof z.ZodError) return { success: false, error: error.issues[0]?.message ?? fallback };
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function isStale(heartbeatAt: unknown) {
  return Date.now() - Number(heartbeatAt || 0) > B2B_RESEARCH_STALE_MS;
}

function runInBackground(ownerId: string) {
  after(() =>
    processB2bResearchRun(ownerId).catch((error) =>
      console.error("B2B research run crashed", error),
    ),
  );
}

export async function getB2bResearchOverview(
  input: z.infer<typeof authSchema>,
): Promise<ActionResult<{
  run: B2bResearchRun | null;
  center: typeof B2B_RESEARCH_CENTER;
  radiusKm: number;
  cities: B2bResearchCity[];
}>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const snapshot = await b2bResearchRunReference(parsed.ownerId).get();
    return {
      success: true,
      data: {
        run: snapshot.exists ? serializeB2bResearchRun(snapshot.data()!) : null,
        center: B2B_RESEARCH_CENTER,
        radiusKm: B2B_RESEARCH_RADIUS_KM,
        cities: getB2bResearchCities(),
      },
    };
  } catch (error) {
    return failure(error, "Status konnte nicht geladen werden.");
  }
}

export async function startB2bResearch(
  input: z.infer<typeof startSchema>,
): Promise<ActionResult<null>> {
  try {
    const parsed = startSchema.parse(input);
    await authorize(parsed);
    const reference = b2bResearchRunReference(parsed.ownerId);
    const existing = await reference.get();
    if (existing.get("status") === "running" && !isStale(existing.get("heartbeatAt"))) {
      throw new Error("Es läuft bereits eine Recherche.");
    }
    const now = Date.now();
    await reference.set({
      ownerId: parsed.ownerId,
      status: "running",
      categories: parsed.categories,
      cities: getB2bResearchCities(),
      nextCityIndex: 0,
      currentCity: null,
      stats: { found: 0, withEmail: 0, imported: 0, updated: 0, failedCities: 0 },
      cityResults: [],
      lastError: null,
      startedAt: now,
      heartbeatAt: now,
      finishedAt: null,
    });
    runInBackground(parsed.ownerId);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Recherche konnte nicht gestartet werden.");
  }
}

export async function stopB2bResearch(
  input: z.infer<typeof authSchema>,
): Promise<ActionResult<null>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const reference = b2bResearchRunReference(parsed.ownerId);
    if ((await reference.get()).get("status") === "running") {
      await reference.update({ status: "stopped" });
    }
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Recherche konnte nicht angehalten werden.");
  }
}

/** Setzt einen angehaltenen oder hängenden Lauf bei der nächsten offenen Stadt fort. */
export async function resumeB2bResearch(
  input: z.infer<typeof authSchema>,
): Promise<ActionResult<null>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const reference = b2bResearchRunReference(parsed.ownerId);
    const snapshot = await reference.get();
    const status = snapshot.get("status");
    if (!snapshot.exists || status === "completed") throw new Error("Kein offener Lauf vorhanden.");
    if (status === "running" && !isStale(snapshot.get("heartbeatAt"))) {
      throw new Error("Die Recherche läuft bereits.");
    }
    await reference.update({ status: "running", heartbeatAt: Date.now() });
    runInBackground(parsed.ownerId);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Recherche konnte nicht fortgesetzt werden.");
  }
}
