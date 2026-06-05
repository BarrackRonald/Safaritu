"use client";

import { useState } from "react";
import Link from "next/link";
import StepIndicator from "./StepIndicator";
import TripDetailsStep from "./TripDetailsStep";
import GuestInfoStep from "./GuestInfoStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";

export type Departure = {
  id: string;
  startDate: string;
  endDate: string | null;
  spotsAvailable: number | null;
};

export type OperatorPayment = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  mpesa: {
    paybillNumber: string | null;
    tillNumber: string | null;
    accountPrefix: string;
  } | null;
  stripePublishableKey: string | null;
};

export type TourData = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  coverImageUrl: string | null;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  currency: string;
  highlights: string[];
  departures: Departure[];
  operator: OperatorPayment;
};

export type BookingFormData = {
  departureId: string | null;
  guests: number;
  specialRequests: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;

  paymentMethod: "mpesa" | "card" | null;
  mpesaPhone: string;
  mpesaReference: string;
};

const STEPS = ["Trip Details", "Your Info", "Payment"] as const;

interface Props {
  tour: TourData;
  preselectedDepartureId: string | null;
  tenantSlug?: string; // ✅ IMPORTANT FIX
}

export default function BookingShell({
  tour,
  preselectedDepartureId,
  tenantSlug,
}: Props) {
  const [step, setStep] = useState(0);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const [form, setForm] = useState<BookingFormData>({
    departureId: preselectedDepartureId,
    guests: 2,
    specialRequests: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "",
    paymentMethod: null,
    mpesaPhone: "",
    mpesaReference: "",
  });

  const update = (patch: Partial<BookingFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const totalPrice = form.guests * tour.pricePerPerson;

  const selectedDeparture =
    tour.departures.find((d) => d.id === form.departureId) ?? null;

  if (bookingRef) {
    return (
      <ConfirmationStep bookingRef={bookingRef} tour={tour} form={form} />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          <Link
            href={`/site/${tenantSlug}/tours/${tour.slug}`}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to safari
          </Link>

          {/* SAFE operator rendering */}
          {tour.operator?.logoUrl ? (
            <img
              src={tour.operator.logoUrl}
              alt={tour.operator.name}
              className="h-7 object-contain"
            />
          ) : (
            <span className="text-sm font-semibold text-stone-700">
              {tour.operator?.name ?? "Unknown Operator"}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-5 gap-8 items-start">

        {/* ── LEFT STEPS ─────────────────────────────────────── */}
        <div className="md:col-span-3 space-y-6">
          <StepIndicator steps={STEPS} current={step} />

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {step === 0 && (
              <TripDetailsStep
                tour={tour}
                form={form}
                update={update}
                totalPrice={totalPrice}
                selectedDeparture={selectedDeparture}
                onNext={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <GuestInfoStep
                form={form}
                update={update}
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <PaymentStep
                tour={tour}
                form={form}
                update={update}
                totalPrice={totalPrice}
                selectedDeparture={selectedDeparture}
                onBack={() => setStep(1)}
                onSuccess={(ref) => setBookingRef(ref)}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT SUMMARY ─────────────────────────────────── */}
        <aside className="md:col-span-2 space-y-4 md:sticky md:top-20">
          <OrderSummary
            tour={tour}
            form={form}
            totalPrice={totalPrice}
            selectedDeparture={selectedDeparture}
          />
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* ORDER SUMMARY */
/* ───────────────────────────────────────────── */
function OrderSummary({
  tour,
  form,
  totalPrice,
  selectedDeparture,
}: {
  tour: TourData;
  form: BookingFormData;
  totalPrice: number;
  selectedDeparture: Departure | null;
}) {
  const currency = tour.currency || "KES";

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">

      {tour.coverImageUrl ? (
        <img
          src={tour.coverImageUrl}
          alt={tour.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-amber-50 flex items-center justify-center text-5xl">
          🦁
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <p className="font-semibold text-stone-900">{tour.title}</p>
          <p className="text-xs text-stone-400 mt-1">
            {tour.durationDays}D / {tour.durationNights}N
            {tour.location ? ` · ${tour.location}` : ""}
          </p>
        </div>

        <div className="border-t border-stone-50 pt-4 space-y-2 text-sm">
          {selectedDeparture && (
            <Row
              label="Departure"
              value={new Date(
                selectedDeparture.startDate
              ).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          )}

          <Row
            label="Guests"
            value={`${form.guests} person${form.guests !== 1 ? "s" : ""}`}
          />

          <Row
            label="Price / person"
            value={`${currency} ${tour.pricePerPerson.toLocaleString()}`}
          />
        </div>

        <div className="border-t border-stone-100 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-stone-700">
              Total
            </span>
            <span className="text-xl font-bold text-amber-700">
              {currency} {totalPrice.toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-stone-400 mt-1">
            Operated by {tour.operator?.name ?? "Unknown Operator"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}