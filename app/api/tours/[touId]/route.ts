// app/api/tours/[tourId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getTourById, updateTour, deleteTour, setTourFeatured, recalculateTopPicks } from "@/lib/prisma/tours";
import { canAddTour, canFeatureTour, getPlanConfig } from "@/lib/monetization/plans";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const UpdateSchema = z.object({
  title:          z.string().min(3).max(120).optional(),
  description:    z.string().min(20).optional(),
  highlights:     z.array(z.string()).optional(),
  includes:       z.array(z.string()).optional(),
  excludes:       z.array(z.string()).optional(),
  durationDays:   z.number().int().min(1).optional(),
  durationNights: z.number().int().min(0).optional(),
  difficulty:     z.enum(["EASY", "MODERATE", "CHALLENGING", "EXTREME"]).optional(),
  maxCapacity:    z.number().int().min(1).optional(),
  minGroupSize:   z.number().int().min(1).optional(),
  pricePerPerson: z.number().min(0).optional(),
  currency:       z.string().optional(),
  location:       z.string().optional(),
  country:        z.string().optional(),
  coverImageUrl:  z.string().url().optional().or(z.literal("")),
  imageUrls:      z.array(z.string()).optional(),
  isFeatured:     z.boolean().optional(),
  status:         z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  itineraryDays:  z.array(z.object({
    dayNumber:     z.number().int().min(1),
    title:         z.string().min(1),
    description:   z.string().min(1),
    accommodation: z.string().optional(),
    mealsIncluded: z.array(z.string()),
    activities:    z.array(z.string()),
  })).optional(),
});

type RouteParams = { params: Promise<{ tourId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { tourId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const tour = await getTourById(tourId, operatorUser.operator.id);
    if (!tour) return NextResponse.json({ success: false, error: "Safari not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: tour });
  } catch (error) {
    console.error("[GET /api/tours/[tourId]]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch safari" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tourId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const { operator } = operatorUser;
    const planConfig   = getPlanConfig(operator.plan);

    const body   = await request.json();
    const result = UpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // ── Plan limit: publishing ────────────────────────────────────────────
    if (data.status === "PUBLISHED") {
      const current = await getTourById(tourId, operator.id);
      if (current?.status !== "PUBLISHED") {
        // Tour is being published for the first time — check limit
        const publishedCount = await prisma.tour.count({
          where: { operatorId: operator.id, status: "PUBLISHED" },
        });
        if (!canAddTour(operator.plan, publishedCount)) {
          return NextResponse.json(
            {
              success:         false,
              error:           `Your ${planConfig.name} plan allows a maximum of ${planConfig.maxTours} published safaris. Upgrade to publish more.`,
              code:            "PLAN_LIMIT_TOURS",
              upgradeRequired: true,
            },
            { status: 403 }
          );
        }
      }
    }

    // ── Plan limit: featuring ─────────────────────────────────────────────
    if (data.isFeatured === true) {
      const current = await getTourById(tourId, operator.id);
      if (!current?.isFeatured) {
        // Tour is being featured for the first time — check limit
        if (planConfig.maxFeatured === 0) {
          return NextResponse.json(
            {
              success:         false,
              error:           `Your ${planConfig.name} plan does not include Featured safaris. Upgrade to Growth or Pro.`,
              code:            "PLAN_LIMIT_FEATURED",
              upgradeRequired: true,
            },
            { status: 403 }
          );
        }
        const featuredCount = await prisma.tour.count({
          where: { operatorId: operator.id, isFeatured: true },
        });
        if (!canFeatureTour(operator.plan, featuredCount)) {
          return NextResponse.json(
            {
              success:         false,
              error:           `Your ${planConfig.name} plan allows a maximum of ${planConfig.maxFeatured} featured safaris.`,
              code:            "PLAN_LIMIT_FEATURED",
              upgradeRequired: true,
            },
            { status: 403 }
          );
        }
      }
    }

    // Handle featured-only toggle (single field patch from the list table)
    if (typeof data.isFeatured === "boolean" && Object.keys(data).length === 1) {
      await setTourFeatured(tourId, operator.id, data.isFeatured);
    } else {
      await updateTour(tourId, operator.id, data as any);
    }

    // Recalculate scores after any change
    await recalculateTopPicks(operator.id);

    const updated = await getTourById(tourId, operator.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/tours/[tourId]]", error);
    return NextResponse.json({ success: false, error: "Failed to update safari" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { tourId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    await deleteTour(tourId, operatorUser.operator.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/tours/[tourId]]", error);
    const isBusinessError = error.message?.includes("active bookings");
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to delete safari" },
      { status: isBusinessError ? 409 : 500 }
    );
  }
}