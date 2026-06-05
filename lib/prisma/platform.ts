// lib/prisma/platform.ts
// Platform-wide public queries — no operator scoping.
// All Decimal fields are converted to plain numbers before being returned.

import "server-only";
import { prisma } from "@/lib/prisma/client";

/* -------------------------------------------------------------------------- */
/* Shared select for public tour cards                                         */
/* -------------------------------------------------------------------------- */

const publicTourSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  durationDays: true,
  durationNights: true,
  difficulty: true,
  pricePerPerson: true,
  currency: true,
  coverImageUrl: true,
  location: true,
  country: true,
  isFeatured: true,
  isTopPick: true,
  operator: {
    select: {
      name: true,
      slug: true,
      logoUrl: true,
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Helper: Remove any rows whose operator relation is missing                  */
/* -------------------------------------------------------------------------- */

function normaliseTours<T extends { pricePerPerson: any; operator: any }>(
  rows: T[],
) {
  return rows
    .filter(
      (t) =>
        t.operator &&
        typeof t.operator.name === "string" &&
        typeof t.operator.slug === "string",
    )
    .map((t) => ({
      ...t,
      pricePerPerson: Number(t.pricePerPerson),
    }));
}

/* -------------------------------------------------------------------------- */
/* Operators                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAllOperators() {
  return prisma.operator.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      logoUrl: true,
      coverImageUrl: true,
      _count: {
        select: {
          tours: {
            where: { status: "PUBLISHED" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/* -------------------------------------------------------------------------- */
/* Featured Tours                                                             */
/* -------------------------------------------------------------------------- */

export async function getPlatformFeaturedTours(limit = 6) {
  const rows = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",
      isFeatured: true,
      operator: {
        is: {
          isActive: true,
        },
      },
    },
    select: publicTourSelect,
    orderBy: [
      { topPickScore: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return normaliseTours(rows);
}

/* -------------------------------------------------------------------------- */
/* Top Picks                                                                  */
/* -------------------------------------------------------------------------- */

export async function getPlatformTopPicks(limit = 6) {
  const rows = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",
      isTopPick: true,
      operator: {
        is: {
          isActive: true,
        },
      },
    },
    select: publicTourSelect,
    orderBy: [
      { topPickScore: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return normaliseTours(rows);
}

/* -------------------------------------------------------------------------- */
/* Search Tours                                                               */
/* -------------------------------------------------------------------------- */

export async function searchTours(params: {
  query?: string;
  destination?: string;
  minDays?: number;
  maxDays?: number;
  maxPrice?: number;
  difficulty?: string;
  limit?: number;
}) {
  const {
    query,
    destination,
    minDays,
    maxDays,
    maxPrice,
    difficulty,
    limit = 24,
  } = params;

  const rows = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",

      ...(query && {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ],
      }),

      ...(destination && {
        OR: [
          { location: { contains: destination, mode: "insensitive" } },
          { country: { contains: destination, mode: "insensitive" } },
        ],
      }),

      ...(minDays && {
        durationDays: { gte: minDays },
      }),

      ...(maxDays && {
        durationDays: { lte: maxDays },
      }),

      ...(maxPrice && {
        pricePerPerson: { lte: maxPrice },
      }),

      ...(difficulty && {
        difficulty: difficulty as any,
      }),

      operator: {
        is: {
          isActive: true,
        },
      },
    },

    select: publicTourSelect,

    orderBy: [
      { topPickScore: "desc" },
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],

    take: limit,
  });

  return normaliseTours(rows);
}

/* -------------------------------------------------------------------------- */
/* Destinations                                                               */
/* -------------------------------------------------------------------------- */

export async function getDestinations() {
  const tours = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",
      location: { not: null },
      operator: {
        is: {
          isActive: true,
        },
      },
    },
    select: {
      location: true,
    },
    distinct: ["location"],
  });

  return tours
    .map((t) => t.location)
    .filter(Boolean) as string[];
}

/* -------------------------------------------------------------------------- */
/* Platform Stats                                                             */
/* -------------------------------------------------------------------------- */

export async function getPlatformStats() {
  const [operators, tours, bookings] = await Promise.all([
    prisma.operator.count({
      where: {
        isActive: true,
      },
    }),

    prisma.tour.count({
      where: {
        status: "PUBLISHED",
        operator: {
          is: {
            isActive: true,
          },
        },
      },
    }),

    prisma.booking.count({
      where: {
        bookingStatus: "CONFIRMED",
      },
    }),
  ]);

  return {
    operators,
    tours,
    bookings,
  };
}