import "server-only";

import { API_WORK_BUDGET_MS } from "@/lib/apiDeadline";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

const GEMINI_REQUEST_TIMEOUT_MS = 20_000;

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY fehlt in der Umgebung");

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  };
}

export async function generateGeminiJson(input: {
  systemInstruction: string;
  prompt: string;
  temperature: number;
  timeoutMs?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
}): Promise<unknown> {
  const { apiKey, model } = getGeminiConfig();
  const timeoutMs = Math.max(
    1,
    Math.min(
      input.timeoutMs ?? GEMINI_REQUEST_TIMEOUT_MS,
      API_WORK_BUDGET_MS,
    ),
  );
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: input.temperature,
            responseMimeType: "application/json",
            ...(input.maxOutputTokens
              ? { maxOutputTokens: input.maxOutputTokens }
              : {}),
            ...(input.thinkingBudget !== undefined
              ? {
                  thinkingConfig: {
                    thinkingBudget: input.thinkingBudget,
                  },
                }
              : {}),
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      console.error(
        "Gemini request timed out",
        `${timeoutMs}ms`,
      );
      throw new Error(
        "Die Gemini-Anfrage hat das Zeitlimit überschritten. Bitte erneut versuchen.",
        { cause: error },
      );
    }
    throw error;
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Gemini request failed", response.status, detail);
    throw new Error("Die Gemini-Anfrage ist fehlgeschlagen");
  }

  const payload = (await response.json()) as GeminiResponse;
  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) {
    console.error(
      "Gemini returned no content",
      payload.promptFeedback?.blockReason ?? "unknown reason",
    );
    throw new Error("Gemini hat keine verwertbare Antwort geliefert");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Gemini returned invalid JSON", error);
    throw new Error("Die Gemini-Antwort konnte nicht verarbeitet werden");
  }
}
