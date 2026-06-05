// lib/payments/booking.ts
// Atomic booking creation. Called by both Stripe and Mpesa payment handlers
// after payment is confirmed. Creates Booking + Customer (upsert) + Payment
// records in a single transaction. Calculates and snapshots commission.
import "server-only";
import { prisma } from "@/lib/prisma/client";
import { getOperatorCommissionRate } from "@/lib/prisma/subscriptions";
import { generateBookingReference } from "@/lib/utils";
import type { PaymentProvider, Plan } from "@prisma/client";

export type BookingInput = {
  tourId:      string;
  departureId: string;
  operatorId:  string;
  partySize:   number;
  totalAmount: number;
  depositAmount: number;
  currency:    string;
  customer: {
    firstName:       string;
    lastName:        string;
    email:           string;
    phone:           string;
    country:         string;
    specialRequests: string;
  };
  payment: {
    provider:          PaymentProvider;
    providerReference: string;
    amount:            number;
    currency:          string;
  };
};

export async function createBookingWithPayment(input: BookingInput) {
  // Get operator plan for commission calculation
  const operator = await prisma.operator.findUnique({
    where:  { id: input.operatorId },
    select: { plan: true },
  });
  if (!operator) throw new Error("Operator not found");

  const commissionRate = await getOperatorCommissionRate(
    input.operatorId,
    operator.plan as Plan
  );
  const commissionAmount = Number(
    (input.totalAmount * commissionRate).toFixed(2)
  );
  const balanceDue = Number(
    (input.totalAmount - input.depositAmount).toFixed(2)
  );

  return prisma.$transaction(async (tx) => {
    // Upsert customer — same email = same customer record per operator
    const customer = await tx.customer.upsert({
      where: {
        operatorId_email: {
          operatorId: input.operatorId,
          email:      input.customer.email,
        },
      },
      create: {
        operatorId: input.operatorId,
        firstName:  input.customer.firstName,
        lastName:   input.customer.lastName,
        email:      input.customer.email,
        phone:      input.customer.phone      || null,
        country:    input.customer.country    || null,
        leadStatus: "CUSTOMER",
        source:     "booking",
      },
      update: {
        // Keep existing record but update phone/country if provided
        phone:   input.customer.phone   || undefined,
        country: input.customer.country || undefined,
      },
    });

    // Check departure still has capacity
    const departure = await tx.departure.findUnique({
      where: { id: input.departureId },
    });
    if (!departure) throw new Error("Departure not found");
    if (departure.capacity - departure.bookedCount < input.partySize) {
      throw new Error("Not enough spots available for this departure.");
    }

    // Create booking
    const booking = await tx.booking.create({
      data: {
        reference:       generateBookingReference(),
        operatorId:      input.operatorId,
        tourId:          input.tourId,
        departureId:     input.departureId,
        customerId:      customer.id,
        partySize:       input.partySize,
        totalAmount:     input.totalAmount,
        depositAmount:   input.depositAmount,
        balanceDue,
        currency:        input.currency,
        commissionRate,
        commissionAmount,
        paymentStatus:   "PARTIAL",    // deposit paid, balance still due
        bookingStatus:   "CONFIRMED",
        specialRequests: input.customer.specialRequests || null,
      },
    });

    // Record the deposit payment
    await tx.payment.create({
      data: {
        bookingId:         booking.id,
        amount:            input.payment.amount,
        currency:          input.payment.currency,
        provider:          input.payment.provider,
        providerReference: input.payment.providerReference,
        status:            "PAID",
        paidAt:            new Date(),
      },
    });

    // Increment departure booked count
    await tx.departure.update({
      where: { id: input.departureId },
      data:  { bookedCount: { increment: input.partySize } },
    });

    return { booking, customer };
  });
}

// Called when full balance is paid (balance payment after deposit)
export async function recordBalancePayment({
  bookingId,
  amount,
  currency,
  provider,
  providerReference,
}: {
  bookingId:         string;
  amount:            number;
  currency:          string;
  provider:          PaymentProvider;
  providerReference: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        bookingId,
        amount,
        currency,
        provider,
        providerReference,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        balanceDue:    0,
        paymentStatus: "PAID",
        updatedAt:     new Date(),
      },
    });
  });
}