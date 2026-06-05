// lib/bookings/createBooking.ts
// Shared logic used by both the M-Pesa and Stripe initiation routes.
// Creates (or upserts) the Customer, creates the Booking (PENDING),
// creates a Payment record (PENDING), and increments departure.bookedCount.
// Returns the booking + payment ids.

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export interface CreateBookingInput {
  operatorId: string;
  tourId: string;
  departureId: string;
  partySize: number;
  totalAmount: number;
  currency: string;
  specialRequests?: string;
  // Customer
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  // Payment
  provider: "MPESA" | "STRIPE";
  // For M-Pesa: store the CheckoutRequestID so we can match the IPN callback
  providerReference?: string;
  metadata?: Record<string, unknown>;
}

export async function createPendingBooking(input: CreateBookingInput) {
  const {
    operatorId,
    tourId,
    departureId,
    partySize,
    totalAmount,
    currency,
    specialRequests,
    firstName,
    lastName,
    email,
    phone,
    nationality,
    provider,
    providerReference,
    metadata,
  } = input;

  // Fetch commission rate from the operator's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { operatorId },
    select: { commissionRate: true },
  });
  const commissionRate = subscription?.commissionRate ?? 0.05;
  const commissionAmount = totalAmount * commissionRate;

  // Deposit = 30% (or full if amount is small)
  const depositAmount = totalAmount <= 5000
    ? totalAmount
    : Math.ceil(totalAmount * 0.3);
  const balanceDue = totalAmount - depositAmount;

  const reference = `BK-${nanoid(8).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Upsert customer (scoped to this operator)
    const customer = await tx.customer.upsert({
      where: { operatorId_email: { operatorId, email } },
      create: {
        operatorId,
        firstName,
        lastName,
        email,
        phone,
        nationality,
        leadStatus: "CUSTOMER",
        source: provider === "MPESA" ? "mpesa_booking" : "stripe_booking",
      },
      update: {
        firstName,
        lastName,
        phone: phone ?? undefined,
        nationality: nationality ?? undefined,
      },
    });

    // 2. Check departure still has space (race-condition safe via select-for-update pattern)
    const departure = await tx.departure.findUniqueOrThrow({
      where: { id: departureId },
      select: { capacity: true, bookedCount: true, status: true },
    });

    if (departure.status === "CANCELLED") {
      throw new Error("This departure has been cancelled.");
    }
    if (departure.bookedCount + partySize > departure.capacity) {
      throw new Error("Not enough spots available for this departure.");
    }

    // 3. Create booking
    const booking = await tx.booking.create({
      data: {
        reference,
        operatorId,
        tourId,
        departureId,
        customerId: customer.id,
        partySize,
        totalAmount,
        depositAmount,
        balanceDue,
        currency,
        commissionRate,
        commissionAmount,
        paymentStatus: "PENDING",
        bookingStatus: "PENDING",
        specialRequests: specialRequests ?? null,
      },
    });

    // 4. Create payment record
    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        currency,
        provider,
        providerReference: providerReference ?? null,
        status: "PENDING",
        metadata: metadata ?? {},
      },
    });

    // 5. Increment departure booked count
    await tx.departure.update({
      where: { id: departureId },
      data: { bookedCount: { increment: partySize } },
    });

    return { booking, payment, customer };
  });

  return result;
}

// ── Confirm a booking after successful payment ────────────────────────────────
export async function confirmBookingPayment({
  bookingId,
  paymentId,
  providerReference,
  paidAt,
  metadata,
}: {
  bookingId: string;
  paymentId: string;
  providerReference: string;
  paidAt: Date;
  metadata?: Record<string, unknown>;
}) {
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        providerReference,
        paidAt,
        metadata: metadata ?? {},
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        bookingStatus: "CONFIRMED",
      },
    }),
  ]);
}

// ── Fail a booking (payment failed / timeout) ─────────────────────────────────
export async function failBookingPayment({
  bookingId,
  paymentId,
  reason,
}: {
  bookingId: string;
  paymentId: string;
  reason: string;
}) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { booking: { select: { partySize: true, departureId: true } } },
    });

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED", metadata: { failReason: reason } },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "FAILED", bookingStatus: "CANCELLED" },
    });

    // Release the spots back
    await tx.departure.update({
      where: { id: payment.booking.departureId },
      data: { bookedCount: { decrement: payment.booking.partySize } },
    });
  });
}