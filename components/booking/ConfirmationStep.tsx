"use client";
// components/booking/ConfirmationStep.tsx

import Link from "next/link";
import type { TourData, BookingFormData } from "./BookingShell";

interface Props {
  bookingRef: string;
  tour: TourData;
  form: BookingFormData;
}

export default function ConfirmationStep({ bookingRef, tour, form }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-stone-900">Booking Confirmed!</h1>
          <p className="text-stone-500 text-sm mt-2">
            Your safari is booked. A confirmation has been sent to{" "}
            <span className="font-medium text-stone-700">{form.email}</span>.
          </p>
        </div>

        {/* Booking details card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            {tour.coverImageUrl ? (
              <img src={tour.coverImageUrl} alt={tour.title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-100" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🦁</div>
            )}
            <div>
              <p className="font-semibold text-stone-900">{tour.title}</p>
              <p className="text-xs text-stone-400">{tour.durationDays}D / {tour.durationNights}N · {tour.operator.name}</p>
            </div>
          </div>

          <div className="border-t border-stone-50 pt-4 space-y-2 text-sm">
            <Row label="Booking Ref" value={bookingRef} mono />
            <Row label="Guests" value={`${form.guests} person${form.guests !== 1 ? "s" : ""}`} />
            <Row
              label="Payment"
              value={form.paymentMethod === "mpesa" ? `M-Pesa · ${form.mpesaReference}` : "Card"}
            />
            <Row label="Guest" value={`${form.firstName} ${form.lastName}`} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/operators/${tour.operator.slug}`}
            className="bg-amber-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm"
          >
            View Operator Profile
          </Link>
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-stone-600">
      <span className="text-stone-400">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-amber-700" : ""}`}>{value}</span>
    </div>
  );
}