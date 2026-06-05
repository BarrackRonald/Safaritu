// app/api/bookings/mpesa/callback/route.ts
//
// Safaricom posts the STK push result to this URL.
// This must be a publicly accessible HTTPS endpoint (use ngrok in dev).
// No auth header — Safaricom doesn't send one; we verify via CheckoutRequestID match.
//
// IMPORTANT: Register this URL in your Safaricom Developer Portal as the
// CallBackURL for Lipa Na M-Pesa Online (or pass it per-request in STK push body).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSTKCallback, type STKCallbackBody } from "@/lib/mpesa/daraja";
import { confirmBookingPayment, failBookingPayment } from "@/lib/bookings/createBooking";

export async function POST(req: NextRequest) {
  let body: STKCallbackBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const parsed = parseSTKCallback(body);

  try {
    // ── Find the Payment by CheckoutRequestID ─────────────────────────────
    const payment = await prisma.payment.findFirst({
      where: {
        providerReference: parsed.checkoutRequestId,
        provider: "MPESA",
      },
      include: {
        booking: {
          select: { id: true, reference: true, operatorId: true },
        },
      },
    });

    if (!payment) {
      // Unknown CheckoutRequestID — log and acknowledge so Safaricom stops retrying
      console.error(
        `[mpesa/callback] No payment found for CheckoutRequestID: ${parsed.checkoutRequestId}`
      );
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (payment.status === "PAID") {
      // Already processed (Safaricom retries) — idempotent acknowledgement
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Already confirmed" });
    }

    if (parsed.success) {
      // ── SUCCESS: confirm booking ────────────────────────────────────────
      await confirmBookingPayment({
        bookingId: payment.bookingId,
        paymentId: payment.id,
        providerReference: parsed.mpesaReceiptNumber ?? parsed.checkoutRequestId,
        paidAt: new Date(),
        metadata: {
          mpesaReceiptNumber: parsed.mpesaReceiptNumber,
          amount: parsed.amount,
          phoneNumber: parsed.phoneNumber,
          transactionDate: parsed.transactionDate,
          checkoutRequestId: parsed.checkoutRequestId,
        },
      });

      console.info(
        `[mpesa/callback] ✅ Booking ${payment.booking.reference} confirmed. Receipt: ${parsed.mpesaReceiptNumber}`
      );

      // TODO: send confirmation email to customer here
      // await sendBookingConfirmationEmail(payment.booking.id);
    } else {
      // ── FAILURE: cancel booking + restore spots ────────────────────────
      await failBookingPayment({
        bookingId: payment.bookingId,
        paymentId: payment.id,
        reason: parsed.resultDesc,
      });

      console.warn(
        `[mpesa/callback] ❌ Payment failed for booking ${payment.booking.reference}. Code: ${parsed.resultCode} — ${parsed.resultDesc}`
      );
    }
  } catch (err) {
    console.error("[mpesa/callback] Error processing callback:", err);
    // Still return 200 so Safaricom doesn't retry indefinitely
  }

  // Safaricom expects this exact shape back
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
