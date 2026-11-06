import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanArticleHtml,
  createOverlappingTextChunks,
} from "./blogResearchText";

test("article cleanup removes navigation, footer, menus and HTML tags", () => {
  const text = cleanArticleHtml(`
    <body>
      <nav>Navigation</nav>
      <main>
        <article><h1>Terrassenbau</h1><p>Der eigentliche Inhalt.</p></article>
      </main>
      <footer>Impressum</footer>
    </body>
  `);

  assert.equal(text, "Terrassenbau\nDer eigentliche Inhalt.");
  assert.doesNotMatch(text, /Navigation|Impressum|<[^>]+>/);
});

test("chunks are at most 700 characters and overlap", () => {
  const text = Array.from({ length: 250 }, (_, index) => `Wort${index}`).join(
    " ",
  );
  const chunks = createOverlappingTextChunks(text);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 700));
  const firstWords = new Set(chunks[0].split(" "));
  assert.ok(chunks[1].split(" ").some((word) => firstWords.has(word)));
});
