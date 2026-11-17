import "server-only";

import { parse } from "csv-parse/sync";
import { FieldValue } from "firebase-admin/firestore";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { B2B_CATEGORY_QUERIES } from "@/lib/b2bCategories";
import {
  listKnownB2bLeadDomains,
  upsertB2bLeads,
  type B2bLeadInput,
} from "@/lib/b2bLeadStore";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { cities, cityCoordinates, getNearbyCities } from "@/statics/Lists";
import type {
  B2bResearchCity,
  B2bResearchCityResult,
  B2bResearchRun,
} from "@/types/B2bResearch";
import type { B2bLeadCategory } from "@/types/B2b";

export const B2B_RESEARCH_CENTER = { name: "Drolshagen", postalCode: "57489" } as const;
export const B2B_RESEARCH_RADIUS_KM = 50;
const RUN_COLLECTION = "b2b_research_runs";
/** Ein Lauf gilt als hängend, wenn so lange keine Stadt fertig wurde. */
export const B2B_RESEARCH_STALE_MS = 45 * 60 * 1_000;
const N8N_TIMEOUT_MS = 40 * 60 * 1_000;
const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/b2b-lead-research";

type CsvLead = {
  Name?: string;
  "E-Mail"?: string;
  Website?: string;
  Telefonnummer?: string;
  Ansprechpartner?: string;
  Suchbegriff?: string;
  Adresse?: string;
};

export function b2bResearchRunReference(ownerId: string) {
  return getAdminDatabase().collection(RUN_COLLECTION).doc(ownerId);
}

/** Alle bekannten Orte im Radius um Drolshagen, nach Entfernung sortiert. */
export function getB2bResearchCities(): B2bResearchCity[] {
  const center = B2B_RESEARCH_CENTER.name;
  const nearby = getNearbyCities(center, undefined, B2B_RESEARCH_RADIUS_KM)
    .filter((city) => cityCoordinates[city.name]);
  return [
    ...(cities.includes(center) ? [{ name: center, distanceKm: 0 }] : []),
    ...nearby,
  ];
}

export function serializeB2bResearchRun(data: FirebaseFirestore.DocumentData): B2bResearchRun {
  return {
    status: data.status,
    categories: data.categories ?? [],
    cityCount: Array.isArray(data.cities) ? data.cities.length : 0,
    nextCityIndex: Number(data.nextCityIndex || 0),
    currentCity: data.currentCity ?? null,
    stats: {
      found: Number(data.stats?.found || 0),
      withEmail: Number(data.stats?.withEmail || 0),
      imported: Number(data.stats?.imported || 0),
      updated: Number(data.stats?.updated || 0),
      failedCities: Number(data.stats?.failedCities || 0),
    },
    cityResults: Array.isArray(data.cityResults) ? data.cityResults.slice(-15).reverse() : [],
    lastError: data.lastError ?? null,
    startedAt: Number(data.startedAt || 0),
    heartbeatAt: Number(data.heartbeatAt || 0),
    finishedAt: data.finishedAt ? Number(data.finishedAt) : null,
  };
}

/** POST an n8n ohne das 5-Minuten-Header-Timeout des globalen fetch. */
function postToN8n(url: string, body: unknown): Promise<{ status: number; contentType: string; text: string }> {
  const target = new URL(url);
  const send = target.protocol === "https:" ? httpsRequest : httpRequest;
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = send(
      target,
      {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": Buffer.byteLength(payload) },
        timeout: N8N_TIMEOUT_MS,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 0,
            contentType: String(response.headers["content-type"] ?? ""),
            text: Buffer.concat(chunks).toString("utf8"),
          }),
        );
        response.on("error", reject);
      },
    );
    request.on("timeout", () => request.destroy(new Error("n8n hat nicht rechtzeitig geantwortet.")));
    request.on("error", (error) =>
      reject(
        "code" in error && error.code === "ECONNREFUSED"
          ? new Error("n8n ist nicht erreichbar. Läuft n8n lokal und ist der Workflow veröffentlicht?")
          : error,
      ),
    );
    request.end(payload);
  });
}

/** Wandelt die leads.csv aus n8n zurück in Datensätze. */
export function parseLeadCsv(text: string): CsvLead[] {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed || !trimmed.includes("Suchbegriff")) return [];
  return parse(trimmed, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
}

function toLeadInput(
  row: CsvLead,
  category: B2bLeadCategory,
  distanceKm: number,
): B2bLeadInput | null {
  const companyName = row.Name?.trim() ?? "";
  if (!companyName) return null;
  const address = row.Adresse?.trim() ?? "";
  const email = row["E-Mail"]?.trim().toLowerCase() ?? "";
  return {
    companyName,
    contactName: row.Ansprechpartner?.trim() || "Geschäftsführung",
    email,
    phone: row.Telefonnummer?.trim() ?? "",
    website: row.Website?.trim() ?? "",
    address,
    category,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${companyName} ${address}`.trim())}`,
    aiOfferAngle: "",
    aiEmailReason: email ? "Per n8n-Workflow aus Impressum/Kontaktseite extrahiert." : "",
    aiStatus: email ? "selected" : "no_email",
    distanceKm,
    searchTerm: row.Suchbegriff?.trim(),
  };
}

async function researchCity(
  ownerId: string,
  city: B2bResearchCity,
  categories: B2bLeadCategory[],
): Promise<B2bResearchCityResult> {
  const termCategory = new Map<string, B2bLeadCategory>();
  for (const category of categories) {
    for (const query of B2B_CATEGORY_QUERIES[category]) {
      termCategory.set(`${query} ${city.name}`, category);
    }
  }
  const response = await postToN8n(process.env.N8N_B2B_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL, {
    // Der n8n-Set-Node erwartet zeilengetrennte Strings
    suchbegriffe: [...termCategory.keys()].join("\n"),
    seiten: 1,
    bekannteDomains: (await listKnownB2bLeadDomains(ownerId)).join("\n"),
  });
  if (response.status === 404) {
    throw new Error("n8n-Webhook nicht gefunden. Ist der Workflow veröffentlicht (aktiv)?");
  }
  if (response.status >= 400) {
    let message = response.text.slice(0, 300);
    try {
      message = JSON.parse(response.text).message ?? message;
    } catch {
      // Antwort war kein JSON
    }
    throw new Error(`n8n-Fehler (${response.status}): ${message}`);
  }

  const rows = parseLeadCsv(response.text);
  const leads = rows.flatMap((row) => {
    const category = termCategory.get(row.Suchbegriff?.trim() ?? "");
    const lead = category ? toLeadInput(row, category, city.distanceKm) : null;
    return lead ? [lead] : [];
  });
  const withEmail = leads.filter((lead) => lead.email);
  const { imported, updated } = await upsertB2bLeads(ownerId, withEmail);
  return {
    city: city.name,
    found: leads.length,
    withEmail: withEmail.length,
    imported,
    updated,
    finishedAt: Date.now(),
  };
}

/**
 * Arbeitet die Städte nacheinander ab. Läuft im Hintergrund des Next-Servers;
 * der Fortschritt steht in Firestore, damit das Frontend ihn anzeigen kann.
 */
export async function processB2bResearchRun(ownerId: string) {
  const reference = b2bResearchRunReference(ownerId);
  while (true) {
    const snapshot = await reference.get();
    const run = snapshot.data();
    if (!run || run.status !== "running") return;
    const runCities = run.cities as B2bResearchCity[];
    const index = Number(run.nextCityIndex || 0);
    if (index >= runCities.length) {
      await reference.update({ status: "completed", currentCity: null, finishedAt: Date.now() });
      return;
    }

    const city = runCities[index];
    await reference.update({ currentCity: city.name, heartbeatAt: Date.now() });
    let result: B2bResearchCityResult;
    try {
      result = await researchCity(ownerId, city, run.categories);
    } catch (error) {
      console.error("B2B n8n research failed", city.name, error);
      result = {
        city: city.name,
        found: 0,
        withEmail: 0,
        imported: 0,
        updated: 0,
        finishedAt: Date.now(),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      };
    }

    // Nur weiterzählen, wenn der Lauf nicht inzwischen neu gestartet wurde.
    const current = await reference.get();
    if (current.get("startedAt") !== run.startedAt) return;
    await reference.update({
      nextCityIndex: index + 1,
      heartbeatAt: Date.now(),
      cityResults: FieldValue.arrayUnion(result),
      "stats.found": FieldValue.increment(result.found),
      "stats.withEmail": FieldValue.increment(result.withEmail),
      "stats.imported": FieldValue.increment(result.imported),
      "stats.updated": FieldValue.increment(result.updated),
      "stats.failedCities": FieldValue.increment(result.error ? 1 : 0),
      lastError: result.error ? `${city.name}: ${result.error}` : current.get("lastError") ?? null,
    });
  }
}
