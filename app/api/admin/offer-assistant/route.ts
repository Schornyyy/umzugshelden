import type {
  AssistantOfferDraft,
  AssistantRoom,
} from "@/types/OfferAssistant";
import { NextResponse } from "next/server";

// Public Firebase Web-API-Key (identisch mit config/firebase.ts)
const FIREBASE_API_KEY = "AIzaSyBYUdfLuf5xfEmbzqF9w6DtULVuTdRuOUs";

const allowedServices = new Set([
  "move",
  "seniorMove",
  "clearance",
  "painting",
  "furnitureAssembly",
  "packing",
  "storage",
]);

const systemPrompt = `Du bist ein Assistent für ein deutsches Umzugs- und Dienstleistungsunternehmen.
Du bekommst eine freie Text- oder Sprachnotiz einer Vor-Ort-Aufnahme und extrahierst daraus ein strukturiertes Angebot.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt mit diesen optionalen Feldern (lasse Felder weg, die im Text nicht vorkommen):
{
  "title": string,                  // kurzer Angebotstitel, z. B. "Umzug Familie Müller"
  "customer": string,               // Kunden- oder Firmenname
  "contactName": string,
  "contactPhone": string,
  "contactEmail": string,
  "date": string,                   // Wunschtermin als YYYY-MM-DD
  "services": string[],             // aus: move, seniorMove, clearance, painting, furnitureAssembly, packing, storage
  "oldAddress": string,
  "newAddress": string,
  "oldFloor": string,               // z. B. "3. OG"
  "newFloor": string,
  "oldFloorLevel": number,          // Etage als Zahl, EG = 0
  "newFloorLevel": number,
  "oldElevator": boolean,
  "newElevator": boolean,
  "kilometers": number,             // Fahrtstrecke gesamt
  "carryDistanceM": number,         // Trageweg in Metern
  "moveTrips": number,
  "moveComplexity": "easy" | "standard" | "difficult",
  "furnitureLiftRequired": boolean,
  "parkingRequired": boolean,       // Halteverbotszone
  "rooms": [                        // Inventar je Raum
    { "name": string, "items": [ { "name": string, "quantity": number, "volumeM3": number } ] }
  ],
  "movingBoxes": number,
  "unpackingBoxes": number,
  "furniturePieces": number,        // Möbelteile zur Montage
  "dismantlingHours": number,
  "paintAreaM2": number,
  "ceilingAreaM2": number,
  "paintCoats": number,
  "disposalVolumeM3": number,
  "clearanceHeavyItems": number,
  "clearanceDisposalIncluded": boolean,  // false, wenn der Kunde selbst entsorgt
  "clearanceHazardousVolumeM3": number,  // Sondermüll / Problemstoffe in m³
  "clearanceContainerCount": number,     // benötigte Container
  "clearanceBroomClean": boolean,        // besenreine Übergabe gewünscht
  "storageVolumeM3": number,
  "storageMonths": number,
  "notes": string                   // wichtige Hinweise, die nirgendwo sonst passen
}

Regeln:
- Schätze für jedes Inventarstück ein realistisches Einzelvolumen in m³ (z. B. Sofa 1,8; Bett 1,4; Kleiderschrank 2,2; Waschmaschine 0,4; Umzugskarton 0,08).
- Ordne Gegenstände sinnvoll Räumen zu; wenn kein Raum genannt ist, verwende passende Standardräume.
- Leite die Services aus dem Kontext ab (z. B. "einpacken" => packing, "entrümpeln" => clearance, "streichen" => painting).
- Erfinde keine Kontaktdaten oder Adressen.`;

function toNumber(value: unknown): number | undefined {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
}

function toText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function sanitizeRooms(value: unknown): AssistantRoom[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rooms = value.flatMap((room): AssistantRoom[] => {
    if (!room || typeof room !== "object") return [];
    const raw = room as { name?: unknown; items?: unknown };
    const items = Array.isArray(raw.items)
      ? raw.items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const rawItem = item as {
            name?: unknown;
            quantity?: unknown;
            volumeM3?: unknown;
          };
          const name = toText(rawItem.name);
          if (!name) return [];
          return [
            {
              name,
              quantity: Math.max(1, Math.round(toNumber(rawItem.quantity) ?? 1)),
              volumeM3: Math.round((toNumber(rawItem.volumeM3) ?? 0.3) * 100) / 100,
            },
          ];
        })
      : [];
    if (!items.length) return [];
    return [{ name: toText(raw.name) ?? "Raum", items }];
  });
  return rooms.length ? rooms : undefined;
}

function sanitizeDraft(raw: Record<string, unknown>): AssistantOfferDraft {
  const services = Array.isArray(raw.services)
    ? raw.services.filter(
        (service): service is string =>
          typeof service === "string" && allowedServices.has(service)
      )
    : undefined;
  const complexity = raw.moveComplexity;

  return {
    title: toText(raw.title),
    customer: toText(raw.customer),
    contactName: toText(raw.contactName),
    contactPhone: toText(raw.contactPhone),
    contactEmail: toText(raw.contactEmail),
    date: toText(raw.date),
    services: services?.length ? services : undefined,
    oldAddress: toText(raw.oldAddress),
    newAddress: toText(raw.newAddress),
    oldFloor: toText(raw.oldFloor),
    newFloor: toText(raw.newFloor),
    oldFloorLevel: toNumber(raw.oldFloorLevel),
    newFloorLevel: toNumber(raw.newFloorLevel),
    oldElevator: toBool(raw.oldElevator),
    newElevator: toBool(raw.newElevator),
    kilometers: toNumber(raw.kilometers),
    carryDistanceM: toNumber(raw.carryDistanceM),
    moveTrips: toNumber(raw.moveTrips),
    moveComplexity:
      complexity === "easy" || complexity === "standard" || complexity === "difficult"
        ? complexity
        : undefined,
    furnitureLiftRequired: toBool(raw.furnitureLiftRequired),
    parkingRequired: toBool(raw.parkingRequired),
    rooms: sanitizeRooms(raw.rooms),
    movingBoxes: toNumber(raw.movingBoxes),
    unpackingBoxes: toNumber(raw.unpackingBoxes),
    furniturePieces: toNumber(raw.furniturePieces),
    dismantlingHours: toNumber(raw.dismantlingHours),
    paintAreaM2: toNumber(raw.paintAreaM2),
    ceilingAreaM2: toNumber(raw.ceilingAreaM2),
    paintCoats: toNumber(raw.paintCoats),
    disposalVolumeM3: toNumber(raw.disposalVolumeM3),
    clearanceHeavyItems: toNumber(raw.clearanceHeavyItems),
    clearanceDisposalIncluded: toBool(raw.clearanceDisposalIncluded),
    clearanceHazardousVolumeM3: toNumber(raw.clearanceHazardousVolumeM3),
    clearanceContainerCount: toNumber(raw.clearanceContainerCount),
    clearanceBroomClean: toBool(raw.clearanceBroomClean),
    storageVolumeM3: toNumber(raw.storageVolumeM3),
    storageMonths: toNumber(raw.storageMonths),
    notes: toText(raw.notes),
  };
}

async function verifyIdToken(idToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "OPENAI_API_KEY fehlt in der Umgebung" },
      { status: 500 }
    );
  }

  const idToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!idToken || !(await verifyIdToken(idToken))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { success: false, error: "Kein Text übergeben" },
      { status: 400 }
    );
  }
  if (text.length > 12000) {
    return NextResponse.json(
      { success: false, error: "Text ist zu lang" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("OpenAI request failed", response.status, detail);
      return NextResponse.json(
        { success: false, error: "KI-Anfrage fehlgeschlagen" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : "{}");
    const draft = sanitizeDraft(
      parsed && typeof parsed === "object" ? parsed : {}
    );

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error("Offer assistant error", error);
    return NextResponse.json(
      { success: false, error: "Antwort konnte nicht verarbeitet werden" },
      { status: 500 }
    );
  }
}
