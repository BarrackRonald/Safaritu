"use client";
// components/bookings/DeleteDepartureButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { departureId: string; hasBookings: boolean };

export default function DeleteDepartureButton({ departureId, hasBookings }: Props) {
  const router     = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  if (hasBookings) {
    return (
      <span className="text-xs text-stone-300 cursor-not-allowed" title="Cannot delete — has bookings">
        Delete
      </span>
    );
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/departures/${departureId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Failed to delete."); setConfirming(false); return; }
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (error) return <span className="text-xs text-red-500">{error}</span>;

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-400">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
        >
          {loading ? "…" : "Yes"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-stone-400 hover:underline">
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 hover:underline font-medium"
    >
      Delete
    </button>
  );
}