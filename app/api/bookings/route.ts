// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getBookingsByOperator } from "@/lib/prisma/bookings";
import type { BookingStatus, PaymentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const { searchParams } = request.nextUrl;
    const status        = searchParams.get("status")        as BookingStatus | null;
    const paymentStatus = searchParams.get("paymentStatus") as PaymentStatus | null;
    const search        = searchParams.get("search")        ?? undefined;
    const tourId        = searchParams.get("tourId")        ?? undefined;

    const bookings = await getBookingsByOperator(operatorUser.operator.id, {
      status:        status        ?? undefined,
      paymentStatus: paymentStatus ?? undefined,
      search,
      tourId,
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("[GET /api/bookings]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}