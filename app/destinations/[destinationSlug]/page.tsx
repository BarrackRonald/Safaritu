// app/destinations/[destinationSlug]/page.tsx
// Public destination landing page.
// Shows all published tours for this destination, sorted by visibility score.
// Fully server-rendered for SEO — each destination gets its own indexed page.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getDestinationBySlug, getToursByDestination } from "@/lib/prisma/destinations";
import { getAllDestinations } from "@/lib/prisma/destinations";
import { formatCurrency, difficultyLabel, difficultyColor, truncate } from "@/lib/utils";

type Props = { params: Promise<{ destinationSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { destinationSlug } = await params;
  const dest = await getDestinationBySlug(destinationSlug);
  if (!dest) return {};
  return {
    title:       `${dest.name} Safaris — SafariTu`,
    description: dest.description ?? `Book the best safari tours in ${dest.name}, ${dest.country}. Compare operators, check availability, and pay securely with Mpesa or card.`,
    openGraph: {
      title:       `${dest.name} Safaris`,
      description: dest.description ?? `Safari tours in ${dest.name}`,
      images:      dest.imageUrl ? [dest.imageUrl] : [],
    },
  };
}

export default async function DestinationPage({ params }: Props) {
  const { destinationSlug } = await params;

  const [destination, allDestinations] = await Promise.all([
    getDestinationBySlug(destinationSlug),
    getAllDestinations(),
  ]);

  if (!destination) notFound();

  const tours = await getToursByDestination(destination.id);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              ST
            </div>
            <span className="font-bold text-stone-900">SafariTu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm text-stone-600 hover:text-stone-900 hidden sm:block">
              All safaris
            </Link>
            <Link
              href="/signup"
              className="bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-800 transition-colors"
            >
              List safaris
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative bg-stone-900 h-72 overflow-hidden">
        {destination.imageUrl ? (
          <>
            <img
              src={destination.imageUrl}
              alt={destination.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-amber-900 flex items-center justify-center">
            <span className="text-[120px] opacity-20 select-none">
              {destination.emoji ?? "🌍"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-8 w-full">
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm transition-colors mb-4 block"
            >
              ← SafariTu
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{destination.emoji ?? "🌍"}</span>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {destination.name}
                </h1>
                <p className="text-white/70 text-sm">{destination.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <aside className="hidden lg:block">

            {/* Description */}
            {destination.description && (
              <div className="bg-amber-50 rounded-2xl p-5 mb-6">
                <p className="text-stone-600 text-sm leading-relaxed">
                  {destination.description}
                </p>
              </div>
            )}

            {/* Other destinations */}
            <div>
              <h3 className="font-semibold text-stone-900 text-sm mb-3 uppercase tracking-wide">
                Other Destinations
              </h3>
              <nav className="space-y-1">
                {allDestinations
                  .filter((d) => d.slug !== destinationSlug)
                  .slice(0, 8)
                  .map((d) => (
                    <Link
                      key={d.slug}
                      href={`/destinations/${d.slug}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-600 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                    >
                      <span>{d.emoji ?? "🌍"}</span>
                      <span>{d.name}</span>
                      <span className="text-stone-300 text-xs ml-auto">{d.country}</span>
                    </Link>
                  ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  Safaris in {destination.name}
                </h2>
                <p className="text-stone-400 text-sm mt-0.5">
                  {tours.length} safari{tours.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <Link
                href={`/explore?destination=${encodeURIComponent(destination.name)}`}
                className="text-sm text-amber-700 hover:underline font-medium hidden sm:block"
              >
                Advanced filters →
              </Link>
            </div>

            {tours.length === 0 ? (
              <div className="bg-stone-50 rounded-2xl p-16 text-center">
                <p className="text-5xl mb-4">{destination.emoji ?? "🌍"}</p>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  No safaris listed yet
                </h3>
                <p className="text-stone-400 text-sm">
                  Operators are adding safaris to {destination.name} soon. Check back shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {tours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/site/${tour.operator.slug}/tours/${tour.slug}`}
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
                          <span className="text-5xl">{destination.emoji ?? "🦁"}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {tour.isTopPick && (
                          <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            ⭐ Top Pick
                          </span>
                        )}
                        {tour.isFeatured && !tour.isTopPick && (
                          <span className="bg-white/90 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                        {(tour.operator as any).plan === "PRO" && (
                          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Pro
                          </span>
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
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(tour.difficulty)}`}>
                          {difficultyLabel(tour.difficulty)}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 leading-snug group-hover:text-amber-700 transition-colors mb-1.5">
                        {tour.title}
                      </h3>
                      <p className="text-stone-400 text-sm flex-1">
                        {truncate(tour.description, 90)}
                      </p>

                      {/* Operator */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-50">
                        <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                          {tour.operator.name[0]}
                        </div>
                        <span className="text-xs text-stone-400">{tour.operator.name}</span>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-xs text-stone-400">From</p>
                          <p className="text-lg font-bold text-stone-900">
                            {formatCurrency(tour.pricePerPerson, tour.currency)}
                          </p>
                        </div>
                        <span className="bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-amber-800 transition-colors">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center text-white font-bold text-xs">ST</div>
            <span>SafariTu — Only Safaris</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/"        className="hover:text-amber-400 transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-amber-400 transition-colors">Explore</Link>
            <Link href="/signup"  className="hover:text-amber-400 transition-colors">List safaris</Link>
          </div>
          <p>© {new Date().getFullYear()} SafariTu</p>
        </div>
      </footer>

    </div>
  );
}
