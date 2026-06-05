"use client";
// components/home/HomepageFeaturedCarousel.tsx
// Full-bleed hero carousel for the platform homepage.
// pricePerPerson is already a plain number (serialised in platform.ts).

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import HomepageSearch from "@/components/home/HomepageSearch";

type Tour = {
  id:             string;
  slug:           string;
  title:          string;
  description:    string;
  durationDays:   number;
  durationNights: number;
  pricePerPerson: number;   // plain number — NOT Decimal
  currency:       string;
  coverImageUrl:  string | null;
  location:       string | null;
  difficulty:     string;
  operator:       { name: string; slug: string; logoUrl: string | null };
};

// tours is optional so the component never crashes when the parent passes
// undefined (e.g. before an async fetch resolves).
type Props = { tours?: Tour[] };

export default function HomepageFeaturedCarousel({ tours = [] }: Props) {
  const [current,   setCurrent]   = useState(0);
  const [paused,    setPaused]    = useState(false);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      if (animating || tours.length === 0) return;
      setAnimating(true);
      setCurrent(i);
      setTimeout(() => setAnimating(false), 600);
    },
    [animating, tours.length],
  );

  const next = useCallback(
    () => goTo((current + 1) % Math.max(tours.length, 1)),
    [current, tours.length, goTo],
  );

  // Auto-advance every 7 s; pause on hover
  useEffect(() => {
    if (paused || tours.length <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, paused, tours.length]);

  // Nothing to render — let the parent show its static fallback instead
  if (tours.length === 0) return null;

  // Keep current in bounds if tours array shrinks between renders
  const safeIndex = current % tours.length;
  const tour = tours[safeIndex];

  if (!tour) return null;

  return (
    <div
      className="relative h-[90vh] min-h-[600px] max-h-[860px] overflow-hidden bg-stone-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Background images ── */}
      {tours.map((t, i) => (
        <div
          key={t.id}
          aria-hidden={i !== safeIndex}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === safeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {t.coverImageUrl ? (
            <img
              src={t.coverImageUrl}
              alt=""                  // decorative; tour title is in the heading
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 to-amber-900" />
          )}
        </div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <div className="absolute inset-0 flex flex-col">

        {/* Space for fixed nav */}
        <div className="h-16 shrink-0" />

        {/* Centre hero text */}
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div
              className={`max-w-2xl transition-all duration-500 ${
                animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              {/* Operator + Featured tag */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="bg-amber-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  ⭐ Featured
                </span>
                <span className="text-white/60 text-xs font-medium">
                   by {tour.operator?.name ?? "Unknown Operator"}
                </span>
              </div>

              {/* Location */}
              {tour.location && (
                <p className="text-amber-300 text-sm font-medium mb-3 flex items-center gap-1.5">
                  <span aria-hidden="true">📍</span>
                  {tour.location}
                </p>
              )}

              {/* Title — h2 because the page <h1> lives in the static hero fallback */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
                {tour.title}
              </h2>

              {/* Description */}
              <p className="text-white/70 text-base mb-8 line-clamp-2 max-w-lg leading-relaxed">
                {tour.description}
              </p>

              {/* Price + CTAs */}
              <div className="flex items-end gap-6 sm:gap-8 flex-wrap">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-1">From</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white">
                    {formatCurrency(tour.pricePerPerson, tour.currency)}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {tour.durationDays} days · per person
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <Link
                    href={`/site/${tour.operator.slug}/tours/${tour.slug}`}
                    className="bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold px-6 sm:px-7 py-3.5 rounded-xl transition-colors text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    View Safari →
                  </Link>
                  <Link
                    href={`/site/${tour.operator.slug}/tours/${tour.slug}/book`}
                    className="bg-white/15 backdrop-blur hover:bg-white/25 active:scale-[0.98] text-white font-semibold px-6 sm:px-7 py-3.5 rounded-xl transition-colors text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search bar + slide controls ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-8 sm:pb-10 space-y-5 sm:space-y-6">
          <HomepageSearch tours={[]} />

          {tours.length > 1 && (
            <nav aria-label="Carousel controls" className="flex items-center justify-center gap-2">
              <button
                onClick={() => goTo((safeIndex - 1 + tours.length) % tours.length)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center border border-white/20 transition-colors text-lg leading-none focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Previous safari"
              >
                ‹
              </button>

              {tours.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => goTo(i)}
                  aria-label={`Show safari ${i + 1}: ${t.title}`}
                  aria-current={i === safeIndex ? "true" : undefined}
                  className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                    i === safeIndex
                      ? "w-6 h-2 bg-amber-400"
                      : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}

              <button
                onClick={() => goTo((safeIndex + 1) % tours.length)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center border border-white/20 transition-colors text-lg leading-none focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Next safari"
              >
                ›
              </button>
            </nav>
          )}
        </div>

      </div>
    </div>
  );
}