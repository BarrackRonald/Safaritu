// lib/prisma/platform.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";

export async function getAllOperators() {
  return prisma.operator.findMany({
    where:   { isActive: true },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      bio:          true,
      logoUrl:      true,
      coverImageUrl:true,
      plan:         true,
      _count: {
        select: { tours: { where: { status: "PUBLISHED" } } },
      },
    },
    orderBy: [{ plan: "desc" }, { createdAt: "asc" }],
  });
}

export async function getPlatformFeaturedTours(limit = 6) {
  const rows = await prisma.tour.findMany({
    where:   { status: "PUBLISHED", isFeatured: true },
    select: {
      id:             true,
      slug:           true,
      title:          true,
      description:    true,
      durationDays:   true,
      durationNights: true,
      difficulty:     true,
      pricePerPerson: true,
      currency:       true,
      coverImageUrl:  true,
      location:       true,
      isFeatured:     true,
      isTopPick:      true,
      visibilityScore:true,
      destination: { select: { name: true, slug: true, emoji: true } },
      operator:    { select: { name: true, slug: true, logoUrl: true, plan: true } },
    },
    orderBy: { visibilityScore: "desc" },
    take:    limit,
  });
  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}

export async function getPlatformTopPicks(limit = 6) {
  const rows = await prisma.tour.findMany({
    where:   { status: "PUBLISHED", isTopPick: true },
    select: {
      id:             true,
      slug:           true,
      title:          true,
      description:    true,
      durationDays:   true,
      durationNights: true,
      difficulty:     true,
      pricePerPerson: true,
      currency:       true,
      coverImageUrl:  true,
      location:       true,
      isFeatured:     true,
      isTopPick:      true,
      visibilityScore:true,
      destination: { select: { name: true, slug: true, emoji: true } },
      operator:    { select: { name: true, slug: true, logoUrl: true, plan: true } },
    },
    orderBy: [{ topPickScore: "desc" }, { visibilityScore: "desc" }],
    take:    limit,
  });
  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}

export async function searchTours(params: {
  query?:         string;
  destination?:   string;   // destination slug or name
  destinationId?: string;   // destination ID (used from destination page)
  minDays?:       number;
  maxDays?:       number;
  maxPrice?:      number;
  difficulty?:    string;
  limit?:         number;
}) {
  const {
    query, destination, destinationId,
    minDays, maxDays, maxPrice, difficulty, limit = 24,
  } = params;

  const rows = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",
      ...(destinationId && { destinationId }),
      ...(destination && !destinationId && {
        OR: [
          { destination: { name:    { contains: destination, mode: "insensitive" } } },
          { destination: { slug:    { contains: destination, mode: "insensitive" } } },
          { location:    { contains: destination, mode: "insensitive" } },
          { country:     { contains: destination, mode: "insensitive" } },
        ],
      }),
      ...(query && {
        OR: [
          { title:       { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { location:    { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(minDays    && { durationDays:   { gte: minDays   } }),
      ...(maxDays    && { durationDays:   { lte: maxDays   } }),
      ...(maxPrice   && { pricePerPerson: { lte: maxPrice  } }),
      ...(difficulty && { difficulty: difficulty as any }),
    },
    select: {
      id:             true,
      slug:           true,
      title:          true,
      description:    true,
      durationDays:   true,
      durationNights: true,
      difficulty:     true,
      pricePerPerson: true,
      currency:       true,
      coverImageUrl:  true,
      location:       true,
      isFeatured:     true,
      isTopPick:      true,
      visibilityScore:true,
      destination: { select: { name: true, slug: true, emoji: true } },
      operator:    { select: { name: true, slug: true, logoUrl: true, plan: true } },
    },
    orderBy: { visibilityScore: "desc" },
    take:    limit,
  });
  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}

export async function getPlatformStats() {
  const [operators, tours, bookings] = await Promise.all([
    prisma.operator.count({ where: { isActive: true } }),
    prisma.tour.count({    where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { bookingStatus: "CONFIRMED" } }),
  ]);
  return { operators, tours, bookings };
}
