// app/api/bookings/stripe/webhook/route.ts
// Stripe posts checkout.session.completed here.
// We verify the signature using the OPERATOR's own webhook secret.
//
// Setup: In each operator's Stripe dashboard, create a webhook pointing to:
//   https://yourdomain.com/api/bookings/stripe/webhook
// and store the signing secret in OperatorPaymentConfig.stripeWebhookSecret

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { confirmBookingPayment } from "@/lib/bookings/createBooking";

// Stripe requires the raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // ── 1. Peek at metadata without verifying (to get operatorId for key lookup) ──
  // We parse the raw JSON just for the metadata fields, then re-verify with the right key.
  let unverifiedEvent: Stripe.Event;
  try {
    unverifiedEvent = JSON.parse(rawBody) as Stripe.Event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = unverifiedEvent?.data?.object as Stripe.Checkout.Session | undefined;
  const operatorId = session?.metadata?.operatorId;
  const bookingId = session?.metadata?.bookingId;
  const paymentId = session?.metadata?.paymentId;

  if (!operatorId || !bookingId || !paymentId) {
    // Not one of our sessions — ignore
    return NextResponse.json({ received: true });
  }

  // ── 2. Load operator's webhook secret ──────────────────────────────────────
  const config = await prisma.operatorPaymentConfig.findUnique({
    where: { operatorId },
    select: { stripeSecretKey: true, stripeWebhookSecret: true },
  });

  if (!config?.stripeSecretKey) {
    console.error(`[stripe/webhook] No Stripe config for operator ${operatorId}`);
    return NextResponse.json({ error: "Operator config not found" }, { status: 400 });
  }

  const webhookSecret =
    config.stripeWebhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET_FALLBACK;

  if (!webhookSecret) {
    console.error("[stripe/webhook] No webhook secret available");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  // ── 3. Verify signature with operator's key ─────────────────────────────────
  const stripe = new Stripe(config.stripeSecretKey, { apiVersion: "2024-04-10" });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe/webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 4. Handle event ─────────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const completedSession = event.data.object as Stripe.Checkout.Session;

    if (completedSession.payment_status === "paid") {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { status: true },
      });

      if (payment?.status === "PAID") {
        // Idempotent — already confirmed
        return NextResponse.json({ received: true });
      }

      await confirmBookingPayment({
        bookingId,
        paymentId,
        providerReference: completedSession.payment_intent as string,
        paidAt: new Date(),
        metadata: {
          stripeSessionId: completedSession.id,
          paymentIntent: completedSession.payment_intent,
          customerEmail: completedSession.customer_email,
        },
      });

      console.info(
        `[stripe/webhook] ✅ Booking ${session?.metadata?.bookingRef} confirmed via Stripe.`
      );

      // TODO: send confirmation email
      // await sendBookingConfirmationEmail(bookingId);
    }
  }

  return NextResponse.json({ received: true });
}
