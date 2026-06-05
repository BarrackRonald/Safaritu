// components/layout/OperatorShell.tsx
// Server component — shared layout for all operator dashboard pages.

import Link from "next/link";
import type { Operator } from "@prisma/client";
import SignOutButton from "@/app/operator/dashboard/SignOutButton";
import NavLink from "@/components/layout/NavLink";

type Props = { operator: Operator; children: React.ReactNode };

export const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", href: "/operator/dashboard" },
  { icon: "🦁", label: "Safaris",   href: "/operator/tours"     },
  { icon: "📅", label: "Bookings",  href: "/operator/bookings"  },
  { icon: "👥", label: "Customers", href: "/operator/customers" },
  { icon: "📈", label: "Reports",   href: "/operator/reports"   },
  { icon: "⚙️", label: "Settings",  href: "/operator/settings"  },
];

export default function OperatorShell({ operator, children }: Props) {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/operator/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-stone-900">SafariTu</span>
              <span className="text-xs text-stone-400 ml-1.5 tracking-widest uppercase">
                Only Safaris
              </span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/operator/tours/new"
              className="hidden sm:flex items-center gap-1.5 bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-amber-800 transition-colors"
            >
              <span className="text-sm">+</span> New safari
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-stone-100">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm select-none">
                {operator.name[0].toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-stone-800 leading-none">
                  {operator.name}
                </p>
                <p className="text-xs text-stone-400 mt-0.5 capitalize">
                  {operator.plan.toLowerCase()} plan
                </p>
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0">
          <nav className="space-y-0.5 sticky top-24">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>

      </div>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-100 z-20 flex">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} label="" />
        ))}
      </nav>

    </div>
  );
}