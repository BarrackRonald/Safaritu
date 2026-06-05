// app/operator/bookings/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { prisma } from "@/lib/prisma";
import OperatorShell from "@/components/layout/OperatorShell";
import BookingStatusBadge from "@/components/bookings/BookingStatusBadge";
import PaymentStatusBadge from "@/components/bookings/PaymentStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Bookings — SafariTu" };
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
type StatusFilter = typeof VALID_STATUSES[number];

interface Props {
  searchParams: { status?: string; q?: string; page?: string };
}

const PER_PAGE = 20;

export default async function BookingsPage({ searchParams }: Props) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const operatorId = operatorUser.operator.id;

  const statusFilter: StatusFilter =
    VALID_STATUSES.includes(searchParams.status as StatusFilter)
      ? (searchParams.status as StatusFilter)
      : "ALL";

  const search = searchParams.q?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const where = {
    operatorId,
    ...(statusFilter !== "ALL" ? { bookingStatus: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" as const } },
            { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
            { customer: { lastName:  { contains: search, mode: "insensitive" as const } } },
            { customer: { email:     { contains: search, mode: "insensitive" as const } } },
            { tour:     { title:     { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [bookings, total, stats] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        tour:     { select: { title: true, slug: true } },
        departure:{ select: { startDate: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PER_PAGE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({
      by: ["bookingStatus"],
      where: { operatorId },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  // Summary stats
  const statMap = Object.fromEntries(
    stats.map((s) => [s.bookingStatus, { count: s._count._all, sum: Number(s._sum.totalAmount ?? 0) }])
  );
  const totalRevenue = stats.reduce((acc, s) => acc + Number(s._sum.totalAmount ?? 0), 0);
  const confirmedCount = statMap["CONFIRMED"]?.count ?? 0;
  const pendingCount   = statMap["PENDING"]?.count   ?? 0;

  return (
    <OperatorShell operator={operatorUser.operator}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
          <p className="text-stone-500 text-sm mt-1">Manage all incoming bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bookings", value: total,          color: "bg-stone-50  text-stone-600"  },
          { label: "Confirmed",      value: confirmedCount, color: "bg-green-50  text-green-700"  },
          { label: "Pending",        value: pendingCount,   color: "bg-amber-50  text-amber-700"  },
          { label: "Total Revenue",  value: formatCurrency(totalRevenue, operatorUser.operator.currency ?? "KES"),
            color: "bg-blue-50 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <form method="GET" className="flex-1 min-w-[200px] max-w-sm">
          <input
            type="search" name="q" defaultValue={search}
            placeholder="Search by name, email, reference…"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition bg-white"
          />
        </form>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          {VALID_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/operator/bookings?status=${s}${search ? `&q=${search}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center shadow-sm">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-stone-800">No bookings found</p>
          <p className="text-stone-400 text-sm mt-1">
            {search ? `No results for "${search}"` : "Bookings will appear here once travellers start booking."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {["Reference", "Customer", "Safari", "Departure", "Guests", "Amount", "Payment", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-semibold text-amber-700">{b.reference}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-stone-900 whitespace-nowrap">
                        {b.customer.firstName} {b.customer.lastName}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{b.customer.email}</p>
                    </td>
                    <td className="px-4 py-4 max-w-[180px]">
                      <p className="text-stone-700 truncate">{b.tour.title}</p>
                    </td>
                    <td className="px-4 py-4 text-stone-500 text-xs whitespace-nowrap">
                      {formatDate(b.departure.startDate)}
                    </td>
                    <td className="px-4 py-4 text-center text-stone-600 font-medium">
                      {b.partySize}
                    </td>
                    <td className="px-4 py-4 font-semibold text-stone-800 whitespace-nowrap">
                      {formatCurrency(Number(b.totalAmount), b.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={b.paymentStatus} provider={b.payments[0]?.provider} />
                    </td>
                    <td className="px-4 py-4">
                      <BookingStatusBadge status={b.bookingStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/operator/bookings/${b.id}`}
                        className="text-xs text-amber-700 hover:underline font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-stone-50 bg-stone-50 flex items-center justify-between text-xs text-stone-400">
            <span>
              Showing {skip + 1}–{Math.min(skip + PER_PAGE, total)} of {total} booking{total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/operator/bookings?status=${statusFilter}&q=${search}&page=${page - 1}`}
                  className="px-3 py-1 rounded-lg border border-stone-200 hover:bg-white transition-colors text-stone-600">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/operator/bookings?status=${statusFilter}&q=${search}&page=${page + 1}`}
                  className="px-3 py-1 rounded-lg border border-stone-200 hover:bg-white transition-colors text-stone-600">
                  Next →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </OperatorShell>
  );
}