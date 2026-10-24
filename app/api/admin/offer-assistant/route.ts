import type {
  AssistantOfferDraft,
  AssistantRoom,
} from "@/types/OfferAssistant";
import { generateGeminiJson } from "@/lib/gemini";
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
    { "name": string, "items": [ {
      "name": string,
      "quantity": number,
      "volumeM3": number,
      "lengthCm": number,
      "widthCm": number,
      "heightCm": number,
      "assemblyQuantity": number,    // Anzahl gewünschter Aufbauten
      "dismantlingQuantity": number  // Anzahl gewünschter Abbauten
    } ] }
  ],
  "movingBoxes": number,
  "unpackingBoxes": number,
  "fragileItemCount": number,       // empfindliche Einzelstücke mit Sonderverpackung
  "householdSize": number,
  "packingRoomCount": number,       // Anzahl der zu packenden Räume
  "livingAreaM2": number,
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
- Übernimm Möbelmaße aus Tabellen oder Listen exakt in Zentimetern. Rechne Angaben in Metern oder Millimetern in Zentimeter um. Erfinde keine Maße; lasse unbekannte Maßfelder weg.
- Setze assemblyQuantity oder dismantlingQuantity nur, wenn Montage bzw. Demontage ausdrücklich genannt oder in einer entsprechenden Tabellenspalte markiert ist.
- Ordne Gegenstände sinnvoll Räumen zu; wenn kein Raum genannt ist, verwende passende Standardräume.
- Leite die Services aus dem Kontext ab (z. B. "einpacken" => packing, "entrümpeln" => clearance, "streichen" => painting).
- Schätze Karton- oder Materialmengen nur, wenn der Text ausreichend Angaben zu Wohnfläche, Räumen, Personen oder Inventar enthält.
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
            lengthCm?: unknown;
            widthCm?: unknown;
            heightCm?: unknown;
            assemblyQuantity?: unknown;
            dismantlingQuantity?: unknown;
          };
          const name = toText(rawItem.name);
          if (!name) return [];
          const lengthCm = toNumber(rawItem.lengthCm);
          const widthCm = toNumber(rawItem.widthCm);
          const heightCm = toNumber(rawItem.heightCm);
          const dimensionVolume =
            lengthCm && widthCm && heightCm
              ? (lengthCm * widthCm * heightCm) / 1_000_000
              : undefined;
          return [
            {
              name,
              quantity: Math.max(1, Math.round(toNumber(rawItem.quantity) ?? 1)),
              volumeM3:
                Math.round(
                  (dimensionVolume ?? toNumber(rawItem.volumeM3) ?? 0.3) * 1000
                ) / 1000,
              lengthCm,
              widthCm,
              heightCm,
              assemblyQuantity: toNumber(rawItem.assemblyQuantity),
              dismantlingQuantity: toNumber(rawItem.dismantlingQuantity),
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
    fragileItemCount: toNumber(raw.fragileItemCount),
    householdSize: toNumber(raw.householdSize),
    packingRoomCount: toNumber(raw.packingRoomCount),
    livingAreaM2: toNumber(raw.livingAreaM2),
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

const MAX_PDF_COUNT = 3;
const MAX_PDF_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_PDF_SIZE = 12 * 1024 * 1024;

type PdfInput = {
  filename: string;
  fileData: string;
};

export async function POST(request: Request) {
  const idToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!idToken || !(await verifyIdToken(idToken))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  const pdfInputs: PdfInput[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { success: false, error: "Upload konnte nicht verarbeitet werden" },
        { status: 400 }
      );
    }
    const rawText = formData.get("text");
    text = typeof rawText === "string" ? rawText.trim() : "";
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    if (files.length > MAX_PDF_COUNT) {
      return NextResponse.json(
        { success: false, error: `Maximal ${MAX_PDF_COUNT} PDFs pro Analyse` },
        { status: 400 }
      );
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_PDF_SIZE) {
      return NextResponse.json(
        { success: false, error: "Die PDFs dürfen zusammen maximal 12 MB groß sein" },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (
        file.type !== "application/pdf" ||
        !file.name.toLocaleLowerCase("de-DE").endsWith(".pdf") ||
        file.size === 0 ||
        file.size > MAX_PDF_SIZE
      ) {
        return NextResponse.json(
          { success: false, error: `Ungültige PDF-Datei: ${file.name}` },
          { status: 400 }
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (
        bytes.length < 5 ||
        bytes[0] !== 0x25 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x44 ||
        bytes[3] !== 0x46 ||
        bytes[4] !== 0x2d
      ) {
        return NextResponse.json(
          { success: false, error: `Die Datei ${file.name} ist keine gültige PDF` },
          { status: 400 }
        );
      }
      pdfInputs.push({
        filename: file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120),
        fileData: Buffer.from(bytes).toString("base64"),
      });
    }
  } else {
    const body = await request.json().catch(() => ({}));
    text = typeof body.text === "string" ? body.text.trim() : "";
  }

  if (!text && pdfInputs.length === 0) {
    return NextResponse.json(
      { success: false, error: "Kein Text oder PDF übergeben" },
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
    const prompt = [
      pdfInputs.length > 0
        ? `Analysiere diese PDF-Dateien: ${pdfInputs
            .map((pdf) => pdf.filename)
            .join(", ")}.`
        : "",
      text ||
        "Lies alle Möbel-, Inventar-, Maß-, Karton- und Leistungsangaben aus den PDFs aus.",
    ]
      .filter(Boolean)
      .join("\n\n");
    const parsed = await generateGeminiJson({
      systemInstruction: systemPrompt,
      prompt,
      temperature: 0.2,
      timeoutMs: 55_000,
      maxOutputTokens: 8_192,
      thinkingBudget: 0,
      inlineData: pdfInputs.map((pdf) => ({
        mimeType: "application/pdf",
        data: pdf.fileData,
      })),
    });
    const draft = sanitizeDraft(
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {}
    );

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error("Gemini offer assistant error", error);
    return NextResponse.json(
      { success: false, error: "Gemini-Antwort konnte nicht verarbeitet werden" },
      { status: 500 }
    );
  }
}
