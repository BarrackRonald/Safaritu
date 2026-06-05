// app/api/departures/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { createDeparture } from "@/lib/prisma/departures";
import { z } from "zod";

const CreateDepartureSchema = z.object({
  tourId:        z.string().min(1),
  startDate:     z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate:       z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  capacity:      z.number().int().min(1).max(500),
  priceOverride: z.number().min(0).optional(),
  notes:         z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const body = await request.json();
    const result = CreateDepartureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { tourId, startDate, endDate, capacity, priceOverride, notes } = result.data;

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { success: false, error: "End date must be after start date." },
        { status: 400 }
      );
    }

    const departure = await createDeparture(tourId, operatorUser.operator.id, {
      startDate:     new Date(startDate),
      endDate:       new Date(endDate),
      capacity,
      priceOverride,
      notes,
    });

    return NextResponse.json({ success: true, data: departure }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/departures]", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to create departure" },
      { status: 500 }
    );
  }
}