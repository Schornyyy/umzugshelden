import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  buildKnowledgeWebhookUrl,
  KNOWLEDGE_N8N_ROUTES,
  sendKnowledgeChatMessage,
} from "./knowledgeChatN8n";

function configureWebhook(t: TestContext, value: string) {
  const previous = process.env.N8N_WEBHOOK_URL;
  process.env.N8N_WEBHOOK_URL = value;
  t.after(() => {
    if (previous === undefined) delete process.env.N8N_WEBHOOK_URL;
    else process.env.N8N_WEBHOOK_URL = previous;
  });
}

test("knowledge categories use their configured n8n routes", () => {
  assert.deepEqual(KNOWLEDGE_N8N_ROUTES, {
    marketing: "marketing-text",
    sales: "sales-text",
    offering: "offering-text",
    positioning: "positioning-text",
  });
  assert.equal(
    buildKnowledgeWebhookUrl(
      "https://n8n.example.test/webhook/blog-generation?token=old",
      "sales",
    ),
    "https://n8n.example.test/webhook/sales-text",
  );
  assert.equal(
    buildKnowledgeWebhookUrl("http://localhost:5678", "positioning"),
    "http://localhost:5678/webhook/positioning-text",
  );
  assert.equal(
    buildKnowledgeWebhookUrl(
      "https://n8n.example.test/webhook/sales-text",
      "sales",
      true,
    ),
    "https://n8n.example.test/webhook/sales-text",
  );
});

test("chat sends session, category and history and reads output", async (t) => {
  configureWebhook(t, "https://n8n.example.test/webhook/blog");
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      assert.equal(
        String(input),
        "https://n8n.example.test/webhook/sales-text",
      );
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        message: "Wie verbessere ich den Abschluss?",
        sessionId: "chat-1",
        category: "sales",
        ansprechpartner: "Max Mustermann",
        branche: "Immobilienmakler",
        unternehmensname: "Muster Immobilien",
        history: [
          { role: "user", content: "Vorherige Frage" },
          { role: "assistant", content: "Vorherige Antwort" },
        ],
      });
      return Response.json([{ output: "Nutze eine klare Abschlussfrage." }]);
    },
  );
  const output = await sendKnowledgeChatMessage({
    category: "sales",
    testMode: false,
    sessionId: "chat-1",
    message: "Wie verbessere ich den Abschluss?",
    additionalFields: {
      ansprechpartner: "Max Mustermann",
      branche: "Immobilienmakler",
      unternehmensname: "Muster Immobilien",
    },
    history: [
      {
        id: "1",
        chatId: "chat-1",
        role: "user",
        content: "Vorherige Frage",
        createdAt: 1,
      },
      {
        id: "2",
        chatId: "chat-1",
        role: "assistant",
        content: "Vorherige Antwort",
        createdAt: 2,
      },
    ],
  });
  assert.equal(output, "Nutze eine klare Abschlussfrage.");
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("missing output and HTTP errors fail explicitly", async (t) => {
  configureWebhook(t, "https://n8n.example.test/webhook/blog");
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ text: "Falsches Feld" }),
  );
  await assert.rejects(
    sendKnowledgeChatMessage({
      category: "marketing",
      testMode: false,
      sessionId: "chat-1",
      message: "Hallo",
      history: [],
    }),
    /keinen Text/,
  );
  fetchMock.mock.restore();
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Fehler", { status: 503 }),
  );
  await assert.rejects(
    sendKnowledgeChatMessage({
      category: "marketing",
      testMode: false,
      sessionId: "chat-1",
      message: "Hallo",
      history: [],
    }),
    /Status 503/,
  );
});

test("raw markdown responses are accepted", async (t) => {
  configureWebhook(t, "https://n8n.example.test/webhook/blog");
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        "Betreff: Kooperation\n---EMAIL---\nGuten Tag,\n\n**Kurzer Text**",
        { headers: { "content-type": "text/markdown; charset=utf-8" } },
      ),
  );
  const output = await sendKnowledgeChatMessage({
    category: "sales",
    testMode: true,
    sessionId: "b2b-1",
    message: "Erstelle eine E-Mail.",
    history: [],
  });
  assert.equal(
    output,
    "Betreff: Kooperation\n---EMAIL---\nGuten Tag,\n\n**Kurzer Text**",
  );
});
