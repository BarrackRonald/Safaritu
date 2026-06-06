// app/api/payments/mpesa/stk-push/route.ts
// Initiates an Mpesa STK Push to the traveler's phone.
// Called by BookingForm when traveler clicks "Pay with Mpesa".
// The actual booking is created by the callback route after payment confirmation.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { initiateStkPush } from "@/lib/payments/mpesa";

const Schema = z.object({
  tourId:       z.string().min(1),
  departureId:  z.string().min(1),
  operatorId:   z.string().min(1),
  partySize:    z.number().int().min(1),
  totalAmount:  z.number().min(1),
  depositAmount:z.number().min(1),
  currency:     z.string().min(3).max(3),
  phone:        z.string().min(9),
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
      totalAmount, depositAmount, currency,
      phone, customerDetails,
    } = result.data;

    // Only support KES for Mpesa
    if (currency !== "KES") {
      return NextResponse.json(
        { success: false, error: "Mpesa only supports KES payments." },
        { status: 400 }
      );
    }

    // Verify tour exists and get details
    const tour = await prisma.tour.findFirst({
      where:  { id: tourId, status: "PUBLISHED" },
      select: { title: true, slug: true, operator: { select: { slug: true } } },
    });
    if (!tour) {
      return NextResponse.json({ success: false, error: "Safari not found" }, { status: 404 });
    }

    // Verify departure capacity
    const departure = await prisma.departure.findUnique({
      where:  { id: departureId },
      select: { capacity: true, bookedCount: true },
    });
    if (!departure || departure.capacity - departure.bookedCount < partySize) {
      return NextResponse.json(
        { success: false, error: "Not enough spots available." },
        { status: 409 }
      );
    }

    // Store pending booking data in a temporary record so the callback
    // can recreate it. We use a JSON metadata field on a pending payment
    // approach — store in a simple key-value via Prisma JSON or a temp table.
    // For simplicity we store all data needed in the Mpesa AccountReference
    // and pass it through the callback via metadata stored server-side.
    // We'll use a short-lived record in the Payment table with status PENDING.

    // Generate a temporary reference
    const tempRef = `MPESA-PENDING-${Date.now()}`;

    // Store pending payment metadata in a way the callback can retrieve it.
    // We store a JSON blob in a temporary booking entry.
    // The real booking is created in the callback after payment confirmation.
    await prisma.payment.create({
      data: {
        bookingId:         "pending", // placeholder — updated in callback
        amount:            depositAmount,
        currency:          "KES",
        provider:          "MPESA",
        providerReference: tempRef,
        status:            "PENDING",
        metadata: {
          tourId,
          departureId,
          operatorId,
          partySize,
          totalAmount,
          depositAmount,
          currency,
          customerDetails,
          tourSlug:     tour.slug,
          operatorSlug: tour.operator.slug,
        },
      },
    });

    // Initiate the STK Push
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`;

    const stkResult = await initiateStkPush({
      phone,
      amount:           depositAmount,
      accountReference: tempRef.slice(-10), // max 12 chars
      transactionDesc:  `Safari deposit`,
      callbackUrl,
    });

    // Update the pending payment with the Mpesa checkout request ID
    await prisma.payment.updateMany({
      where: { providerReference: tempRef },
      data:  { providerReference: stkResult.checkoutRequestId },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutRequestId:   stkResult.checkoutRequestId,
        merchantRequestId:   stkResult.merchantRequestId,
        responseDescription: stkResult.responseDescription,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/payments/mpesa/stk-push]", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to initiate Mpesa payment" },
      { status: 500 }
    );
  }
}