// app/operator/bookings/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getBookingsByOperator, getBookingStats } from "@/lib/prisma/bookings";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import OperatorShell from "@/components/layout/OperatorShell";
import BookingStatusSelect from "@/components/bookings/BookingStatusSelect";
import type { BookingStatus } from "@prisma/client";

export const metadata = { title: "Booking Control Center — SafariTu" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; search?: string }> };

export default async function BookingsPage({ searchParams }: Props) {
  const { status, search } = await searchParams;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const oid = operatorUser.operator.id;

  const [bookings, stats] = await Promise.all([
    getBookingsByOperator(oid, {
      status: status as BookingStatus | undefined,
      search: search || undefined,
    }),
    getBookingStats(oid),
  ]);

  const STATUS_TABS = [
    { label: "All", value: "", count: stats.total },
    { label: "Confirmed", value: "CONFIRMED", count: stats.confirmed },
    { label: "Pending", value: "PENDING", count: stats.pending },
    { label: "Completed", value: "COMPLETED", count: stats.completed },
    { label: "Cancelled", value: "CANCELLED", count: stats.cancelled },
  ];

  return (
    <OperatorShell operator={operatorUser.operator}>

      {/* 🧭 HEADER (FIELD DESK STYLE) */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Booking Control Desk
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {stats.total} total manifests · {stats.pending} awaiting confirmation
        </p>
      </div>

      {/* 🧭 STATUS STRIP (LIKE RADIO CHANNEL FILTERS) */}
      <div className="flex gap-2 mb-6 overflow-x-auto">

        {STATUS_TABS.map((tab) => {
          const isActive = (status ?? "") === tab.value;

          const href = tab.value
            ? `/operator/bookings?status=${tab.value}${search ? `&search=${search}` : ""}`
            : `/operator/bookings${search ? `?search=${search}` : ""}`;

          return (
            <Link
              key={tab.label}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition ${
                isActive
                  ? "bg-[#b08d57] text-black border-[#b08d57]"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}

      </div>

      {/* 🔍 SEARCH (FIELD LOOKUP BAR) */}
      <form method="GET" action="/operator/bookings" className="mb-6">
        {status && <input type="hidden" name="status" value={status} />}

        <div className="max-w-md relative">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search guest, safari, or reference…"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b08d57]"
          />
        </div>
      </form>

      {/* 🧭 EMPTY STATE (FIELD LOGIC) */}
      {bookings.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium text-stone-800">
            No bookings found
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Adjust filters or wait for new safari requests.
          </p>

          <Link
            href="/operator/bookings"
            className="text-sm text-[#b08d57] mt-4 inline-block"
          >
            Clear filters
          </Link>
        </div>
      ) : (

        /* 🧭 MAIN MANIFEST BOARD */
        <div className="space-y-3">

          {bookings.map((b) => (

            <div
              key={b.id}
              className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-sm transition"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                {/* LEFT: GUEST + SAFARI */}
                <div className="min-w-0">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center font-bold text-sm text-stone-700">
                      {b.customer.firstName[0]}{b.customer.lastName[0]}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {b.customer.firstName} {b.customer.lastName}
                      </p>

                      <p className="text-xs text-stone-500 truncate">
                        {b.tour.title} · {b.reference}
                      </p>
                    </div>

                  </div>

                </div>

                {/* CENTER: DATE + VALUE */}
                <div className="text-sm text-stone-600">

                  <p className="text-xs text-stone-400">
                    {formatRelativeTime(b.createdAt)}
                  </p>

                  <p className="font-semibold text-stone-900">
                    {formatCurrency(Number(b.totalAmount), b.currency)}
                  </p>

                </div>

                {/* RIGHT: STATUS CONTROL */}
                <div className="flex items-center gap-3">

                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.bookingStatus === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : b.bookingStatus === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-stone-100 text-stone-500"
                  }`}>
                    {b.bookingStatus}
                  </span>

                  <BookingStatusSelect
                    bookingId={b.id}
                    current={b.bookingStatus}
                  />

                  <Link
                    href={`/operator/bookings/${b.id}`}
                    className="text-xs text-[#b08d57] font-medium"
                  >
                    Open →
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* 🧭 FOOTER INFO BAR */}
      <div className="mt-6 text-xs text-stone-400">
        Showing {bookings.length} booking(s)
        {status && ` · Filter: ${status}`}
        {search && ` · Search: "${search}"`}
      </div>

    </OperatorShell>
  );
}