"use client";
// components/layout/NavLink.tsx
// Client component so it can use usePathname for active link highlighting.
// Kept minimal — just the nav link with active state logic.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  icon: string;
  label: string;
};

export default function NavLink({ href, icon, label }: Props) {
  const pathname = usePathname();

  // Mark as active if the current path starts with this href
  // e.g. /operator/tours/new is "active" for the Safaris nav item
  const isActive =
    pathname === href || (href !== "/operator/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-amber-50 text-amber-800"
          : "text-stone-600 hover:bg-amber-50 hover:text-amber-800"
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}