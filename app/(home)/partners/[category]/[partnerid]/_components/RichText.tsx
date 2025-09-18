"use client";

import { convertFromRaw, Editor, EditorState } from "draft-js";
import React from "react";

function extractPlain(content?: string): string | null {
  if (!content) return null;
  try {
    const raw = JSON.parse(content);
    if (raw && Array.isArray(raw.blocks)) {
      return raw.blocks
        .map((b: { text?: string }) => b?.text ?? "")
        .join("\n\n")
        .trim();
    }
    return content;
  } catch {
    return content;
  }
}

function parseDraft(content?: string) {
  if (!content) return null;
  try {
    const raw = JSON.parse(content);
    const state = convertFromRaw(raw);
    return EditorState.createWithContent(state);
  } catch {
    return null;
  }
}

export default function RichText({ content }: { content?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const plain = React.useMemo(() => extractPlain(content), [content]);

  // Ensure server and first client render output match to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!content) return null;

  // On server and initial client render, show stable plain text
  if (!mounted) return plain ? <p>{plain}</p> : null;

  const editorState = parseDraft(content);
  // After mount: If it's valid Draft.js content, render read-only editor
  if (editorState)
    return (
      <Editor editorState={editorState} readOnly={true} onChange={() => {}} />
    );

  // Fallback: render plain text if content is not Draft.js JSON
  return plain ? <p>{plain}</p> : null;
}
