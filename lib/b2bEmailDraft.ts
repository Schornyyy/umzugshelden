type DraftRange = {
  offset: number;
  length: number;
  style?: string;
  key?: number;
};

type DraftBlock = {
  key: string;
  text: string;
  type: string;
  depth: number;
  inlineStyleRanges: DraftRange[];
  entityRanges: DraftRange[];
  data: Record<string, never>;
};

type DraftEntity = {
  type: "LINK";
  mutability: "MUTABLE";
  data: { url: string };
};

const DEFAULT_SIGNATURE_MARKDOWN = [
  "Viele Grüße",
  "",
  "Lukas Schornstein",
  "+49 151 68567708",
  "[Umzugshelden.io](https://www.umzugshelden.io)",
  "[info@umzugshelden.io](mailto:info@umzugshelden.io)",
].join("\n");

const INLINE_PATTERNS = [
  { expression: /^\[([^\]]+)\]\(([^)\s]+)\)/, style: "", link: true },
  { expression: /^\*\*(.+?)\*\*/, style: "BOLD" },
  { expression: /^__(.+?)__/, style: "BOLD" },
  { expression: /^~~(.+?)~~/, style: "STRIKETHROUGH" },
  { expression: /^`([^`]+)`/, style: "CODE" },
  { expression: /^\*([^*\n]+)\*/, style: "ITALIC" },
  { expression: /^_([^_\n]+)_/, style: "ITALIC" },
] as const;

function isSafeLink(url: string) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

function parseInline(
  markdown: string,
  entityMap: Record<string, DraftEntity>,
): Pick<DraftBlock, "text" | "inlineStyleRanges" | "entityRanges"> {
  let text = "";
  const inlineStyleRanges: DraftRange[] = [];
  const entityRanges: DraftRange[] = [];

  for (let index = 0; index < markdown.length; ) {
    const remaining = markdown.slice(index);
    const pattern = INLINE_PATTERNS.find(({ expression }) =>
      expression.test(remaining),
    );
    const match = pattern?.expression.exec(remaining);
    if (!pattern || !match) {
      text += markdown[index];
      index += 1;
      continue;
    }

    const content = match[1];
    const offset = text.length;
    const parsed = parseInline(content, entityMap);
    text += parsed.text;
    inlineStyleRanges.push(
      ...parsed.inlineStyleRanges.map((range) => ({
        ...range,
        offset: range.offset + offset,
      })),
    );
    entityRanges.push(
      ...parsed.entityRanges.map((range) => ({
        ...range,
        offset: range.offset + offset,
      })),
    );

    if (pattern.style && parsed.text.length) {
      inlineStyleRanges.push({
        offset,
        length: parsed.text.length,
        style: pattern.style,
      });
    }
    const url = "link" in pattern && pattern.link ? match[2] : "";
    if (url && isSafeLink(url) && parsed.text.length) {
      const key = Object.keys(entityMap).length;
      entityMap[String(key)] = {
        type: "LINK",
        mutability: "MUTABLE",
        data: { url },
      };
      entityRanges.push({ offset, length: parsed.text.length, key });
    }
    index += match[0].length;
  }

  return { text, inlineStyleRanges, entityRanges };
}

function createBlock(
  markdown: string,
  type: string,
  key: number,
  entityMap: Record<string, DraftEntity>,
): DraftBlock {
  return {
    key: `md${key}`,
    ...parseInline(markdown, entityMap),
    type,
    depth: 0,
    data: {},
  };
}

export function markdownEmailDraft(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  const content = [normalized, DEFAULT_SIGNATURE_MARKDOWN]
    .filter(Boolean)
    .join("\n\n");
  const entityMap: Record<string, DraftEntity> = {};
  const blocks: DraftBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      createBlock(paragraph.join("\n"), "unstyled", blocks.length, entityMap),
    );
    paragraph = [];
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    const unorderedItem = /^\s*[-*+]\s+(.+)$/.exec(line);
    const orderedItem = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    const quote = /^\s*>\s?(.+)$/.exec(line);
    if (heading || unorderedItem || orderedItem || quote) {
      flushParagraph();
      const value = heading?.[2] ?? unorderedItem?.[1] ?? orderedItem?.[1] ?? quote?.[1] ?? "";
      const type = heading
        ? `header-${["one", "two", "three", "four"][heading[1].length - 1]}`
        : unorderedItem
          ? "unordered-list-item"
          : orderedItem
            ? "ordered-list-item"
            : "blockquote";
      blocks.push(createBlock(value, type, blocks.length, entityMap));
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();

  return JSON.stringify({ blocks, entityMap });
}

export function defaultEmailDraft() {
  return markdownEmailDraft("");
}

export function parseGeneratedEmailMarkdown(output: string) {
  const normalized = output
    .replace(/\r\n?/g, "\n")
    .replace(/^```(?:markdown|md|text)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  const lines = normalized.split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const inlineSubject =
    /^(?:#{1,3}\s*)?(?:\*\*)?(?:Betreff|Subject)\s*(?::|–|-)(?:\*\*)?\s*(.+)$/i.exec(
      firstLine,
    );
  const subjectHeading =
    /^(?:#{1,3}\s*)?(?:\*\*)?(?:Betreff|Subject)(?:\*\*)?\s*:?\s*$/i.test(
      firstLine,
    );
  const subjectLineIndex = subjectHeading
    ? lines.findIndex((line, index) => index > 0 && Boolean(line.trim()))
    : -1;
  const subject = (
    inlineSubject?.[1] ??
    (subjectLineIndex > 0 ? lines[subjectLineIndex] : "")
  )
    .replace(/^\s*(?:#{1,3}\s*)?(?:\*\*)?/, "")
    .replace(/(?:\*\*)?\s*$/, "")
    .trim();
  if (!subject) {
    throw new Error("Die n8n-Antwort enthält keinen gültigen Betreff.");
  }
  const bodyStartIndex = subjectHeading ? subjectLineIndex + 1 : 1;
  const body = lines
    .slice(bodyStartIndex)
    .join("\n")
    .replace(
      /^\s*(?:---EMAIL---|#{1,3}\s+(?:E-Mail(?:-Text)?|Nachricht))\s*:?\s*/i,
      "",
    )
    .trim();
  if (!subject || !body) {
    throw new Error("Die n8n-Antwort enthält keinen vollständigen E-Mail-Entwurf.");
  }
  return { subject, body };
}
