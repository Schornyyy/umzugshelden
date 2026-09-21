"use client";

import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";
import { SimpleRichTextEditor } from "@/components/RichTextEditor";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { createBlogBlock } from "@/lib/blogBuilder";
import type {
  BlogBlockStyle,
  BlogBlockType,
  BlogPageBlock,
} from "@/types/blog/BlogPage";
import { Reorder } from "framer-motion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BetweenHorizontalStart,
  Copy,
  GripVertical,
  Heading2,
  ImageIcon,
  Minus,
  MousePointerClick,
  Pilcrow,
  Quote,
  Rows3,
  Trash2,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

interface BlogVisualBuilderProps {
  blocks: BlogPageBlock[];
  accentColor: string;
  headingColor: string;
  onChange: (blocks: BlogPageBlock[]) => void;
}

interface BlockLibraryItem {
  type: BlogBlockType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const BLOCK_LIBRARY: BlockLibraryItem[] = [
  { type: "heading", label: "Überschrift", description: "H2 bis H4", icon: Heading2 },
  { type: "richText", label: "Text", description: "Formatierter Inhalt", icon: Pilcrow },
  { type: "image", label: "Bild", description: "Bild und Bildtext", icon: ImageIcon },
  { type: "imageText", label: "Bild + Text", description: "Zweispaltige Sektion", icon: Rows3 },
  { type: "quote", label: "Zitat", description: "Zitat mit Quelle", icon: Quote },
  { type: "button", label: "Button", description: "Interner oder externer Link", icon: MousePointerClick },
  { type: "divider", label: "Trennlinie", description: "Inhalte gliedern", icon: Minus },
  { type: "spacer", label: "Abstand", description: "Vertikaler Freiraum", icon: BetweenHorizontalStart },
];

const INPUT_CLASS =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-slate-600";

function blockLabel(type: BlogBlockType) {
  return BLOCK_LIBRARY.find((item) => item.type === type)?.label || type;
}

function BlockInspector({
  block,
  onChange,
}: {
  block: BlogPageBlock;
  onChange: (patch: Partial<BlogPageBlock>) => void;
}) {
  const updateStyle = (patch: Partial<BlogBlockStyle>) =>
    onChange({ style: { ...block.style, ...patch } });

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-xs font-semibold uppercase text-slate-400'>Element</p>
        <h3 className='mt-1 font-semibold text-slate-900'>{blockLabel(block.type)}</h3>
      </div>

      <div className='space-y-4'>
        {block.type === "heading" && (
          <>
            <label>
              <span className={LABEL_CLASS}>Überschrift</span>
              <input
                className={INPUT_CLASS}
                value={block.heading || ""}
                onChange={(event) => onChange({ heading: event.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Ebene</span>
              <select
                className={INPUT_CLASS}
                value={block.headingLevel || 2}
                onChange={(event) =>
                  onChange({ headingLevel: Number(event.target.value) as 2 | 3 | 4 })
                }>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
              </select>
            </label>
          </>
        )}

        {(block.type === "richText" || block.type === "imageText") && (
          <div>
            {block.type === "imageText" && (
              <label className='mb-4 block'>
                <span className={LABEL_CLASS}>Überschrift</span>
                <input
                  className={INPUT_CLASS}
                  value={block.heading || ""}
                  onChange={(event) => onChange({ heading: event.target.value })}
                />
              </label>
            )}
            <span className={LABEL_CLASS}>Inhalt</span>
            <SimpleRichTextEditor
              key={block.id}
              value={block.content || ""}
              onChange={(content) => onChange({ content })}
            />
          </div>
        )}

        {(block.type === "image" || block.type === "imageText") && (
          <div className='space-y-4'>
            <div>
              <span className={LABEL_CLASS}>Bild</span>
              <div className='flex items-center gap-2'>
                <MediathekDialog
                  btnName={block.imageUrl ? "Bild ändern" : "Bild wählen"}
                  onSelect={(selection) => {
                    const imageUrl = Array.isArray(selection) ? selection[0] : selection;
                    if (imageUrl) onChange({ imageUrl });
                  }}
                />
                {block.imageUrl && (
                  <button
                    type='button'
                    className='text-xs text-red-600'
                    onClick={() => onChange({ imageUrl: undefined })}>
                    Entfernen
                  </button>
                )}
              </div>
            </div>
            <label>
              <span className={LABEL_CLASS}>Alternativtext</span>
              <input
                className={INPUT_CLASS}
                value={block.imageAlt || ""}
                onChange={(event) => onChange({ imageAlt: event.target.value })}
              />
            </label>
            {block.type === "image" && (
              <label>
                <span className={LABEL_CLASS}>Bildunterschrift</span>
                <input
                  className={INPUT_CLASS}
                  value={block.caption || ""}
                  onChange={(event) => onChange({ caption: event.target.value })}
                />
              </label>
            )}
            {block.type === "imageText" && (
              <label>
                <span className={LABEL_CLASS}>Bildposition</span>
                <select
                  className={INPUT_CLASS}
                  value={block.imagePosition || "left"}
                  onChange={(event) =>
                    onChange({ imagePosition: event.target.value as "left" | "right" })
                  }>
                  <option value='left'>Links</option>
                  <option value='right'>Rechts</option>
                </select>
              </label>
            )}
          </div>
        )}

        {block.type === "quote" && (
          <>
            <label>
              <span className={LABEL_CLASS}>Zitat</span>
              <textarea
                rows={5}
                className={INPUT_CLASS}
                value={block.quote || ""}
                onChange={(event) => onChange({ quote: event.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Quelle</span>
              <input
                className={INPUT_CLASS}
                value={block.attribution || ""}
                onChange={(event) => onChange({ attribution: event.target.value })}
              />
            </label>
          </>
        )}

        {(block.type === "button" || block.type === "imageText") && (
          <div className='space-y-4'>
            <label>
              <span className={LABEL_CLASS}>Button-Text</span>
              <input
                className={INPUT_CLASS}
                value={block.buttonLabel || ""}
                onChange={(event) => onChange({ buttonLabel: event.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Link</span>
              <input
                className={INPUT_CLASS}
                value={block.buttonUrl || ""}
                placeholder='/kontakt oder https://...'
                onChange={(event) =>
                  onChange({ buttonUrl: event.target.value || undefined })
                }
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Button-Stil</span>
              <select
                className={INPUT_CLASS}
                value={block.buttonStyle || "primary"}
                onChange={(event) =>
                  onChange({
                    buttonStyle: event.target.value as BlogPageBlock["buttonStyle"],
                  })
                }>
                <option value='primary'>Primär</option>
                <option value='secondary'>Sekundär</option>
                <option value='outline'>Kontur</option>
              </select>
            </label>
          </div>
        )}

        {block.type === "spacer" && (
          <label>
            <span className={LABEL_CLASS}>Höhe: {block.spacerHeight || 48}px</span>
            <input
              className='w-full accent-slate-900'
              type='range'
              min={8}
              max={240}
              step={8}
              value={block.spacerHeight || 48}
              onChange={(event) => onChange({ spacerHeight: Number(event.target.value) })}
            />
          </label>
        )}
      </div>

      {block.type !== "spacer" && (
        <div className='space-y-4 border-t border-slate-200 pt-5'>
          <p className='text-xs font-semibold uppercase text-slate-400'>Design</p>
          <div>
            <span className={LABEL_CLASS}>Ausrichtung</span>
            <div className='grid grid-cols-3 overflow-hidden rounded border border-slate-300'>
              {([
                ["left", AlignLeft, "Linksbündig"],
                ["center", AlignCenter, "Zentriert"],
                ["right", AlignRight, "Rechtsbündig"],
              ] as const).map(([value, Icon, title]) => (
                <button
                  key={value}
                  type='button'
                  title={title}
                  aria-label={title}
                  onClick={() => updateStyle({ alignment: value })}
                  className={`flex h-9 items-center justify-center border-r last:border-r-0 ${
                    (block.style?.alignment || "left") === value
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600"
                  }`}>
                  <Icon className='h-4 w-4' />
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className={LABEL_CLASS}>Breite</span>
            <select
              className={INPUT_CLASS}
              value={block.style?.width || "normal"}
              onChange={(event) =>
                updateStyle({ width: event.target.value as BlogBlockStyle["width"] })
              }>
              <option value='narrow'>Schmal</option>
              <option value='normal'>Normal</option>
              <option value='wide'>Breit</option>
              <option value='full'>Volle Breite</option>
            </select>
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <label>
              <span className={LABEL_CLASS}>Innenabstand</span>
              <select
                className={INPUT_CLASS}
                value={block.style?.padding || "medium"}
                onChange={(event) =>
                  updateStyle({ padding: event.target.value as BlogBlockStyle["padding"] })
                }>
                <option value='none'>Keiner</option>
                <option value='small'>Klein</option>
                <option value='medium'>Mittel</option>
                <option value='large'>Groß</option>
              </select>
            </label>
            <label>
              <span className={LABEL_CLASS}>Ecken</span>
              <select
                className={INPUT_CLASS}
                value={block.style?.borderRadius || "none"}
                onChange={(event) =>
                  updateStyle({
                    borderRadius: event.target.value as BlogBlockStyle["borderRadius"],
                  })
                }>
                <option value='none'>Eckig</option>
                <option value='small'>Klein</option>
                <option value='medium'>Mittel</option>
                <option value='large'>Groß</option>
              </select>
            </label>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <label>
              <span className={LABEL_CLASS}>Hintergrund</span>
              <input
                type='color'
                className='h-10 w-full cursor-pointer rounded border border-slate-300 bg-white p-1'
                value={block.style?.backgroundColor || "#ffffff"}
                onChange={(event) => updateStyle({ backgroundColor: event.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Textfarbe</span>
              <input
                type='color'
                className='h-10 w-full cursor-pointer rounded border border-slate-300 bg-white p-1'
                value={block.style?.textColor || "#334155"}
                onChange={(event) => updateStyle({ textColor: event.target.value })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogVisualBuilder({
  blocks,
  accentColor,
  headingColor,
  onChange,
}: BlogVisualBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id || null);
  const selectedBlock = blocks.find((block) => block.id === selectedId) || null;

  const addBlock = (type: BlogBlockType) => {
    const block = createBlogBlock(type);
    onChange([...blocks, block]);
    setSelectedId(block.id);
  };

  const updateBlock = (id: string, patch: Partial<BlogPageBlock>) => {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const duplicateBlock = (block: BlogPageBlock) => {
    const duplicate = { ...block, id: createBlogBlock(block.type).id };
    const index = blocks.findIndex((item) => item.id === block.id);
    const next = [...blocks];
    next.splice(index + 1, 0, duplicate);
    onChange(next);
    setSelectedId(duplicate.id);
  };

  const removeBlock = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    const next = blocks.filter((block) => block.id !== id);
    onChange(next);
    if (selectedId === id) {
      setSelectedId(next[Math.max(0, index - 1)]?.id || null);
    }
  };

  return (
    <div className='grid min-h-[680px] overflow-hidden rounded-md border border-slate-200 bg-slate-100 xl:grid-cols-[210px_minmax(0,1fr)_340px]'>
      <aside className='border-b border-slate-200 bg-white p-4 xl:border-b-0 xl:border-r'>
        <h2 className='text-sm font-semibold text-slate-900'>Elemente</h2>
        <div className='mt-4 grid grid-cols-2 gap-2 xl:grid-cols-1'>
          {BLOCK_LIBRARY.map((item) => (
            <button
              key={item.type}
              type='button'
              onClick={() => addBlock(item.type)}
              className='flex min-h-16 items-center gap-3 rounded border border-slate-200 bg-white p-3 text-left hover:border-slate-400 hover:bg-slate-50'>
              <item.icon className='h-5 w-5 shrink-0 text-slate-600' />
              <span className='min-w-0'>
                <span className='block text-sm font-medium text-slate-800'>{item.label}</span>
                <span className='block text-[11px] leading-4 text-slate-500'>{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className='min-w-0 p-3 sm:p-6'>
        <div className='mx-auto max-w-5xl overflow-hidden border border-slate-200 bg-white shadow-sm'>
          {blocks.length === 0 ? (
            <div className='flex min-h-[420px] flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 text-center'>
              <Rows3 className='h-8 w-8 text-slate-300' />
              <p className='mt-3 text-sm font-medium text-slate-700'>Noch keine Inhalte</p>
              <p className='mt-1 max-w-xs text-xs text-slate-500'>Wähle links ein Element aus und baue den Beitrag Block für Block auf.</p>
            </div>
          ) : (
            <Reorder.Group axis='y' values={blocks} onReorder={onChange} className='divide-y divide-slate-100'>
              {blocks.map((block) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  onClick={() => setSelectedId(block.id)}
                  className={`group relative cursor-pointer bg-white outline-none ${
                    selectedId === block.id ? "ring-2 ring-inset ring-emerald-500" : "hover:ring-1 hover:ring-inset hover:ring-slate-300"
                  }`}>
                  <div className='absolute right-2 top-2 z-10 flex items-center overflow-hidden rounded border border-slate-200 bg-white opacity-100 shadow-sm xl:opacity-0 xl:group-hover:opacity-100'>
                    <span className='flex h-8 w-8 cursor-grab items-center justify-center text-slate-400' title='Verschieben'>
                      <GripVertical className='h-4 w-4' />
                    </span>
                    <button
                      type='button'
                      title='Duplizieren'
                      aria-label='Block duplizieren'
                      className='flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-100'
                      onClick={(event) => {
                        event.stopPropagation();
                        duplicateBlock(block);
                      }}>
                      <Copy className='h-4 w-4' />
                    </button>
                    <button
                      type='button'
                      title='Löschen'
                      aria-label='Block löschen'
                      className='flex h-8 w-8 items-center justify-center text-red-600 hover:bg-red-50'
                      onClick={(event) => {
                        event.stopPropagation();
                        removeBlock(block.id);
                      }}>
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                  <div className='pointer-events-none'>
                    <BlogBlockRenderer
                      block={block}
                      accentColor={accentColor}
                      headingColor={headingColor}
                    />
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </main>

      <aside className='border-t border-slate-200 bg-white p-5 xl:border-l xl:border-t-0'>
        {selectedBlock ? (
          <BlockInspector
            block={selectedBlock}
            onChange={(patch) => updateBlock(selectedBlock.id, patch)}
          />
        ) : (
          <div className='py-12 text-center text-sm text-slate-500'>Wähle einen Block aus, um ihn zu bearbeiten.</div>
        )}
      </aside>
    </div>
  );
}
