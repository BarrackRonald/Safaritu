// app/operator/dashboard/page.tsx
// Protected server component. Reads the logged-in operator from the DB
// and renders real stats. Redirects to login if session is missing.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId, getOperatorWithStats } from "@/lib/prisma/operator";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { prisma } from "@/lib/prisma/client";
import SignOutButton from "./SignOutButton";

export const metadata = { title: "Dashboard — SafariTu" };

export default async function DashboardPage() {
  // Get authenticated Supabase user
  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Get operator record linked to this Supabase user
  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const { operator } = operatorUser;

  // Get stats
  const operatorWithStats = await getOperatorWithStats(operator.id);

  // Get revenue total
  const revenueResult = await prisma.payment.aggregate({
    where: {
      booking: { operatorId: operator.id },
      status: "PAID",
    },
    _sum: { amount: true },
  });
  const totalRevenue = Number(revenueResult._sum.amount ?? 0);

  // Get this month's bookings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const bookingsThisMonth = await prisma.booking.count({
    where: {
      operatorId: operator.id,
      createdAt: { gte: startOfMonth },
    },
  });

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { operatorId: operator.id },
    include: {
      tour: { select: { title: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, operator.plan === "STARTER" ? "KES" : "KES"),
      sub: "All time",
      icon: "💰",
    },
    {
      label: "Total Bookings",
      value: formatNumber(operatorWithStats?._count.bookings ?? 0),
      sub: `${bookingsThisMonth} this month`,
      icon: "📅",
    },
    {
      label: "Customers",
      value: formatNumber(operatorWithStats?._count.customers ?? 0),
      sub: "In your CRM",
      icon: "👥",
    },
    {
      label: "Active Safaris",
      value: formatNumber(operatorWithStats?._count.tours ?? 0),
      sub: "Published",
      icon: "🦁",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-stone-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-lg text-amber-700">SafariTu</span>
            <span className="text-xs text-stone-400 ml-2 tracking-widest uppercase">
              Only Safaris
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-500 hidden sm:block">
              {operator.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm select-none">
              {operator.name[0].toUpperCase()}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Sidebar + main layout ── */}
      <div className="max-w-6xl mx-auto flex gap-6 px-8 py-8">

        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-amber-50 hover:text-amber-800 transition-colors"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
            <p className="text-stone-500 text-sm mt-1">
              Welcome back, {operator.name}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                <p className="text-xs text-stone-400 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent bookings + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Recent bookings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-stone-900">Recent Bookings</h2>
                <Link
                  href="/operator/bookings"
                  className="text-xs text-amber-700 hover:underline"
                >
                  View all
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-sm font-medium">No bookings yet</p>
                  <p className="text-xs mt-1">
                    Create your first safari to start receiving bookings.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </p>
                        <p className="text-xs text-stone-400">
                          {booking.tour.title} · {booking.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-stone-900">
                          {formatCurrency(Number(booking.totalAmount), booking.currency)}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            booking.bookingStatus === "CONFIRMED"
                              ? "bg-green-50 text-green-700"
                              : booking.bookingStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {booking.bookingStatus.charAt(0) +
                            booking.bookingStatus.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <h2 className="font-semibold text-stone-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 hover:bg-amber-50 hover:text-amber-800 transition-colors text-sm font-medium text-stone-700 w-full"
                  >
                    <span className="text-lg">{action.icon}</span>
                    {action.label}
                  </Link>
                ))}
              </div>

              {/* Plan badge */}
              <div className="mt-6 bg-amber-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                  {operator.plan} Plan
                </p>
                {operator.plan === "STARTER" && (
                  <p className="text-xs text-amber-600 mt-1">
                    Upgrade to unlock more features
                  </p>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", href: "/operator/dashboard" },
  { icon: "🦁", label: "Safaris", href: "/operator/tours" },
  { icon: "📅", label: "Bookings", href: "/operator/bookings" },
  { icon: "👥", label: "Customers", href: "/operator/customers" },
  { icon: "📈", label: "Reports", href: "/operator/reports" },
  { icon: "⚙️", label: "Settings", href: "/operator/settings" },
];

const QUICK_ACTIONS = [
  { icon: "➕", label: "New safari", href: "/operator/tours/new" },
  { icon: "📅", label: "View bookings", href: "/operator/bookings" },
  { icon: "👥", label: "View customers", href: "/operator/customers" },
  { icon: "📈", label: "View reports", href: "/operator/reports" },
];