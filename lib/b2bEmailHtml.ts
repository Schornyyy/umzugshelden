import "server-only";

type DraftRange = {
  offset: number;
  length: number;
  style?: string;
  key?: number;
};

type DraftBlock = {
  text?: string;
  type?: string;
  inlineStyleRanges?: DraftRange[];
  entityRanges?: DraftRange[];
};

type DraftEntity = {
  type?: string;
  data?: { url?: string };
};

type DraftContent = {
  blocks?: DraftBlock[];
  entityMap?: Record<string, DraftEntity>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeLink(value: string | undefined) {
  const url = value?.trim() ?? "";
  return /^(https?:|mailto:|tel:)/i.test(url) ? escapeHtml(url) : "";
}

function renderText(block: DraftBlock, entities: Record<string, DraftEntity>) {
  const text = block.text ?? "";
  const characters = Array.from(text, (character, index) => {
    const styles = (block.inlineStyleRanges ?? [])
      .filter((range) => index >= range.offset && index < range.offset + range.length)
      .map((range) => range.style ?? "")
      .filter(Boolean)
      .sort();
    const entityKey = (block.entityRanges ?? []).find(
      (range) => index >= range.offset && index < range.offset + range.length,
    )?.key;
    return { character, styles, entityKey };
  });

  const runs: Array<{
    text: string;
    styles: string[];
    entityKey?: number;
  }> = [];
  for (const character of characters) {
    const previous = runs.at(-1);
    if (
      previous &&
      previous.entityKey === character.entityKey &&
      previous.styles.join("|") === character.styles.join("|")
    ) {
      previous.text += character.character;
    } else {
      runs.push({
        text: character.character,
        styles: character.styles,
        entityKey: character.entityKey,
      });
    }
  }

  return runs
    .map((run) => {
      let html = escapeHtml(run.text).replaceAll("\n", "<br />");
      for (const style of run.styles) {
        if (style === "BOLD") html = `<strong>${html}</strong>`;
        if (style === "ITALIC") html = `<em>${html}</em>`;
        if (style === "UNDERLINE") html = `<u>${html}</u>`;
        if (style === "STRIKETHROUGH") html = `<s>${html}</s>`;
        if (style === "CODE") html = `<code>${html}</code>`;
        if (style.startsWith("COLOR-")) {
          const color = style.slice(6);
          if (/^#[0-9a-f]{6}$/i.test(color)) {
            html = `<span style="color:${color}">${html}</span>`;
          }
        }
        if (style.startsWith("FONT_SIZE-")) {
          const size = Number(style.slice(10));
          if (Number.isFinite(size) && size >= 10 && size <= 64) {
            html = `<span style="font-size:${size}px">${html}</span>`;
          }
        }
      }
      const entity = run.entityKey === undefined ? undefined : entities[String(run.entityKey)];
      const url = entity?.type === "LINK" ? safeLink(entity.data?.url) : "";
      return url ? `<a href="${url}">${html}</a>` : html;
    })
    .join("");
}

export function draftContentToEmailHtml(rawContent: string) {
  let content: DraftContent;
  try {
    content = JSON.parse(rawContent) as DraftContent;
  } catch (error) {
    throw new Error("Der E-Mail-Inhalt ist ungültig.", { cause: error });
  }

  if (!Array.isArray(content.blocks)) {
    throw new Error("Der E-Mail-Inhalt enthält keine Textblöcke.");
  }

  const entities = content.entityMap ?? {};
  const html: string[] = [];
  let listType = "";
  for (const block of content.blocks) {
    const type = block.type ?? "unstyled";
    const rendered = renderText(block, entities) || "<br />";
    const nextListType =
      type === "unordered-list-item"
        ? "ul"
        : type === "ordered-list-item"
          ? "ol"
          : "";

    if (listType && listType !== nextListType) {
      html.push(`</${listType}>`);
      listType = "";
    }
    if (nextListType) {
      if (!listType) {
        listType = nextListType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${rendered}</li>`);
      continue;
    }

    const tags: Record<string, string> = {
      "header-one": "h1",
      "header-two": "h2",
      "header-three": "h3",
      "header-four": "h4",
      blockquote: "blockquote",
      "code-block": "pre",
      unstyled: "p",
    };
    const tag = tags[type] ?? "p";
    html.push(`<${tag}>${rendered}</${tag}>`);
  }
  if (listType) html.push(`</${listType}>`);

  const result = html.join("");
  if (!result.replace(/<[^>]+>/g, "").trim()) {
    throw new Error("Bitte einen E-Mail-Text eingeben.");
  }
  return result;
}

