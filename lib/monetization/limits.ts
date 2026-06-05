// lib/monetization/limits.ts
// Server-side plan limit checks used in API routes and server components.
// Centralised here so limit logic is never duplicated.
import "server-only";
import { prisma } from "@/lib/prisma/client";
import { canAddTour, canFeatureTour, getPlanConfig } from "@/lib/monetization/plans";
import type { Plan } from "@prisma/client";

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; code: string; upgradeRequired: true };

export async function checkTourPublishLimit(
  operatorId: string,
  plan:        Plan
): Promise<LimitCheckResult> {
  const config = getPlanConfig(plan);
  if (config.maxTours === -1) return { allowed: true };

  const count = await prisma.tour.count({
    where: { operatorId, status: "PUBLISHED" },
  });

  if (canAddTour(plan, count)) return { allowed: true };

  return {
    allowed:         false,
    error:           `Your ${config.name} plan allows a maximum of ${config.maxTours} published safaris. Upgrade your plan to publish more.`,
    code:            "PLAN_LIMIT_TOURS",
    upgradeRequired: true,
  };
}

export async function checkFeaturedLimit(
  operatorId: string,
  plan:        Plan
): Promise<LimitCheckResult> {
  const config = getPlanConfig(plan);

  if (config.maxFeatured === 0) {
    return {
      allowed:         false,
      error:           `Your ${config.name} plan does not include Featured safaris. Upgrade to Growth or Pro to feature your safaris on the homepage.`,
      code:            "PLAN_LIMIT_FEATURED",
      upgradeRequired: true,
    };
  }

  if (config.maxFeatured === -1) return { allowed: true };

  const count = await prisma.tour.count({
    where: { operatorId, isFeatured: true },
  });

  if (canFeatureTour(plan, count)) return { allowed: true };

  return {
    allowed:         false,
    error:           `Your ${config.name} plan allows a maximum of ${config.maxFeatured} featured safari${config.maxFeatured !== 1 ? "s" : ""}. Upgrade to Pro for unlimited featured safaris.`,
    code:            "PLAN_LIMIT_FEATURED",
    upgradeRequired: true,
  };
}

// Returns a summary of what the operator is currently using vs their limits
export async function getOperatorUsage(operatorId: string, plan: Plan) {
  const config = getPlanConfig(plan);

  const [publishedCount, featuredCount] = await Promise.all([
    prisma.tour.count({ where: { operatorId, status: "PUBLISHED" } }),
    prisma.tour.count({ where: { operatorId, isFeatured: true } }),
  ]);

  return {
    tours: {
      used:  publishedCount,
      limit: config.maxTours,
      unlimited: config.maxTours === -1,
      atLimit: config.maxTours !== -1 && publishedCount >= config.maxTours,
    },
    featured: {
      used:  featuredCount,
      limit: config.maxFeatured,
      unlimited: config.maxFeatured === -1,
      atLimit: config.maxFeatured !== -1 && featuredCount >= config.maxFeatured,
    },
    commissionRate: config.commissionRate,
    planWeight:     config.planWeight,
  };
}