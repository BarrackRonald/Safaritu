// app/operator/tours/[tourId]/edit/page.tsx
// Edit an existing safari. Fetches the tour and passes it as initialData to TourForm.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getTourById } from "@/lib/prisma/tours";
import OperatorShell from "@/components/layout/OperatorShell";
import TourForm from "@/components/tours/TourForm";

export const metadata = { title: "Edit Safari — SafariTu" };

type Props = { params: Promise<{ tourId: string }> };

export default async function EditTourPage({ params }: Props) {
  const { tourId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const tour = await getTourById(tourId, operatorUser.operator.id);
  if (!tour) notFound();

  // Map DB model to TourForm's expected shape
  const initialData = {
    title: tour.title,
    description: tour.description,
    highlights: tour.highlights.length > 0 ? tour.highlights : [""],
    includes: tour.includes.length > 0 ? tour.includes : [""],
    excludes: tour.excludes.length > 0 ? tour.excludes : [""],
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    difficulty: tour.difficulty,
    maxCapacity: tour.maxCapacity,
    minGroupSize: tour.minGroupSize,
    pricePerPerson: Number(tour.pricePerPerson),
    currency: tour.currency,
    location: tour.location ?? "",
    country: tour.country ?? "Kenya",
    coverImageUrl: tour.coverImageUrl ?? "",
    isFeatured: tour.isFeatured,
    status: tour.status as "DRAFT" | "PUBLISHED",
    itineraryDays: tour.itineraryDays.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      description: d.description,
      accommodation: d.accommodation ?? "",
      mealsIncluded: d.mealsIncluded,
      activities: d.activities,
    })),
  };

  return (
    <OperatorShell operator={operatorUser.operator}>
      <div className="mb-6">
        <Link
          href="/operator/tours"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to safaris
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">
          Edit safari
        </h1>
        <p className="text-stone-500 text-sm mt-1">{tour.title}</p>
      </div>
      <TourForm tourId={tourId} initialData={initialData} />
    </OperatorShell>
  );
}