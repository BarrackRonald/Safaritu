// lib/monetization/plans.ts
// Single source of truth for plan configuration.
// Import PLAN_CONFIG anywhere you need plan limits, weights, or rates.
// Never hardcode plan values elsewhere — always reference this file.

import type { Plan } from "@prisma/client";

export type PlanConfig = {
  name:              string;
  priceKES:          number;       // monthly price in KES (0 = free)
  priceUSD:          number;       // monthly price in USD
  stripePriceId:     string;       // Stripe Price ID — set in .env and reference here
  maxTours:          number;       // max published tours (-1 = unlimited)
  maxFeatured:       number;       // max tours marked as featured (-1 = unlimited)
  commissionRate:    number;       // decimal e.g. 0.05 = 5%
  planWeight:        number;       // visibility score boost for all tours on this plan
  topPickEligible:   boolean;      // can tours appear as Top Picks
  bookingWidget:     boolean;      // can embed booking widget on own site
  fullAnalytics:     boolean;      // access to full analytics & export
  prioritySupport:   boolean;
  description:       string;
  badge:             string | null; // shown on public tour cards
};

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  STARTER: {
    name:            "Starter",
    priceKES:        0,
    priceUSD:        0,
    stripePriceId:   "",           // free — no Stripe price
    maxTours:        3,
    maxFeatured:     0,
    commissionRate:  0.05,         // 5%
    planWeight:      10,           // lowest visibility
    topPickEligible: false,
    bookingWidget:   false,
    fullAnalytics:   false,
    prioritySupport: false,
    description:     "Get started for free. Up to 3 safaris.",
    badge:           null,
  },

  GROWTH: {
    name:            "Growth",
    priceKES:        2999,
    priceUSD:        23,
    stripePriceId:   process.env.STRIPE_PRICE_GROWTH ?? "",
    maxTours:        15,
    maxFeatured:     2,
    commissionRate:  0.03,         // 3%
    planWeight:      50,           // mid visibility
    topPickEligible: true,
    bookingWidget:   true,
    fullAnalytics:   true,
    prioritySupport: false,
    description:     "For growing operators. Up to 15 safaris, 3% commission.",
    badge:           "Growth",
  },

  PRO: {
    name:            "Pro",
    priceKES:        7999,
    priceUSD:        62,
    stripePriceId:   process.env.STRIPE_PRICE_PRO ?? "",
    maxTours:        -1,           // unlimited
    maxFeatured:     -1,           // unlimited
    commissionRate:  0.015,        // 1.5%
    planWeight:      100,          // highest visibility
    topPickEligible: true,
    bookingWidget:   true,
    fullAnalytics:   true,
    prioritySupport: true,
    description:     "For established operators. Unlimited safaris, 1.5% commission.",
    badge:           "Pro",
  },
};

// Helper — get config for a plan
export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIG[plan];
}

// Helper — get the commission rate for an operator
// Prefers the rate stored on their Subscription record (allows custom deals)
// Falls back to the plan's default rate
export function getCommissionRate(
  plan:              Plan,
  subscriptionRate?: number | null
): number {
  if (subscriptionRate != null) return subscriptionRate;
  return PLAN_CONFIG[plan].commissionRate;
}

// Helper — check if an operator can add more tours
export function canAddTour(plan: Plan, currentPublishedCount: number): boolean {
  const config = PLAN_CONFIG[plan];
  if (config.maxTours === -1) return true;
  return currentPublishedCount < config.maxTours;
}

// Helper — check if an operator can mark more tours as featured
export function canFeatureTour(plan: Plan, currentFeaturedCount: number): boolean {
  const config = PLAN_CONFIG[plan];
  if (config.maxFeatured === -1) return true;
  if (config.maxFeatured === 0) return false;
  return currentFeaturedCount < config.maxFeatured;
}

// Compute the full visibility score for a tour
// Used by recalculateTopPicks and homepage query ordering
export function computeVisibilityScore({
  planWeight,
  topPickScore,
  isFeatured,
  activeBoostScore,
  daysSincePublished,
}: {
  planWeight:         number;
  topPickScore:       number;
  isFeatured:         boolean;
  activeBoostScore:   number;   // sum of active TourBoost.boostScore values
  daysSincePublished: number;
}): number {
  return (
    planWeight                         // plan tier advantage
    + topPickScore                     // organic engagement score
    + (isFeatured ? 20 : 0)           // featured bonus
    + activeBoostScore                 // paid boost bonus
    - daysSincePublished * 0.05        // slight decay to keep fresh content up
  );
}