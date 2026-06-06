// app/api/payments/mpesa/status/route.ts
// Frontend polls this endpoint after STK push to check if payment completed.
// Returns the booking reference once confirmed so frontend can redirect.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: "Missing checkoutRequestId" }, { status: 400 });
    }

    // Check if the pending payment has been converted to a confirmed booking
    // The callback deletes the PENDING record and creates a real booking
    const pending = await prisma.payment.findFirst({
      where:  { providerReference: checkoutRequestId, status: "PENDING" },
    });

    if (pending) {
      // Still waiting for callback
      return NextResponse.json({ success: true, data: { status: "PENDING" } });
    }

    // Check if a PAID payment exists with a receipt number that came from this session
    // We do this by checking for a recently created booking
    const recentPayment = await prisma.payment.findFirst({
      where: {
        provider:  "MPESA",
        status:    "PAID",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // within last 10 mins
      },
      include: {
        booking: {
          select: {
            reference: true,
            tour: { select: { operator: { select: { slug: true } } } },
            tourId:    true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentPayment && recentPayment.booking.reference !== "pending") {
      return NextResponse.json({
        success: true,
        data: {
          status:    "PAID",
          reference: recentPayment.booking.reference,
          operatorSlug: recentPayment.booking.tour.operator.slug,
        },
      });
    }

    // Check if payment failed
    const failed = await prisma.payment.findFirst({
      where: { providerReference: checkoutRequestId, status: "FAILED" },
    });
    if (failed) {
      return NextResponse.json({ success: true, data: { status: "FAILED" } });
    }

    return NextResponse.json({ success: true, data: { status: "PENDING" } });
  } catch (error) {
    console.error("[GET /api/payments/mpesa/status]", error);
    return NextResponse.json({ success: false, error: "Status check failed" }, { status: 500 });
  }
}