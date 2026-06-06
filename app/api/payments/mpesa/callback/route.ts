// app/api/payments/mpesa/callback/route.ts
// Safaricom calls this URL after the traveler enters their Mpesa PIN.
// This is the authoritative confirmation of payment — create the booking here.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createBookingWithPayment } from "@/lib/payments/booking";
import { sendBookingConfirmationToTraveler, sendBookingNotificationToOperator } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Safaricom callback structure
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("[mpesa callback] Invalid callback body:", JSON.stringify(body));
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const resultCode       = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    // ResultCode 0 = success, anything else = failed/cancelled
    if (resultCode !== 0) {
      console.log(`[mpesa callback] Payment failed/cancelled. Code: ${resultCode}, CheckoutRequestID: ${checkoutRequestId}`);

      // Mark the pending payment as failed
      await prisma.payment.updateMany({
        where: { providerReference: checkoutRequestId, status: "PENDING" },
        data:  { status: "FAILED" },
      });

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Extract payment details from callback metadata
    const callbackMetadata = stkCallback.CallbackMetadata?.Item ?? [];
    const getMeta = (name: string) =>
      callbackMetadata.find((i: any) => i.Name === name)?.Value;

    const mpesaReceiptNumber = getMeta("MpesaReceiptNumber") as string;
    const transactionDate    = getMeta("TransactionDate");
    const phoneNumber        = getMeta("PhoneNumber");
    const amount             = Number(getMeta("Amount"));

    if (!mpesaReceiptNumber) {
      console.error("[mpesa callback] No receipt number in callback");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotency check — has this receipt already been processed?
    const alreadyProcessed = await prisma.payment.findFirst({
      where: { providerReference: mpesaReceiptNumber, status: "PAID" },
    });
    if (alreadyProcessed) {
      console.log("[mpesa callback] Already processed:", mpesaReceiptNumber);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Find the pending payment record with the metadata
    const pendingPayment = await prisma.payment.findFirst({
      where: { providerReference: checkoutRequestId, status: "PENDING" },
    });
    if (!pendingPayment || !pendingPayment.metadata) {
      console.error("[mpesa callback] No pending payment found for:", checkoutRequestId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const meta = pendingPayment.metadata as any;

    // Fetch tour and operator for email
    const tour = await prisma.tour.findUnique({
      where:   { id: meta.tourId },
      include: { operator: { select: { name: true, email: true, phone: true } } },
    });
    const departure = await prisma.departure.findUnique({
      where:  { id: meta.departureId },
      select: { startDate: true, endDate: true },
    });

    if (!tour || !departure) {
      console.error("[mpesa callback] Tour or departure not found for:", meta.tourId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Create the booking
    const { booking, customer } = await createBookingWithPayment({
      tourId:       meta.tourId,
      departureId:  meta.departureId,
      operatorId:   meta.operatorId,
      partySize:    meta.partySize,
      totalAmount:  meta.totalAmount,
      depositAmount:meta.depositAmount,
      currency:     "KES",
      customer:     meta.customerDetails,
      payment: {
        provider:          "MPESA",
        providerReference: mpesaReceiptNumber,
        amount:            amount,
        currency:          "KES",
      },
    });

    // Delete the pending placeholder payment
    await prisma.payment.deleteMany({
      where: { providerReference: checkoutRequestId, status: "PENDING" },
    });

    // Send confirmation emails
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

    console.log(`[mpesa callback] Booking created: ${booking.reference} — Receipt: ${mpesaReceiptNumber}`);

    // Safaricom expects this exact response format
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("[mpesa callback] Error:", error);
    // Always return success to Safaricom — handle errors internally
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}