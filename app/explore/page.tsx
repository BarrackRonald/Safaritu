// app/explore/page.tsx
// Public safari discovery and search page.
// Server-rendered with searchParams for SEO and shareability.

import Link from "next/link";
import type { Metadata } from "next";
import { searchTours, getDestinations } from "@/lib/prisma/platform";
import { formatCurrency, difficultyLabel, difficultyColor, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore Safaris — SafariTu",
  description: "Browse and search all safari experiences across East Africa. Filter by destination, duration, price, and difficulty.",
};

type Props = {
  searchParams: Promise<{
    q?:           string;
    destination?: string;
    difficulty?:  string;
    minDays?:     string;
    maxDays?:     string;
    maxPrice?:    string;
  }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const sp = await searchParams;

  const [tours, destinations] = await Promise.all([
    searchTours({
      query:       sp.q,
      destination: sp.destination,
      difficulty:  sp.difficulty,
      minDays:     sp.minDays  ? parseInt(sp.minDays)  : undefined,
      maxDays:     sp.maxDays  ? parseInt(sp.maxDays)  : undefined,
      maxPrice:    sp.maxPrice ? parseInt(sp.maxPrice) : undefined,
    }),
    getDestinations(),
  ]);

  const hasFilters = !!(sp.q || sp.destination || sp.difficulty || sp.minDays || sp.maxDays || sp.maxPrice);

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">ST</div>
            <span className="font-bold text-stone-900">SafariTu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"  className="text-sm text-stone-600 hover:text-stone-900">Operator login</Link>
            <Link href="/signup" className="bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-800 transition-colors">
              List safaris
            </Link>
          </div>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="bg-amber-700 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-3xl font-bold text-center mb-6">
            {sp.destination ? `Safaris in ${sp.destination}` :
             sp.q           ? `Results for "${sp.q}"`         :
             "Explore All Safaris"}
          </h1>
          <form method="GET" action="/explore" className="flex gap-0 bg-white rounded-2xl overflow-hidden shadow-xl">
            <input
              name="q"
              type="text"
              defaultValue={sp.q}
              placeholder="Search safaris, destinations…"
              className="flex-1 px-6 py-4 text-stone-900 placeholder-stone-400 focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 transition-colors text-sm shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8">

        {/* ── Filters sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-900">Filters</h2>
              {hasFilters && (
                <Link href="/explore" className="text-xs text-amber-700 hover:underline">
                  Clear all
                </Link>
              )}
            </div>

            <form method="GET" action="/explore" className="space-y-6">
              {sp.q && <input type="hidden" name="q" value={sp.q} />}

              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Destination
                </label>
                <select
                  name="destination"
                  defaultValue={sp.destination ?? ""}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All destinations</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  defaultValue={sp.difficulty ?? ""}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Any difficulty</option>
                  {["EASY", "MODERATE", "CHALLENGING", "EXTREME"].map((d) => (
                    <option key={d} value={d}>{difficultyLabel(d)}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Duration (days)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="minDays"
                    defaultValue={sp.minDays}
                    min={1}
                    placeholder="Min"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="number"
                    name="maxDays"
                    defaultValue={sp.maxDays}
                    min={1}
                    placeholder="Max"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Max price */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Max price (KES)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={sp.maxPrice}
                  min={0}
                  step={1000}
                  placeholder="e.g. 150000"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-800 transition-colors"
              >
                Apply filters
              </button>
            </form>
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-stone-500 text-sm">
              <span className="font-semibold text-stone-900">{tours.length}</span>{" "}
              safari{tours.length !== 1 ? "s" : ""} found
              {hasFilters && (
                <Link href="/explore" className="ml-3 text-amber-700 hover:underline text-xs font-medium">
                  Clear filters
                </Link>
              )}
            </p>
          </div>

          {tours.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center shadow-sm">
              <p className="text-5xl mb-4">🔍</p>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">No safaris found</h2>
              <p className="text-stone-400 text-sm mb-6">
                Try adjusting your search or removing some filters.
              </p>
              <Link href="/explore" className="text-amber-700 hover:underline text-sm font-medium">
                Clear all filters →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tours.map((tour) => {
                const href = `/site/${(tour as any).operator.slug}/tours/${tour.slug}`;
                return (
                  <Link
                    key={tour.id}
                    href={href}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-stone-100 overflow-hidden">
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
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {tour.isTopPick && (
                          <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ Top Pick</span>
                        )}
                        {tour.isFeatured && !tour.isTopPick && (
                          <span className="bg-white/90 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">Featured</span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/50 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          {tour.durationDays}D / {tour.durationNights}N
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        {tour.location && (
                          <span className="text-xs text-stone-400">📍 {tour.location}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(tour.difficulty)}`}>
                          {difficultyLabel(tour.difficulty)}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 leading-snug group-hover:text-amber-700 transition-colors mb-1.5">
                        {tour.title}
                      </h3>
                      <p className="text-stone-400 text-sm flex-1">{truncate(tour.description, 85)}</p>

                      {/* Operator */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-stone-50">
                        <div className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                          {(tour as any).operator.name[0]}
                        </div>
                        <span className="text-xs text-stone-400">{(tour as any).operator.name}</span>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-xs text-stone-400">From</p>
                          <p className="text-lg font-bold text-stone-900">
                            {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                          </p>
                        </div>
                        <span className="bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-amber-800 transition-colors">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}