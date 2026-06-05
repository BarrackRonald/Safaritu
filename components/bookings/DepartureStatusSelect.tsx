"use client";
// components/bookings/DepartureStatusSelect.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DepartureStatus } from "@prisma/client";

type Props = { departureId: string; current: DepartureStatus };

const OPTIONS: { value: DepartureStatus; label: string }[] = [
  { value: "AVAILABLE",  label: "Available"  },
  { value: "FULL",       label: "Full"        },
  { value: "CANCELLED",  label: "Cancelled"  },
];

const STYLES: Record<DepartureStatus, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  FULL:      "bg-red-50   text-red-700   border-red-200",
  CANCELLED: "bg-stone-100 text-stone-500 border-stone-200",
};

export default function DepartureStatusSelect({ departureId, current }: Props) {
  const router  = useRouter();
  const [status,  setStatus]  = useState<DepartureStatus>(current);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: DepartureStatus) {
    if (next === status) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departures/${departureId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.success) { setStatus(next); router.refresh(); }
    } catch (error) {
      console.error("Failed to update departure status", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as DepartureStatus)}
      disabled={loading}
      className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50 transition-colors ${STYLES[status]}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}