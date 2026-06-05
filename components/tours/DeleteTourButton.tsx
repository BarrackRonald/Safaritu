"use client";
// components/tours/DeleteTourButton.tsx
// Delete button with inline confirmation. Prevents accidental deletion.

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tourId: string;
  tourTitle: string;
};

export default function DeleteTourButton({ tourId, tourTitle }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tours/${tourId}`, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to delete safari.");
        setConfirming(false);
        return;
      }

      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <span className="text-xs text-red-600">{error}</span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-500">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-stone-400 hover:underline"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-500 hover:underline font-medium"
    >
      Delete
    </button>
  );
}