// app/api/departures/[departureId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { updateDeparture, deleteDeparture } from "@/lib/prisma/departures";
import { z } from "zod";

const UpdateSchema = z.object({
  startDate:     z.string().optional(),
  endDate:       z.string().optional(),
  capacity:      z.number().int().min(1).optional(),
  priceOverride: z.number().min(0).nullable().optional(),
  notes:         z.string().max(500).optional(),
  status:        z.enum(["AVAILABLE", "FULL", "CANCELLED"]).optional(),
});

type RouteParams = { params: Promise<{ departureId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { departureId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const body = await request.json();
    const result = UpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = {
      ...result.data,
      startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
      endDate:   result.data.endDate   ? new Date(result.data.endDate)   : undefined,
    };

    const departure = await updateDeparture(departureId, operatorUser.operator.id, data);
    return NextResponse.json({ success: true, data: departure });
  } catch (error: any) {
    console.error("[PATCH /api/departures/[departureId]]", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to update departure" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { departureId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    await deleteDeparture(departureId, operatorUser.operator.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/departures/[departureId]]", error);
    const isBusinessError = error.message?.includes("bookings");
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to delete departure" },
      { status: isBusinessError ? 409 : 500 }
    );
  }
}