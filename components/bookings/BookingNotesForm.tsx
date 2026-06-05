"use client";
// components/bookings/BookingNotesForm.tsx
// Editable internal notes field on the booking detail page.

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { bookingId: string; initialNotes: string };

export default function BookingNotesForm({ bookingId, initialNotes }: Props) {
  const router  = useRouter();
  const [notes,   setNotes]   = useState(initialNotes);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ internalNotes: notes }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save notes.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add internal notes about this booking — visible only to you and your team."
        rows={4}
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-shadow"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || notes === initialNotes}
          className="bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {saved && (
          <span className="text-xs text-green-600 font-medium">✓ Saved</span>
        )}
      </div>
    </div>
  );
}