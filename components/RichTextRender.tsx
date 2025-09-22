"use client";
import { convertFromRaw } from "draft-js";
import { useMemo } from "react";
import "draft-js/dist/Draft.css";

// Lightweight read-only renderer for stored Draft.js raw JSON
export function RichTextRender({ value }: { value?: string }) {
  const html = useMemo(() => {
    if (!value) return null;
    try {
      const raw = JSON.parse(value);
      const content = convertFromRaw(raw);
      const blocks = content.getBlocksAsArray();
      return blocks
        .map((b) => {
          const text = b.getText();
          const type = b.getType();
          if (type === "header-one") return `<h2>${escapeHtml(text)}</h2>`;
          if (type === "header-two") return `<h3>${escapeHtml(text)}</h3>`;
          if (type === "unordered-list-item")
            return `<li>${escapeHtml(text)}</li>`;
          if (type === "ordered-list-item")
            return `<li>${escapeHtml(text)}</li>`;
          return `<p>${escapeHtml(text)}</p>`;
        })
        .join("\n");
    } catch {
      return null;
    }
  }, [value]);

  if (!html) return null;
  // Very naive handling of list items: wrap consecutive lis later could be improved
  const wrapped = html.replace(
    /(?:\n)?(<li>.*?<\/li>)(?!\n<li>)/g,
    (m) => `<ul>${m}</ul>`
  );
  return (
    <div
      className='prose prose-slate max-w-none'
      dangerouslySetInnerHTML={{ __html: wrapped }}
    />
  );
}

function escapeHtml(str: string) {
  return str.replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ] as string)
  );
}
