"use client";
// components/bookings/AddDepartureForm.tsx
// Inline form to add a new departure date to a safari.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Props = {
  tourId:            string;
  defaultCurrency:   string;
  defaultCapacity:   number;
  defaultPrice:      number;
};

export default function AddDepartureForm({
  tourId,
  defaultCurrency,
  defaultCapacity,
  defaultPrice,
}: Props) {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    startDate:     "",
    endDate:       "",
    capacity:      defaultCapacity,
    priceOverride: "" as string | number,
    notes:         "",
  });

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.startDate || !form.endDate) {
      setError("Both start and end dates are required.");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError("End date must be after start date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/departures", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId,
          startDate:     form.startDate,
          endDate:       form.endDate,
          capacity:      form.capacity,
          priceOverride: form.priceOverride !== "" ? Number(form.priceOverride) : undefined,
          notes:         form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to add departure.");
        return;
      }

      setOpen(false);
      setForm({ startDate: "", endDate: "", capacity: defaultCapacity, priceOverride: "", notes: "" });
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm"
      >
        + Add departure date
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-stone-900">New departure date</h3>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="text-stone-400 hover:text-stone-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Start date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("startDate", e.target.value)}
              required
              className={INPUT}
            />
          </div>
          <div>
            <label className={LBL}>End date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => set("endDate", e.target.value)}
              required
              className={INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Capacity (guests)</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => set("capacity", parseInt(e.target.value) || 1)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LBL}>
              Price override
              <span className="text-stone-400 font-normal ml-1">
                (optional — default {formatCurrency(defaultPrice, defaultCurrency)})
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={form.priceOverride}
              placeholder={String(defaultPrice)}
              onChange={(e) => set("priceOverride", e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className={LBL}>Notes (internal)</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. Peak season rate, school holiday departure"
            className={INPUT}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add departure"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            className="text-stone-400 text-sm hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const INPUT = "w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow bg-white";
const LBL   = "block text-sm font-medium text-stone-700 mb-1.5";