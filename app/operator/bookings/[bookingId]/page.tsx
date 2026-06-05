// app/operator/bookings/[bookingId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getBookingById } from "@/lib/prisma/bookings";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";
import OperatorShell from "@/components/layout/OperatorShell";
import BookingStatusSelect from "@/components/bookings/BookingStatusSelect";
import BookingNotesForm from "@/components/bookings/BookingNotesForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bookingId: string }> };

export async function generateMetadata({ params }: Props) {
  const { bookingId } = await params;
  return { title: `Booking ${bookingId.slice(0, 8).toUpperCase()} — SafariTu` };
}

export default async function BookingDetailPage({ params }: Props) {
  const { bookingId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const booking = await getBookingById(bookingId, operatorUser.operator.id);
  if (!booking) notFound();

  const totalPaid = booking.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <OperatorShell operator={operatorUser.operator}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/operator/bookings"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to bookings
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Booking {booking.reference}
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              Created {formatRelativeTime(booking.createdAt)} · {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <BookingStatusSelect bookingId={booking.id} current={booking.bookingStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Safari & departure */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-stone-900">Safari Details</h2>
            </div>
            <div className="p-6 flex gap-4">
              {booking.tour.coverImageUrl ? (
                <img
                  src={booking.tour.coverImageUrl}
                  alt={booking.tour.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-amber-50 flex items-center justify-center text-3xl shrink-0 border border-amber-100">
                  🦁
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 text-base">{booking.tour.title}</p>
                <div className="mt-2 space-y-1 text-sm text-stone-500">
                  <p>
                    <span className="font-medium text-stone-700">Departure:</span>{" "}
                    {formatDate(booking.departure.startDate)} → {formatDate(booking.departure.endDate)}
                  </p>
                  <p>
                    <span className="font-medium text-stone-700">Party size:</span>{" "}
                    {booking.partySize} guest{booking.partySize !== 1 ? "s" : ""}
                  </p>
                  {booking.specialRequests && (
                    <p>
                      <span className="font-medium text-stone-700">Special requests:</span>{" "}
                      {booking.specialRequests}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-stone-900">Payment Summary</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total amount</span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(Number(booking.totalAmount), booking.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Deposit</span>
                <span className="text-stone-700">
                  {formatCurrency(Number(booking.depositAmount), booking.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Balance due</span>
                <span className={Number(booking.balanceDue) > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                  {formatCurrency(Number(booking.balanceDue), booking.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total paid</span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(totalPaid, booking.currency)}
                </span>
              </div>

              {/* Payment status pill */}
              <div className="pt-2 border-t border-stone-50">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  booking.paymentStatus === "PAID"     ? "bg-green-50 text-green-700"  :
                  booking.paymentStatus === "PARTIAL"  ? "bg-amber-50 text-amber-700"  :
                  booking.paymentStatus === "REFUNDED" ? "bg-blue-50  text-blue-700"   :
                  booking.paymentStatus === "FAILED"   ? "bg-red-50   text-red-700"    :
                                                         "bg-stone-100 text-stone-500"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    booking.paymentStatus === "PAID"    ? "bg-green-500" :
                    booking.paymentStatus === "PARTIAL" ? "bg-amber-500" : "bg-stone-400"
                  }`} />
                  {booking.paymentStatus.charAt(0) + booking.paymentStatus.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Individual payments */}
            {booking.payments.length > 0 && (
              <div className="border-t border-stone-50">
                <div className="px-6 py-3 bg-stone-50">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                    Payment transactions
                  </p>
                </div>
                <div className="divide-y divide-stone-50">
                  {booking.payments.map((payment) => (
                    <div key={payment.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-700 capitalize">
                          {payment.provider.toLowerCase()}
                        </p>
                        <p className="text-xs text-stone-400">
                          {payment.providerReference ?? "No reference"}
                          {payment.paidAt ? ` · ${formatDate(payment.paidAt)}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-stone-900">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </p>
                        <p className={`text-xs font-medium ${
                          payment.status === "PAID"     ? "text-green-600" :
                          payment.status === "FAILED"   ? "text-red-600"   :
                          payment.status === "REFUNDED" ? "text-blue-600"  : "text-stone-400"
                        }`}>
                          {payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Internal notes */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-stone-900">Internal Notes</h2>
            </div>
            <div className="p-6">
              <BookingNotesForm
                bookingId={booking.id}
                initialNotes={booking.internalNotes ?? ""}
              />
            </div>
          </div>

        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Customer card */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-stone-900">Customer</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg select-none">
                  {booking.customer.firstName[0]}{booking.customer.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-stone-900">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">Customer</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-600">
                  <span>✉️</span>
                  <a href={`mailto:${booking.customer.email}`} className="hover:text-amber-700 hover:underline truncate">
                    {booking.customer.email}
                  </a>
                </div>
                {booking.customer.phone && (
                  <div className="flex items-center gap-2 text-stone-600">
                    <span>📱</span>
                    <a href={`tel:${booking.customer.phone}`} className="hover:text-amber-700 hover:underline">
                      {booking.customer.phone}
                    </a>
                  </div>
                )}
                {booking.customer.country && (
                  <div className="flex items-center gap-2 text-stone-600">
                    <span>🌍</span>
                    <span>{booking.customer.country}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-stone-50">
                <Link
                  href={`/operator/customers/${booking.customer.id}`}
                  className="text-xs text-amber-700 hover:underline font-semibold"
                >
                  View full profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Booking metadata */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <h2 className="font-semibold text-stone-900 mb-4">Booking Info</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Reference</span>
                <span className="font-mono text-stone-700 font-medium">{booking.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Created</span>
                <span className="text-stone-700">{formatDate(booking.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Last updated</span>
                <span className="text-stone-700">{formatRelativeTime(booking.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Currency</span>
                <span className="text-stone-700">{booking.currency}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </OperatorShell>
  );
}