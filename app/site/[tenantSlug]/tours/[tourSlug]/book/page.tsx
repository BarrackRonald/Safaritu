// app/site/[tenantSlug]/tours/[tourSlug]/book/page.tsx
// Public booking page. Travelers select a departure date, enter their
// details, and pay by Mpesa or card.
// All params are awaited — required in Next.js 15 App Router.

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { formatCurrency, formatDate, formatDateRange, spotsRemaining } from "@/lib/utils";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import BookingForm from "@/components/public/BookingForm";

export const dynamic = "force-dynamic";

type Props = {
  params:       Promise<{ tenantSlug: string; tourSlug: string }>;
  searchParams: Promise<{ departureId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, tourSlug } = await params;   // ← must await

  const tour = await prisma.tour.findFirst({
    where:  { slug: tourSlug, operator: { slug: tenantSlug } },
    select: { title: true },
  });

  return {
    title: tour ? `Book — ${tour.title} | SafariTu` : "Book Safari | SafariTu",
  };
}

export default async function BookPage({ params, searchParams }: Props) {
  const { tenantSlug, tourSlug } = await params;       // ← must await
  const { departureId }          = await searchParams; // ← must await

  const tour = await prisma.tour.findFirst({
    where: {
      slug:     tourSlug,
      status:   "PUBLISHED",
      operator: { slug: tenantSlug, isActive: true },
    },
    include: {
      operator: {
        select: {
          id:           true,
          name:         true,
          slug:         true,
          logoUrl:      true,
          email:        true,
          phone:        true,
          coverImageUrl:true,
          plan:         true,
        },
      },
      departures: {
        where: {
          startDate: { gte: new Date() },
          status:    "AVAILABLE",
        },
        orderBy: { startDate: "asc" },
        select: {
          id:            true,
          startDate:     true,
          endDate:       true,
          capacity:      true,
          bookedCount:   true,
          priceOverride: true,
          status:        true,
        },
      },
    },
  });

  if (!tour) notFound();

  // If no available departures, redirect back to the tour detail page
  if (tour.departures.length === 0) {
    redirect(`/site/${tenantSlug}/tours/${tourSlug}`);
  }

  // Serialise Decimals for client components
  const serialisedTour = {
    ...tour,
    pricePerPerson: Number(tour.pricePerPerson),
    departures: tour.departures.map((d) => ({
      ...d,
      priceOverride: d.priceOverride != null ? Number(d.priceOverride) : null,
    })),
  };

  // Pre-select departure if passed in query string
  const preselectedDeparture = departureId
    ? serialisedTour.departures.find((d) => d.id === departureId) ?? serialisedTour.departures[0]
    : serialisedTour.departures[0];

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicHeader operator={tour.operator} />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <nav className="text-xs text-stone-400 flex items-center gap-2 mb-4">
            <a href={`/site/${tenantSlug}`} className="hover:text-stone-600 transition-colors">
              {tour.operator.name}
            </a>
            <span>›</span>
            <a href={`/site/${tenantSlug}/tours/${tourSlug}`} className="hover:text-stone-600 transition-colors">
              {tour.title}
            </a>
            <span>›</span>
            <span className="text-stone-600 font-medium">Book</span>
          </nav>
          <h1 className="text-3xl font-bold text-stone-900">Book your safari</h1>
          <p className="text-stone-500 mt-1">{tour.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Booking form ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <BookingForm
              tour={serialisedTour}
              operator={tour.operator}
              preselectedDepartureId={preselectedDeparture.id}
            />
          </div>

          {/* ── Order summary sidebar ────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Tour card */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              {tour.coverImageUrl ? (
                <img
                  src={tour.coverImageUrl}
                  alt={tour.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                  <span className="text-5xl">🦁</span>
                </div>
              )}
              <div className="p-5">
                <p className="font-bold text-stone-900 leading-snug">{tour.title}</p>
                <p className="text-xs text-stone-400 mt-1">
                  {tour.durationDays} days / {tour.durationNights} nights
                  {tour.location ? ` · ${tour.location}` : ""}
                </p>
                <div className="mt-3 pt-3 border-t border-stone-50">
                  <p className="text-xs text-stone-400 mb-0.5">From</p>
                  <p className="text-xl font-bold text-stone-900">
                    {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                  </p>
                  <p className="text-xs text-stone-400">per person</p>
                </div>
              </div>
            </div>

            {/* Available departures */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <h3 className="font-semibold text-stone-900 mb-3 text-sm">
                Available Departures
              </h3>
              <div className="space-y-2">
                {serialisedTour.departures.map((dep) => {
                  const spots     = spotsRemaining(dep.capacity, dep.bookedCount);
                  const isSelected = dep.id === preselectedDeparture.id;
                  return (
                    <a
                      key={dep.id}
                      href={`/site/${tenantSlug}/tours/${tourSlug}/book?departureId=${dep.id}`}
                      className={`block p-3 rounded-xl border text-sm transition-colors ${
                        isSelected
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-100 hover:border-amber-200 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-800">
                            {formatDateRange(dep.startDate, dep.endDate)}
                          </p>
                          <p className={`text-xs mt-0.5 font-medium ${
                            spots <= 3 ? "text-red-500" : "text-green-600"
                          }`}>
                            {spots} spot{spots !== 1 ? "s" : ""} left
                          </p>
                        </div>
                        {dep.priceOverride && (
                          <p className="text-sm font-bold text-amber-700">
                            {formatCurrency(dep.priceOverride, tour.currency)}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
              {[
                { icon: "🔒", text: "Secure payment — Mpesa & card" },
                { icon: "📋", text: "Instant booking confirmation"  },
                { icon: "💰", text: "Pay deposit to secure your spot"},
                { icon: "📞", text: "24/7 operator support"         },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-stone-600">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <PublicFooter operator={tour.operator} />
    </div>
  );
}