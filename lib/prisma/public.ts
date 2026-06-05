// lib/prisma/public.ts
// Public-facing data access — read-only, no auth.
// All Decimal fields converted to plain numbers before returning.
import "server-only";
import { prisma } from "@/lib/prisma/client";

export async function getPublicOperator(slug: string) {
  return prisma.operator.findUnique({
    where:  { slug, isActive: true },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      bio:          true,
      logoUrl:      true,
      coverImageUrl:true,
      website:      true,
      phone:        true,
      email:        true,
    },
  });
}

export async function getPublicTours(operatorId: string) {
  const rows = await prisma.tour.findMany({
    where:   { operatorId, status: "PUBLISHED" },
    select: {
      id:            true,
      slug:          true,
      title:         true,
      description:   true,
      highlights:    true,
      durationDays:  true,
      durationNights:true,
      difficulty:    true,
      pricePerPerson:true,
      currency:      true,
      coverImageUrl: true,
      imageUrls:     true,
      location:      true,
      country:       true,
      isFeatured:    true,
      isTopPick:     true,
      topPickScore:  true,
      maxCapacity:   true,
      minGroupSize:  true,
      _count: { select: { bookings: true } },
    },
    orderBy: [
      { isFeatured:   "desc" },
      { topPickScore: "desc" },
      { createdAt:    "desc" },
    ],
  });

  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}

export async function getPublicTourBySlug(operatorId: string, slug: string) {
  const tour = await prisma.tour.findFirst({
    where:  { operatorId, slug, status: "PUBLISHED" },
    include: {
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      departures: {
        where:   { status: "AVAILABLE", startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take:    12,
      },
      operator: {
        select: { name: true, slug: true, logoUrl: true, phone: true, email: true },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!tour) return null;

  return {
    ...tour,
    pricePerPerson: Number(tour.pricePerPerson),
    departures: tour.departures.map((d) => ({
      ...d,
      priceOverride: d.priceOverride != null ? Number(d.priceOverride) : null,
    })),
  };
}

export async function getRelatedTours(
  operatorId: string,
  excludeId:  string,
  limit = 3
) {
  const rows = await prisma.tour.findMany({
    where:  { operatorId, status: "PUBLISHED", id: { not: excludeId } },
    select: {
      id:            true,
      slug:          true,
      title:         true,
      description:   true,
      durationDays:  true,
      durationNights:true,
      pricePerPerson:true,
      currency:      true,
      coverImageUrl: true,
      location:      true,
      isTopPick:     true,
      isFeatured:    true,
      difficulty:    true,
    },
    orderBy: { topPickScore: "desc" },
    take:    limit,
  });

  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}