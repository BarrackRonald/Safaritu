"use client";
// components/booking/PaymentStep.tsx
//
// Multi-tenant payment routing:
//   - M-Pesa: each operator has their own paybill/till stored in OperatorPaymentConfig.
//             We either trigger an STK push (if backend supports it) or show the operator's
//             paybill/till for the user to pay manually and paste the confirmation code.
//   - Card:   Each operator may have their own Stripe publishable key. If not, we fall back
//             to the platform's key. Stripe Elements is loaded dynamically with the correct key.

import { useState } from "react";
import type { TourData, BookingFormData, Departure } from "./BookingShell";

interface Props {
  tour: TourData;
  form: BookingFormData;
  update: (patch: Partial<BookingFormData>) => void;
  totalPrice: number;
  selectedDeparture: Departure | null;
  onBack: () => void;
  onSuccess: (bookingRef: string) => void;
}

type PaymentState = "idle" | "processing" | "awaiting_mpesa" | "error";

export default function PaymentStep({
  tour,
  form,
  update,
  totalPrice,
  selectedDeparture,
  onBack,
  onSuccess,
}: Props) {
  const [state, setState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const currency = tour.currency || "KES";

  const { mpesa, stripePublishableKey } = tour.operator;
  const hasMpesa =
  !!mpesa?.paybillNumber || !!mpesa?.tillNumber;
  // If neither method is available on the operator, we show both placeholders
  // (real integration would always have at least one)
  const hasCard = true; // card is always offered; Stripe key may be platform or operator-level

  async function handleMpesaSubmit() {
    if (!form.mpesaPhone.trim()) {
      setErrorMsg("Please enter your M-Pesa phone number.");
      return;
    }
    setErrorMsg(null);
    setState("processing");

    try {
      // POST to our API route which calls the operator's M-Pesa STK push
      const res = await fetch("/api/bookings/mpesa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          departureId: form.departureId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          guestName: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          mpesaPhone: form.mpesaPhone,
          totalAmount: totalPrice,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Payment initiation failed");

      // STK push sent — now wait for user to complete on their phone
      setState("awaiting_mpesa");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  async function handleMpesaConfirm() {
    if (!form.mpesaReference.trim()) {
      setErrorMsg("Please enter the M-Pesa confirmation code from your phone.");
      return;
    }
    setErrorMsg(null);
    setState("processing");

    try {
      const res = await fetch("/api/bookings/mpesa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          departureId: form.departureId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          guestName: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          mpesaPhone: form.mpesaPhone,
          mpesaReference: form.mpesaReference,
          totalAmount: totalPrice,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");

      onSuccess(data.bookingRef);
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  async function handleCardSubmit() {
    // In production: use Stripe.js / Elements with the operator's publishable key.
    // Here we call our API which creates a Stripe PaymentIntent server-side
    // using the operator's secret key (fetched from OperatorPaymentConfig server-side).
    setState("processing");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/bookings/card/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          departureId: form.departureId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          guestName: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          totalAmount: totalPrice,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start card payment");

      // Redirect to Stripe Checkout or handle PaymentIntent with Elements
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Caller will mount Stripe Elements with data.clientSecret
        // For this scaffold we just show a placeholder
        throw new Error("Stripe Elements integration required — see comments in PaymentStep.tsx");
      }
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Payment</h2>
        <p className="text-sm text-stone-400 mt-0.5">Choose how you'd like to pay</p>
      </div>

      {/* Method selector */}
      {!form.paymentMethod && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hasMpesa && (
            <MethodCard
              icon="📱"
              title="M-Pesa"
              subtitle={
                mpesa!.paybillNumber
                  ? `Paybill ${mpesa!.paybillNumber}`
                  : mpesa!.tillNumber
                  ? `Till ${mpesa!.tillNumber}`
                  : "Mobile Money"
              }
              recommended
              onClick={() => update({ paymentMethod: "mpesa" })}
            />
          )}
          {hasCard && (
            <MethodCard
              icon="💳"
              title="Card"
              subtitle="Visa, Mastercard, Amex"
              onClick={() => update({ paymentMethod: "card" })}
            />
          )}
        </div>
      )}

      {/* ── M-Pesa flow ────────────────────────────────────────────────── */}
      {form.paymentMethod === "mpesa" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { update({ paymentMethod: null }); setState("idle"); }}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              ← Change method
            </button>
            <span className="text-sm font-semibold text-stone-800">📱 M-Pesa</span>
          </div>

          {/* Operator paybill info */}
          {mpesa && (mpesa.paybillNumber || mpesa.tillNumber) && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Pay To</p>
              {mpesa.paybillNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Paybill Number</span>
                  <span className="font-bold text-green-900 font-mono">{mpesa.paybillNumber}</span>
                </div>
              )}
              {mpesa.tillNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Till Number</span>
                  <span className="font-bold text-green-900 font-mono">{mpesa.tillNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Account Number</span>
                <span className="font-bold text-green-900 font-mono">
                  {mpesa.accountPrefix}-{form.email.split("@")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Amount</span>
                <span className="font-bold text-green-900">{currency} {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {state !== "awaiting_mpesa" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Your M-Pesa Phone Number<span className="text-amber-600 ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  value={form.mpesaPhone}
                  onChange={(e) => update({ mpesaPhone: e.target.value })}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition font-mono"
                />
                <p className="text-xs text-stone-400">
                  We'll send an STK push to this number to request payment.
                </p>
              </div>

              <button
                onClick={handleMpesaSubmit}
                disabled={state === "processing"}
                className="w-full bg-green-700 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-green-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {state === "processing" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Sending STK Push…
                  </span>
                ) : (
                  `Pay ${currency} ${totalPrice.toLocaleString()} via M-Pesa`
                )}
              </button>
            </>
          )}

          {/* After STK push: user confirms with code */}
          {state === "awaiting_mpesa" && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-sm text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Check your phone 📲</p>
                An M-Pesa payment request of <strong>{currency} {totalPrice.toLocaleString()}</strong> has been sent to <strong>{form.mpesaPhone}</strong>.
                Enter your M-Pesa PIN to complete payment, then paste the confirmation code below.
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  M-Pesa Confirmation Code<span className="text-amber-600 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.mpesaReference}
                  onChange={(e) => update({ mpesaReference: e.target.value.toUpperCase() })}
                  placeholder="e.g. RHX1K23ABC"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition font-mono tracking-widest"
                />
                <p className="text-xs text-stone-400">
                  You'll find this in the M-Pesa SMS from MPESA.
                </p>
              </div>
              <button
                onClick={handleMpesaConfirm}
                disabled={state === "processing"}
                className="w-full bg-amber-700 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {state === "processing" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Verifying…
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Card flow ──────────────────────────────────────────────────── */}
      {form.paymentMethod === "card" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { update({ paymentMethod: null }); setState("idle"); }}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              ← Change method
            </button>
            <span className="text-sm font-semibold text-stone-800">💳 Card Payment</span>
          </div>

          <div className="bg-stone-50 border border-stone-100 rounded-xl p-5 space-y-3">
            <p className="text-xs text-stone-500">
              You'll be securely redirected to complete your payment via Stripe.
              {stripePublishableKey
                ? " Payment is processed directly by the operator."
                : " Payment is processed on behalf of the operator."}
            </p>
            <div className="flex gap-2">
              {["VISA", "MC", "AMEX"].map((c) => (
                <span key={c} className="text-xs font-bold px-2 py-1 bg-white border border-stone-200 rounded text-stone-500 font-mono">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleCardSubmit}
            disabled={state === "processing"}
            className="w-full bg-stone-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {state === "processing" ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Redirecting to payment…
              </span>
            ) : (
              `Pay ${currency} ${totalPrice.toLocaleString()} by Card`
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* Back */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <button
          onClick={onBack}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors font-medium"
        >
          ← Back
        </button>
        <p className="text-xs text-stone-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure booking
        </p>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  subtitle,
  recommended,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left px-4 py-4 rounded-xl border-2 border-stone-100 hover:border-amber-500 hover:bg-amber-50 transition-all group"
    >
      {recommended && (
        <span className="absolute -top-2.5 left-3 bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Recommended
        </span>
      )}
      <p className="text-2xl mb-2">{icon}</p>
      <p className="font-semibold text-stone-900 text-sm">{title}</p>
      <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-200 group-hover:text-amber-500 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}