import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { fetchBlogN8nText } from "./blogN8n";

function configureWebhook(t: TestContext, url = "https://n8n.example.test/webhook/blog") {
  const previous = process.env.N8N_WEBHOOK_URL;
  process.env.N8N_WEBHOOK_URL = url;
  t.after(() => {
    if (previous === undefined) delete process.env.N8N_WEBHOOK_URL;
    else process.env.N8N_WEBHOOK_URL = previous;
  });
}

test("n8n receives only the keyword and returns Markdown or common JSON formats", async (t) => {
  configureWebhook(t);
  const responses = [
    { body: "# Ratgeber\n\nEin hilfreicher Text.", type: "text/markdown" },
    { body: "[Planung](https://example.test)\n\nMarkdown.", type: "text/plain" },
    { body: JSON.stringify("Ein JSON-Text."), type: "application/json" },
    { body: JSON.stringify({ output: "Ein Artikel." }), type: "application/json" },
    { body: JSON.stringify({ text: "Ein Text." }), type: "application/json" },
    { body: JSON.stringify({ content: "Ein Inhalt." }), type: "application/json" },
    { body: JSON.stringify({ markdown: "# Artikel" }), type: "application/json" },
    { body: JSON.stringify({ success: true, data: [{ output: "Teil 1" }, { article: "Teil 2" }] }), type: "application/json" },
    { body: '  [{ "output": "Ohne JSON-Header" }]  ', type: "text/plain" },
  ];
  const expected = [
    "# Ratgeber\n\nEin hilfreicher Text.",
    "[Planung](https://example.test)\n\nMarkdown.",
    "Ein JSON-Text.",
    "Ein Artikel.",
    "Ein Text.",
    "Ein Inhalt.",
    "# Artikel",
    "Teil 1\n\nTeil 2",
    "Ohne JSON-Header",
  ];
  for (const [index, fixture] of responses.entries()) {
    const fetchMock = t.mock.method(globalThis, "fetch", async (
      input: Parameters<typeof fetch>[0],
      init?: RequestInit,
    ) => {
      assert.equal(String(input), "https://n8n.example.test/webhook/blog");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, { "Content-Type": "application/json" });
      assert.deepEqual(JSON.parse(String(init?.body)), { keyword: "Umzug planen" });
      assert.ok(init?.signal instanceof AbortSignal);
      assert.equal(init?.cache, "no-store");
      return new Response(fixture.body, { headers: { "content-type": fixture.type } });
    });
    assert.equal(await fetchBlogN8nText("  Umzug planen  ", 1_000), expected[index]);
    fetchMock.mock.restore();
  }
});

test("missing configuration and invalid keywords never call n8n", async (t) => {
  configureWebhook(t, "");
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
  await assert.rejects(fetchBlogN8nText("Umzug planen", 1_000), /nicht konfiguriert/);
  await assert.rejects(fetchBlogN8nText(" ", 1_000), /Keyword ist erforderlich/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("invalid webhook protocols are rejected", async (t) => {
  configureWebhook(t, "file:///private");
  await assert.rejects(fetchBlogN8nText("Umzug", 1_000), /HTTP oder HTTPS/);
});

test("HTTP errors, invalid JSON, empty and oversized results are explicit errors", async (t) => {
  configureWebhook(t);
  const cases = [
    { response: new Response("private upstream error", { status: 503 }), error: /Status: 503/ },
    { response: new Response("{invalid", { headers: { "content-type": "application/json" } }), error: /ungültiges JSON/ },
    { response: new Response(" "), error: /keinen verwertbaren Artikeltext/ },
    { response: Response.json({ success: true }), error: /keinen verwertbaren Artikeltext/ },
    { response: Response.json({ error: "Failure" }), error: /keinen verwertbaren Artikeltext/ },
    { response: Response.json({ output: "a".repeat(120_001) }), error: /120.000 Zeichen/ },
    { response: new Response("a".repeat(500_001)), error: /Antwort ist zu groß/ },
  ];
  for (const fixture of cases) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => fixture.response);
    await assert.rejects(fetchBlogN8nText("Umzug", 1_000), fixture.error);
    fetchMock.mock.restore();
  }
});

test("timeouts and network errors propagate instead of returning fallback content", async (t) => {
  configureWebhook(t);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Timed out", "TimeoutError");
  });
  await assert.rejects(fetchBlogN8nText("Umzug", 1_000), /Zeitlimit überschritten/);
  fetchMock.mock.restore();
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Network unavailable");
  });
  await assert.rejects(fetchBlogN8nText("Umzug", 1_000), /Network unavailable/);
});

test("responses at the exact content and response limits are accepted", async (t) => {
  configureWebhook(t);
  const maximumText = "a".repeat(120_000);
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ output: maximumText }),
  );
  assert.equal(await fetchBlogN8nText("Umzug", 1_000), maximumText);
  fetchMock.mock.restore();

  const payload = { output: "Artikeltext", padding: "" };
  payload.padding = "a".repeat(500_000 - JSON.stringify(payload).length);
  const body = JSON.stringify(payload);
  assert.equal(body.length, 500_000);
  t.mock.method(globalThis, "fetch", async () =>
    new Response(body, { headers: { "content-type": "application/json" } }),
  );
  assert.equal(await fetchBlogN8nText("Umzug", 1_000), "Artikeltext");
});
