// app/api/webhooks/stripe/route.ts
// Stripe sends events here after payment is completed.
// This is the authoritative source of truth for payment confirmation —
// never trust the success URL redirect alone.
// Must be raw body (not parsed) for signature verification.

import { NextRequest, NextResponse } from "next/server";
import { constructStripeWebhookEvent } from "@/lib/payments/stripe";
import { createBookingWithPayment } from "@/lib/payments/booking";
import { sendBookingConfirmationToTraveler, sendBookingNotificationToOperator } from "@/lib/email";
import { prisma } from "@/lib/prisma/client";
import type Stripe from "stripe";

// CRITICAL: disable body parsing — Stripe requires the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(body, signature);
  } catch (error: any) {
    console.error("[stripe webhook] Signature verification failed:", error.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process if payment was successful
        if (session.payment_status !== "paid") break;

        const meta = session.metadata ?? {};

        // Extract all booking data from metadata (set when creating the session)
        const tourId        = meta.tourId;
        const departureId   = meta.departureId;
        const operatorId    = meta.operatorId;
        const partySize     = parseInt(meta.partySize ?? "1");
        const totalAmount   = parseFloat(meta.totalAmount ?? "0");
        const depositAmount = parseFloat(meta.depositAmount ?? "0");
        const currency      = meta.currency ?? "KES";

        if (!tourId || !departureId || !operatorId) {
          console.error("[stripe webhook] Missing metadata in session:", session.id);
          break;
        }

        // Check if booking already exists for this session (idempotency)
        const existing = await prisma.payment.findFirst({
          where: { providerReference: session.payment_intent as string },
        });
        if (existing) {
          console.log("[stripe webhook] Payment already processed:", session.id);
          break;
        }

        // Fetch tour and departure details for the emails
        const tour = await prisma.tour.findUnique({
          where:   { id: tourId },
          include: { operator: { select: { name: true, email: true, phone: true } } },
        });
        const departure = await prisma.departure.findUnique({
          where: { id: departureId },
          select: { startDate: true, endDate: true },
        });

        if (!tour || !departure) {
          console.error("[stripe webhook] Tour or departure not found");
          break;
        }

        // Create the booking
        const { booking, customer } = await createBookingWithPayment({
          tourId,
          departureId,
          operatorId,
          partySize,
          totalAmount,
          depositAmount,
          currency,
          customer: {
            firstName:       meta.firstName       ?? "",
            lastName:        meta.lastName        ?? "",
            email:           meta.email           ?? session.customer_email ?? "",
            phone:           meta.phone           ?? "",
            country:         meta.country         ?? "",
            specialRequests: meta.specialRequests ?? "",
          },
          payment: {
            provider:          "STRIPE",
            providerReference: session.payment_intent as string,
            amount:            depositAmount,
            currency,
          },
        });

        // Send confirmation emails (non-blocking)
        const emailData = {
          booking: {
            reference:     booking.reference,
            totalAmount:   Number(booking.totalAmount),
            depositAmount: Number(booking.depositAmount),
            balanceDue:    Number(booking.balanceDue),
            currency:      booking.currency,
            partySize:     booking.partySize,
          },
          tour: {
            title:        tour.title,
            location:     tour.location,
            durationDays: tour.durationDays,
          },
          departure: {
            startDate: departure.startDate,
            endDate:   departure.endDate,
          },
          customer: {
            firstName: customer.firstName,
            lastName:  customer.lastName,
            email:     customer.email,
          },
          operator: {
            name:  tour.operator.name,
            email: tour.operator.email,
            phone: tour.operator.phone,
          },
        };

        await Promise.allSettled([
          sendBookingConfirmationToTraveler(emailData),
          sendBookingNotificationToOperator(emailData),
        ]);

        console.log(`[stripe webhook] Booking created: ${booking.reference}`);
        break;
      }

      case "checkout.session.expired": {
        // Session expired without payment — nothing to do
        console.log("[stripe webhook] Session expired:", event.data.object.id);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        console.log(`[stripe webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[stripe webhook] Processing error:", error);
    // Return 200 so Stripe doesn't keep retrying for application errors
    // Log the error to Sentry in production
    return NextResponse.json({ received: true, error: error.message });
  }
}