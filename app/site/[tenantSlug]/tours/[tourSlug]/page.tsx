// app/site/[tenantSlug]/tours/[tourSlug]/page.tsx
// Individual safari detail page. Fully server-rendered for SEO.
// Shows hero image, highlights, full itinerary, departures, and book CTA.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicOperator, getPublicTourBySlug, getRelatedTours } from "@/lib/prisma/public";
import { formatCurrency, formatDate, formatDateRange, difficultyLabel, difficultyColor, spotsRemaining, occupancyRate } from "@/lib/utils";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import TourGallery from "@/components/public/TourGallery";
import TourGrid from "@/components/public/TourGrid";

type Props = { params: Promise<{ tenantSlug: string; tourSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, tourSlug } = await params;

  console.log("[generateMetadata] tenantSlug:", tenantSlug, "tourSlug:", tourSlug);

  const operator = await getPublicOperator(tenantSlug);
  console.log("[generateMetadata] operator:", operator?.id ?? null, operator?.slug ?? null);
  if (!operator) return {};

  const tour = await getPublicTourBySlug(operator.id, tourSlug);
  console.log("[generateMetadata] tour:", tour?.id ?? null, tour?.slug ?? null);
  if (!tour) return {};

  return {
    title:       `${tour.title} — ${operator.name}`,
    description: tour.description.slice(0, 160),
    openGraph: {
      title:       tour.title,
      description: tour.description.slice(0, 160),
      images:      tour.coverImageUrl ? [tour.coverImageUrl] : [],
      type:        "website",
    },
    // JSON-LD structured data for Google rich results
    other: {
      "application/ld+json": JSON.stringify({
        "@context":    "https://schema.org",
        "@type":       "TouristTrip",
        name:          tour.title,
        description:   tour.description,
        image:         tour.coverImageUrl ?? undefined,
        offers: {
          "@type":     "Offer",
          price:       Number(tour.pricePerPerson),
          priceCurrency: tour.currency,
          availability: "https://schema.org/InStock",
        },
      }),
    },
  };
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch:     "☀️",
  dinner:    "🌙",
};

export default async function TourDetailPage({ params }: Props) {
  const { tenantSlug, tourSlug } = await params;

  console.log("[TourDetailPage] tenantSlug:", tenantSlug, "tourSlug:", tourSlug);

  const operator = await getPublicOperator(tenantSlug);
  console.log("[TourDetailPage] operator:", operator?.id ?? null, operator?.slug ?? null);
  if (!operator) {
    console.log("[TourDetailPage] → notFound() triggered by missing operator");
    notFound();
  }

  const [tour, related] = await Promise.all([
    getPublicTourBySlug(operator.id, tourSlug),
    getRelatedTours(operator.id, tourSlug),
  ]);
  console.log("[TourDetailPage] tour:", tour?.id ?? null, tour?.slug ?? null);
  console.log("[TourDetailPage] related count:", related.length);
  if (!tour) {
    console.log("[TourDetailPage] → notFound() triggered by missing tour (operatorId:", operator.id, ", tourSlug:", tourSlug, ")");
    notFound();
  }

  const hasAvailableDepartures = tour.departures.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader operator={operator} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative bg-stone-900 h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {tour.coverImageUrl ? (
          <img
            src={tour.coverImageUrl}
            alt={tour.title}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-amber-900 flex items-center justify-center">
            <span className="text-8xl opacity-30">🦁</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-6">
          <Link
            href={`/site/${tenantSlug}`}
            className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1"
          >
            ← {operator.name}
          </Link>
        </div>

        {/* Badges */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
          {tour.isFeatured && (
            <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              ⭐ Featured
            </span>
          )}
          {tour.isTopPick && (
            <span className="bg-white text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
              🏆 Top Pick
            </span>
          )}
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {tour.location && (
                <span className="text-amber-300 text-sm font-medium flex items-center gap-1">
                  📍 {tour.location}
                </span>
              )}
              <span className="text-white/60 text-sm">
                {tour.durationDays} days / {tour.durationNights} nights
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColor(tour.difficulty)}`}>
                {difficultyLabel(tour.difficulty)}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
              {tour.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: tour details ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: "📅", label: "Duration",  value: `${tour.durationDays}D / ${tour.durationNights}N` },
                { icon: "👥", label: "Group size", value: `${tour.minGroupSize}–${tour.maxCapacity} guests`  },
                { icon: "🏔️", label: "Difficulty", value: difficultyLabel(tour.difficulty) },
                { icon: "📍", label: "Location",   value: tour.location ?? tour.country ?? "Africa"         },
              ].map((s) => (
                <div key={s.label} className="bg-stone-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">{s.label}</p>
                  <p className="text-sm font-semibold text-stone-800">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4">About this Safari</h2>
              <p className="text-stone-600 leading-relaxed text-base">{tour.description}</p>
            </div>

            {/* Highlights */}
            {tour.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-4">Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.filter(Boolean).map((h, i) => (
                    <div key={i} className="flex items-start gap-3 bg-amber-50 rounded-xl p-3.5">
                      <span className="text-amber-600 font-bold mt-0.5 shrink-0">✓</span>
                      <span className="text-stone-700 text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {tour.imageUrls.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-4">Gallery</h2>
                <TourGallery images={tour.imageUrls} title={tour.title} />
              </div>
            )}

            {/* Itinerary */}
            {tour.itineraryDays.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {tour.itineraryDays.map((day) => (
                    <details
                      key={day.id}
                      className="group bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm"
                      open={day.dayNumber === 1}
                    >
                      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-stone-50 transition-colors list-none">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-700 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                            {day.dayNumber}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{day.title}</p>
                            {day.accommodation && (
                              <p className="text-xs text-stone-400 mt-0.5">
                                🏕️ {day.accommodation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {day.mealsIncluded.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                              {day.mealsIncluded.map((m) => (
                                <span key={m} title={m} className="text-sm">
                                  {MEAL_ICONS[m] ?? "🍽️"}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-stone-400 group-open:rotate-180 transition-transform text-lg">
                            ↓
                          </span>
                        </div>
                      </summary>
                      <div className="px-6 pb-5 pt-2 border-t border-stone-50">
                        <p className="text-stone-600 text-sm leading-relaxed mb-4">
                          {day.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {day.activities.filter(Boolean).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                                Activities
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {day.activities.filter(Boolean).map((a, i) => (
                                  <span key={i} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {day.mealsIncluded.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                                Meals
                              </p>
                              <div className="flex gap-2">
                                {day.mealsIncluded.map((m) => (
                                  <span key={m} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full capitalize">
                                    {MEAL_ICONS[m]} {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Includes / Excludes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tour.includes.filter(Boolean).length > 0 && (
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-green-600">✓</span> What&apos;s Included
                  </h3>
                  <ul className="space-y-2">
                    {tour.includes.filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.excludes.filter(Boolean).length > 0 && (
                <div className="bg-red-50 rounded-2xl p-6">
                  <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-red-400">✕</span> Not Included
                  </h3>
                  <ul className="space-y-2">
                    {tour.excludes.filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* ── Right: sticky booking card ─────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">

              {/* Price card */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6">
                <div className="text-center mb-5 pb-5 border-b border-stone-100">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">From</p>
                  <p className="text-4xl font-bold text-stone-900">
                    {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                  </p>
                  <p className="text-stone-400 text-sm mt-1">per person</p>
                </div>

                {/* Available departures */}
                {hasAvailableDepartures ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
                      Available Departures
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {tour.departures.map((dep) => {
                        const spots = spotsRemaining(dep.capacity, dep.bookedCount);
                        const occ   = occupancyRate(dep.capacity, dep.bookedCount);
                        const almostFull = occ >= 80;
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center justify-between bg-stone-50 rounded-xl px-3.5 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-medium text-stone-800">
                                {formatDate(dep.startDate)}
                              </p>
                              <p className="text-xs text-stone-400">
                                → {formatDate(dep.endDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              {dep.priceOverride && (
                                <p className="text-xs font-semibold text-amber-700">
                                  {formatCurrency(Number(dep.priceOverride), tour.currency)}
                                </p>
                              )}
                              <p className={`text-xs font-medium ${almostFull ? "text-red-500" : "text-green-600"}`}>
                                {spots} spot{spots !== 1 ? "s" : ""} left
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-700 font-medium">
                      No departure dates listed yet.
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Contact us to arrange a custom date.
                    </p>
                  </div>
                )}

                {/* Book CTA */}
                <Link
                  href={`/site/${tenantSlug}/tours/${tour.slug}/book`}
                  className="block w-full bg-amber-700 hover:bg-amber-800 text-white text-center font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm"
                >
                  Book This Safari
                </Link>

                {/* Contact alternative */}
                {operator.phone && (
                  <a
                    href={`tel:${operator.phone}`}
                    className="block w-full mt-3 border border-stone-200 text-stone-700 text-center font-semibold py-3 rounded-xl hover:bg-stone-50 transition-colors text-sm"
                  >
                    📞 Call to Enquire
                  </a>
                )}

                <p className="text-center text-xs text-stone-400 mt-4">
                  Free cancellation · Secure payment
                </p>
              </div>

              {/* Operator mini card */}
              <div className="bg-stone-50 rounded-2xl p-5">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                  Your Operator
                </p>
                <div className="flex items-center gap-3">
                  {operator.logoUrl ? (
                    <img
                      src={operator.logoUrl}
                      alt={operator.name}
                      className="w-10 h-10 rounded-xl object-contain bg-white border border-stone-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold">
                      {operator.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{operator.name}</p>
                    <p className="text-xs text-stone-400">Licensed safari operator</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Related safaris ─────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              More Safaris You Might Like
            </h2>
            <TourGrid tours={related} operatorSlug={tenantSlug} />
          </section>
        )}

      </div>

      <PublicFooter operator={operator} />
    </div>
  );
}