"use client";
// components/booking/PaymentStep.tsx

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

  const hasCard = true;

  // =====================================================
  // ✅ ADDITION 1 & 2: DEPOSIT LOGIC (20%–100%)
  // =====================================================
  const paymentType = form.paymentType || "full";

  const depositPercent =
    paymentType === "deposit"
      ? Math.min(Math.max(form.depositPercent ?? 20, 20), 100)
      : 100;

  const payableAmount = Math.round(
    (totalPrice * depositPercent) / 100
  );

  // =====================================================
  // ✅ ADDITION 3: SAFE JSON PARSING (FIX HTML ERROR)
  // =====================================================
  async function safeJson(res: Response) {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(
        "Server did not return JSON. Possible backend error or HTML response."
      );
    }
  }

  async function handleMpesaSubmit() {
    if (!form.mpesaPhone.trim()) {
      setErrorMsg("Please enter your M-Pesa phone number.");
      return;
    }

    setErrorMsg(null);
    setState("processing");

    try {
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

          // ✅ UPDATED ONLY
          totalAmount: payableAmount,
          currency,

          paymentType,
          depositPercent,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Payment initiation failed");

      setState("awaiting_mpesa");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  async function handleMpesaConfirm() {
    if (!form.mpesaReference.trim()) {
      setErrorMsg("Please enter the M-Pesa confirmation code.");
      return;
    }

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

          // ✅ UPDATED ONLY
          totalAmount: payableAmount,
          currency,

          paymentType,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Confirmation failed");

      onSuccess(data.bookingRef);
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  async function handleCardSubmit() {
    setState("processing");

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

          // ✅ UPDATED ONLY
          totalAmount: payableAmount,
          currency,

          paymentType,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Card payment failed");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">

      {/* ================= PAYMENT TYPE ================= */}
      {!form.paymentMethod && (
        <div className="flex gap-3">
          <button
            onClick={() =>
              update({ paymentType: "full", depositPercent: 100 })
            }
            className={`px-3 py-2 border rounded ${
              paymentType === "full"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Full Payment
          </button>

          <button
            onClick={() =>
              update({
                paymentType: "deposit",
                depositPercent: 20,
              })
            }
            className={`px-3 py-2 border rounded ${
              paymentType === "deposit"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Deposit
          </button>
        </div>
      )}

      {/* ================= METHOD SELECTOR ================= */}
      {!form.paymentMethod && (
        <div className="grid grid-cols-2 gap-3">
          {hasMpesa && (
            <MethodCard
              icon="📱"
              title="M-Pesa"
              subtitle="Mobile Money"
              onClick={() => update({ paymentMethod: "mpesa" })}
            />
          )}

          {hasCard && (
            <MethodCard
              icon="💳"
              title="Card"
              subtitle="Visa / Mastercard"
              onClick={() => update({ paymentMethod: "card" })}
            />
          )}
        </div>
      )}

      {/* ================= AMOUNT DISPLAY ================= */}
      <div className="bg-stone-50 p-3 rounded-xl">
        Payable:
        <b>
          {" "}
          {currency} {payableAmount.toLocaleString()}
        </b>
      </div>

      {/* ================= MPESA ================= */}
      {form.paymentMethod === "mpesa" && (
        <div className="space-y-4">

          <input
            value={form.mpesaPhone}
            onChange={(e) =>
              update({ mpesaPhone: e.target.value })
            }
            className="border p-2 w-full"
            placeholder="Phone"
          />

          <button onClick={handleMpesaSubmit}>
            Pay via M-Pesa
          </button>

          {state === "awaiting_mpesa" && (
            <>
              <input
                value={form.mpesaReference}
                onChange={(e) =>
                  update({
                    mpesaReference: e.target.value,
                  })
                }
                className="border p-2 w-full"
                placeholder="Code"
              />

              <button onClick={handleMpesaConfirm}>
                Confirm Booking
              </button>
            </>
          )}
        </div>
      )}

      {/* ================= CARD ================= */}
      {form.paymentMethod === "card" && (
        <button onClick={handleCardSubmit}>
          Pay by Card
        </button>
      )}

      {/* ================= ERROR ================= */}
      {errorMsg && (
        <div className="text-red-600">{errorMsg}</div>
      )}

      <button onClick={onBack}>Back</button>
    </div>
  );
}

/* ================= METHOD CARD ================= */
function MethodCard({
  icon,
  title,
  subtitle,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      className="border p-4 rounded text-left bg-white"
    >
      <div>{icon}</div>
      <div className="font-bold">{title}</div>
      <div className="text-xs">{subtitle}</div>
    </button>
  );
}