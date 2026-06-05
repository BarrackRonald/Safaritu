"use client";
// components/tours/TourFeaturedToggle.tsx
// Toggles featured status. Shows a friendly upgrade prompt if the operator
// has hit their plan's featured tour limit.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  tourId:     string;
  isFeatured: boolean;
};

export default function TourFeaturedToggle({ tourId, isFeatured }: Props) {
  const router  = useRouter();
  const [featured,  setFeatured]  = useState(isFeatured);
  const [loading,   setLoading]   = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setUpgradeMsg(null);
    const next = !featured;

    try {
      const res  = await fetch(`/api/tours/${tourId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isFeatured: next }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.code === "PLAN_LIMIT_FEATURED") {
          setUpgradeMsg(data.error);
        }
        return;
      }

      setFeatured(next);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle featured status", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        title={featured ? "Remove from featured" : "Mark as featured"}
        className={`text-xl transition-all disabled:opacity-40 hover:scale-110 ${
          loading ? "animate-pulse" : ""
        }`}
      >
        {featured ? "⭐" : "☆"}
      </button>

      {/* Upgrade prompt shown inline under the star */}
      {upgradeMsg && (
        <div className="absolute z-10 mt-8 w-64 bg-white border border-amber-200 rounded-xl shadow-lg p-3 text-xs">
          <p className="text-stone-700 mb-2">{upgradeMsg}</p>
          <Link
            href="/operator/settings/billing"
            className="bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-800 transition-colors block text-center"
          >
            Upgrade plan →
          </Link>
          <button
            onClick={() => setUpgradeMsg(null)}
            className="mt-1.5 text-stone-400 hover:text-stone-600 block w-full text-center"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}