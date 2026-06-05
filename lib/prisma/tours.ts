// lib/prisma/tours.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";
import { computeVisibilityScore, getPlanConfig } from "@/lib/monetization/plans";
import type { Difficulty, TourStatus } from "@prisma/client";

export async function getToursByOperator(operatorId: string) {
  return prisma.tour.findMany({
    where:   { operatorId },
    include: {
      _count: { select: { bookings: true, departures: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTourById(tourId: string, operatorId: string) {
  return prisma.tour.findFirst({
    where:   { id: tourId, operatorId },
    include: {
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      departures:    { orderBy: { startDate: "asc" } },
      _count:        { select: { bookings: true } },
    },
  });
}

export async function getTourBySlug(slug: string, operatorId: string) {
  return prisma.tour.findFirst({
    where:   { slug, operatorId, status: "PUBLISHED" },
    include: {
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      departures: {
        where:   { status: "AVAILABLE", startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
      },
    },
  });
}

export async function createTour(
  operatorId: string,
  data: {
    title:          string;
    slug:           string;
    description:    string;
    highlights:     string[];
    includes:       string[];
    excludes:       string[];
    durationDays:   number;
    durationNights: number;
    difficulty:     Difficulty;
    maxCapacity:    number;
    minGroupSize:   number;
    pricePerPerson: number;
    currency:       string;
    location:       string;
    country:        string;
    coverImageUrl?: string;
    imageUrls:      string[];
    isFeatured:     boolean;
    status:         TourStatus;
    itineraryDays: {
      dayNumber:     number;
      title:         string;
      description:   string;
      accommodation?: string;
      mealsIncluded: string[];
      activities:    string[];
    }[];
  }
) {
  const { itineraryDays, ...tourData } = data;
  return prisma.tour.create({
    data: {
      ...tourData,
      operatorId,
      itineraryDays: { create: itineraryDays },
    },
    include: {
      itineraryDays: { orderBy: { dayNumber: "asc" } },
    },
  });
}

export async function updateTour(
  tourId:     string,
  operatorId: string,
  data: {
    title?:          string;
    description?:    string;
    highlights?:     string[];
    includes?:       string[];
    excludes?:       string[];
    durationDays?:   number;
    durationNights?: number;
    difficulty?:     Difficulty;
    maxCapacity?:    number;
    minGroupSize?:   number;
    pricePerPerson?: number;
    currency?:       string;
    location?:       string;
    country?:        string;
    coverImageUrl?:  string;
    imageUrls?:      string[];
    isFeatured?:     boolean;
    status?:         TourStatus;
    itineraryDays?: {
      dayNumber:     number;
      title:         string;
      description:   string;
      accommodation?: string;
      mealsIncluded: string[];
      activities:    string[];
    }[];
  }
) {
  const { itineraryDays, ...tourData } = data;
  return prisma.$transaction(async (tx) => {
    const tour = await tx.tour.update({
      where: { id: tourId, operatorId },
      data:  tourData,
    });
    if (itineraryDays) {
      await tx.itineraryDay.deleteMany({ where: { tourId } });
      await tx.itineraryDay.createMany({
        data: itineraryDays.map((d) => ({ ...d, tourId })),
      });
    }
    return tour;
  });
}

export async function deleteTour(tourId: string, operatorId: string) {
  const active = await prisma.booking.count({
    where: { tourId, bookingStatus: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (active > 0) throw new Error("Cannot delete a safari with active bookings.");
  return prisma.tour.delete({ where: { id: tourId, operatorId } });
}

export async function setTourFeatured(
  tourId:     string,
  operatorId: string,
  isFeatured: boolean
) {
  return prisma.tour.update({
    where: { id: tourId, operatorId },
    data:  { isFeatured },
  });
}

// ── Scoring engine ────────────────────────────────────────────────────────────
// Recalculates topPickScore AND visibilityScore for every published tour
// belonging to this operator. Called after:
//   - a booking is confirmed
//   - featured status changes
//   - a boost is activated or expires
//   - an operator's plan changes
//
// visibilityScore drives homepage ordering across ALL operators.
// topPickScore drives the ⭐ Top Pick badge (organic only, no plan/boost factor).

export async function recalculateTopPicks(operatorId: string) {
  // Get the operator's plan to determine planWeight
  const operator = await prisma.operator.findUnique({
    where:  { id: operatorId },
    select: { plan: true },
  });
  if (!operator) return;

  const planConfig  = getPlanConfig(operator.plan);
  const planWeight  = planConfig.planWeight;
  const now         = Date.now();

  const tours = await prisma.tour.findMany({
    where:   { operatorId, status: "PUBLISHED" },
    include: {
      _count:  { select: { bookings: true } },
      boosts: {
        where: { paid: true, endsAt: { gte: new Date() } },
        select: { boostScore: true },
      },
    },
  });

  await Promise.all(
    tours.map((tour) => {
      const ageDays = (now - tour.createdAt.getTime()) / 86_400_000;

      // topPickScore — pure organic metric (bookings + recency)
      // Not influenced by plan or boosts — keeps the badge trustworthy
      const topPickScore = Math.max(
        0,
        tour._count.bookings * 3
        + (tour.isFeatured ? 5 : 0)
        - ageDays * 0.1
      );

      // Sum all active boost scores for this tour
      const activeBoostScore = tour.boosts.reduce(
        (sum, b) => sum + b.boostScore,
        0
      );

      // visibilityScore — full ranking score including plan and boosts
      const visibilityScore = computeVisibilityScore({
        planWeight,
        topPickScore,
        isFeatured:         tour.isFeatured,
        activeBoostScore,
        daysSincePublished: ageDays,
      });

      // Only plans that allow Top Picks can get the badge
      const isTopPick = planConfig.topPickEligible && topPickScore >= 5;

      return prisma.tour.update({
        where: { id: tour.id },
        data:  { topPickScore, visibilityScore, isTopPick },
      });
    })
  );
}

// Recalculate scores for ALL operators — run as a nightly cron job
export async function recalculateAllVisibilityScores() {
  const operators = await prisma.operator.findMany({
    where:  { isActive: true },
    select: { id: true },
  });
  await Promise.all(operators.map((op) => recalculateTopPicks(op.id)));
}