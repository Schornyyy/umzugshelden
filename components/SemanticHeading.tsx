import type { ReactNode } from "react";

type SemanticHeadingProps = {
  level?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
};

export default function SemanticHeading({
  level = 2,
  className,
  children,
}: SemanticHeadingProps) {
  const HeadingTag = `h${level}` as "h2" | "h3" | "h4";

  return <HeadingTag className={className}>{children}</HeadingTag>;
}