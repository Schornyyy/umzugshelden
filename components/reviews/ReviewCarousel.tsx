"use client";
import React, { useState } from "react";

type Review = {
  name: string;
  review: string;
  rating: number;
};

const reviews: Review[] = [
  {
    name: "Oliver W.",
    review:
      "In einer persönlichen Notsituation hat Herr Weiß sehr spontan seine Hilfe zugesagt und hat mir innerhalb von 15 Minuten ausgeholfen. Unaufgeregt, sehr freundlich und fair kann ich diesen Hausmeisterservice nur empfehlen und weiß, wo ich mich wieder einmal melden werde, wenn etwas (auch größeres) anliegt. Vielen Dank!",
    rating: 5,
  },
  {
    name: "Ahmet D.",
    review:
      "Einen besseren Service Dienstleister kenne ich echt nicht! Top Arbeit geleistet und vor allem alles sauber hinterlassen. Sehr freundlich und zuvorkommen, absolut fairer Preisleistung! Empfehlenswert…..",
    rating: 5,
  },
  {
    name: "Anke R.",
    review: "Nettes Team, dass sauber arbeitet.",
    rating: 5,
  },
];

export default function ReviewCarousel() {
  const [current, setCurrent] = useState<number>(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [incomingMounted, setIncomingMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1); // 1 = next (to right), -1 = prev (to left)

  const len = reviews.length;

  function goNext() {
    const next = (current + 1) % len;
    slideTo(next, 1);
  }

  function goPrev() {
    const next = (current - 1 + len) % len;
    slideTo(next, -1);
  }

  function slideTo(nextIndex: number, direction: 1 | -1) {
    if (transitioning || nextIndex === current) return;
    setIncoming(nextIndex);
    setIncomingMounted(false);
    setDir(direction);
    setTransitioning(true);

    // mount incoming off-screen first, then trigger its entrance
    requestAnimationFrame(() => {
      setIncomingMounted(true);
    });

    // finish animation after duration (match duration in classes)
    window.setTimeout(() => {
      setCurrent(nextIndex);
      setIncoming(null);
      setIncomingMounted(false);
      setTransitioning(false);
    }, 520);
  }

  return (
    <section
      aria-label='Kundenbewertungen'
      className='py-32 relative'
      style={{
        backgroundImage: "url('/images/Bewertungen-Background.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}>
      <div className='container mx-auto'>
        <div className='relative max-w-7xl mx-auto px-12'>
          {/* Carousel viewport */}
          <div className='h-56 md:h-44 lg:h-56 relative overflow-hidden'>
            {/* current card */}
            <article
              key={current}
              className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out p-6 md:p-8 bg-white/90 dark:bg-slate-800/80 rounded-xl shadow-lg flex flex-col justify-between ${
                transitioning
                  ? dir === 1
                    ? "-translate-x-full"
                    : "translate-x-full"
                  : "translate-x-0"
              }`}>
              <div>
                <div className='flex items-center justify-between'>
                  <h4 className='font-semibold'>{reviews[current].name}</h4>
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill={
                          i < reviews[current].rating ? "#f59e0b" : "#e5e7eb"
                        }
                        className='w-4 h-4'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    ))}
                  </div>
                </div>

                <p className='mt-4 text-sm md:text-base text-slate-700 dark:text-slate-200'>
                  {reviews[current].review}
                </p>
              </div>
            </article>

            {/* incoming card (when set) */}
            {incoming !== null && (
              <article
                key={incoming}
                className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out p-6 md:p-8 bg-white/90 dark:bg-slate-800/80 rounded-xl shadow-lg flex flex-col justify-between ${
                  incomingMounted
                    ? "translate-x-0"
                    : dir === 1
                    ? "translate-x-full"
                    : "-translate-x-full"
                }`}>
                <div>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>{reviews[incoming].name}</h4>
                    <div className='flex items-center gap-1'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns='http://www.w3.org/2000/svg'
                          viewBox='0 0 20 20'
                          fill={
                            i < reviews[incoming].rating ? "#f59e0b" : "#e5e7eb"
                          }
                          className='w-4 h-4'>
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                  </div>

                  <p className='mt-4 text-sm md:text-base text-slate-700 dark:text-slate-200'>
                    {reviews[incoming].review}
                  </p>
                </div>
              </article>
            )}
          </div>

          {/* arrows */}
          <div className='absolute inset-y-0 left-0 flex items-center'>
            <button
              onClick={goPrev}
              aria-label='vorherige Bewertung'
              className='ml-2 md:ml-0 bg-white/80 dark:bg-slate-800/80 hover:bg-white rounded-full p-2 shadow'>
              <svg
                className='w-5 h-5'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M12 4L6 10L12 16'
                  stroke='#111827'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>

          <div className='absolute inset-y-0 right-0 flex items-center'>
            <button
              onClick={goNext}
              aria-label='nächste Bewertung'
              className='mr-2 md:mr-0 bg-white/80 dark:bg-slate-800/80 hover:bg-white rounded-full p-2 shadow'>
              <svg
                className='w-5 h-5'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M8 4L14 10L8 16'
                  stroke='#111827'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
