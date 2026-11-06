const MAX_RESPONSE_LENGTH = 500_000;
const MAX_CONTENT_LENGTH = 120_000;
const CONTENT_FIELDS = ["output", "text", "markdown", "content", "article", "data", "result"] as const;

function extractText(value: unknown, depth = 0): string {
  if (depth > 8) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((entry) => extractText(entry, depth + 1)).filter(Boolean).join("\n\n");
  }
  if (value && typeof value === "object") {
    const fields = new Map(Object.entries(value));
    for (const field of CONTENT_FIELDS) {
      const text = extractText(fields.get(field), depth + 1);
      if (text) return text;
    }
  }
  return "";
}

export async function fetchN8nRagText(
  keyword: string,
  timeoutMs: number,
): Promise<string> {
  if (!keyword.trim()) throw new Error("Keyword ist erforderlich.");
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
  if (!webhookUrl) throw new Error("N8N Webhook URL ist nicht konfiguriert.");
  const url = new URL(webhookUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("N8N Webhook URL muss HTTP oder HTTPS verwenden.");
  }

  let response: Response;
  let body: string;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: keyword.trim() }),
      signal: AbortSignal.timeout(Math.max(1, Math.min(timeoutMs, 50_000))),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`n8n antwortete mit Status: ${response.status}`);
    }
    body = await response.text();
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
      throw new Error("Der n8n Webhook hat das Zeitlimit überschritten. Bitte erneut versuchen.", { cause: error });
    }
    throw error;
  }
  if (body.length > MAX_RESPONSE_LENGTH) {
    throw new Error("Die n8n-Antwort ist zu groß.");
  }

  let payload: unknown;
  const trimmedBody = body.trim();
  const isJson = response.headers.get("content-type")?.includes("json") ||
    /^(?:\{|\[\s*(?:\{|\[|")|")/u.test(trimmedBody);
  if (isJson) {
    try {
      payload = JSON.parse(trimmedBody);
    } catch (error) {
      throw new Error("Der n8n Webhook hat ungültiges JSON geliefert.", { cause: error });
    }
  } else {
    payload = trimmedBody;
  }
  const text = extractText(payload);
  if (!text) {
    throw new Error("Der n8n Webhook hat keinen verwertbaren Artikeltext geliefert.");
  }
  if (text.length > MAX_CONTENT_LENGTH) {
    throw new Error("Der n8n-Artikeltext überschreitet das Limit von 120.000 Zeichen.");
  }
  return text;
}

export const fetchBlogN8nText = fetchN8nRagText;
