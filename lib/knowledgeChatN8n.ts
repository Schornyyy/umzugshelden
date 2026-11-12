import type { KnowledgeChatMessage } from "@/lib/knowledgeChat";
import type { KnowledgeCategory } from "@/lib/knowledgeSettings";

const MAX_RESPONSE_BYTES = 500_000;
const MAX_OUTPUT_LENGTH = 120_000;

export const KNOWLEDGE_N8N_ROUTES: Record<KnowledgeCategory, string> = {
  marketing: "marketing-text",
  sales: "sales-text",
  offering: "offering-text",
  positioning: "positioning-text",
};

export function buildKnowledgeWebhookUrl(
  configuredUrl: string,
  category: KnowledgeCategory,
  testMode = false,
): string {
  const url = new URL(configuredUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("N8N Webhook URL muss HTTP oder HTTPS verwenden.");
  }
  const route = KNOWLEDGE_N8N_ROUTES[category];
  const match = url.pathname.match(/^(.*)\/webhook(?:-test)?\/[^/]*$/);
  const basePath = match?.[1] ?? "";
  url.pathname = `${basePath}/webhook${testMode ? "-test" : ""}/${route}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function extractOutput(payload: unknown): string {
  const value = Array.isArray(payload) ? payload[0] : payload;
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || !("output" in value)) return "";
  const output = (value as { output?: unknown }).output;
  return typeof output === "string" ? output.trim() : "";
}

export async function sendKnowledgeChatMessage(input: {
  category: KnowledgeCategory;
  testMode: boolean;
  sessionId: string;
  message: string;
  history: KnowledgeChatMessage[];
  additionalFields?: Record<string, string>;
}): Promise<string> {
  const configuredUrl = process.env.N8N_WEBHOOK_URL?.trim();
  if (!configuredUrl) {
    throw new Error("N8N_WEBHOOK_URL ist nicht konfiguriert.");
  }
  const response = await fetch(
    buildKnowledgeWebhookUrl(configuredUrl, input.category, false),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input.additionalFields,
        message: input.message,
        sessionId: input.sessionId,
        category: input.category,
        history: input.history.map(({ role, content }) => ({ role, content })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    },
  ).catch((error: unknown) => {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    ) {
      throw new Error(
        "Der n8n-Chat hat das Zeitlimit überschritten. Bitte erneut versuchen.",
        { cause: error },
      );
    }
    throw error;
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Knowledge n8n webhook failed", response.status, detail);
    throw new Error(`n8n antwortete mit Status ${response.status}.`);
  }
  const body = await response.text();
  if (body.length > MAX_RESPONSE_BYTES) {
    throw new Error("Die n8n-Antwort ist zu groß.");
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const trimmedBody = body.trim();
  let output = "";
  if (
    contentType.includes("application/json") ||
    trimmedBody.startsWith("{") ||
    trimmedBody.startsWith("[")
  ) {
    let payload: unknown;
    try {
      payload = JSON.parse(trimmedBody);
    } catch (error) {
      throw new Error("Der n8n-Webhook hat ungültiges JSON geliefert.", {
        cause: error,
      });
    }
    output = extractOutput(payload);
  } else {
    output = trimmedBody;
  }
  if (!output) {
    throw new Error("Die n8n-Antwort enthält keinen Text.");
  }
  if (output.length > MAX_OUTPUT_LENGTH) {
    throw new Error("Die n8n-Antwort überschreitet 120.000 Zeichen.");
  }
  return output;
}
