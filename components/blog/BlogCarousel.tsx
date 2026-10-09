"use client";

import type { BlogPageBlock } from "@/types/blog/BlogPage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BlogCarousel({
  block,
  accentColor,
}: {
  block: BlogPageBlock;
  accentColor: string;
}) {
  const slides = (
    block.carouselSlides ||
    block.slides?.map((slide) => ({
      imageUrl: slide.image,
      imageAlt: slide.imageAlt,
      heading: slide.heading,
      text: slide.text,
      linkLabel: slide.linkLabel,
      linkUrl: slide.linkUrl,
    })) ||
    []
  ).filter((slide) => slide.imageUrl);
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex] || slides[0];

  useEffect(() => {
    if (!(block.carouselAutoplay ?? block.autoplay) || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % slides.length),
      block.carouselInterval || block.interval || 5000,
    );
    return () => window.clearInterval(timer);
  }, [block.autoplay, block.carouselAutoplay, block.carouselInterval, block.interval, slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  if (!slide) {
    return (
      <div className='flex min-h-64 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500'>
        Noch keine Carousel-Bilder ausgewählt
      </div>
    );
  }

  const move = (direction: -1 | 1) => {
    setActiveIndex(
      (current) => (current + direction + slides.length) % slides.length,
    );
  };

  return (
    <div className='space-y-4'>
      {block.heading && (
        <h2 className='text-3xl font-bold' style={{ fontSize: block.style?.headingSize }}>
          {block.heading}
        </h2>
      )}
      <div className='relative aspect-[16/9] min-h-64 overflow-hidden rounded bg-slate-950'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt={slide.imageAlt}
          className='absolute inset-0 h-full w-full object-cover'
        />
        {(slide.heading || slide.text || (slide.linkLabel && slide.linkUrl)) && (
          <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-6 md:p-10'>
            <div className='max-w-2xl text-left text-white'>
              {slide.heading && <h3 className='text-2xl font-bold md:text-4xl'>{slide.heading}</h3>}
              {slide.text && <p className='mt-3 text-sm leading-relaxed text-white/90 md:text-base'>{slide.text}</p>}
              {slide.linkLabel && slide.linkUrl && (
                <Link
                  href={slide.linkUrl}
                  className='mt-5 inline-flex rounded px-5 py-3 text-sm font-semibold text-white'
                  style={{ backgroundColor: accentColor }}>
                  {slide.linkLabel}
                </Link>
              )}
            </div>
          </div>
        )}
        {(block.carouselShowArrows ?? block.showArrows) !== false && slides.length > 1 && (
          <>
            <button type='button' aria-label='Vorheriges Bild' onClick={() => move(-1)} className='absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow hover:bg-white'>
              <ChevronLeft className='h-5 w-5' />
            </button>
            <button type='button' aria-label='Nächstes Bild' onClick={() => move(1)} className='absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow hover:bg-white'>
              <ChevronRight className='h-5 w-5' />
            </button>
          </>
        )}
      </div>
      {(block.carouselShowDots ?? block.showDots) !== false && slides.length > 1 && (
        <div className='flex justify-center gap-2' aria-label='Bildauswahl'>
          {slides.map((item, index) => (
            <button
              key={`${item.imageUrl}-${index}`}
              type='button'
              aria-label={`Bild ${index + 1} anzeigen`}
              aria-current={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className='h-2.5 w-2.5 rounded-full'
              style={{ backgroundColor: activeIndex === index ? accentColor : "#cbd5e1" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
