"use client";
// components/bookings/BookingStatusSelect.tsx
// Inline dropdown to change booking status directly from the list or detail view.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";

type Props = {
  bookingId: string;
  current:   BookingStatus;
};

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "PENDING",   label: "Pending"   },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW",   label: "No Show"   },
];

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-green-50  text-green-700  border-green-200",
  COMPLETED: "bg-blue-50   text-blue-700   border-blue-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
  NO_SHOW:   "bg-stone-100 text-stone-600  border-stone-200",
};

export default function BookingStatusSelect({ bookingId, current }: Props) {
  const router  = useRouter();
  const [status,  setStatus]  = useState<BookingStatus>(current);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: BookingStatus) {
    if (next === status) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingStatus: next }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(next);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update booking status", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as BookingStatus)}
      disabled={loading}
      className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50 transition-colors ${STATUS_STYLES[status]}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}