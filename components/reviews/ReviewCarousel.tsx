"use client";

import React, { useEffect, useState } from "react";
import { Pause, Play, Star } from "lucide-react";
import { reviewSettingsSchema, type Review } from "@/lib/reviewSettings";
import styles from "./ReviewCarousel.module.css";

export function ReviewCarouselContent({ reviews }: { reviews: Review[] }) {
  const [paused, setPaused] = useState(false);
  if (!reviews.length) return null;
  const moving = reviews.length > 1;

  return (
    <section aria-label='Kundenbewertungen' className='bg-slate-50 py-20 text-slate-900'>
      <div className='container mx-auto mb-10 flex flex-wrap items-center justify-between gap-4 px-4'>
        <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>Das sagen unsere Kunden</h2>
        {moving && (
          <button
            type='button'
            data-builder-interactive
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            className='flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm'>
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Karussell fortsetzen" : "Karussell pausieren"}
          </button>
        )}
      </div>
      <div
        className={styles.viewport}
        style={{ maxWidth: `calc(${Math.min(reviews.length, 3)} * (24rem + 1.5rem) - 1.5rem)` }}
        tabIndex={0}
        role='region'
        aria-label='Bewertungskarten'>
        <div
          className={`${styles.track} ${moving ? styles.moving : ""}`}
          data-paused={paused}
          style={{ animationDuration: `${reviews.length * 12}s` }}>
          {Array.from({ length: moving ? 2 : 1 }, (_, copy) => (
            <div key={copy} className={styles.group} aria-hidden={copy === 1 ? true : undefined}>
              {reviews.map((review) => (
                <figure key={review.id} className={styles.card}>
                  <figcaption className='font-sans font-semibold text-navy'>{review.name}</figcaption>
                  <div className='mt-3 flex gap-1' role='img' aria-label={`${review.rating} von 5 Sternen`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} aria-hidden='true' size={18} className={index < review.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"} />
                    ))}
                  </div>
                  <blockquote className='mt-4 whitespace-pre-wrap font-body text-sm leading-relaxed text-slate-700'>{review.review}</blockquote>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ReviewCarousel({
  initialReviews,
}: {
  initialReviews?: Review[];
}) {
  const [reviews, setReviews] = useState<Review[] | null>(
    initialReviews ?? null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialReviews !== undefined) {
      setReviews(initialReviews);
      return;
    }

    const controller = new AbortController();
    async function load() {
      setError(false);
      try {
        const response = await fetch("/api/page-builder/reviews", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(`Bewertungen: HTTP ${response.status}`);
        const settings = reviewSettingsSchema.parse(await response.json());
        setReviews(settings.reviews);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Bewertungen konnten nicht geladen werden:", error);
        setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, initialReviews]);

  if (error) {
    return (
      <div role='alert' className='p-6 text-center text-slate-700'>
        Bewertungen konnten nicht geladen werden.{" "}
        <button type='button' data-builder-interactive className='underline' onClick={() => setAttempt((value) => value + 1)}>Erneut versuchen</button>
      </div>
    );
  }
  if (reviews === null) return <p role='status' className='p-6 text-center text-slate-600'>Bewertungen werden geladen ...</p>;
  return <ReviewCarouselContent reviews={reviews} />;
}
