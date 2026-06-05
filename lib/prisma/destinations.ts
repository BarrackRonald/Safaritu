// lib/prisma/destinations.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";

// All destinations — used in search filters and explore page
export async function getAllDestinations() {
  return prisma.destination.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });
}

// Featured destinations only — used on homepage
export async function getFeaturedDestinations() {
  return prisma.destination.findMany({
    where:   { featured: true },
    orderBy: { sortOrder: "asc" },
  });
}

// Single destination by slug — used on destination landing page
export async function getDestinationBySlug(slug: string) {
  return prisma.destination.findUnique({
    where: { slug },
  });
}

// Tours for a destination — used on destination landing page
export async function getToursByDestination(destinationId: string) {
  const rows = await prisma.tour.findMany({
    where:   { destinationId, status: "PUBLISHED" },
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
      operator: {
        select: { name: true, slug: true, logoUrl: true, plan: true },
      },
    },
    orderBy: { visibilityScore: "desc" },
  });

  return rows.map((t) => ({ ...t, pricePerPerson: Number(t.pricePerPerson) }));
}

// Destination counts — used in search filter to show (n) next to each option
export async function getDestinationTourCounts() {
  const counts = await prisma.tour.groupBy({
    by:     ["destinationId"],
    where:  { status: "PUBLISHED", destinationId: { not: null } },
    _count: { id: true },
  });

  return counts.reduce<Record<string, number>>((acc, c) => {
    if (c.destinationId) acc[c.destinationId] = c._count.id;
    return acc;
  }, {});
}
