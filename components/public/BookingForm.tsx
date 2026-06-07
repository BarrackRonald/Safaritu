"use client";
// components/public/BookingForm.tsx
// Multi-step booking form. Handles Stripe redirect and Mpesa STK push
// with real-time status polling until payment is confirmed.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateRange } from "@/lib/utils";

type Departure = {
  id:            string;
  startDate:     Date | string;
  endDate:       Date | string;
  capacity:      number;
  bookedCount:   number;
  priceOverride: number | null;
  status:        string;
};

type Tour = {
  id:             string;
  title:          string;
  pricePerPerson: number;
  currency:       string;
  minGroupSize:   number;
  maxCapacity:    number;
  departures:     Departure[];
};

type Operator = {
  id:   string;
  name: string;
  slug: string;
  plan: string;
};

type Props = {
  tour:                   Tour;
  operator:               Operator;
  preselectedDepartureId: string;
};

type CustomerDetails = {
  firstName:       string;
  lastName:        string;
  email:           string;
  phone:           string;
  country:         string;
  specialRequests: string;
};

const STEPS = ["Trip details", "Your details", "Payment"] as const;

export default function BookingForm({ tour, operator, preselectedDepartureId }: Props) {
  const router = useRouter();

  const [step,        setStep]        = useState(0);
  const [departureId, setDepartureId] = useState(preselectedDepartureId);
  const [partySize,   setPartySize]   = useState(Math.max(1, tour.minGroupSize));
  const [details,     setDetails]     = useState<CustomerDetails>({
    firstName: "", lastName: "", email: "", phone: "", country: "Kenya", specialRequests: "",
  });
  const [errors,      setErrors]      = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mpesa polling state
  const [mpesaCheckoutId,  setMpesaCheckoutId]  = useState<string | null>(null);
  const [mpesaPollStatus,  setMpesaPollStatus]  = useState<"PENDING" | "PAID" | "FAILED" | null>(null);
  const [mpesaPollCount,   setMpesaPollCount]   = useState(0);

  const departure = tour.departures.find((d) => d.id === departureId)!;
  const priceEach = departure.priceOverride ?? tour.pricePerPerson;
  const total     = priceEach * partySize;
  const deposit   = Math.ceil(total * 0.3);
  const balance   = total - deposit;
  const spotsLeft = departure.capacity - departure.bookedCount;

  // ── Mpesa polling ──────────────────────────────────────────────────────────
  const pollMpesaStatus = useCallback(async () => {
    if (!mpesaCheckoutId) return;

    try {
      const res  = await fetch(`/api/payments/mpesa/status?checkoutRequestId=${mpesaCheckoutId}`);
      const data = await res.json();

      if (!data.success) return;

      const status = data.data.status;
      setMpesaPollStatus(status);

      if (status === "PAID") {
        // Payment confirmed — redirect to success page
        const ref          = data.data.reference;
        const operatorSlug = data.data.operatorSlug ?? operator.slug;
        router.push(
          `/site/${operatorSlug}/tours/${encodeURIComponent(tour.id)}/book/success?reference=${ref}`
        );
      } else if (status === "FAILED") {
        setSubmitError("Payment was cancelled or failed. Please try again.");
        setStep(2);
        setMpesaCheckoutId(null);
      }
    } catch {
      // Ignore transient poll errors
    }
  }, [mpesaCheckoutId, operator.slug, router, tour.id]);

  // Poll every 3 seconds while waiting for Mpesa, stop after 3 minutes
  useEffect(() => {
    if (!mpesaCheckoutId || mpesaPollStatus === "PAID" || mpesaPollStatus === "FAILED") return;
    if (mpesaPollCount >= 60) {
      // Timeout after 60 polls (3 mins)
      setSubmitError("Payment timed out. If you completed the payment, check your email for confirmation.");
      setStep(2);
      setMpesaCheckoutId(null);
      return;
    }

    const interval = setInterval(() => {
      setMpesaPollCount((c) => c + 1);
      pollMpesaStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [mpesaCheckoutId, mpesaPollStatus, mpesaPollCount, pollMpesaStatus]);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateDetails(): boolean {
    const e: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!details.firstName.trim()) e.firstName = "Required";
    if (!details.lastName.trim())  e.lastName  = "Required";
    if (!details.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      e.email = "Valid email required";
    }
    if (!details.phone.trim()) e.phone = "Phone number required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNextStep() {
    if (step === 0) setStep(1);
    else if (step === 1 && validateDetails()) setStep(2);
  }

  // ── Payment handlers ────────────────────────────────────────────────────────
  const paymentPayload = {
    tourId:       tour.id,
    departureId,
    operatorId:   operator.id,
    partySize,
    totalAmount:  total,
    depositAmount:deposit,
    currency:     tour.currency,
    customerDetails: details,
  };

  async function handleStripePayment() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res  = await fetch("/api/payments/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(paymentPayload),
      });
      const data = await res.json();
      if (!data.success) { setSubmitError(data.error ?? "Payment failed."); return; }
      window.location.href = data.data.url;
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMpesaPayment() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res  = await fetch("/api/payments/mpesa/stk-push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...paymentPayload, phone: details.phone }),
      });
      const data = await res.json();
      if (!data.success) { setSubmitError(data.error ?? "Mpesa request failed."); return; }

      setMpesaCheckoutId(data.data.checkoutRequestId);
      setMpesaPollStatus("PENDING");
      setMpesaPollCount(0);
      setStep(99); // Mpesa waiting screen
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Step indicator — hide on Mpesa waiting screen */}
      {step < 3 && (
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step   ? "bg-green-500 text-white" :
                  i === step ? "bg-amber-700 text-white" :
                               "bg-stone-200 text-stone-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === step ? "text-amber-700" : "text-stone-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? "bg-green-400" : "bg-stone-200"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 0: Trip details ── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
          <h2 className="font-bold text-stone-900 text-lg">Select your trip</h2>

          {/* Departure selector */}
          <div>
            <label className={LBL}>Departure date <span className="text-red-400">*</span></label>
            <div className="space-y-2 mt-2">
              {tour.departures.map((dep) => {
                const spots    = dep.capacity - dep.bookedCount;
                const price    = dep.priceOverride ?? tour.pricePerPerson;
                const selected = dep.id === departureId;
                return (
                  <button
                    key={dep.id}
                    onClick={() => setDepartureId(dep.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-50 shadow-sm"
                        : "border-stone-200 hover:border-amber-300 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">
                        {formatDateRange(dep.startDate, dep.endDate)}
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${spots <= 3 ? "text-red-500" : "text-green-600"}`}>
                        {spots} spot{spots !== 1 ? "s" : ""} left
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">{formatCurrency(price, tour.currency)}</p>
                      <p className="text-xs text-stone-400">per person</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Party size */}
          <div>
            <label className={LBL}>Number of guests <span className="text-red-400">*</span></label>
            <p className="text-xs text-stone-400 mt-0.5 mb-3">
              Min {tour.minGroupSize} · Max {Math.min(tour.maxCapacity, spotsLeft)} available
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPartySize((p) => Math.max(tour.minGroupSize, p - 1))}
                className="w-10 h-10 rounded-full border-2 border-stone-200 hover:border-amber-400 text-stone-600 font-bold text-xl flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-2xl font-bold text-stone-900 w-8 text-center">{partySize}</span>
              <button
                onClick={() => setPartySize((p) => Math.min(Math.min(tour.maxCapacity, spotsLeft), p + 1))}
                className="w-10 h-10 rounded-full border-2 border-stone-200 hover:border-amber-400 text-stone-600 font-bold text-xl flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>

          {/* Price summary */}
          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>{formatCurrency(priceEach, tour.currency)} × {partySize} guest{partySize !== 1 ? "s" : ""}</span>
              <span className="font-medium">{formatCurrency(total, tour.currency)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Deposit due today (30%)</span>
              <span className="font-medium text-amber-700">{formatCurrency(deposit, tour.currency)}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-xs">
              <span>Balance before departure</span>
              <span>{formatCurrency(balance, tour.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Total</span>
              <span>{formatCurrency(total, tour.currency)}</span>
            </div>
          </div>

          <button onClick={handleNextStep} className={PRIMARY_BTN}>
            Continue to your details →
          </button>
        </div>
      )}

      {/* ── STEP 1: Personal details ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-stone-900 text-lg">Your details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LBL}>First name <span className="text-red-400">*</span></label>
              <input type="text" value={details.firstName} onChange={(e) => { setDetails((d) => ({ ...d, firstName: e.target.value })); setErrors((e2) => ({ ...e2, firstName: undefined })); }} placeholder="Jane" className={`${INPUT} ${errors.firstName ? "border-red-400" : ""}`} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className={LBL}>Last name <span className="text-red-400">*</span></label>
              <input type="text" value={details.lastName} onChange={(e) => { setDetails((d) => ({ ...d, lastName: e.target.value })); setErrors((e2) => ({ ...e2, lastName: undefined })); }} placeholder="Mwangi" className={`${INPUT} ${errors.lastName ? "border-red-400" : ""}`} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={LBL}>Email address <span className="text-red-400">*</span></label>
            <input type="email" value={details.email} onChange={(e) => { setDetails((d) => ({ ...d, email: e.target.value })); setErrors((e2) => ({ ...e2, email: undefined })); }} placeholder="jane@example.com" className={`${INPUT} ${errors.email ? "border-red-400" : ""}`} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className={LBL}>Phone number <span className="text-red-400">*</span></label>
            <input type="tel" value={details.phone} onChange={(e) => { setDetails((d) => ({ ...d, phone: e.target.value })); setErrors((e2) => ({ ...e2, phone: undefined })); }} placeholder="+254 7XX XXX XXX" className={`${INPUT} ${errors.phone ? "border-red-400" : ""}`} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            <p className="text-xs text-stone-400 mt-1">Used for Mpesa STK push</p>
          </div>

          <div>
            <label className={LBL}>Country</label>
            <input type="text" value={details.country} onChange={(e) => setDetails((d) => ({ ...d, country: e.target.value }))} placeholder="Kenya" className={INPUT} />
          </div>

          <div>
            <label className={LBL}>Special requests</label>
            <textarea value={details.specialRequests} onChange={(e) => setDetails((d) => ({ ...d, specialRequests: e.target.value }))} placeholder="Dietary requirements, accessibility needs, anniversaries…" rows={3} className={INPUT} />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setStep(0)} className={SECONDARY_BTN}>← Back</button>
            <button onClick={handleNextStep}   className={PRIMARY_BTN}>Continue to payment →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payment ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
          <h2 className="font-bold text-stone-900 text-lg">Payment</h2>

          {/* Summary */}
          <div className="bg-amber-50 rounded-xl p-4 text-sm space-y-1.5">
            <p className="font-semibold text-stone-900">{tour.title}</p>
            <p className="text-stone-600">{formatDateRange(departure.startDate, departure.endDate)} · {partySize} guest{partySize !== 1 ? "s" : ""}</p>
            <p className="text-stone-600">{details.firstName} {details.lastName} · {details.email}</p>
            <div className="pt-2 border-t border-amber-200 flex justify-between font-bold text-stone-900">
              <span>Deposit due now</span>
              <span className="text-amber-700">{formatCurrency(deposit, tour.currency)}</span>
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            {/* Mpesa */}
            <button
              onClick={handleMpesaPayment}
              disabled={submitting}
              className="w-full flex items-center justify-between bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="font-bold">Pay with Mpesa</p>
                  <p className="text-green-200 text-xs">STK push to {details.phone || "your phone"}</p>
                </div>
              </div>
              <span className="font-bold">{formatCurrency(deposit, tour.currency)}</span>
            </button>

            {/* Stripe */}
            <button
              onClick={handleStripePayment}
              disabled={submitting}
              className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div className="text-left">
                  <p className="font-bold">Pay with Card</p>
                  <p className="text-indigo-200 text-xs">Visa, Mastercard, American Express</p>
                </div>
              </div>
              <span className="font-bold">{formatCurrency(deposit, tour.currency)}</span>
            </button>
          </div>

          {submitting && (
            <div className="flex items-center justify-center gap-3 py-2 text-stone-500 text-sm">
              <Spinner /> Processing…
            </div>
          )}

          <p className="text-xs text-stone-400 text-center">
            By booking you agree to our Terms of Service. The balance of{" "}
            {formatCurrency(balance, tour.currency)} is due before departure.
          </p>

          <button onClick={() => setStep(1)} className={SECONDARY_BTN}>← Back</button>
        </div>
      )}

      {/* ── STEP 99: Mpesa waiting screen ── */}
      {step === 99 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center space-y-5">
          <div className="text-6xl">📱</div>
          <h2 className="font-bold text-stone-900 text-xl">Check your phone</h2>
          <p className="text-stone-500 max-w-sm mx-auto leading-relaxed">
            An Mpesa payment request of{" "}
            <span className="font-bold text-stone-900">{formatCurrency(deposit, tour.currency)}</span>{" "}
            has been sent to <span className="font-bold">{details.phone}</span>.
          </p>
          <p className="text-stone-400 text-sm">Enter your Mpesa PIN to complete the payment.</p>

          {mpesaPollStatus === "PENDING" && (
            <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
              <Spinner /> Waiting for confirmation…
            </div>
          )}

          {mpesaPollStatus === "FAILED" && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
              Payment was cancelled or failed.
            </div>
          )}

          <button
            onClick={() => { setStep(2); setSubmitError(null); setMpesaCheckoutId(null); setMpesaPollStatus(null); }}
            className="text-sm text-stone-400 hover:text-stone-600 underline"
          >
            Try a different payment method
          </button>
        </div>
      )}

    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

const INPUT       = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow bg-white mt-1.5";
const LBL         = "block text-sm font-medium text-stone-700";
const PRIMARY_BTN = "flex-1 bg-amber-700 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-800 transition-colors disabled:opacity-60";
const SECONDARY_BTN = "border border-stone-200 text-stone-600 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-stone-50 transition-colors";