"use client";

import CityServiceLivePreview, {
  type BuilderViewport,
} from "@/components/admin/city/CityServiceLivePreview";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
  type CityServiceBlock,
  type CityServiceBlockStyle,
  type CityServiceBlockTone,
  type CityServiceBlockType,
  type CityServiceImageCardsBlock,
} from "@/types/city/CityServicePage";
import { Reorder } from "framer-motion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BadgeEuro,
  BadgeCheck,
  Blocks,
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  CirclePlay,
  Copy,
  EyeOff,
  GripVertical,
  ImageIcon,
  Images,
  Layers3,
  LayoutTemplate,
  ListChecks,
  ListCollapse,
  ListOrdered,
  MapPin,
  MapPinned,
  Maximize2,
  Megaphone,
  MessageSquareQuote,
  Minimize2,
  Monitor,
  PanelsTopLeft,
  Phone,
  Pilcrow,
  Plus,
  Redo2,
  RotateCcw,
  SeparatorHorizontal,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  blocks: CityServiceBlock[];
  onChange: (blocks: CityServiceBlock[]) => void;
  readOnly?: boolean;
  cityName?: string;
  citySlug?: string;
  serviceKey?: CityServiceKey;
  serviceName?: string;
  primaryKeyword?: string;
};

type LibraryItem = {
  type: CityServiceBlockType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const BLOCK_LIBRARY: LibraryItem[] = [
  { type: "hero", label: "Hero", description: "Titel, Bild und Anfrage", icon: LayoutTemplate },
  { type: "intro", label: "Einleitung", description: "Überschrift und Text", icon: Pilcrow },
  { type: "imageText", label: "Bild + Text", description: "Zweispaltiger Inhalt", icon: ImageIcon },
  { type: "cta", label: "CTA-Banner", description: "Handlungsaufruf mit Buttons", icon: Megaphone },
  { type: "stats", label: "Kennzahlen", description: "Zahlen und Leistungswerte", icon: ChartNoAxesColumnIncreasing },
  { type: "testimonials", label: "Bewertungen", description: "Kundenstimmen mit Sternen", icon: MessageSquareQuote },
  { type: "gallery", label: "Galerie", description: "Flexible Bildergalerie", icon: Images },
  { type: "carousel", label: "Karussell", description: "Bilder und Inhalte als Slider", icon: Images },
  { type: "imageCollage", label: "Bild-Collage", description: "Überlappende Bildkomposition", icon: Layers3 },
  { type: "beforeAfter", label: "Vorher/Nachher", description: "Interaktiver Bildvergleich", icon: PanelsTopLeft },
  { type: "imageCards", label: "Bildkarten", description: "Karten mit Bild und Link", icon: ImageIcon },
  { type: "team", label: "Team", description: "Personen und Ansprechpartner", icon: UsersRound },
  { type: "video", label: "Video", description: "Datei, YouTube oder Vimeo", icon: CirclePlay },
  { type: "logoCloud", label: "Logoleiste", description: "Partner und Zertifikate", icon: BadgeCheck },
  { type: "accordion", label: "Akkordeon", description: "Aufklappbare Informationen", icon: ListCollapse },
  { type: "spacer", label: "Abstand", description: "Freiraum oder Trennlinie", icon: SeparatorHorizontal },
  { type: "localArea", label: "Lokaler Bereich", description: "Region und nahe Orte", icon: MapPinned },
  { type: "cardGrid", label: "Kartenraster", description: "Leistungen und Fälle", icon: PanelsTopLeft },
  { type: "checkList", label: "Checkliste", description: "Vorteile und Hinweise", icon: ListChecks },
  { type: "process", label: "Ablauf", description: "Nummerierte Schritte", icon: ListOrdered },
  { type: "pricing", label: "Kosten", description: "Preisfaktoren und CTA", icon: BadgeEuro },
  { type: "faq", label: "FAQ", description: "Fragen und Antworten", icon: CircleHelp },
  { type: "contact", label: "Kontakt", description: "Kontaktdaten und Formular", icon: Phone },
  { type: "nearbyCities", label: "Städte im Umkreis", description: "Dynamische Stadtlinks", icon: MapPin },
  { type: "otherServices", label: "Weitere Services", description: "Dynamische Service-Links", icon: PanelsTopLeft },
  { type: "serviceCards", label: "Leistungskarten", description: "Dynamische Service-Karten", icon: PanelsTopLeft },
];

const INPUT_CLASS =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-slate-600";

function blockLabel(type: CityServiceBlockType) {
  return BLOCK_LIBRARY.find((item) => item.type === type)?.label || type;
}

function blockSummary(block: CityServiceBlock) {
  if ("heading" in block && block.heading) return block.heading;
  if (block.type === "hero") return block.title;
  return blockLabel(block.type);
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className='block'>
      <span className={LABEL_CLASS}>{label}</span>
      <input
        className={INPUT_CLASS}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MediaField({
  label,
  value,
  onChange,
  disabled,
  optional = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      {value && (
        <div className='relative mb-2 aspect-[16/9] overflow-hidden rounded border border-slate-200 bg-slate-100'>
          <Image src={value} alt='' fill sizes='340px' className='object-cover' />
        </div>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        {!disabled && (
          <MediathekDialog
            btnName={value ? "In Mediathek ändern" : "Aus Mediathek wählen"}
            onSelect={(selection) => {
              const image = Array.isArray(selection) ? selection[0] : selection;
              if (image) onChange(image);
            }}
          />
        )}
        {value && optional && !disabled && (
          <button
            type='button'
            onClick={() => onChange(undefined)}
            className='h-9 rounded border border-slate-300 px-3 text-xs font-medium text-red-600 hover:bg-red-50'>
            Entfernen
          </button>
        )}
      </div>
      {!value && disabled && (
        <p className='text-xs text-slate-400'>Kein Bild ausgewählt</p>
      )}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <label className='block'>
      <span className={LABEL_CLASS}>{label}</span>
      <textarea
        className={INPUT_CLASS}
        value={value}
        disabled={disabled}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className='flex items-center gap-2 text-sm text-slate-700'>
      <input
        type='checkbox'
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className='h-4 w-4 accent-emerald-600'
      />
      {label}
    </label>
  );
}

function StringListEditor({
  label,
  values,
  onChange,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <div className='space-y-2'>
        {values.map((value, index) => (
          <div key={index} className='flex items-start gap-2'>
            <textarea
              rows={2}
              className={INPUT_CLASS}
              value={value}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  values.map((entry, entryIndex) =>
                    entryIndex === index ? event.target.value : entry,
                  ),
                )
              }
            />
            <button
              type='button'
              title='Eintrag entfernen'
              aria-label='Eintrag entfernen'
              disabled={disabled || values.length <= 1}
              onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 text-red-600 disabled:opacity-30'>
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
      </div>
      <button
        type='button'
        disabled={disabled}
        onClick={() => onChange([...values, "Neuer Eintrag"])}
        className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-40'>
        <Plus className='h-3.5 w-3.5' />
        Eintrag
      </button>
    </div>
  );
}

function CardsEditor({
  values,
  onChange,
  disabled,
}: {
  values: { title: string; text: string }[];
  onChange: (values: { title: string; text: string }[]) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>Karten</span>
      <div className='space-y-4'>
        {values.map((value, index) => (
          <div key={index} className='border-l-2 border-slate-200 pl-3'>
            <div className='space-y-2'>
              <Field
                label={`Titel ${index + 1}`}
                value={value.title}
                disabled={disabled}
                onChange={(title) =>
                  onChange(
                    values.map((card, cardIndex) =>
                      cardIndex === index ? { ...card, title } : card,
                    ),
                  )
                }
              />
              <TextareaField
                label='Text'
                value={value.text}
                disabled={disabled}
                onChange={(text) =>
                  onChange(
                    values.map((card, cardIndex) =>
                      cardIndex === index ? { ...card, text } : card,
                    ),
                  )
                }
              />
            </div>
            <button
              type='button'
              disabled={disabled || values.length <= 1}
              onClick={() => onChange(values.filter((_, cardIndex) => cardIndex !== index))}
              className='mt-2 text-xs text-red-600 disabled:opacity-30'>
              Karte entfernen
            </button>
          </div>
        ))}
      </div>
      <button
        type='button'
        disabled={disabled}
        onClick={() =>
          onChange([...values, { title: "Neue Karte", text: "Beschreibung" }])
        }
        className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-40'>
        <Plus className='h-3.5 w-3.5' />
        Karte
      </button>
    </div>
  );
}

function FaqEditor({
  values,
  onChange,
  disabled,
}: {
  values: { question: string; answer: string }[];
  onChange: (values: { question: string; answer: string }[]) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>Fragen</span>
      <div className='space-y-4'>
        {values.map((value, index) => (
          <div key={index} className='border-l-2 border-slate-200 pl-3'>
            <div className='space-y-2'>
              <Field
                label={`Frage ${index + 1}`}
                value={value.question}
                disabled={disabled}
                onChange={(question) =>
                  onChange(
                    values.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, question } : item,
                    ),
                  )
                }
              />
              <TextareaField
                label='Antwort'
                value={value.answer}
                disabled={disabled}
                onChange={(answer) =>
                  onChange(
                    values.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, answer } : item,
                    ),
                  )
                }
              />
            </div>
            <button
              type='button'
              disabled={disabled}
              onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              className='mt-2 text-xs text-red-600 disabled:opacity-30'>
              Frage entfernen
            </button>
          </div>
        ))}
      </div>
      <button
        type='button'
        disabled={disabled}
        onClick={() =>
          onChange([...values, { question: "Neue Frage", answer: "Neue Antwort" }])
        }
        className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-40'>
        <Plus className='h-3.5 w-3.5' />
        Frage
      </button>
    </div>
  );
}

function CollectionEditor<T extends object>({
  label,
  itemName,
  values,
  createValue,
  onChange,
  renderItem,
  disabled,
  minItems = 1,
  maxItems,
}: {
  label: string;
  itemName: string;
  values: T[];
  createValue: () => T;
  onChange: (values: T[]) => void;
  renderItem: (
    value: T,
    index: number,
    patch: (values: Partial<T>) => void,
  ) => ReactNode;
  disabled?: boolean;
  minItems?: number;
  maxItems?: number;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <div className='space-y-4'>
        {values.map((value, index) => (
          <div key={index} className='border-l-2 border-slate-200 pl-3'>
            <div className='space-y-3'>
              {renderItem(value, index, (patch) =>
                onChange(
                  values.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, ...patch } : entry,
                  ),
                ),
              )}
            </div>
            <button
              type='button'
              disabled={disabled || values.length <= minItems}
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
              className='mt-2 text-xs text-red-600 disabled:opacity-30'>
              {itemName} entfernen
            </button>
          </div>
        ))}
      </div>
      <button
        type='button'
        disabled={disabled || (maxItems !== undefined && values.length >= maxItems)}
        onClick={() => onChange([...values, createValue()])}
        className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-40'>
        <Plus className='h-3.5 w-3.5' />
        {itemName}
      </button>
    </div>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <div className='flex items-center gap-2'>
        <input
          type='color'
          value={value || fallback}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className='h-10 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1 disabled:cursor-not-allowed'
        />
        <code className='min-w-0 flex-1 rounded bg-slate-100 px-2 py-2 text-xs uppercase text-slate-600'>
          {value || "Standard"}
        </code>
        <button
          type='button'
          title={`${label} zurücksetzen`}
          aria-label={`${label} zurücksetzen`}
          disabled={disabled || !value}
          onClick={() => onChange(undefined)}
          className='flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-30'>
          <RotateCcw className='h-3.5 w-3.5' />
        </button>
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  fallback,
  onChange,
  disabled,
}: {
  label: string;
  value?: number;
  min: number;
  max: number;
  fallback: number;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}) {
  const current = value ?? fallback;
  return (
    <label className='block'>
      <span className='mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600'>
        <span>{label}</span>
        <span className='font-normal tabular-nums text-slate-400'>{current}px</span>
      </span>
      <div className='flex items-center gap-2'>
        <input
          type='range'
          min={min}
          max={max}
          value={current}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className='min-w-0 flex-1 accent-emerald-600'
        />
        <button
          type='button'
          title={`${label} zurücksetzen`}
          aria-label={`${label} zurücksetzen`}
          disabled={disabled || value === undefined}
          onClick={() => onChange(undefined)}
          className='flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-30'>
          <RotateCcw className='h-3.5 w-3.5' />
        </button>
      </div>
    </label>
  );
}

function BlockDesignInspector({
  block,
  onChange,
  readOnly,
  advanced,
}: {
  block: CityServiceBlock;
  onChange: (block: CityServiceBlock) => void;
  readOnly: boolean;
  advanced: boolean;
}) {
  const style = block.style || {};
  const updateStyle = (
    key: keyof CityServiceBlockStyle,
    value: CityServiceBlockStyle[keyof CityServiceBlockStyle],
  ) => {
    const nextStyle = { ...style, [key]: value };
    if (value === undefined) delete nextStyle[key];
    onChange({
      ...block,
      style: Object.keys(nextStyle).length ? nextStyle : undefined,
    } as CityServiceBlock);
  };

  if (advanced) {
    return (
      <div className='space-y-6'>
        <section className='space-y-4'>
          <h4 className='text-xs font-semibold uppercase text-slate-400'>Außenabstand</h4>
          <RangeField label='Oben' value={style.marginTop} min={0} max={160} fallback={0} disabled={readOnly} onChange={(value) => updateStyle("marginTop", value)} />
          <RangeField label='Unten' value={style.marginBottom} min={0} max={160} fallback={0} disabled={readOnly} onChange={(value) => updateStyle("marginBottom", value)} />
          <RangeField label='Eckenradius' value={style.borderRadius} min={0} max={64} fallback={0} disabled={readOnly} onChange={(value) => updateStyle("borderRadius", value)} />
        </section>
        <section className='space-y-3 border-t border-slate-200 pt-5'>
          <div>
            <h4 className='text-xs font-semibold uppercase text-slate-400'>Responsive Sichtbarkeit</h4>
            <p className='mt-1 text-xs leading-5 text-slate-500'>Abschnitt gezielt auf Geräten ausblenden.</p>
          </div>
          <CheckboxField label='Auf Desktop ausblenden' checked={style.hideOnDesktop || false} disabled={readOnly} onChange={(value) => updateStyle("hideOnDesktop", value || undefined)} />
          <CheckboxField label='Auf Tablet ausblenden' checked={style.hideOnTablet || false} disabled={readOnly} onChange={(value) => updateStyle("hideOnTablet", value || undefined)} />
          <CheckboxField label='Auf Mobilgeräten ausblenden' checked={style.hideOnMobile || false} disabled={readOnly} onChange={(value) => updateStyle("hideOnMobile", value || undefined)} />
        </section>
        <button
          type='button'
          disabled={readOnly || !block.style}
          onClick={() => onChange({ ...block, style: undefined } as CityServiceBlock)}
          className='inline-flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-xs font-medium text-slate-600 disabled:opacity-30'>
          <RotateCcw className='h-3.5 w-3.5' />
          Gesamtes Design zurücksetzen
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <section className='space-y-4'>
        <h4 className='text-xs font-semibold uppercase text-slate-400'>Hintergrund</h4>
        <label className='block'>
          <span className={LABEL_CLASS}>Grundstil</span>
          <select
            className={INPUT_CLASS}
            value={block.tone}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...block,
                tone: event.target.value as CityServiceBlockTone,
              } as CityServiceBlock)
            }>
            <option value='white'>Weiß</option>
            <option value='muted'>Hellgrau</option>
            <option value='accent'>Akzentfläche</option>
            <option value='navy'>Dunkel</option>
          </select>
        </label>
        <ColorField label='Eigene Hintergrundfarbe' value={style.backgroundColor} fallback='#ffffff' disabled={readOnly} onChange={(value) => updateStyle("backgroundColor", value)} />
        <MediaField label='Hintergrundbild' value={style.backgroundImage} disabled={readOnly} optional onChange={(value) => updateStyle("backgroundImage", value)} />
        {style.backgroundImage && (
          <>
            <label className='block'>
              <span className={LABEL_CLASS}>Bildposition</span>
              <select className={INPUT_CLASS} value={style.backgroundPosition || "center"} disabled={readOnly} onChange={(event) => updateStyle("backgroundPosition", event.target.value as CityServiceBlockStyle["backgroundPosition"])}>
                <option value='top'>Oben</option>
                <option value='center'>Mitte</option>
                <option value='bottom'>Unten</option>
              </select>
            </label>
            <ColorField label='Overlay-Farbe' value={style.overlayColor} fallback='#000000' disabled={readOnly} onChange={(value) => updateStyle("overlayColor", value)} />
            <RangeField label='Overlay-Deckkraft' value={style.overlayOpacity} min={0} max={100} fallback={0} disabled={readOnly} onChange={(value) => updateStyle("overlayOpacity", value)} />
          </>
        )}
      </section>

      <section className='space-y-4 border-t border-slate-200 pt-5'>
        <h4 className='text-xs font-semibold uppercase text-slate-400'>Typografie</h4>
        <ColorField label='Textfarbe' value={style.textColor} fallback='#334155' disabled={readOnly} onChange={(value) => updateStyle("textColor", value)} />
        <ColorField label='Akzentfarbe' value={style.accentColor} fallback='#e87722' disabled={readOnly} onChange={(value) => updateStyle("accentColor", value)} />
        <RangeField label='Überschrift' value={style.headingSize} min={16} max={96} fallback={36} disabled={readOnly} onChange={(value) => updateStyle("headingSize", value)} />
        <RangeField label='Fließtext' value={style.textSize} min={10} max={32} fallback={16} disabled={readOnly} onChange={(value) => updateStyle("textSize", value)} />
        <div>
          <span className={LABEL_CLASS}>Ausrichtung</span>
          <div className='grid grid-cols-3 overflow-hidden rounded border border-slate-300'>
            {([
              ["left", AlignLeft, "Linksbündig"],
              ["center", AlignCenter, "Zentriert"],
              ["right", AlignRight, "Rechtsbündig"],
            ] as const).map(([value, Icon, label]) => (
              <button key={value} type='button' title={label} aria-label={label} disabled={readOnly} onClick={() => updateStyle("textAlign", value)} className={`flex h-9 items-center justify-center border-r border-slate-200 last:border-r-0 ${style.textAlign === value ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}>
                <Icon className='h-4 w-4' />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className='space-y-4 border-t border-slate-200 pt-5'>
        <h4 className='text-xs font-semibold uppercase text-slate-400'>Layout</h4>
        <div>
          <span className={LABEL_CLASS}>Inhaltsbreite</span>
          <div className='grid grid-cols-4 overflow-hidden rounded border border-slate-300'>
            {(["narrow", "boxed", "wide", "full"] as const).map((value) => (
              <button key={value} type='button' disabled={readOnly} onClick={() => updateStyle("contentWidth", value)} className={`h-9 border-r border-slate-200 text-[10px] font-semibold uppercase last:border-r-0 ${style.contentWidth === value ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}>
                {{ narrow: "Schmal", boxed: "Box", wide: "Breit", full: "Voll" }[value]}
              </button>
            ))}
          </div>
        </div>
        <RangeField label='Innenabstand oben' value={style.paddingTop} min={0} max={240} fallback={80} disabled={readOnly} onChange={(value) => updateStyle("paddingTop", value)} />
        <RangeField label='Innenabstand unten' value={style.paddingBottom} min={0} max={240} fallback={80} disabled={readOnly} onChange={(value) => updateStyle("paddingBottom", value)} />
        <RangeField label='Mindesthöhe' value={style.minHeight} min={0} max={1000} fallback={0} disabled={readOnly} onChange={(value) => updateStyle("minHeight", value)} />
      </section>
    </div>
  );
}

function BlockInspector({
  block,
  onChange,
  readOnly,
}: {
  block: CityServiceBlock;
  onChange: (block: CityServiceBlock) => void;
  readOnly: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "style" | "advanced">(
    "content",
  );
  const patch = (values: Record<string, unknown>) =>
    onChange({ ...block, ...values } as CityServiceBlock);

  return (
    <div className='space-y-5'>
      <div>
        <p className='text-xs font-semibold uppercase text-slate-400'>Block</p>
        <h3 className='mt-1 font-semibold text-slate-900'>
          {blockLabel(block.type)}
        </h3>
      </div>

      <nav className='grid grid-cols-3 border-b border-slate-200'>
        {([
          ["content", "Inhalt"],
          ["style", "Design"],
          ["advanced", "Erweitert"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type='button'
            onClick={() => setActiveTab(value)}
            className={`border-b-2 px-2 py-2.5 text-xs font-semibold ${
              activeTab === value
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "content" && (
        <>
          <div className='space-y-3 border-b border-slate-200 pb-5'>
            <CheckboxField
              label='Block anzeigen'
              checked={block.enabled}
              disabled={readOnly}
              onChange={(enabled) => patch({ enabled })}
            />
          </div>

      {block.type === "hero" && (
        <div className='space-y-4'>
          <Field label='H1-Titel' value={block.title} disabled={readOnly} onChange={(title) => patch({ title })} />
          <TextareaField label='Beschreibung' value={block.description} disabled={readOnly} onChange={(description) => patch({ description })} />
          <MediaField label='Hintergrundbild' value={block.image} disabled={readOnly} onChange={(image) => image && patch({ image })} />
          <Field label='Alternativtext' value={block.imageAlt} disabled={readOnly} onChange={(imageAlt) => patch({ imageAlt })} />
          <Field label='Formular-Titel' value={block.formTitle} disabled={readOnly} onChange={(formTitle) => patch({ formTitle })} />
          <TextareaField label='Formular-Text' value={block.formText} disabled={readOnly} onChange={(formText) => patch({ formText })} />
        </div>
      )}

      {block.type === "intro" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text} disabled={readOnly} rows={7} onChange={(text) => patch({ text })} />
        </div>
      )}

      {block.type === "imageText" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow || ""} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow: eyebrow || undefined })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <StringListEditor label='Absätze' values={block.paragraphs} disabled={readOnly} onChange={(paragraphs) => patch({ paragraphs })} />
          <MediaField label='Bild' value={block.image} disabled={readOnly} onChange={(image) => image && patch({ image })} />
          <Field label='Alternativtext' value={block.imageAlt} disabled={readOnly} onChange={(imageAlt) => patch({ imageAlt })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Bildposition</span>
            <select className={INPUT_CLASS} value={block.imagePosition} disabled={readOnly} onChange={(event) => patch({ imagePosition: event.target.value })}>
              <option value='left'>Links</option>
              <option value='right'>Rechts</option>
            </select>
          </label>
          <Field label='Button-Text' value={block.ctaLabel || ""} disabled={readOnly} onChange={(ctaLabel) => patch({ ctaLabel: ctaLabel || undefined })} />
          <Field label='Button-Link' value={block.ctaUrl || ""} disabled={readOnly} onChange={(ctaUrl) => patch({ ctaUrl: ctaUrl || undefined })} />
        </div>
      )}

      {block.type === "cta" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow || ""} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow: eyebrow || undefined })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text} disabled={readOnly} onChange={(text) => patch({ text })} />
          <div className='grid gap-3 sm:grid-cols-2'>
            <Field label='Primärer Button' value={block.primaryLabel} disabled={readOnly} onChange={(primaryLabel) => patch({ primaryLabel })} />
            <Field label='Primärer Link' value={block.primaryUrl} disabled={readOnly} onChange={(primaryUrl) => patch({ primaryUrl })} />
            <Field label='Sekundärer Button' value={block.secondaryLabel || ""} disabled={readOnly} onChange={(secondaryLabel) => patch({ secondaryLabel: secondaryLabel || undefined })} />
            <Field label='Sekundärer Link' value={block.secondaryUrl || ""} disabled={readOnly} onChange={(secondaryUrl) => patch({ secondaryUrl: secondaryUrl || undefined })} />
          </div>
        </div>
      )}

      {block.type === "stats" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading || ""} disabled={readOnly} onChange={(heading) => patch({ heading: heading || undefined })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </label>
          <CollectionEditor
            label='Kennzahlen'
            itemName='Kennzahl'
            values={block.items}
            createValue={() => ({ value: "100 %", label: "Neue Kennzahl" })}
            disabled={readOnly}
            onChange={(items) => patch({ items })}
            renderItem={(item, index, update) => (
              <>
                <Field label={`Wert ${index + 1}`} value={item.value} disabled={readOnly} onChange={(value) => update({ value })} />
                <Field label='Bezeichnung' value={item.label} disabled={readOnly} onChange={(label) => update({ label })} />
              </>
            )}
          />
        </div>
      )}

      {block.type === "testimonials" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 1 | 2 | 3 })}>
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </label>
          <CollectionEditor
            label='Kundenstimmen'
            itemName='Bewertung'
            values={block.items}
            createValue={() => ({ quote: "Neue Kundenstimme", name: "Kundenname", role: "", rating: 5 as const })}
            disabled={readOnly}
            onChange={(items) => patch({ items })}
            renderItem={(item, index, update) => (
              <>
                <TextareaField label={`Zitat ${index + 1}`} value={item.quote} disabled={readOnly} onChange={(quote) => update({ quote })} />
                <Field label='Name' value={item.name} disabled={readOnly} onChange={(name) => update({ name })} />
                <Field label='Zusatz' value={item.role || ""} disabled={readOnly} onChange={(role) => update({ role: role || undefined })} />
                <MediaField label='Avatar' value={item.avatar} disabled={readOnly} optional onChange={(avatar) => update({ avatar })} />
                <Field label='Quelle' value={item.source || ""} disabled={readOnly} placeholder='z. B. Google' onChange={(source) => update({ source: source || undefined })} />
                <label className='block'>
                  <span className={LABEL_CLASS}>Bewertung</span>
                  <select className={INPUT_CLASS} value={item.rating} disabled={readOnly} onChange={(event) => update({ rating: Number(event.target.value) as 1 | 2 | 3 | 4 | 5 })}>
                    {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} Sterne</option>)}
                  </select>
                </label>
              </>
            )}
          />
        </div>
      )}

      {block.type === "gallery" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <div className='grid grid-cols-2 gap-3'>
            <label className='block'>
              <span className={LABEL_CLASS}>Spalten</span>
              <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 2 | 3 | 4 })}>
                <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
              </select>
            </label>
            <label className='block'>
              <span className={LABEL_CLASS}>Bildformat</span>
              <select className={INPUT_CLASS} value={block.aspectRatio} disabled={readOnly} onChange={(event) => patch({ aspectRatio: event.target.value })}>
                <option value='square'>Quadratisch</option><option value='landscape'>Querformat</option><option value='portrait'>Hochformat</option>
              </select>
            </label>
          </div>
          <CollectionEditor
            label='Bilder'
            itemName='Bild'
            values={block.images}
            createValue={() => ({ src: "/images/Umzugsunternhemen_olpe.png", alt: "{service} in {city}", caption: "" })}
            disabled={readOnly}
            onChange={(images) => patch({ images })}
            renderItem={(image, index, update) => (
              <>
                <MediaField label={`Bild ${index + 1}`} value={image.src} disabled={readOnly} onChange={(src) => src && update({ src })} />
                <Field label='Alternativtext' value={image.alt} disabled={readOnly} onChange={(alt) => update({ alt })} />
                <Field label='Bildunterschrift' value={image.caption || ""} disabled={readOnly} onChange={(caption) => update({ caption: caption || undefined })} />
              </>
            )}
          />
          {!readOnly && (
            <MediathekDialog
              btnName='Mehrere Galeriebilder auswählen'
              multiSelect
              onSelect={(selection) => {
                const urls = Array.isArray(selection) ? selection : [selection];
                patch({
                  images: [
                    ...block.images,
                    ...urls.map((src) => ({ src, alt: "{service} in {city}" })),
                  ].slice(0, 18),
                });
              }}
            />
          )}
        </div>
      )}

      {block.type === "carousel" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading || ""} disabled={readOnly} onChange={(heading) => patch({ heading: heading || undefined })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <div className='space-y-2'>
            <CheckboxField label='Automatisch abspielen' checked={block.autoplay} disabled={readOnly} onChange={(autoplay) => patch({ autoplay })} />
            <CheckboxField label='Navigationspfeile' checked={block.showArrows} disabled={readOnly} onChange={(showArrows) => patch({ showArrows })} />
            <CheckboxField label='Navigationspunkte' checked={block.showDots} disabled={readOnly} onChange={(showDots) => patch({ showDots })} />
          </div>
          {block.autoplay && (
            <Field label='Intervall in Sekunden' value={String(block.interval / 1000)} disabled={readOnly} onChange={(seconds) => patch({ interval: Math.max(2000, Math.min(20000, (Number(seconds) || 5) * 1000)) })} />
          )}
          <CollectionEditor
            label='Slides'
            itemName='Slide'
            values={block.slides}
            maxItems={12}
            createValue={() => ({ image: "/images/Umzugsunternhemen_olpe.png", imageAlt: "{service} in {city}", heading: "Neuer Slide", text: "" })}
            disabled={readOnly}
            onChange={(slides) => patch({ slides })}
            renderItem={(slide, index, update) => (
              <>
                <MediaField label={`Slide-Bild ${index + 1}`} value={slide.image} disabled={readOnly} onChange={(image) => image && update({ image })} />
                <Field label='Alternativtext' value={slide.imageAlt} disabled={readOnly} onChange={(imageAlt) => update({ imageAlt })} />
                <Field label='Titel' value={slide.heading || ""} disabled={readOnly} onChange={(heading) => update({ heading: heading || undefined })} />
                <TextareaField label='Text' value={slide.text || ""} disabled={readOnly} onChange={(text) => update({ text: text || undefined })} />
                <Field label='Button-Text' value={slide.linkLabel || ""} disabled={readOnly} onChange={(linkLabel) => update({ linkLabel: linkLabel || undefined })} />
                <Field label='Button-Link' value={slide.linkUrl || ""} disabled={readOnly} onChange={(linkUrl) => update({ linkUrl: linkUrl || undefined })} />
              </>
            )}
          />
          {!readOnly && (
            <MediathekDialog
              btnName='Mehrere Slides auswählen'
              multiSelect
              onSelect={(selection) => {
                const urls = Array.isArray(selection) ? selection : [selection];
                patch({ slides: [...block.slides, ...urls.map((image) => ({ image, imageAlt: "{service} in {city}" }))].slice(0, 12) });
              }}
            />
          )}
        </div>
      )}

      {block.type === "imageCollage" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow || ""} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow: eyebrow || undefined })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text} disabled={readOnly} onChange={(text) => patch({ text })} />
          <div className='grid grid-cols-2 gap-3'>
            <label className='block'>
              <span className={LABEL_CLASS}>Bildseite</span>
              <select className={INPUT_CLASS} value={block.imagePosition} disabled={readOnly} onChange={(event) => patch({ imagePosition: event.target.value })}>
                <option value='left'>Links</option><option value='right'>Rechts</option>
              </select>
            </label>
            <label className='block'>
              <span className={LABEL_CLASS}>Anordnung</span>
              <select className={INPUT_CLASS} value={block.layout} disabled={readOnly} onChange={(event) => patch({ layout: event.target.value })}>
                <option value='stacked'>Überlappend</option><option value='fan'>Aufgefächert</option><option value='mosaic'>Mosaik</option>
              </select>
            </label>
          </div>
          <CollectionEditor
            label='Collage-Bilder'
            itemName='Bild'
            values={block.images}
            minItems={2}
            maxItems={5}
            createValue={() => ({ src: "/images/Umzugsunternhemen_olpe.png", alt: "{service} in {city}" })}
            disabled={readOnly}
            onChange={(images) => patch({ images })}
            renderItem={(image, index, update) => (
              <>
                <MediaField label={`Bild ${index + 1}`} value={image.src} disabled={readOnly} onChange={(src) => src && update({ src })} />
                <Field label='Alternativtext' value={image.alt} disabled={readOnly} onChange={(alt) => update({ alt })} />
              </>
            )}
          />
          {!readOnly && (
            <MediathekDialog
              btnName='Collage aus Mediathek füllen'
              multiSelect
              onSelect={(selection) => {
                const urls = Array.isArray(selection) ? selection : [selection];
                if (urls.length >= 2) patch({ images: urls.slice(0, 5).map((src) => ({ src, alt: "{service} in {city}" })) });
              }}
            />
          )}
        </div>
      )}

      {block.type === "beforeAfter" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text || ""} disabled={readOnly} onChange={(text) => patch({ text: text || undefined })} />
          <MediaField label='Vorher-Bild' value={block.beforeImage} disabled={readOnly} onChange={(beforeImage) => beforeImage && patch({ beforeImage })} />
          <Field label='Vorher-Alternativtext' value={block.beforeAlt} disabled={readOnly} onChange={(beforeAlt) => patch({ beforeAlt })} />
          <Field label='Vorher-Bezeichnung' value={block.beforeLabel} disabled={readOnly} onChange={(beforeLabel) => patch({ beforeLabel })} />
          <MediaField label='Nachher-Bild' value={block.afterImage} disabled={readOnly} onChange={(afterImage) => afterImage && patch({ afterImage })} />
          <Field label='Nachher-Alternativtext' value={block.afterAlt} disabled={readOnly} onChange={(afterAlt) => patch({ afterAlt })} />
          <Field label='Nachher-Bezeichnung' value={block.afterLabel} disabled={readOnly} onChange={(afterLabel) => patch({ afterLabel })} />
        </div>
      )}

      {block.type === "imageCards" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </label>
          <CheckboxField label='Text über Bild legen' checked={block.overlay} disabled={readOnly} onChange={(overlay) => patch({ overlay })} />
          <CollectionEditor<CityServiceImageCardsBlock["cards"][number]>
            label='Bildkarten'
            itemName='Karte'
            values={block.cards}
            maxItems={12}
            createValue={() => ({ image: "/images/Umzugsunternhemen_olpe.png", imageAlt: "{service} in {city}", title: "Neue Karte", text: "Beschreibung" })}
            disabled={readOnly}
            onChange={(cards) => patch({ cards })}
            renderItem={(card, index, update) => (
              <>
                <MediaField label={`Kartenbild ${index + 1}`} value={card.image} disabled={readOnly} onChange={(image) => image && update({ image })} />
                <Field label='Alternativtext' value={card.imageAlt} disabled={readOnly} onChange={(imageAlt) => update({ imageAlt })} />
                <Field label='Titel' value={card.title} disabled={readOnly} onChange={(title) => update({ title })} />
                <TextareaField label='Text' value={card.text} disabled={readOnly} onChange={(text) => update({ text })} />
                <Field label='Link-Text' value={card.linkLabel || ""} disabled={readOnly} onChange={(linkLabel) => update({ linkLabel: linkLabel || undefined })} />
                <Field label='Link-Ziel' value={card.linkUrl || ""} disabled={readOnly} onChange={(linkUrl) => update({ linkUrl: linkUrl || undefined })} />
              </>
            )}
          />
        </div>
      )}

      {block.type === "team" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </label>
          <CollectionEditor
            label='Teammitglieder'
            itemName='Person'
            values={block.members}
            maxItems={12}
            createValue={() => ({ image: "/images/Umzugsunternhemen_olpe.png", imageAlt: "Teammitglied", name: "Vorname Nachname", role: "Position", text: "" })}
            disabled={readOnly}
            onChange={(members) => patch({ members })}
            renderItem={(member, index, update) => (
              <>
                <MediaField label={`Portrait ${index + 1}`} value={member.image} disabled={readOnly} onChange={(image) => image && update({ image })} />
                <Field label='Alternativtext' value={member.imageAlt} disabled={readOnly} onChange={(imageAlt) => update({ imageAlt })} />
                <Field label='Name' value={member.name} disabled={readOnly} onChange={(name) => update({ name })} />
                <Field label='Position' value={member.role} disabled={readOnly} onChange={(role) => update({ role })} />
                <TextareaField label='Kurzbeschreibung' value={member.text || ""} disabled={readOnly} onChange={(text) => update({ text: text || undefined })} />
              </>
            )}
          />
        </div>
      )}

      {block.type === "video" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text || ""} disabled={readOnly} onChange={(text) => patch({ text: text || undefined })} />
          <Field label='Video-URL' value={block.videoUrl} disabled={readOnly} placeholder='YouTube, Vimeo oder Mediathek-Datei' onChange={(videoUrl) => patch({ videoUrl })} />
          {!readOnly && <MediathekDialog btnName='Video wählen' accept='video/*' onSelect={(selection) => {
            const videoUrl = Array.isArray(selection) ? selection[0] : selection;
            if (videoUrl) patch({ videoUrl });
          }} />}
          <MediaField label='Vorschaubild' value={block.poster} disabled={readOnly} optional onChange={(poster) => patch({ poster })} />
          <Field label='Bildunterschrift' value={block.caption || ""} disabled={readOnly} onChange={(caption) => patch({ caption: caption || undefined })} />
        </div>
      )}

      {block.type === "logoCloud" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) as 3 | 4 | 5 | 6 })}>
              <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option><option value={6}>6</option>
            </select>
          </label>
          <CollectionEditor
            label='Logos'
            itemName='Logo'
            values={block.logos}
            createValue={() => ({ src: "/images/Umzugshelden.png", alt: "Partnerlogo", url: "" })}
            disabled={readOnly}
            onChange={(logos) => patch({ logos })}
            renderItem={(logo, index, update) => (
              <>
                <MediaField label={`Logo ${index + 1}`} value={logo.src} disabled={readOnly} onChange={(src) => src && update({ src })} />
                <Field label='Alternativtext' value={logo.alt} disabled={readOnly} onChange={(alt) => update({ alt })} />
                <Field label='Optionaler Link' value={logo.url || ""} disabled={readOnly} onChange={(url) => update({ url: url || undefined })} />
              </>
            )}
          />
        </div>
      )}

      {block.type === "accordion" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <CollectionEditor
            label='Einträge'
            itemName='Eintrag'
            values={block.items}
            createValue={() => ({ title: "Neue Überschrift", content: "Neuer Inhalt" })}
            disabled={readOnly}
            onChange={(items) => patch({ items })}
            renderItem={(item, index, update) => (
              <>
                <Field label={`Titel ${index + 1}`} value={item.title} disabled={readOnly} onChange={(title) => update({ title })} />
                <TextareaField label='Inhalt' value={item.content} disabled={readOnly} onChange={(content) => update({ content })} />
              </>
            )}
          />
        </div>
      )}

      {block.type === "spacer" && (
        <div className='space-y-4'>
          <RangeField label='Höhe' value={block.height} min={0} max={300} fallback={64} disabled={readOnly} onChange={(height) => patch({ height: height ?? 64 })} />
          <CheckboxField label='Trennlinie anzeigen' checked={block.showDivider} disabled={readOnly} onChange={(showDivider) => patch({ showDivider })} />
          {block.showDivider && (
            <>
              <label className='block'>
                <span className={LABEL_CLASS}>Linienfarbe</span>
                <input type='color' value={block.dividerColor} disabled={readOnly} onChange={(event) => patch({ dividerColor: event.target.value })} className='h-10 w-full cursor-pointer rounded border border-slate-300 bg-white p-1' />
              </label>
              <label className='block'>
                <span className={LABEL_CLASS}>Linienstärke</span>
                <select className={INPUT_CLASS} value={block.dividerWidth} disabled={readOnly} onChange={(event) => patch({ dividerWidth: Number(event.target.value) as 1 | 2 | 3 })}>
                  <option value={1}>1 px</option><option value={2}>2 px</option><option value={3}>3 px</option>
                </select>
              </label>
            </>
          )}
        </div>
      )}

      {block.type === "localArea" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <Field label='Nahe Orte im Text' value={String(block.nearbyLimit)} disabled={readOnly} onChange={(nearbyLimit) => patch({ nearbyLimit: Math.max(1, Math.min(12, Number(nearbyLimit) || 1)) })} />
          <CheckboxField label='Regionsfakten anzeigen' checked={block.showFacts} disabled={readOnly} onChange={(showFacts) => patch({ showFacts })} />
        </div>
      )}

      {block.type === "cardGrid" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow || ""} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow: eyebrow || undefined })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) })}>
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </label>
          <CheckboxField label='Karten nummerieren' checked={block.numbered} disabled={readOnly} onChange={(numbered) => patch({ numbered })} />
          <CardsEditor values={block.cards} disabled={readOnly} onChange={(cards) => patch({ cards })} />
        </div>
      )}

      {block.type === "checkList" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <label className='block'>
            <span className={LABEL_CLASS}>Spalten</span>
            <select className={INPUT_CLASS} value={block.columns} disabled={readOnly} onChange={(event) => patch({ columns: Number(event.target.value) })}>
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </label>
          <StringListEditor label='Punkte' values={block.items} disabled={readOnly} onChange={(items) => patch({ items })} />
        </div>
      )}

      {block.type === "process" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro || ""} disabled={readOnly} onChange={(intro) => patch({ intro: intro || undefined })} />
          <StringListEditor label='Schritte' values={block.steps} disabled={readOnly} onChange={(steps) => patch({ steps })} />
        </div>
      )}

      {block.type === "pricing" && (
        <div className='space-y-4'>
          <Field label='Eyebrow' value={block.eyebrow || ""} disabled={readOnly} onChange={(eyebrow) => patch({ eyebrow: eyebrow || undefined })} />
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text} disabled={readOnly} onChange={(text) => patch({ text })} />
          <StringListEditor label='Preisfaktoren' values={block.factors} disabled={readOnly} onChange={(factors) => patch({ factors })} />
          <Field label='CTA-Titel' value={block.ctaTitle} disabled={readOnly} onChange={(ctaTitle) => patch({ ctaTitle })} />
          <TextareaField label='CTA-Text' value={block.ctaText} disabled={readOnly} onChange={(ctaText) => patch({ ctaText })} />
          <Field label='CTA-Button' value={block.ctaLabel} disabled={readOnly} onChange={(ctaLabel) => patch({ ctaLabel })} />
        </div>
      )}

      {block.type === "faq" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <CheckboxField label='Automatische lokale Frage ergänzen' checked={block.includeLocalQuestion} disabled={readOnly} onChange={(includeLocalQuestion) => patch({ includeLocalQuestion })} />
          <FaqEditor values={block.items} disabled={readOnly} onChange={(items) => patch({ items })} />
        </div>
      )}

      {block.type === "contact" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Text' value={block.text} disabled={readOnly} onChange={(text) => patch({ text })} />
          <CheckboxField label='Telefon anzeigen' checked={block.showPhone} disabled={readOnly} onChange={(showPhone) => patch({ showPhone })} />
          <CheckboxField label='E-Mail anzeigen' checked={block.showEmail} disabled={readOnly} onChange={(showEmail) => patch({ showEmail })} />
          <CheckboxField label='Formular anzeigen' checked={block.showForm} disabled={readOnly} onChange={(showForm) => patch({ showForm })} />
        </div>
      )}

      {block.type === "nearbyCities" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <TextareaField label='Einleitung' value={block.intro} disabled={readOnly} onChange={(intro) => patch({ intro })} />
          <Field label='Maximale Anzahl' value={String(block.limit)} disabled={readOnly} onChange={(limit) => patch({ limit: Math.max(1, Math.min(30, Number(limit) || 1)) })} />
          <Field label='Radius in km' value={String(block.radiusKm)} disabled={readOnly} onChange={(radiusKm) => patch({ radiusKm: Math.max(1, Math.min(150, Number(radiusKm) || 1)) })} />
          <CheckboxField label='Entfernung anzeigen' checked={block.showDistance} disabled={readOnly} onChange={(showDistance) => patch({ showDistance })} />
        </div>
      )}

      {block.type === "otherServices" && (
        <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
      )}

      {block.type === "serviceCards" && (
        <div className='space-y-4'>
          <Field label='Überschrift' value={block.heading} disabled={readOnly} onChange={(heading) => patch({ heading })} />
          <div>
            <span className={LABEL_CLASS}>Angezeigte Leistungen</span>
            <div className='space-y-2'>
              {CITY_SERVICE_KEYS.map((serviceKey) => (
                <CheckboxField
                  key={serviceKey}
                  label={getDefaultCityServiceName(serviceKey)}
                  checked={block.serviceKeys.includes(serviceKey)}
                  disabled={readOnly}
                  onChange={(checked) => {
                    const serviceKeys: CityServiceKey[] = checked
                      ? [...block.serviceKeys, serviceKey]
                      : block.serviceKeys.filter((key) => key !== serviceKey);
                    if (serviceKeys.length) patch({ serviceKeys });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === "style" && (
        <BlockDesignInspector
          block={block}
          onChange={onChange}
          readOnly={readOnly}
          advanced={false}
        />
      )}

      {activeTab === "advanced" && (
        <BlockDesignInspector
          block={block}
          onChange={onChange}
          readOnly={readOnly}
          advanced
        />
      )}
    </div>
  );
}

export default function CityServiceBlockEditor({
  blocks,
  onChange,
  readOnly = false,
  cityName = "Olpe",
  citySlug = "olpe",
  serviceKey = "umzugsservice",
  serviceName = "Umzugsservice",
  primaryKeyword = "Umzugsunternehmen",
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    blocks[0]?.id || null,
  );
  const [sidePanel, setSidePanel] = useState<"elements" | "navigator">(
    "elements",
  );
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const pastRef = useRef<CityServiceBlock[][]>([]);
  const futureRef = useRef<CityServiceBlock[][]>([]);
  const [, forceHistoryRender] = useState(0);
  const selectedBlock = blocks.find((block) => block.id === selectedId) || null;

  useEffect(() => {
    if (selectedId && blocks.some((block) => block.id === selectedId)) return;
    setSelectedId(blocks[0]?.id || null);
  }, [blocks, selectedId]);

  useEffect(() => {
    if (!fullscreen) return;
    const closeFullscreen = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeFullscreen);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeFullscreen);
    };
  }, [fullscreen]);

  const commit = (next: CityServiceBlock[]) => {
    if (readOnly) return;
    pastRef.current = [...pastRef.current.slice(-49), structuredClone(blocks)];
    futureRef.current = [];
    onChange(next);
    forceHistoryRender((revision) => revision + 1);
  };

  const undo = () => {
    const previous = pastRef.current.at(-1);
    if (!previous) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [structuredClone(blocks), ...futureRef.current].slice(0, 50);
    onChange(structuredClone(previous));
    forceHistoryRender((revision) => revision + 1);
  };

  const redo = () => {
    const next = futureRef.current[0];
    if (!next) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current.slice(-49), structuredClone(blocks)];
    onChange(structuredClone(next));
    forceHistoryRender((revision) => revision + 1);
  };

  const addBlock = (type: CityServiceBlockType) => {
    const block = createCityServiceBlock(type);
    commit([...blocks, block]);
    setSelectedId(block.id);
  };

  const updateBlock = (nextBlock: CityServiceBlock) => {
    commit(
      blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block)),
    );
  };

  const duplicateBlock = (block: CityServiceBlock) => {
    const id = createCityServiceBlock(block.type).id;
    const duplicate = { ...structuredClone(block), id } as CityServiceBlock;
    const index = blocks.findIndex((entry) => entry.id === block.id);
    const next = [...blocks];
    next.splice(index + 1, 0, duplicate);
    commit(next);
    setSelectedId(id);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex((block) => block.id === id);
    const next = blocks.filter((block) => block.id !== id);
    commit(next);
    setSelectedId(next[Math.max(0, index - 1)]?.id || null);
  };

  return (
    <div
      className={`grid overflow-hidden border border-slate-300 bg-slate-100 xl:grid-cols-[240px_minmax(0,1fr)_380px] ${
        fullscreen
          ? "fixed inset-0 z-40 h-[100dvh] rounded-none"
          : "rounded-md xl:h-[calc(100dvh-9rem)] xl:min-h-[760px]"
      }`}>
      <aside className='min-h-0 border-b border-slate-200 bg-white xl:border-b-0 xl:border-r'>
        <nav className='grid grid-cols-2 border-b border-slate-200 p-2'>
          <button
            type='button'
            onClick={() => setSidePanel("elements")}
            className={`flex h-10 items-center justify-center gap-2 rounded text-xs font-semibold ${sidePanel === "elements" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
            <Blocks className='h-4 w-4' />
            Elemente
          </button>
          <button
            type='button'
            onClick={() => setSidePanel("navigator")}
            className={`flex h-10 items-center justify-center gap-2 rounded text-xs font-semibold ${sidePanel === "navigator" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
            <Layers3 className='h-4 w-4' />
            Navigator
          </button>
        </nav>

        <div className='h-full overflow-y-auto p-3 pb-20'>
          {sidePanel === "elements" && (
            <div className='grid grid-cols-2 gap-2'>
              {BLOCK_LIBRARY.map((item) => (
                <button
                  key={item.type}
                  type='button'
                  title={item.description}
                  disabled={readOnly}
                  onClick={() => addBlock(item.type)}
                  className='flex min-h-20 flex-col items-center justify-center gap-2 rounded border border-slate-200 bg-white p-2 text-center hover:border-emerald-500 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-40'>
                  <item.icon className='h-5 w-5 shrink-0 text-emerald-700' />
                  <span className='text-[11px] font-semibold leading-4 text-slate-700'>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {sidePanel === "navigator" && (
            <Reorder.Group
              axis='y'
              values={blocks}
              onReorder={readOnly ? () => {} : commit}
              className='space-y-1.5'>
              {blocks.map((block, index) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  dragListener={!readOnly}
                  onClick={() => setSelectedId(block.id)}
                  className={`group flex cursor-pointer items-center gap-2 rounded border bg-white p-2 ${
                    selectedId === block.id
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-slate-200 hover:border-slate-400"
                  } ${block.enabled ? "" : "opacity-50"}`}>
                  <GripVertical className={`h-4 w-4 shrink-0 text-slate-400 ${readOnly ? "cursor-default" : "cursor-grab"}`} />
                  <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-500'>
                    {index + 1}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-[10px] font-semibold uppercase text-emerald-700'>
                      {blockLabel(block.type)}
                    </span>
                    <span className='block truncate text-xs text-slate-600'>
                      {blockSummary(block)}
                    </span>
                  </span>
                  {!block.enabled && <EyeOff className='h-3.5 w-3.5 text-slate-400' />}
                  {!readOnly && (
                    <span className='hidden items-center group-hover:flex'>
                      <button
                        type='button'
                        title='Duplizieren'
                        aria-label='Block duplizieren'
                        onClick={(event) => {
                          event.stopPropagation();
                          duplicateBlock(block);
                        }}
                        className='flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-100'>
                        <Copy className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        title='Löschen'
                        aria-label='Block löschen'
                        disabled={blocks.length <= 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className='flex h-7 w-7 items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-30'>
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </span>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </aside>

      <main className='flex min-h-0 min-w-0 flex-col bg-slate-200'>
        <header className='flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-300 bg-white px-3'>
          <div className='flex items-center gap-1'>
            <button
              type='button'
              title='Rückgängig'
              aria-label='Rückgängig'
              disabled={readOnly || pastRef.current.length === 0}
              onClick={undo}
              className='flex h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30'>
              <Undo2 className='h-4 w-4' />
            </button>
            <button
              type='button'
              title='Wiederholen'
              aria-label='Wiederholen'
              disabled={readOnly || futureRef.current.length === 0}
              onClick={redo}
              className='flex h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30'>
              <Redo2 className='h-4 w-4' />
            </button>
          </div>

          <div className='flex overflow-hidden rounded border border-slate-300 bg-slate-50'>
            {([
              ["desktop", Monitor, "Desktop"],
              ["tablet", Tablet, "Tablet"],
              ["mobile", Smartphone, "Mobil"],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type='button'
                title={`${label}-Vorschau`}
                aria-label={`${label}-Vorschau`}
                onClick={() => setViewport(value)}
                className={`flex h-9 w-10 items-center justify-center border-r border-slate-200 last:border-r-0 ${viewport === value ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-white"}`}>
                <Icon className='h-4 w-4' />
              </button>
            ))}
          </div>

          <span className='hidden text-xs font-medium text-slate-500 sm:block'>
            {viewport === "desktop" ? "1280 px" : viewport === "tablet" ? "768 px" : "390 px"}
          </span>
          <button
            type='button'
            title={fullscreen ? "Vollbild schließen (Esc)" : "Editor im Vollbild öffnen"}
            aria-label={fullscreen ? "Vollbild schließen" : "Editor im Vollbild öffnen"}
            onClick={() => setFullscreen((current) => !current)}
            className='hidden h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100 xl:flex'>
            {fullscreen ? (
              <Minimize2 className='h-4 w-4' />
            ) : (
              <Maximize2 className='h-4 w-4' />
            )}
          </button>
        </header>
        <div className='min-h-0 flex-1 overflow-hidden'>
          <CityServiceLivePreview
            blocks={blocks}
            cityName={cityName}
            citySlug={citySlug}
            serviceKey={serviceKey}
            serviceName={serviceName}
            primaryKeyword={primaryKeyword}
            selectedBlockId={selectedId}
            viewport={viewport}
            onSelectBlock={setSelectedId}
          />
        </div>
      </main>

      <aside className='min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-5 xl:border-l xl:border-t-0'>
        {selectedBlock ? (
          <BlockInspector
            block={selectedBlock}
            onChange={updateBlock}
            readOnly={readOnly}
          />
        ) : (
          <div className='py-12 text-center text-sm text-slate-500'>
            Wähle einen Block aus.
          </div>
        )}
      </aside>
    </div>
  );
}