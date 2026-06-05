// components/public/TourGrid.tsx
// Responsive grid of tour cards. Used on the operator public homepage.
// variant="topPick" renders a slightly elevated card style.

import Link from "next/link";
import { formatCurrency, truncate, difficultyLabel, difficultyColor } from "@/lib/utils";

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
  isTopPick:     boolean;
  isFeatured:    boolean;
};

type Props = {
  tours:        Tour[];
  operatorSlug: string;
  variant?:     "default" | "topPick";
};

export default function TourGrid({ tours, operatorSlug, variant = "default" }: Props) {
  return (
    <div
      id="safaris"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {tours.map((tour) => (
        <TourCard
          key={tour.id}
          tour={tour}
          operatorSlug={operatorSlug}
          elevated={variant === "topPick"}
        />
      ))}
    </div>
  );
}

function TourCard({
  tour,
  operatorSlug,
  elevated,
}: {
  tour:         Tour;
  operatorSlug: string;
  elevated:     boolean;
}) {
  const href = `/site/${operatorSlug}/tours/${tour.slug}`;

  return (
    <Link
      href={href}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        elevated
          ? "shadow-md hover:shadow-xl border border-amber-100"
          : "shadow-sm hover:shadow-lg border border-stone-100"
      }`}
    >
      {/* Image */}
      <div className="relative h-52 bg-stone-100 overflow-hidden">
        {tour.coverImageUrl ? (
          <img
            src={tour.coverImageUrl}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
            <span className="text-5xl">🦁</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {tour.isTopPick && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⭐ Top Pick
            </span>
          )}
          {tour.isFeatured && !tour.isTopPick && (
            <span className="bg-white/90 backdrop-blur text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Duration pill */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tour.durationDays}D / {tour.durationNights}N
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">

        {/* Location + difficulty */}
        <div className="flex items-center justify-between mb-2">
          {tour.location && (
            <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
              📍 {tour.location}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(tour.difficulty)}`}>
            {difficultyLabel(tour.difficulty)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-stone-900 text-base leading-snug mb-2 group-hover:text-amber-700 transition-colors">
          {tour.title}
        </h3>

        {/* Description */}
        <p className="text-stone-500 text-sm leading-relaxed flex-1">
          {truncate(tour.description, 110)}
        </p>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">From</p>
            <p className="text-lg font-bold text-stone-900">
              {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
            </p>
            <p className="text-xs text-stone-400">per person</p>
          </div>
          <span className="bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-amber-800 transition-colors">
            View →
          </span>
        </div>

      </div>
    </Link>
  );
}