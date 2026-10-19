import { getAdminAuth, getAdminDatabase } from "@/lib/firebaseAdmin";
import { generateGeminiJson } from "@/lib/gemini";
import type { FurnitureCatalogItem } from "@/lib/offerPricingSettings";
import { NextResponse } from "next/server";

const USERS_COLLECTION = "users_umzugshelden";

const systemPrompt = `Du erstellst einen Möbelkatalog für einen deutschen Umzugsbetrieb.
Antworte ausschließlich mit einem JSON-Objekt:
{
  "items": [
    {
      "name": "eindeutiger deutscher Möbelname",
      "category": "passender Raum oder Kategorie",
      "volumeM3": 0.5
    }
  ]
}

Regeln:
- Erzeuge nur konkrete transportierbare Möbel oder Haushaltsgegenstände.
- volumeM3 ist ein realistisches Transportvolumen je einzelnem Gegenstand in Kubikmetern.
- Erzeuge für jeden kommagetrennten Begriff genau einen passenden Eintrag.
- Keine Duplikate, Varianten klar benennen.
- Höchstens 30 Einträge.`;

function sanitizeItems(value: unknown): FurnitureCatalogItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const raw = item as {
      name?: unknown;
      category?: unknown;
      volumeM3?: unknown;
    };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const category =
      typeof raw.category === "string" ? raw.category.trim() : "";
    const volumeM3 =
      typeof raw.volumeM3 === "number" ? raw.volumeM3 : Number(raw.volumeM3);
    if (!name || !category || !Number.isFinite(volumeM3) || volumeM3 <= 0) {
      return [];
    }
    return [
      {
        id: crypto.randomUUID(),
        name,
        category,
        volumeM3: Math.round(volumeM3 * 1000) / 1000,
      },
    ];
  });
}

async function isAdmin(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return false;
  const decoded = await getAdminAuth().verifyIdToken(token).catch(() => null);
  const email = decoded?.email?.trim();
  if (!email) return false;
  const accounts = await getAdminDatabase()
    .collection(USERS_COLLECTION)
    .where("email", "==", email)
    .get();
  return accounts.docs.some(
    (account) =>
      String(account.get("role") ?? "").toLocaleLowerCase("de-DE") === "admin"
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    description?: unknown;
  };
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (!description || description.length > 4000) {
    return NextResponse.json(
      { success: false, error: "Bitte eine gültige Beschreibung eingeben." },
      { status: 400 }
    );
  }

  try {
    const requestedItems = description
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30);
    if (requestedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bitte mindestens ein Möbelstück eingeben." },
        { status: 400 }
      );
    }
    const parsed = await generateGeminiJson({
      systemInstruction: systemPrompt,
      prompt: `Erstelle Katalogeinträge für diese Möbelstücke:\n${requestedItems
        .map((item) => `- ${item}`)
        .join("\n")}`,
      temperature: 0.2,
      maxOutputTokens: 3000,
      thinkingBudget: 0,
    });
    const items = sanitizeItems(
      parsed && typeof parsed === "object"
        ? (parsed as { items?: unknown }).items
        : undefined
    );
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Die KI hat keine gültigen Möbelstücke erzeugt." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Furniture catalog generation failed", error);
    return NextResponse.json(
      { success: false, error: "KI-Antwort konnte nicht verarbeitet werden." },
      { status: 500 }
    );
  }
}
