// app/api/bookings/stripe/create-checkout/route.ts
// Creates a Stripe Checkout Session using the OPERATOR's own Stripe secret key.
// The booking is created as PENDING; the webhook confirms it.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createPendingBooking } from "@/lib/bookings/createBooking";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tourId,
      departureId,
      guests,
      specialRequests,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      totalAmount,
      currency,
    } = body;

    // ── 1. Load operator Stripe config ──────────────────────────────────────
    const tour = await prisma.tour.findUniqueOrThrow({
      where: { id: tourId },
      select: {
        operatorId: true,
        title: true,
        coverImageUrl: true,
        slug: true,
        operator: {
          select: {
            slug: true,
            paymentConfig: {
              select: {
                stripeEnabled: true,
                stripeSecretKey: true,
                stripeWebhookSecret: true,
              },
            },
          },
        },
      },
    });

    const cfg = tour.operator.paymentConfig;

    if (!cfg?.stripeEnabled || !cfg.stripeSecretKey) {
      return NextResponse.json(
        { error: "Card payments are not enabled for this operator." },
        { status: 400 }
      );
    }

    // ── 2. Create pending booking ───────────────────────────────────────────
    const { booking, payment } = await createPendingBooking({
      operatorId: tour.operatorId,
      tourId,
      departureId,
      partySize: guests,
      totalAmount,
      currency,
      specialRequests,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      provider: "STRIPE",
    });

    // ── 3. Init Stripe with operator's own secret key ───────────────────────
    const stripe = new Stripe(cfg.stripeSecretKey, {
      apiVersion: "2024-04-10",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const tenantSlug = tour.operator.slug;

    // ── 4. Create Checkout Session ──────────────────────────────────────────
    // Stripe amounts are in smallest currency unit (KES cents = fils, but KES is 0-decimal)
    // KES is a zero-decimal currency in Stripe, so amount = whole KES value
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: tour.title,
              images: tour.coverImageUrl ? [tour.coverImageUrl] : [],
              description: `${guests} guest${guests !== 1 ? "s" : ""} · Ref: ${booking.reference}`,
            },
            unit_amount: Math.ceil(totalAmount), // KES is zero-decimal in Stripe
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
        bookingRef: booking.reference,
        operatorId: tour.operatorId,
      },
      success_url: `${appUrl}/site/${tenantSlug}/tours/${tour.slug}/book/success?session_id={CHECKOUT_SESSION_ID}&ref=${booking.reference}`,
      cancel_url: `${appUrl}/site/${tenantSlug}/tours/${tour.slug}/book?cancelled=1`,
    });

    // ── 5. Store Stripe session ID on payment record ────────────────────────
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: session.id,
        metadata: {
          stripeSessionId: session.id,
          bookingRef: booking.reference,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: any) {
    console.error("[stripe/create-checkout]", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
