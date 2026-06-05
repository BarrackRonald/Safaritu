"use client";
// components/booking/PaymentStep.tsx
// Handles M-Pesa STK push with IPN polling + Stripe Checkout redirect.
// Multi-tenant: payment credentials are fetched server-side via API routes;
// only display info (paybill/till) is passed to this component.

import { useState, useEffect, useRef } from "react";
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

type UIState = "idle" | "processing" | "awaiting_mpesa" | "error";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90_000;

export default function PaymentStep({
  tour, form, update, totalPrice, selectedDeparture, onBack, onSuccess,
}: Props) {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pollData, setPollData] = useState<{
    bookingId: string; paymentId: string; bookingRef: string;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(90);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = tour.currency || "KES";
  const { mpesa, stripe } = tour.operator;
  const hasMpesa = !!mpesa;
  const hasStripe = !!stripe;

  // ── Poll for IPN confirmation ─────────────────────────────────────────────
  useEffect(() => {
    if (uiState !== "awaiting_mpesa" || !pollData) return;
    let elapsed = 0;

    pollRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL_MS;
      setSecondsLeft(Math.max(0, Math.round((POLL_TIMEOUT_MS - elapsed) / 1000)));
      try {
        const res = await fetch(
          `/api/bookings/status?bookingId=${pollData.bookingId}&paymentId=${pollData.paymentId}`
        );
        const data = await res.json();
        if (data.paymentStatus === "PAID") {
          clearInterval(pollRef.current!);
          clearTimeout(timeoutRef.current!);
          onSuccess(data.bookingRef);
        } else if (data.paymentStatus === "FAILED") {
          clearInterval(pollRef.current!);
          clearTimeout(timeoutRef.current!);
          setUiState("error");
          setErrorMsg("M-Pesa payment was declined or cancelled. Please try again.");
        }
      } catch { /* network blip — keep polling */ }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current!);
      setUiState("error");
      setErrorMsg(
        "We didn't receive payment confirmation. If money was deducted, contact the operator with your M-Pesa confirmation code."
      );
    }, POLL_TIMEOUT_MS);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, [uiState, pollData, onSuccess]);

  // ── M-Pesa STK push ───────────────────────────────────────────────────────
  async function handleMpesaSubmit() {
    if (!form.mpesaPhone.trim()) {
      setErrorMsg("Please enter your M-Pesa phone number.");
      return;
    }
    setErrorMsg(null);
    setUiState("processing");
    try {
      const res = await fetch("/api/bookings/mpesa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          departureId: form.departureId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          mpesaPhone: form.mpesaPhone,
          totalAmount: totalPrice,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "STK push failed");
      setPollData({ bookingId: data.bookingId, paymentId: data.paymentId, bookingRef: data.bookingRef });
      setSecondsLeft(90);
      setUiState("awaiting_mpesa");
    } catch (err: any) {
      setUiState("error");
      setErrorMsg(err.message);
    }
  }

  // ── Stripe Checkout ───────────────────────────────────────────────────────
  async function handleStripeSubmit() {
    setUiState("processing");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/bookings/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          departureId: form.departureId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          totalAmount: totalPrice,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start card payment");
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setUiState("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Payment</h2>
        <p className="text-sm text-stone-400 mt-0.5">
          {uiState === "awaiting_mpesa" ? "Waiting for M-Pesa confirmation…" : "Choose how you'd like to pay"}
        </p>
      </div>

      {/* Method picker */}
      {uiState === "idle" && !form.paymentMethod && (
        <div className="grid gap-3">
          {hasMpesa && (
            <MethodCard icon="📱" title="M-Pesa" badge="Recommended"
              subtitle={mpesa!.paybillNumber ? `Paybill ${mpesa!.paybillNumber}` : mpesa!.tillNumber ? `Till ${mpesa!.tillNumber}` : "Mobile Money"}
              onClick={() => update({ paymentMethod: "mpesa" })} />
          )}
          {hasStripe && (
            <MethodCard icon="💳" title="Credit / Debit Card"
              subtitle="Visa · Mastercard · Amex — secured by Stripe"
              onClick={() => update({ paymentMethod: "card" })} />
          )}
          {!hasMpesa && !hasStripe && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-sm text-amber-800">
              This operator hasn't enabled online payments yet. Please contact them directly.
            </div>
          )}
        </div>
      )}

      {/* M-Pesa: phone input */}
      {form.paymentMethod === "mpesa" && uiState === "idle" && (
        <div className="space-y-5">
          <BackLink onClick={() => update({ paymentMethod: null })} />

          {(mpesa?.paybillNumber || mpesa?.tillNumber) && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Paying to</p>
              {mpesa.paybillNumber && <InfoRow label="Paybill" value={mpesa.paybillNumber} mono />}
              {mpesa.tillNumber && <InfoRow label="Till Number" value={mpesa.tillNumber} mono />}
              <InfoRow label="Account" value={`${mpesa.accountPrefix}-${form.email.split("@")[0].toUpperCase()}`} mono />
              <InfoRow label="Amount" value={`${currency} ${totalPrice.toLocaleString()}`} bold />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone-700">
              Your M-Pesa Number<span className="text-amber-600 ml-0.5">*</span>
            </label>
            <input type="tel" value={form.mpesaPhone}
              onChange={(e) => update({ mpesaPhone: e.target.value })}
              placeholder="0712 345 678"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition font-mono" />
            <p className="text-xs text-stone-400">You'll receive a payment prompt on this number. Enter your PIN to confirm.</p>
          </div>

          {errorMsg && <ErrorBox msg={errorMsg} />}

          <button onClick={handleMpesaSubmit}
            className="w-full bg-green-700 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-green-800 transition-colors shadow-sm">
            Send Payment Request · {currency} {totalPrice.toLocaleString()}
          </button>
        </div>
      )}

      {/* M-Pesa: waiting for IPN */}
      {uiState === "awaiting_mpesa" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-3">
            <div className="text-4xl">📲</div>
            <p className="font-semibold text-green-900">Check your phone</p>
            <p className="text-sm text-green-700 leading-relaxed">
              A prompt for <strong>{currency} {totalPrice.toLocaleString()}</strong> was sent to{" "}
              <strong className="font-mono">{form.mpesaPhone}</strong>.<br />
              Enter your M-Pesa PIN to complete payment.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 mt-2">
              <Spinner /> Confirming… ({secondsLeft}s remaining)
            </div>
          </div>
          <p className="text-xs text-center text-stone-400">
            No prompt received?{" "}
            <button className="text-amber-700 underline" onClick={() => {
              clearInterval(pollRef.current!);
              clearTimeout(timeoutRef.current!);
              setUiState("idle");
              setPollData(null);
              update({ paymentMethod: "mpesa" });
            }}>Try again</button>
          </p>
        </div>
      )}

      {/* Card */}
      {form.paymentMethod === "card" && uiState === "idle" && (
        <div className="space-y-5">
          <BackLink onClick={() => update({ paymentMethod: null })} />
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-5 space-y-3">
            <p className="text-sm text-stone-600 leading-relaxed">
              You'll be securely redirected to Stripe. Your card details are never stored on our servers.
            </p>
            <div className="flex gap-2">
              {["VISA", "Mastercard", "AMEX"].map((c) => (
                <span key={c} className="text-xs font-bold px-2.5 py-1 bg-white border border-stone-200 rounded text-stone-500">{c}</span>
              ))}
            </div>
          </div>
          {errorMsg && <ErrorBox msg={errorMsg} />}
          <button onClick={handleStripeSubmit}
            className="w-full bg-stone-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-center gap-2">
            <LockIcon />
            Pay {currency} {totalPrice.toLocaleString()} Securely
          </button>
        </div>
      )}

      {/* Processing */}
      {uiState === "processing" && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner large />
          <p className="text-sm text-stone-500">
            {form.paymentMethod === "card" ? "Redirecting to Stripe…" : "Sending M-Pesa request…"}
          </p>
        </div>
      )}

      {/* Error (non-inline) */}
      {uiState === "error" && errorMsg && (
        <div className="space-y-4">
          <ErrorBox msg={errorMsg} />
          <button onClick={() => { setUiState("idle"); setErrorMsg(null); update({ paymentMethod: null }); }}
            className="w-full border border-stone-200 text-stone-700 py-3 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors">
            Try a different payment method
          </button>
        </div>
      )}

      {/* Footer */}
      {uiState !== "awaiting_mpesa" && uiState !== "processing" && uiState !== "error" && (
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-800 transition-colors font-medium">← Back</button>
          <p className="text-xs text-stone-400 flex items-center gap-1"><LockIcon /> Secure booking</p>
        </div>
      )}
    </div>
  );
}

function MethodCard({ icon, title, subtitle, badge, onClick }: {
  icon: string; title: string; subtitle: string; badge?: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="relative w-full text-left px-5 py-4 rounded-xl border-2 border-stone-100 hover:border-amber-500 hover:bg-amber-50 transition-all group">
      {badge && (
        <span className="absolute -top-2.5 left-4 bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
      )}
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-stone-900 text-sm">{title}</p>
          <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
        </div>
        <svg className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-green-700">{label}</span>
      <span className={`text-green-900 ${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Change payment method
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">{msg}</div>
  );
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function Spinner({ large }: { large?: boolean }) {
  return (
    <svg className={`${large ? "w-8 h-8" : "w-4 h-4"} animate-spin text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
