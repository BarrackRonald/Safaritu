// lib/prisma/subscriptions.ts
// Data access for operator subscriptions and tour boosts.
import "server-only";
import { prisma } from "@/lib/prisma/client";
import { PLAN_CONFIG, getPlanConfig } from "@/lib/monetization/plans";
import type { Plan } from "@prisma/client";

// Get an operator's subscription (returns null if they're on free Starter with no record)
export async function getSubscription(operatorId: string) {
  return prisma.subscription.findUnique({
    where: { operatorId },
  });
}

// Upsert subscription — called by Stripe webhook on subscription create/update
export async function upsertSubscription({
  operatorId,
  plan,
  stripeSubId,
  stripePriceId,
  currentPeriodEnd,
  status,
  cancelAtPeriodEnd,
}: {
  operatorId:        string;
  plan:              Plan;
  stripeSubId:       string;
  stripePriceId:     string;
  currentPeriodEnd:  Date;
  status:            "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "UNPAID";
  cancelAtPeriodEnd: boolean;
}) {
  const config = getPlanConfig(plan);

  return prisma.$transaction(async (tx) => {
    // Update the operator's plan field
    await tx.operator.update({
      where: { id: operatorId },
      data:  { plan },
    });

    // Upsert the subscription record
    return tx.subscription.upsert({
      where:  { operatorId },
      create: {
        operatorId,
        plan,
        stripeSubId,
        stripePriceId,
        commissionRate:   config.commissionRate,
        currentPeriodEnd,
        status,
        cancelAtPeriodEnd,
      },
      update: {
        plan,
        stripeSubId,
        stripePriceId,
        commissionRate:   config.commissionRate,
        currentPeriodEnd,
        status,
        cancelAtPeriodEnd,
        updatedAt:        new Date(),
      },
    });
  });
}

// Called when Stripe subscription is cancelled/expired
export async function cancelSubscription(operatorId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.operator.update({
      where: { id: operatorId },
      data:  { plan: "STARTER" },
    });
    await tx.subscription.update({
      where: { operatorId },
      data:  { status: "CANCELLED", updatedAt: new Date() },
    });
  });
}

// Get the commission rate for an operator — used at booking creation time
export async function getOperatorCommissionRate(
  operatorId: string,
  plan:        Plan
): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where:  { operatorId },
    select: { commissionRate: true },
  });
  // Use stored rate (supports custom deals) or fall back to plan default
  return sub?.commissionRate ?? PLAN_CONFIG[plan].commissionRate;
}

// Get active boosts for a tour (endsAt in the future, paid = true)
export async function getActiveBoosts(tourId: string) {
  return prisma.tourBoost.findMany({
    where: {
      tourId,
      paid:   true,
      endsAt: { gte: new Date() },
    },
  });
}

// Create a pending boost — marked paid after Stripe confirms
export async function createTourBoost({
  tourId,
  operatorId,
  durationDays,
  amountPaid,
  currency,
}: {
  tourId:       string;
  operatorId:   string;
  durationDays: 7 | 30;
  amountPaid:   number;
  currency:     string;
}) {
  const boostScore = 30; // fixed boost score per boosted tour
  const startsAt   = new Date();
  const endsAt     = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + durationDays);

  return prisma.tourBoost.create({
    data: {
      tourId,
      operatorId,
      boostScore,
      durationDays,
      startsAt,
      endsAt,
      amountPaid,
      currency,
      paid: false, // set to true by Stripe webhook
    },
  });
}

// Mark a boost as paid (called by Stripe webhook)
export async function activateBoost(tourId: string, stripePaymentIntentId: string) {
  return prisma.tourBoost.updateMany({
    where: { tourId, stripePaymentIntentId },
    data:  { paid: true },
  });
}