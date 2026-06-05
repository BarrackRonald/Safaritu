// app/site/[tenantSlug]/tours/[tourSlug]/book/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingShell from "@/components/booking/BookingShell";

interface Props {
  params: Promise<{
    tenantSlug: string;
    tourSlug: string;
  }>;
  searchParams: Promise<{
    departure?: string;
  }>;
}

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────
export async function generateMetadata({ params }: Props) {
  const { tenantSlug, tourSlug } = await params;

  const tour = await prisma.tour.findFirst({
    where: {
      slug: tourSlug,
      operator: {
        slug: tenantSlug,
      },
    },
    select: {
      title: true,
    },
  });

  return {
    title: tour ? `Book · ${tour.title}` : "Book",
  };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default async function BookPage({ params, searchParams }: Props) {
  const { tenantSlug, tourSlug } = await params;
  const { departure } = await searchParams;

  const tour = await prisma.tour.findFirst({
    where: {
      slug: tourSlug,
      status: "PUBLISHED",
      operator: {
        slug: tenantSlug,
      },
    },
    include: {
      operator: {
        include: {
          paymentConfig: true,
        },
      },
      departures: {
        where: {
          startDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          startDate: "asc",
        },
      },
      itineraryDays: {
        orderBy: {
          dayNumber: "asc",
        },
        take: 1,
      },
    },
  });

  if (!tour) return notFound();

  const tourData = {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    location: tour.location,
    coverImageUrl: tour.coverImageUrl,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    pricePerPerson: Number(tour.pricePerPerson),
    currency: tour.currency,
    highlights: tour.highlights ?? [],

    departures: tour.departures.map((d) => ({
      id: d.id,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate?.toISOString() ?? null,

      // ✅ FIXED: always valid arithmetic
      spotsAvailable: d.capacity - d.bookedCount,
    })),

    operator: {
      id: tour.operator.id,
      name: tour.operator.name,
      slug: tour.operator.slug,
      logoUrl: tour.operator.logoUrl ?? null,

      mpesa: tour.operator.paymentConfig?.mpesaEnabled
        ? {
            paybillNumber: tour.operator.paymentConfig.mpesaPaybill ?? null,
            tillNumber: tour.operator.paymentConfig.mpesaTill ?? null,
            accountPrefix:
              tour.operator.paymentConfig.mpesaAccountPrefix ?? "BOOKING",
          }
        : null,

      stripePublishableKey:
        tour.operator.paymentConfig?.stripePublishableKey ?? null,
    },
  };

  return (
    <BookingShell
      tour={tourData}
      preselectedDepartureId={departure ?? null}
    />
  );
}