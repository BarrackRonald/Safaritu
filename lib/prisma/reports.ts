// lib/prisma/reports.ts
import "server-only";
import { prisma } from "@/lib/prisma/client";

export async function getRevenueByMonth(operatorId: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      booking:  { operatorId },
      status:   "PAID",
      createdAt:{ gte: since },
    },
    select: { amount: true, createdAt: true },
  });

  // Build month buckets
  const map: Record<string, number> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d   = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("en-KE", { month: "short", year: "2-digit" });
    map[key]  = 0;
  }
  for (const p of payments) {
    const key = p.createdAt.toLocaleString("en-KE", { month: "short", year: "2-digit" });
    if (key in map) map[key] += Number(p.amount);
  }

  return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
}

export async function getBookingsByMonth(operatorId: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where:  { operatorId, createdAt: { gte: since } },
    select: { createdAt: true, bookingStatus: true },
  });

  const map: Record<string, number> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d   = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("en-KE", { month: "short", year: "2-digit" });
    map[key]  = 0;
  }
  for (const b of bookings) {
    if (b.bookingStatus === "CANCELLED") continue;
    const key = b.createdAt.toLocaleString("en-KE", { month: "short", year: "2-digit" });
    if (key in map) map[key]++;
  }
  return Object.entries(map).map(([month, bookings]) => ({ month, bookings }));
}

export async function getTopTours(operatorId: string, limit = 5) {
  const tours = await prisma.tour.findMany({
    where:   { operatorId },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where:  { bookingStatus: { not: "CANCELLED" } },
        select: { totalAmount: true, currency: true },
      },
    },
    orderBy: { topPickScore: "desc" },
    take:    limit,
  });

  return tours.map((t) => ({
    id:         t.id,
    title:      t.title,
    bookings:   t._count.bookings,
    revenue:    t.bookings.reduce((s, b) => s + Number(b.totalAmount), 0),
    currency:   t.currency,
    isFeatured: t.isFeatured,
    isTopPick:  t.isTopPick,
  }));
}

export async function getRevenueStats(operatorId: string) {
  const now            = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

  const [allTime, thisMonth, lastMonth, pending] = await Promise.all([
    prisma.payment.aggregate({
      where: { booking: { operatorId }, status: "PAID" },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { booking: { operatorId }, status: "PAID", createdAt: { gte: startOfMonth } },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { booking: { operatorId }, status: "PAID", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum:  { amount: true },
    }),
    prisma.booking.aggregate({
      where: { operatorId, paymentStatus: "PARTIAL" },
      _sum:  { balanceDue: true },
    }),
  ]);

  const thisMonthRev = Number(thisMonth._sum.amount  ?? 0);
  const lastMonthRev = Number(lastMonth._sum.amount  ?? 0);
  const growthPct    = lastMonthRev === 0 ? null
    : ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100;

  return {
    allTime:      Number(allTime._sum.amount    ?? 0),
    thisMonth:    thisMonthRev,
    lastMonth:    lastMonthRev,
    growthPct,
    pendingBalance: Number(pending._sum.balanceDue ?? 0),
  };
}

export async function getOccupancyStats(operatorId: string) {
  const departures = await prisma.departure.findMany({
    where:   { tour: { operatorId }, startDate: { gte: new Date(Date.now() - 90 * 86400000) } },
    select:  { capacity: true, bookedCount: true },
  });

  if (departures.length === 0) return { avgOccupancy: 0, totalDepartures: 0 };

  const avg = departures.reduce(
    (sum, d) => sum + (d.capacity > 0 ? d.bookedCount / d.capacity : 0),
    0
  ) / departures.length;

  return { avgOccupancy: avg * 100, totalDepartures: departures.length };
}

export async function getBookingSourceStats(operatorId: string) {
  const sources = await prisma.customer.groupBy({
    by:     ["source"],
    where:  { operatorId, source: { not: null } },
    _count: { id: true },
  });
  return sources.map((s) => ({ source: s.source ?? "unknown", count: s._count.id }));
}