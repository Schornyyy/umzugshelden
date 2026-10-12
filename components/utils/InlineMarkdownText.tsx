import Link from "next/link";
import type { ReactNode } from "react";

export function renderInlineMarkdown(value: string): ReactNode {
  const normalizedValue = value
    .replace(/(^|\n)\s{0,3}#{1,6}\s+/gu, "$1")
    .replace(/\[([^\]\n]+)\](?!\()/gu, "$1");
  const parts = normalizedValue.split(
    /(\*\*[\s\S]+?\*\*|\[[^\]\n]+\]\((?:\/(?!\/)[^)\s]+|https:\/\/[^)\s]+)\))/gu,
  );
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const content = part.slice(2, -2);
      const boldLink = content.match(
        /^\[([^\]\n]+)\]\((\/(?!\/)[^)\s]+|https:\/\/[^)\s]+)\)$/u,
      );
      if (boldLink) {
        return (
          <strong key={index}>
            <Link
              href={boldLink[2]}
              className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
              {boldLink[1]}
            </Link>
          </strong>
        );
      }
      return <strong key={index}>{content}</strong>;
    }
    return /^\[[^\]\n]+\]\((?:\/(?!\/)[^)\s]+|https:\/\/[^)\s]+)\)$/u.test(part) ? (
      <Link
        key={index}
        href={part.slice(part.indexOf("](") + 2, -1)}
        className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
        {part.slice(1, part.indexOf("]("))}
      </Link>
    ) : (
      part
    );
  });
}
