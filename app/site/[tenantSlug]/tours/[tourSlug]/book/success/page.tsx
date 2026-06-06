// app/site/[tenantSlug]/tours/[tourSlug]/book/success/page.tsx
// Shown after successful payment. Retrieves booking from Stripe session
// or booking reference and displays confirmation to the traveler.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { stripe } from "@/lib/payments/stripe";
import { formatCurrency, formatDateRange, formatDate } from "@/lib/utils";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = { title: "Booking Confirmed — SafariTu" };
export const dynamic = "force-dynamic";

type Props = {
  params:       Promise<{ tenantSlug: string; tourSlug: string }>;
  searchParams: Promise<{ session_id?: string; reference?: string }>;
};

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const { tenantSlug }          = await params;
  const { session_id, reference } = await searchParams;

  // Get the operator for the header/footer
  const operator = await prisma.operator.findUnique({
    where:  { slug: tenantSlug },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      logoUrl:      true,
      email:        true,
      phone:        true,
      coverImageUrl:true,
    },
  });
  if (!operator) notFound();

  // Resolve the booking — either from Stripe session or reference
  let booking: any = null;

  if (session_id) {
    try {
      // Retrieve booking via Stripe session metadata
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const ref     = session.metadata?.bookingReference;
      if (ref) {
        booking = await prisma.booking.findUnique({
          where:   { reference: ref },
          include: {
            tour:      { select: { title: true, coverImageUrl: true, location: true, durationDays: true, durationNights: true } },
            departure: { select: { startDate: true, endDate: true } },
            customer:  { select: { firstName: true, lastName: true, email: true } },
            payments:  { where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        });
      }

      // Fallback — find by Stripe PaymentIntent reference
      if (!booking) {
        const paymentIntentId = session.payment_intent as string;
        const payment = await prisma.payment.findFirst({
          where:   { providerReference: paymentIntentId, status: "PAID" },
          include: {
            booking: {
              include: {
                tour:      { select: { title: true, coverImageUrl: true, location: true, durationDays: true, durationNights: true } },
                departure: { select: { startDate: true, endDate: true } },
                customer:  { select: { firstName: true, lastName: true, email: true } },
                payments:  { where: { status: "PAID" }, take: 1 },
              },
            },
          },
        });
        if (payment) booking = payment.booking;
      }
    } catch (error) {
      console.error("[success page] Stripe session lookup failed:", error);
    }
  }

  if (reference) {
    booking = await prisma.booking.findUnique({
      where:   { reference },
      include: {
        tour:      { select: { title: true, coverImageUrl: true, location: true, durationDays: true, durationNights: true } },
        departure: { select: { startDate: true, endDate: true } },
        customer:  { select: { firstName: true, lastName: true, email: true } },
        payments:  { where: { status: "PAID" }, take: 1 },
      },
    });
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicHeader operator={operator} />

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">

        {booking ? (
          <>
            {/* Success animation */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>

            <h1 className="text-3xl font-bold text-stone-900 mb-2">
              You&apos;re going on safari!
            </h1>
            <p className="text-stone-500 mb-8">
              A confirmation has been sent to{" "}
              <span className="font-medium text-stone-700">{booking.customer.email}</span>
            </p>

            {/* Booking card */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden text-left mb-8">

              {/* Tour image */}
              {booking.tour.coverImageUrl ? (
                <img
                  src={booking.tour.coverImageUrl}
                  alt={booking.tour.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                  <span className="text-6xl">🦁</span>
                </div>
              )}

              <div className="p-6">
                {/* Reference */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">
                      Booking Reference
                    </p>
                    <p className="text-2xl font-bold text-amber-700 tracking-wider mt-0.5">
                      {booking.reference}
                    </p>
                  </div>
                  <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    Confirmed ✓
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Safari",    value: booking.tour.title },
                    { label: "Dates",     value: formatDateRange(booking.departure.startDate, booking.departure.endDate) },
                    { label: "Location",  value: booking.tour.location ?? "East Africa" },
                    { label: "Duration",  value: `${booking.tour.durationDays} days / ${booking.tour.durationNights} nights` },
                    { label: "Guests",    value: `${booking.partySize} guest${booking.partySize !== 1 ? "s" : ""}` },
                    { label: "Guest name",value: `${booking.customer.firstName} ${booking.customer.lastName}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-stone-400">{label}</span>
                      <span className="font-medium text-stone-800">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Payment summary */}
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Deposit paid</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(Number(booking.depositAmount), booking.currency)} ✓
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Balance due before departure</span>
                    <span className="font-semibold text-amber-700">
                      {formatCurrency(Number(booking.balanceDue), booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span>{formatCurrency(Number(booking.totalAmount), booking.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left mb-8">
              <h3 className="font-bold text-stone-900 mb-3">What happens next?</h3>
              <ol className="space-y-2 text-sm text-stone-600 list-none">
                {[
                  `${operator.name} will contact you within 24 hours with full trip details and a packing list.`,
                  `Pay the remaining balance of ${formatCurrency(Number(booking.balanceDue), booking.currency)} at least 7 days before your departure date.`,
                  "Pack your bags and get ready for the adventure of a lifetime! 🦁",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href={`/site/${tenantSlug}`}
                className="border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-stone-50 transition-colors"
              >
                ← Back to safaris
              </Link>
              {operator.phone && (
                <a
                  href={`tel:${operator.phone}`}
                  className="bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-amber-800 transition-colors"
                >
                  📞 Call {operator.name}
                </a>
              )}
            </div>
          </>
        ) : (
          /* Booking not found — payment may still be processing */
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-3">
              Payment received — booking is being confirmed
            </h1>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              Your payment was successful. Your booking confirmation will arrive
              by email within a few minutes.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/site/${tenantSlug}`}
                className="bg-amber-700 text-white px-7 py-3 rounded-xl font-semibold text-sm hover:bg-amber-800 transition-colors"
              >
                Back to safaris
              </Link>
            </div>
          </>
        )}

      </div>

      <PublicFooter operator={operator} />
    </div>
  );
}