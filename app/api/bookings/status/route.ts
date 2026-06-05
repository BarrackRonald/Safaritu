// app/api/bookings/status/route.ts
// Client polls this every 3s after STK push to check if IPN has confirmed the booking.
// Query: GET /api/bookings/status?bookingId=xxx&paymentId=yyy

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bookingId = searchParams.get("bookingId");
  const paymentId = searchParams.get("paymentId");

  if (!bookingId || !paymentId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      status: true,
      providerReference: true,
      booking: {
        select: {
          bookingStatus: true,
          paymentStatus: true,
          reference: true,
        },
      },
    },
  });

  if (!payment || payment.booking.id !== bookingId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    paymentStatus: payment.status,               // PENDING | PAID | FAILED
    bookingStatus: payment.booking.bookingStatus, // PENDING | CONFIRMED | CANCELLED
    bookingRef: payment.booking.reference,
    providerReference: payment.providerReference,
  });
}
