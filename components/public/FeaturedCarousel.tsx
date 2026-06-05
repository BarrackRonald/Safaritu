"use client";
// components/public/FeaturedCarousel.tsx
// Auto-advancing hero carousel for featured safaris.
// Full-bleed images with gradient overlays, title, price, and CTA.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Tour = {
  id:            string;
  slug:          string;
  title:         string;
  description:   string;
  durationDays:  number;
  durationNights:number;
  pricePerPerson:number | { toString(): string };
  currency:      string;
  coverImageUrl: string | null;
  location:      string | null;
  difficulty:    string;
};

type Props = {
  tours:        Tour[];
  operatorSlug: string;
};

const DIFFICULTIES: Record<string, string> = {
  EASY:        "Easy",
  MODERATE:    "Moderate",
  CHALLENGING: "Challenging",
  EXTREME:     "Extreme",
};

export default function FeaturedCarousel({ tours, operatorSlug }: Props) {
  const [current,  setCurrent]  = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [animating,setAnimating]= useState(false);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 600);
  }, [animating]);

  const next = useCallback(() => goTo((current + 1) % tours.length), [current, tours.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + tours.length) % tours.length), [current, tours.length, goTo]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (paused || tours.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, paused, tours.length]);

  const tour = tours[current];

  return (
    <div
      className="relative h-[85vh] min-h-[560px] max-h-[800px] overflow-hidden bg-stone-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image */}
      {tours.map((t, i) => (
        <div
          key={t.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {t.coverImageUrl ? (
            <img
              src={t.coverImageUrl}
              alt={t.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900" />
          )}
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Featured badge */}
      <div className="absolute top-6 left-6">
        <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
          ⭐ Featured Safari
        </span>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-6xl mx-auto px-6 pb-16 w-full">
          <div
            className={`max-w-2xl transition-all duration-500 ${
              animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            {/* Meta tags */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {tour.location && (
                <span className="flex items-center gap-1 text-amber-300 text-sm font-medium">
                  📍 {tour.location}
                </span>
              )}
              <span className="text-white/60 text-sm">
                {tour.durationDays}D / {tour.durationNights}N
              </span>
              <span className="text-white/60 text-sm">
                {DIFFICULTIES[tour.difficulty] ?? tour.difficulty}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              {tour.title}
            </h1>

            {/* Description */}
            <p className="text-white/80 text-base leading-relaxed mb-6 line-clamp-2 max-w-xl">
              {tour.description}
            </p>

            {/* Price + CTA */}
            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">
                  From
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                </p>
                <p className="text-white/60 text-xs mt-0.5">per person</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/site/${operatorSlug}/tours/${tour.slug}`}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm shadow-lg"
                >
                  View Safari →
                </Link>
                <Link
                  href={`/site/${operatorSlug}/tours/${tour.slug}/book`}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm border border-white/20"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>

          {/* Dots + arrows */}
          {tours.length > 1 && (
            <div className="flex items-center gap-4 mt-8">
              {/* Prev */}
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center transition-colors border border-white/20"
                aria-label="Previous safari"
              >
                ‹
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {tours.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to safari ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-6 h-2 bg-amber-400"
                        : "w-2 h-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              {/* Next */}
              <button
                onClick={next}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center transition-colors border border-white/20"
                aria-label="Next safari"
              >
                ›
              </button>

              {/* Tour count */}
              <span className="text-white/40 text-xs ml-2">
                {current + 1} / {tours.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}