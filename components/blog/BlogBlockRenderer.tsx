"use client";

import { RichTextRender } from "@/components/RichTextRender";
import type { BlogPageBlock } from "@/types/blog/BlogPage";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const widthClasses = {
  narrow: "max-w-2xl",
  normal: "max-w-4xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

const paddingClasses = {
  none: "py-0 px-0",
  small: "py-3 px-3",
  medium: "py-6 px-4 sm:px-6",
  large: "py-10 px-5 sm:px-10",
};

const radiusClasses = {
  none: "rounded-none",
  small: "rounded",
  medium: "rounded-md",
  large: "rounded-lg",
};

function BlockFrame({
  block,
  children,
}: {
  block: BlogPageBlock;
  children: ReactNode;
}) {
  const style = block.style;
  const inlineStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor,
    color: style?.textColor,
    textAlign: style?.alignment,
  };

  return (
    <section
      className={`mx-auto w-full ${widthClasses[style?.width || "normal"]} ${
        paddingClasses[style?.padding || "medium"]
      } ${radiusClasses[style?.borderRadius || "none"]}`}
      style={inlineStyle}>
      {children}
    </section>
  );
}

function Heading({
  block,
  headingColor,
}: {
  block: BlogPageBlock;
  headingColor?: string;
}) {
  const className = "font-bold leading-tight";
  const style = { color: block.style?.textColor || headingColor };
  if (block.headingLevel === 4) {
    return <h4 className={`${className} text-xl`} style={style}>{block.heading}</h4>;
  }
  if (block.headingLevel === 3) {
    return <h3 className={`${className} text-2xl`} style={style}>{block.heading}</h3>;
  }
  return <h2 className={`${className} text-3xl`} style={style}>{block.heading}</h2>;
}

function BlockImage({ block }: { block: BlogPageBlock }) {
  if (!block.imageUrl) {
    return (
      <div className='flex aspect-video items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400'>
        Kein Bild ausgewählt
      </div>
    );
  }

  return (
    <figure className='space-y-2'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt={block.imageAlt || ""}
        className='h-auto max-h-[720px] w-full object-cover'
      />
      {block.caption && (
        <figcaption className='text-center text-xs opacity-70'>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function BlockButton({
  block,
  accentColor,
}: {
  block: BlogPageBlock;
  accentColor: string;
}) {
  const isOutline = block.buttonStyle === "outline";
  const isSecondary = block.buttonStyle === "secondary";
  const style: CSSProperties = isOutline
    ? { borderColor: accentColor, color: accentColor }
    : isSecondary
      ? { backgroundColor: "#e2e8f0", color: "#0f172a" }
      : { backgroundColor: accentColor, color: "#ffffff" };

  return (
    <Link
      href={block.buttonUrl || "#"}
      className={`inline-flex min-h-11 items-center justify-center border px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 ${
        isOutline ? "bg-transparent" : "border-transparent"
      }`}
      style={style}>
      {block.buttonLabel || "Mehr erfahren"}
    </Link>
  );
}

export function BlogBlockRenderer({
  block,
  accentColor = "#16a34a",
  headingColor,
}: {
  block: BlogPageBlock;
  accentColor?: string;
  headingColor?: string;
}) {
  if (block.type === "spacer") {
    return <div aria-hidden='true' style={{ height: block.spacerHeight || 48 }} />;
  }

  return (
    <BlockFrame block={block}>
      {block.type === "heading" && <Heading block={block} headingColor={headingColor} />}
      {block.type === "richText" && <RichTextRender value={block.content} />}
      {block.type === "image" && <BlockImage block={block} />}
      {block.type === "imageText" && (
        <div
          className={`grid items-center gap-8 md:grid-cols-2 ${
            block.imagePosition === "right" ? "md:[&>figure]:order-2" : ""
          }`}>
          <BlockImage block={block} />
          <div className='space-y-4'>
            {block.heading && (
              <Heading
                block={{ ...block, headingLevel: 2 }}
                headingColor={headingColor}
              />
            )}
            <RichTextRender value={block.content} />
            {block.buttonUrl && (
              <BlockButton block={block} accentColor={accentColor} />
            )}
          </div>
        </div>
      )}
      {block.type === "quote" && (
        <blockquote
          className='border-l-4 py-2 pl-6 text-xl italic leading-relaxed'
          style={{ borderColor: accentColor }}>
          <p>{block.quote}</p>
          {block.attribution && (
            <footer className='mt-3 text-sm not-italic opacity-70'>
              {block.attribution}
            </footer>
          )}
        </blockquote>
      )}
      {block.type === "button" && (
        <BlockButton block={block} accentColor={accentColor} />
      )}
      {block.type === "divider" && (
        <hr className='border-0 border-t border-current opacity-20' />
      )}
    </BlockFrame>
  );
}

export function BlogBlocksRenderer({
  blocks,
  accentColor,
  headingColor,
}: {
  blocks: BlogPageBlock[];
  accentColor?: string;
  headingColor?: string;
}) {
  return (
    <div className='w-full'>
      {blocks.map((block) => (
        <BlogBlockRenderer
          key={block.id}
          block={block}
          accentColor={accentColor}
          headingColor={headingColor}
        />
      ))}
    </div>
  );
}
