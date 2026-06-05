// app/api/bookings/[bookingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getBookingById, updateBookingStatus, updateBookingNotes } from "@/lib/prisma/bookings";
import { z } from "zod";

const UpdateSchema = z.object({
  bookingStatus:  z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  internalNotes:  z.string().max(2000).optional(),
});

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const booking = await getBookingById(bookingId, operatorUser.operator.id);
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("[GET /api/bookings/[bookingId]]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId } = await params;
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

    const { bookingStatus, internalNotes } = result.data;

    if (bookingStatus) {
      await updateBookingStatus(bookingId, operatorUser.operator.id, bookingStatus);
    }
    if (internalNotes !== undefined) {
      await updateBookingNotes(bookingId, operatorUser.operator.id, internalNotes);
    }

    const updated = await getBookingById(bookingId, operatorUser.operator.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/bookings/[bookingId]]", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}