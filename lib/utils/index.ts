// lib/utils/index.ts
// Shared helper functions used across the entire SafariTu app.
// Import from here: import { cn, formatCurrency } from "@/lib/utils"

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ─── TAILWIND CLASS MERGING ───────────────────────────────────────────────────
// Use cn() everywhere instead of manually joining class strings.
// It handles conditional classes and resolves Tailwind conflicts cleanly.
// Example: cn("px-4", isActive && "bg-emerald-500") → "px-4 bg-emerald-500"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

const CURRENCY_LOCALES: Record<string, string> = {
  KES: "en-KE",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  TZS: "sw-TZ",
  UGX: "en-UG",
  ZAR: "en-ZA",
};

export function formatCurrency(
  amount: number | string,
  currency: string = "KES"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = CURRENCY_LOCALES[currency] ?? "en-KE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─── DATES ────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateRange(
  start: Date | string,
  end: Date | string
): string {
  const s = new Date(start);
  const e = new Date(end);
  if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    return `${format(s, "d")}–${format(e, "d MMM yyyy")}`;
  }
  return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
}

// ─── STRINGS ──────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Generates a short human-readable booking reference e.g. ST-2026-A4X2
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ST-${year}-${random}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

// ─── NUMBERS ──────────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-KE").format(n);
}

export function formatPercent(n: number, decimals: number = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── SAFARI / AVAILABILITY ────────────────────────────────────────────────────

export function spotsRemaining(capacity: number, bookedCount: number): number {
  return Math.max(0, capacity - bookedCount);
}

export function occupancyRate(capacity: number, bookedCount: number): number {
  if (capacity === 0) return 0;
  return clamp((bookedCount / capacity) * 100, 0, 100);
}

export function isAlmostFull(capacity: number, bookedCount: number): boolean {
  return occupancyRate(capacity, bookedCount) >= 80;
}

export function difficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    EASY: "Easy",
    MODERATE: "Moderate",
    CHALLENGING: "Challenging",
    EXTREME: "Extreme",
  };
  return labels[difficulty] ?? difficulty;
}

export function difficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    EASY: "text-green-600 bg-green-50",
    MODERATE: "text-amber-600 bg-amber-50",
    CHALLENGING: "text-orange-600 bg-orange-50",
    EXTREME: "text-red-600 bg-red-50",
  };
  return colors[difficulty] ?? "text-gray-600 bg-gray-50";
}
