import type { CSSProperties, ReactNode } from "react";

interface RawStyleRange {
  offset: number;
  length: number;
  style: string;
}

interface RawEntityRange {
  offset: number;
  length: number;
  key: number;
}

interface RawBlock {
  key: string;
  text: string;
  type: string;
  inlineStyleRanges?: RawStyleRange[];
  entityRanges?: RawEntityRange[];
}

interface RawEntity {
  type: string;
  data?: { url?: string };
}

function safeHref(value?: string) {
  if (!value) return null;
  return value.startsWith("/") || /^(https?:|mailto:|tel:)/i.test(value) ? value : null;
}

function renderStyledText(block: RawBlock, entityMap: Record<string, RawEntity>) {
  const text = block.text || "";
  const styleRanges = block.inlineStyleRanges || [];
  const entityRanges = block.entityRanges || [];
  const boundaries = new Set([0, text.length]);

  [...styleRanges, ...entityRanges].forEach((range) => {
    boundaries.add(Math.max(0, Math.min(text.length, range.offset)));
    boundaries.add(Math.max(0, Math.min(text.length, range.offset + range.length)));
  });

  const points = Array.from(boundaries).sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const styles = styleRanges
      .filter((range) => start >= range.offset && start < range.offset + range.length)
      .map((range) => range.style);
    const css: CSSProperties = {};
    styles.forEach((style) => {
      if (style.startsWith("COLOR-")) css.color = style.slice(6);
      if (style.startsWith("FONT_SIZE-")) css.fontSize = `${style.slice(10)}px`;
    });

    let node: ReactNode = <span style={css}>{text.slice(start, end)}</span>;
    if (styles.includes("CODE")) node = <code className='rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]'>{node}</code>;
    if (styles.includes("STRIKETHROUGH")) node = <s>{node}</s>;
    if (styles.includes("UNDERLINE")) node = <u>{node}</u>;
    if (styles.includes("ITALIC")) node = <em>{node}</em>;
    if (styles.includes("BOLD")) node = <strong>{node}</strong>;

    const entityRange = entityRanges.find(
      (range) => start >= range.offset && start < range.offset + range.length,
    );
    const entity = entityRange ? entityMap[String(entityRange.key)] : undefined;
    const href = entity?.type === "LINK" ? safeHref(entity.data?.url) : null;
    if (href) {
      node = (
        <a
          href={href}
          className='font-medium underline underline-offset-2'
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
          {node}
        </a>
      );
    }
    return <span key={`${block.key}-${start}`}>{node}</span>;
  });
}

export function RichTextRender({ value }: { value?: string }) {
  if (!value) return null;

  let blocks: RawBlock[] = [];
  let entityMap: Record<string, RawEntity> = {};
  try {
    const raw = JSON.parse(value) as {
      blocks?: RawBlock[];
      entityMap?: Record<string, RawEntity>;
    };
    blocks = raw.blocks || [];
    entityMap = raw.entityMap || {};
  } catch {
    return <p className='italic opacity-70'>Inhalt konnte nicht geladen werden.</p>;
  }

  if (!blocks.length) return null;
  const content: ReactNode[] = [];

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const isList = block.type === "unordered-list-item" || block.type === "ordered-list-item";
    if (isList) {
      const listType = block.type;
      const listItems: RawBlock[] = [];
      while (index < blocks.length && blocks[index].type === listType) {
        listItems.push(blocks[index]);
        index++;
      }
      index--;
      const ListTag = listType === "ordered-list-item" ? "ol" : "ul";
      content.push(
        <ListTag key={`list-${block.key}`} className={`mb-4 space-y-1 pl-6 ${ListTag === "ol" ? "list-decimal" : "list-disc"}`}>
          {listItems.map((item) => <li key={item.key}>{renderStyledText(item, entityMap)}</li>)}
        </ListTag>,
      );
      continue;
    }

    const children = renderStyledText(block, entityMap);
    switch (block.type) {
      case "header-one":
        content.push(<h2 key={block.key} className='mb-3 mt-7 text-3xl font-bold'>{children}</h2>);
        break;
      case "header-two":
        content.push(<h3 key={block.key} className='mb-3 mt-6 text-2xl font-bold'>{children}</h3>);
        break;
      case "header-three":
        content.push(<h4 key={block.key} className='mb-2 mt-5 text-xl font-semibold'>{children}</h4>);
        break;
      case "header-four":
        content.push(<h5 key={block.key} className='mb-2 mt-4 text-lg font-semibold'>{children}</h5>);
        break;
      case "blockquote":
        content.push(<blockquote key={block.key} className='my-5 border-l-4 pl-4 text-lg italic opacity-80'>{children}</blockquote>);
        break;
      case "code-block":
        content.push(<pre key={block.key} className='mb-4 overflow-x-auto rounded bg-slate-950 p-4 text-sm text-slate-100'><code>{block.text}</code></pre>);
        break;
      default:
        content.push(<p key={block.key} className='mb-4 leading-7'>{children}</p>);
    }
  }

  return <div className='max-w-none text-inherit'>{content}</div>;
}
