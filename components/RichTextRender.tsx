"use client";
import type { ReactNode } from "react";
import { useMemo } from "react";
import "draft-js/dist/Draft.css";

interface RawStyleRange {
  offset: number;
  length: number;
  style: "BOLD" | "ITALIC" | "UNDERLINE" | string;
}

interface RawBlock {
  key: string;
  text: string;
  type: string;
  inlineStyleRanges?: RawStyleRange[];
}

function renderStyledText(block: RawBlock) {
  const text = block.text || "";
  const ranges = block.inlineStyleRanges || [];
  const boundaries = new Set([0, text.length]);

  ranges.forEach((range) => {
    boundaries.add(Math.max(0, Math.min(text.length, range.offset)));
    boundaries.add(
      Math.max(0, Math.min(text.length, range.offset + range.length))
    );
  });

  const points = Array.from(boundaries).sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    let node: ReactNode = text.slice(start, end);
    const styles = ranges
      .filter((range) => start >= range.offset && start < range.offset + range.length)
      .map((range) => range.style);

    if (styles.includes("UNDERLINE")) node = <u>{node}</u>;
    if (styles.includes("ITALIC")) node = <em>{node}</em>;
    if (styles.includes("BOLD")) node = <strong>{node}</strong>;
    return <span key={`${block.key}-${start}`}>{node}</span>;
  });
}

export function RichTextRender({ value }: { value?: string }) {
  const blocks = useMemo<RawBlock[]>(() => {
    if (!value) return [];
    try {
      const raw = JSON.parse(value) as { blocks?: RawBlock[] };
      return raw.blocks || [];
    } catch {
      return [];
    }
  }, [value]);

  if (!blocks.length) return null;

  const content: ReactNode[] = [];
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const isList =
      block.type === "unordered-list-item" || block.type === "ordered-list-item";

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
        <ListTag
          key={`list-${block.key}`}
          className={`mb-4 space-y-1 pl-6 ${ListTag === "ol" ? "list-decimal" : "list-disc"}`}>
          {listItems.map((item) => (
            <li key={item.key}>{renderStyledText(item)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    switch (block.type) {
      case "header-one":
        content.push(<h2 key={block.key} className='mb-3 mt-6 text-2xl font-bold'>{renderStyledText(block)}</h2>);
        break;
      case "header-two":
        content.push(<h3 key={block.key} className='mb-2 mt-5 text-xl font-bold'>{renderStyledText(block)}</h3>);
        break;
      case "header-three":
        content.push(<h4 key={block.key} className='mb-2 mt-4 text-lg font-semibold'>{renderStyledText(block)}</h4>);
        break;
      case "blockquote":
        content.push(<blockquote key={block.key} className='my-4 border-l-4 pl-4 italic opacity-80'>{renderStyledText(block)}</blockquote>);
        break;
      default:
        content.push(<p key={block.key} className='mb-4 leading-7'>{renderStyledText(block)}</p>);
    }
  }

  return (
    <div className='max-w-none text-inherit'>
      {content}
    </div>
  );
}
