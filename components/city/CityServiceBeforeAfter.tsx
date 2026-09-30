"use client";

import { resolveCityServiceText, type CityServiceTemplateContext } from "@/lib/cityServiceTemplate";
import type { CityServiceBeforeAfterBlock } from "@/types/city/CityServicePage";
import Image from "next/image";
import { useState } from "react";

const sectionTone = {
  white: "bg-white",
  muted: "bg-gray-50",
  navy: "bg-navy",
  accent: "bg-[#eef3f7]",
} as const;

export default function CityServiceBeforeAfter({
  block,
  context,
}: {
  block: CityServiceBeforeAfterBlock;
  context: CityServiceTemplateContext;
}) {
  const [position, setPosition] = useState(50);
  const text = (value: string) => resolveCityServiceText(value, context);
  const isNavy = block.tone === "navy";

  return (
    <section className={`${sectionTone[block.tone]} py-20`}>
      <div className='container mx-auto max-w-5xl px-4'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className={`font-sans text-3xl font-bold md:text-4xl ${isNavy ? "text-white" : "text-navy"}`}>
            {text(block.heading)}
          </h2>
          {block.text && (
            <p className={`mt-3 font-body ${isNavy ? "text-gray-300" : "text-gray-600"}`}>
              {text(block.text)}
            </p>
          )}
        </div>

        <div className='relative mt-8 aspect-[16/9] min-h-[280px] overflow-hidden rounded bg-slate-200 shadow-lg'>
          <Image src={block.afterImage} alt={text(block.afterAlt)} fill sizes='(max-width: 1024px) 100vw, 960px' className='object-cover' />
          <div className='absolute inset-0' style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <Image src={block.beforeImage} alt={text(block.beforeAlt)} fill sizes='(max-width: 1024px) 100vw, 960px' className='object-cover' />
          </div>
          <span className='absolute left-4 top-4 rounded bg-black/70 px-3 py-1 font-sans text-xs font-semibold text-white'>{text(block.beforeLabel)}</span>
          <span className='absolute right-4 top-4 rounded bg-black/70 px-3 py-1 font-sans text-xs font-semibold text-white'>{text(block.afterLabel)}</span>
          <div className='pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow' style={{ left: `${position}%` }} />
          <input
            data-builder-interactive
            type='range'
            min={0}
            max={100}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            aria-label='Vorher-Nachher-Vergleich'
            className='absolute inset-x-5 bottom-5 z-10 accent-primary'
          />
        </div>
      </div>
    </section>
  );
}