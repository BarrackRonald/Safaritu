// app/site/[tenantSlug]/tours/[tourSlug]/book/success/page.tsx
// Stripe redirects here after successful checkout.
// We verify the session server-side (don't trust the URL alone),
// then show the confirmation UI.

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";
import ConfirmationStep from "@/components/booking/ConfirmationStep";

interface Props {
  params: { tenantSlug: string; tourSlug: string };
  searchParams: { session_id?: string; ref?: string };
}

export const dynamic = "force-dynamic";

export default async function StripeSuccessPage({ params, searchParams }: Props) {
  const sessionId = searchParams.session_id;
  const bookingRef = searchParams.ref;

  if (!sessionId || !bookingRef) {
    redirect(`/site/${params.tenantSlug}/tours/${params.tourSlug}`);
  }

  // Load booking by reference
  const booking = await prisma.booking.findUnique({
    where: { reference: bookingRef },
    include: {
      customer: true,
      tour: {
        select: {
          id: true,
          slug: true,
          title: true,
          location: true,
          coverImageUrl: true,
          durationDays: true,
          durationNights: true,
          currency: true,
        },
      },
      operator: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          paymentConfig: {
            select: { stripeSecretKey: true },
          },
        },
      },
      payments: {
        where: { provider: "STRIPE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!booking) return notFound();

  // Verify the Stripe session matches this booking (prevent ref-fishing)
  const stripeKey = booking.operator.paymentConfig?.stripeSecretKey;
  if (stripeKey) {
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.bookingRef !== bookingRef) {
        redirect(`/site/${params.tenantSlug}/tours/${params.tourSlug}`);
      }
    } catch {
      redirect(`/site/${params.tenantSlug}/tours/${params.tourSlug}`);
    }
  }

  // Build props for ConfirmationStep
  const tourData = {
    id: booking.tour.id,
    slug: booking.tour.slug,
    title: booking.tour.title,
    location: booking.tour.location,
    coverImageUrl: booking.tour.coverImageUrl,
    durationDays: booking.tour.durationDays,
    durationNights: booking.tour.durationNights,
    pricePerPerson: Number(booking.totalAmount) / booking.partySize,
    currency: booking.tour.currency,
    highlights: [],
    departures: [],
    operator: {
      id: booking.operator.id,
      name: booking.operator.name,
      slug: booking.operator.slug,
      logoUrl: booking.operator.logoUrl ?? null,
      mpesa: null,
      stripe: null,
    },
  };

  const formData = {
    departureId: booking.departureId,
    guests: booking.partySize,
    specialRequests: booking.specialRequests ?? "",
    firstName: booking.customer.firstName,
    lastName: booking.customer.lastName,
    email: booking.customer.email,
    phone: booking.customer.phone ?? "",
    nationality: booking.customer.nationality ?? "",
    paymentMethod: "card" as const,
    mpesaPhone: "",
    mpesaReference: "",
  };

  return (
    <ConfirmationStep
      bookingRef={bookingRef}
      tour={tourData}
      form={formData}
    />
  );
}
