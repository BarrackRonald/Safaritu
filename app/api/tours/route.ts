// app/api/tours/route.ts
// GET  — list tours for operator
// POST — create tour (enforces plan limits)

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getToursByOperator, createTour } from "@/lib/prisma/tours";
import { slugify } from "@/lib/utils";
import { prisma } from "@/lib/prisma/client";
import { canAddTour, canFeatureTour, getPlanConfig } from "@/lib/monetization/plans";
import { z } from "zod";
import type { Difficulty, TourStatus } from "@prisma/client";

const ItineraryDaySchema = z.object({
  dayNumber:     z.number().int().min(1),
  title:         z.string().min(1, "Day title is required"),
  description:   z.string().min(1, "Day description is required"),
  accommodation: z.string().optional(),
  mealsIncluded: z.array(z.string()),
  activities:    z.array(z.string()),
});

const CreateTourSchema = z.object({
  title:          z.string().min(3).max(120),
  description:    z.string().min(20),
  highlights:     z.array(z.string().min(1)).min(1),
  includes:       z.array(z.string()),
  excludes:       z.array(z.string()),
  durationDays:   z.number().int().min(1),
  durationNights: z.number().int().min(0),
  difficulty:     z.enum(["EASY", "MODERATE", "CHALLENGING", "EXTREME"]),
  maxCapacity:    z.number().int().min(1),
  minGroupSize:   z.number().int().min(1),
  pricePerPerson: z.number().min(1, "Price must be greater than 0"),
  currency:       z.string().min(3).max(3),
  location:       z.string().min(1),
  country:        z.string().default("Kenya"),
  coverImageUrl:  z.string().url().optional().or(z.literal("")),
  imageUrls:      z.array(z.string()).default([]),
  isFeatured:     z.boolean().default(false),
  status:         z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  itineraryDays:  z.array(ItineraryDaySchema).min(1),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const tours = await getToursByOperator(operatorUser.operator.id);
    return NextResponse.json({ success: true, data: tours });
  } catch (error) {
    console.error("[GET /api/tours]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch safaris" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const { operator } = operatorUser;
    const planConfig   = getPlanConfig(operator.plan);

    const body   = await request.json();
    const result = CreateTourSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // ── Plan limit: max tours ─────────────────────────────────────────────
    // Count tours that are PUBLISHED or DRAFT (not ARCHIVED)
    // Only published tours count toward the plan limit
    if (data.status === "PUBLISHED") {
      const publishedCount = await prisma.tour.count({
        where: { operatorId: operator.id, status: "PUBLISHED" },
      });
      if (!canAddTour(operator.plan, publishedCount)) {
        return NextResponse.json(
          {
            success:     false,
            error:       `Your ${planConfig.name} plan allows a maximum of ${planConfig.maxTours} published safaris. Please upgrade to publish more.`,
            code:        "PLAN_LIMIT_TOURS",
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // ── Plan limit: featured tours ────────────────────────────────────────
    if (data.isFeatured) {
      if (planConfig.maxFeatured === 0) {
        return NextResponse.json(
          {
            success:         false,
            error:           `Your ${planConfig.name} plan does not include Featured safaris. Upgrade to Growth or Pro to feature your safaris.`,
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

    // ── Generate unique slug ──────────────────────────────────────────────
    let slug = slugify(data.title);
    const existing = await prisma.tour.findUnique({
      where: { operatorId_slug: { operatorId: operator.id, slug } },
    });
    if (existing) slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

    const tour = await createTour(operator.id, {
      ...data,
      slug,
      coverImageUrl: data.coverImageUrl || undefined,
      difficulty:    data.difficulty as Difficulty,
      status:        data.status as TourStatus,
    });

    // Trigger score recalculation so the new tour gets its initial visibilityScore
    const { recalculateTopPicks } = await import("@/lib/prisma/tours");
    await recalculateTopPicks(operator.id);

    return NextResponse.json({ success: true, data: tour }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tours]", error);
    return NextResponse.json({ success: false, error: "Failed to create safari" }, { status: 500 });
  }
}