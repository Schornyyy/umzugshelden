import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultEmailDraft,
  markdownEmailDraft,
  parseGeneratedEmailMarkdown,
} from "./b2bEmailDraft";

test("default draft contains the complete B2B signature", () => {
  const draft = JSON.parse(defaultEmailDraft()) as {
    blocks: Array<{ text: string }>;
  };
  const text = draft.blocks.map((block) => block.text).join("\n");
  assert.match(text, /Lukas Schornstein/);
  assert.match(text, /\+49 151 68567708/);
  assert.match(text, /Umzugshelden\.io/);
  assert.match(text, /info@umzugshelden\.io/);
});

test("markdown draft renders formatting and appends the signature", () => {
  const draft = JSON.parse(
    markdownEmailDraft("Guten Tag,\n\n**verlässliche Unterstützung** für Sie."),
  ) as {
    blocks: Array<{
      text: string;
      inlineStyleRanges: Array<{ style: string }>;
    }>;
  };
  assert.equal(draft.blocks[1].text, "verlässliche Unterstützung für Sie.");
  assert.equal(draft.blocks[1].inlineStyleRanges[0]?.style, "BOLD");
  assert.equal(
    draft.blocks.filter((block) => block.text === "Lukas Schornstein").length,
    1,
  );
});

test("n8n markdown response is split into subject and body", () => {
  assert.deepEqual(
    parseGeneratedEmailMarkdown(
      "Betreff: Kooperation bei Mieterwechseln\n---EMAIL---\nGuten Tag,\n\n**Dürfen wir uns austauschen?**",
    ),
    {
      subject: "Kooperation bei Mieterwechseln",
      body: "Guten Tag,\n\n**Dürfen wir uns austauschen?**",
    },
  );
});

test("n8n markdown headings and code fences are accepted", () => {
  assert.deepEqual(
    parseGeneratedEmailMarkdown(
      "```markdown\n## Betreff\nKooperation bei Mieterwechseln\n\n## E-Mail-Text\nGuten Tag,\n\n**Kurzer Text**\n```",
    ),
    {
      subject: "Kooperation bei Mieterwechseln",
      body: "Guten Tag,\n\n**Kurzer Text**",
    },
  );
});

test("n8n response without a subject fails explicitly", () => {
  assert.throws(
    () => parseGeneratedEmailMarkdown("Guten Tag,\n\nText"),
    /keinen gültigen Betreff/,
  );
});
