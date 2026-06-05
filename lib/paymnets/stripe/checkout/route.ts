// app/api/payments/stripe/checkout/route.ts
// Creates a Stripe Checkout Session for safari deposit payments.
// Called by BookingForm when the traveler clicks "Pay with Card".

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";

const Schema = z.object({
  tourId:      z.string().min(1),
  departureId: z.string().min(1),
  operatorId:  z.string().min(1),
  partySize:   z.number().int().min(1),
  totalAmount: z.number().min(1),
  depositAmount: z.number().min(1),
  currency:    z.string().min(3).max(3),
  customerDetails: z.object({
    firstName:       z.string().min(1),
    lastName:        z.string().min(1),
    email:           z.string().email(),
    phone:           z.string().min(1),
    country:         z.string(),
    specialRequests: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json();
    const result = Schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      tourId, departureId, operatorId, partySize,
      totalAmount, depositAmount, currency, customerDetails,
    } = result.data;

    // Fetch tour and operator details for the checkout session
    const tour = await prisma.tour.findFirst({
      where:  { id: tourId, status: "PUBLISHED" },
      select: { title: true, slug: true, operator: { select: { slug: true, stripeCustomerId: true } } },
    });
    if (!tour) {
      return NextResponse.json({ success: false, error: "Safari not found" }, { status: 404 });
    }

    // Verify departure still has capacity
    const departure = await prisma.departure.findUnique({
      where:  { id: departureId },
      select: { capacity: true, bookedCount: true },
    });
    if (!departure || departure.capacity - departure.bookedCount < partySize) {
      return NextResponse.json(
        { success: false, error: "Not enough spots available for this departure." },
        { status: 409 }
      );
    }

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL!;
    const operatorSlug = tour.operator.slug;
    const successUrl  = `${appUrl}/site/${operatorSlug}/tours/${tour.slug}/book/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl   = `${appUrl}/site/${operatorSlug}/tours/${tour.slug}/book?cancelled=true`;

    const session = await createStripeCheckoutSession({
      tourId,
      tourTitle:               tour.title,
      departureId,
      operatorId,
      operatorStripeCustomerId: tour.operator.stripeCustomerId,
      partySize,
      depositAmount,
      totalAmount,
      currency,
      customerEmail:  customerDetails.email,
      customerName:   `${customerDetails.firstName} ${customerDetails.lastName}`,
      successUrl,
      cancelUrl,
      metadata: {
        firstName:       customerDetails.firstName,
        lastName:        customerDetails.lastName,
        email:           customerDetails.email,
        phone:           customerDetails.phone,
        country:         customerDetails.country,
        specialRequests: customerDetails.specialRequests,
      },
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error: any) {
    console.error("[POST /api/payments/stripe/checkout]", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to create checkout session" },
      { status: 500 }
    );
  }
}