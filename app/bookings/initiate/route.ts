// app/api/bookings/mpesa/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDarajaToken, initiateSTKPush, normalisePhone, type DarajaConfig } from "@/lib/mpesa/daraja";
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
      mpesaPhone,
      totalAmount,
      currency,
    } = body;

    // ── 1. Load tour + operator payment config ──────────────────────────────
    const tour = await prisma.tour.findUniqueOrThrow({
      where: { id: tourId },
      select: {
        operatorId: true,
        title: true,
        operator: {
          select: {
            paymentConfig: {
              select: {
                mpesaEnabled: true,
                mpesaConsumerKey: true,
                mpesaConsumerSecret: true,
                mpesaPasskey: true,
                mpesaShortcode: true,
                mpesaEnvironment: true,
                mpesaCallbackUrl: true,
              },
            },
          },
        },
      },
    });

    const cfg = tour.operator.paymentConfig;

    if (!cfg?.mpesaEnabled) {
      return NextResponse.json(
        { error: "M-Pesa payments are not enabled for this operator." },
        { status: 400 }
      );
    }

    if (
      !cfg.mpesaConsumerKey ||
      !cfg.mpesaConsumerSecret ||
      !cfg.mpesaPasskey ||
      !cfg.mpesaShortcode
    ) {
      return NextResponse.json(
        { error: "Operator M-Pesa configuration is incomplete. Please contact the operator." },
        { status: 400 }
      );
    }

    // ── 2. Normalise phone ──────────────────────────────────────────────────
    let normalisedPhone: string;
    try {
      normalisedPhone = normalisePhone(mpesaPhone);
    } catch {
      return NextResponse.json(
        { error: "Invalid M-Pesa phone number. Use format 07XXXXXXXX." },
        { status: 400 }
      );
    }

    // ── 3. Create pending booking first (so we have an ID for AccountReference) ──
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
      provider: "MPESA",
      // providerReference will be updated once we get CheckoutRequestID
    });

    // ── 4. Build Daraja config ──────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const darajaConfig: DarajaConfig = {
      consumerKey: cfg.mpesaConsumerKey,
      consumerSecret: cfg.mpesaConsumerSecret,
      passkey: cfg.mpesaPasskey,
      shortcode: cfg.mpesaShortcode,
      environment: (cfg.mpesaEnvironment ?? "sandbox") as "sandbox" | "production",
      callbackUrl:
        cfg.mpesaCallbackUrl ??
        `${appUrl}/api/bookings/mpesa/callback`,
    };

    // ── 5. Get token ────────────────────────────────────────────────────────
    const token = await getDarajaToken(darajaConfig);

    // ── 6. Fire STK push ────────────────────────────────────────────────────
    const stkResponse = await initiateSTKPush({
      config: darajaConfig,
      token,
      phoneNumber: normalisedPhone,
      amount: totalAmount,
      accountReference: booking.reference, // e.g. BK-XYZ12345
      transactionDesc: `Safari booking`,
    });

    if (stkResponse.ResponseCode !== "0") {
      // Roll back the booking
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { bookingStatus: "CANCELLED", paymentStatus: "FAILED" },
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        }),
      ]);
      return NextResponse.json(
        { error: stkResponse.ResponseDescription },
        { status: 502 }
      );
    }

    // ── 7. Store CheckoutRequestID on the payment for IPN matching ──────────
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: stkResponse.CheckoutRequestID,
        metadata: {
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
          mpesaPhone: normalisedPhone,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      paymentId: payment.id,
      bookingRef: booking.reference,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: stkResponse.CustomerMessage,
    });
  } catch (err: any) {
    console.error("[mpesa/initiate]", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
