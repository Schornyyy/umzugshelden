"use client";

import { Button } from "@/components/ui/button";
import { resolveCityServiceText, type CityServiceTemplateContext } from "@/lib/cityServiceTemplate";
import type { CityServiceCarouselBlock } from "@/types/city/CityServicePage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const sectionTone = {
  white: "bg-white",
  muted: "bg-gray-50",
  navy: "bg-navy",
  accent: "bg-[#eef3f7]",
} as const;

export default function CityServiceCarousel({
  block,
  context,
}: {
  block: CityServiceCarouselBlock;
  context: CityServiceTemplateContext;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const text = (value: string) => resolveCityServiceText(value, context);
  const slide = block.slides[activeIndex] || block.slides[0];

  useEffect(() => {
    if (!block.autoplay || block.slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % block.slides.length),
      block.interval,
    );
    return () => window.clearInterval(timer);
  }, [block.autoplay, block.interval, block.slides.length]);

  useEffect(() => {
    if (activeIndex >= block.slides.length) setActiveIndex(0);
  }, [activeIndex, block.slides.length]);

  if (!slide) return null;

  const move = (direction: -1 | 1) => {
    setActiveIndex(
      (current) =>
        (current + direction + block.slides.length) % block.slides.length,
    );
  };

  return (
    <section className={`${sectionTone[block.tone]} py-20`}>
      <div className='container mx-auto max-w-6xl px-4'>
        {(block.heading || block.intro) && (
          <div className='mx-auto mb-8 max-w-3xl text-center'>
            {block.heading && (
              <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
                {text(block.heading)}
              </h2>
            )}
            {block.intro && (
              <p className='mt-3 font-body text-gray-600'>{text(block.intro)}</p>
            )}
          </div>
        )}

        <div className='relative aspect-[16/9] min-h-[320px] overflow-hidden rounded bg-slate-950 shadow-lg'>
          <Image
            key={slide.image}
            src={slide.image}
            alt={text(slide.imageAlt)}
            fill
            sizes='(max-width: 1200px) 100vw, 1152px'
            className='object-cover'
          />
          {(slide.heading || slide.text || (slide.linkLabel && slide.linkUrl)) && (
            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 md:p-10'>
              <div className='max-w-2xl text-white'>
                {slide.heading && (
                  <h3 className='font-sans text-2xl font-bold md:text-4xl'>
                    {text(slide.heading)}
                  </h3>
                )}
                {slide.text && (
                  <p className='mt-3 font-body text-sm leading-relaxed text-white/85 md:text-base'>
                    {text(slide.text)}
                  </p>
                )}
                {slide.linkLabel && slide.linkUrl && (
                  <Link href={slide.linkUrl} className='mt-5 inline-flex'>
                    <Button className='rounded bg-primary px-5 font-semibold text-white'>
                      {text(slide.linkLabel)}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {block.showArrows && block.slides.length > 1 && (
            <>
              <button
                data-builder-interactive
                type='button'
                aria-label='Vorheriges Bild'
                onClick={() => move(-1)}
                className='absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow hover:bg-white'>
                <ChevronLeft className='h-5 w-5' />
              </button>
              <button
                data-builder-interactive
                type='button'
                aria-label='Nächstes Bild'
                onClick={() => move(1)}
                className='absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow hover:bg-white'>
                <ChevronRight className='h-5 w-5' />
              </button>
            </>
          )}
        </div>

        {block.showDots && block.slides.length > 1 && (
          <div className='mt-4 flex justify-center gap-2' aria-label='Bildauswahl'>
            {block.slides.map((item, index) => (
              <button
                data-builder-interactive
                key={`${item.image}-${index}`}
                type='button'
                aria-label={`Bild ${index + 1} anzeigen`}
                aria-current={activeIndex === index}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full ${activeIndex === index ? "bg-primary" : "bg-slate-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}