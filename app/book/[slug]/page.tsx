// app/book/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingShell from "@/components/booking/BookingShell";

interface Props {
  params: { slug: string };
  searchParams: { departure?: string };
}

export async function generateMetadata({ params }: Props) {
  const tour = await prisma.tour.findFirst({ where: { slug: params.slug } });
  return { title: tour ? `Book · ${tour.title}` : "Book" };
}

export default async function BookPage({ params, searchParams }: Props) {
  const tour = await prisma.tour.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      operator: {
        include: {
          // Each operator has their own payment config stored in OperatorPaymentConfig
          paymentConfig: true,
        },
      },
      departures: {
        where: { startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
      },
      itineraryDays: { orderBy: { dayNumber: "asc" }, take: 1 },
    },
  });

  if (!tour) return notFound();

  // Serialize for client (Decimal → number, Date → string)
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
      spotsAvailable: d.spotsAvailable,
    })),
    operator: {
      id: tour.operator.id,
      name: tour.operator.name,
      slug: tour.operator.slug,
      logoUrl: tour.operator.logoUrl ?? null,
      // M-Pesa — each operator registers their own paybill / till
      mpesa: tour.operator.paymentConfig?.mpesaEnabled
        ? {
            paybillNumber: tour.operator.paymentConfig.mpesaPaybill ?? null,
            tillNumber: tour.operator.paymentConfig.mpesaTill ?? null,
            accountPrefix: tour.operator.paymentConfig.mpesaAccountPrefix ?? "BOOKING",
          }
        : null,
      // Card — operator's own Stripe publishable key (or null → use platform key)
      stripePublishableKey:
        tour.operator.paymentConfig?.stripePublishableKey ?? null,
    },
  };

  const preselectedDepartureId = searchParams.departure ?? null;

  return (
    <BookingShell
      tour={tourData}
      preselectedDepartureId={preselectedDepartureId}
    />
  );
}