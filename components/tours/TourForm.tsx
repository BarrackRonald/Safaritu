"use client";
// components/tours/TourForm.tsx
// Full safari builder form. Used for both create and edit.
// Handles multi-step sections: basics, itinerary, pricing, settings.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItineraryDay = {
  dayNumber: number;
  title: string;
  description: string;
  accommodation: string;
  mealsIncluded: string[];
  activities: string[];
};

type TourFormData = {
  title: string;
  description: string;
  highlights: string[];
  includes: string[];
  excludes: string[];
  durationDays: number;
  durationNights: number;
  difficulty: string;
  maxCapacity: number;
  minGroupSize: number;
  pricePerPerson: number;
  currency: string;
  location: string;
  country: string;
  coverImageUrl: string;
  isFeatured: boolean;
  status: "DRAFT" | "PUBLISHED";
  itineraryDays: ItineraryDay[];
};

type Props = {
  tourId?: string; // if provided, we're editing
  initialData?: Partial<TourFormData>;
};

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "ZAR"];
const DIFFICULTIES = ["EASY", "MODERATE", "CHALLENGING", "EXTREME"];
const MEALS = ["breakfast", "lunch", "dinner"];

const defaultDay = (dayNumber: number): ItineraryDay => ({
  dayNumber,
  title: "",
  description: "",
  accommodation: "",
  mealsIncluded: [],
  activities: [],
});

const defaultValues: TourFormData = {
  title: "",
  description: "",
  highlights: [""],
  includes: [""],
  excludes: [""],
  durationDays: 1,
  durationNights: 0,
  difficulty: "MODERATE",
  maxCapacity: 12,
  minGroupSize: 1,
  pricePerPerson: 0,
  currency: "KES",
  location: "",
  country: "Kenya",
  coverImageUrl: "",
  isFeatured: false,
  status: "DRAFT",
  itineraryDays: [defaultDay(1)],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updateList(list: string[], index: number, value: string): string[] {
  const updated = [...list];
  updated[index] = value;
  return updated;
}

function addToList(list: string[]): string[] {
  return [...list, ""];
}

function removeFromList(list: string[], index: number): string[] {
  return list.filter((_, i) => i !== index);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TourForm({ tourId, initialData }: Props) {
  const router = useRouter();
  const isEditing = !!tourId;

  const [form, setForm] = useState<TourFormData>({
    ...defaultValues,
    ...initialData,
  });
  const [activeTab, setActiveTab] = useState<
    "basics" | "itinerary" | "pricing" | "settings"
  >("basics");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState<"DRAFT" | "PUBLISHED" | null>(
    null
  );

  // ── Field helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof TourFormData>(key: K, value: TourFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setDay(index: number, key: keyof ItineraryDay, value: unknown) {
    const updated = [...form.itineraryDays];
    updated[index] = { ...updated[index], [key]: value };
    setForm((prev) => ({ ...prev, itineraryDays: updated }));
  }

  function addDay() {
    setForm((prev) => ({
      ...prev,
      itineraryDays: [
        ...prev.itineraryDays,
        defaultDay(prev.itineraryDays.length + 1),
      ],
    }));
  }

  function removeDay(index: number) {
    const updated = form.itineraryDays
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setForm((prev) => ({ ...prev, itineraryDays: updated }));
  }

  function toggleMeal(dayIndex: number, meal: string) {
    const current = form.itineraryDays[dayIndex].mealsIncluded;
    const updated = current.includes(meal)
      ? current.filter((m) => m !== meal)
      : [...current, meal];
    setDay(dayIndex, "mealsIncluded", updated);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    setError(null);
    setSaving(true);
    setSaveLabel(status);

    // Clean up empty list items
    const payload = {
      ...form,
      status,
      highlights: form.highlights.filter(Boolean),
      includes: form.includes.filter(Boolean),
      excludes: form.excludes.filter(Boolean),
    };

    // Basic validation
    if (!payload.title.trim()) {
      setError("Safari title is required.");
      setSaving(false);
      setActiveTab("basics");
      return;
    }
    if (!payload.description.trim()) {
      setError("Description is required.");
      setSaving(false);
      setActiveTab("basics");
      return;
    }
    if (!payload.location.trim()) {
      setError("Location is required.");
      setSaving(false);
      setActiveTab("basics");
      return;
    }
    if (payload.itineraryDays.some((d) => !d.title.trim() || !d.description.trim())) {
      setError("All itinerary days must have a title and description.");
      setSaving(false);
      setActiveTab("itinerary");
      return;
    }
    if (payload.pricePerPerson <= 0) {
      setError("Price per person must be greater than 0.");
      setSaving(false);
      setActiveTab("pricing");
      return;
    }

    try {
      const url = isEditing ? `/api/tours/${tourId}` : "/api/tours";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to save safari.");
        return;
      }

      router.push("/operator/tours");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
      setSaveLabel(null);
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: "basics", label: "Basics" },
    { id: "itinerary", label: "Itinerary" },
    { id: "pricing", label: "Pricing" },
    { id: "settings", label: "Settings" },
  ] as const;

  return (
    <div className="max-w-3xl">

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-stone-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── BASICS TAB ── */}
      {activeTab === "basics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-stone-900">Safari details</h2>

            <Field label="Safari title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. 7-Day Maasai Mara Migration Safari"
                className={INPUT}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the safari experience in detail — what makes it special, what guests can expect..."
                rows={5}
                className={INPUT}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Location" required>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Maasai Mara, Kenya"
                  className={INPUT}
                />
              </Field>
              <Field label="Country">
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Duration (days)" required>
                <input
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 1;
                    set("durationDays", days);
                    // Auto-sync itinerary days
                    const current = form.itineraryDays;
                    if (days > current.length) {
                      const extra = Array.from(
                        { length: days - current.length },
                        (_, i) => defaultDay(current.length + i + 1)
                      );
                      set("itineraryDays", [...current, ...extra]);
                    } else if (days < current.length) {
                      set("itineraryDays", current.slice(0, days));
                    }
                  }}
                  className={INPUT}
                />
              </Field>
              <Field label="Duration (nights)">
                <input
                  type="number"
                  min={0}
                  value={form.durationNights}
                  onChange={(e) => set("durationNights", parseInt(e.target.value) || 0)}
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="Difficulty">
              <select
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className={INPUT}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cover image URL">
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
                placeholder="https://..."
                className={INPUT}
              />
              {form.coverImageUrl && (
                <img
                  src={form.coverImageUrl}
                  alt="Cover preview"
                  className="mt-2 w-full h-40 object-cover rounded-xl"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </Field>
          </div>

          {/* Highlights */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-stone-900">Highlights</h2>
            <p className="text-xs text-stone-400">
              Key selling points — shown prominently on the booking page.
            </p>
            {form.highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={h}
                  onChange={(e) =>
                    set("highlights", updateList(form.highlights, i, e.target.value))
                  }
                  placeholder={`Highlight ${i + 1}`}
                  className={INPUT + " flex-1"}
                />
                {form.highlights.length > 1 && (
                  <button
                    onClick={() => set("highlights", removeFromList(form.highlights, i))}
                    className="text-red-400 hover:text-red-600 text-lg px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => set("highlights", addToList(form.highlights))}
              className={ADD_BTN}
            >
              + Add highlight
            </button>
          </div>

          {/* Includes / Excludes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-stone-900">What&apos;s included</h2>
              {form.includes.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      set("includes", updateList(form.includes, i, e.target.value))
                    }
                    placeholder="e.g. Park fees"
                    className={INPUT + " flex-1"}
                  />
                  {form.includes.length > 1 && (
                    <button
                      onClick={() => set("includes", removeFromList(form.includes, i))}
                      className="text-red-400 hover:text-red-600 text-lg px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => set("includes", addToList(form.includes))}
                className={ADD_BTN}
              >
                + Add item
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-stone-900">What&apos;s excluded</h2>
              {form.excludes.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      set("excludes", updateList(form.excludes, i, e.target.value))
                    }
                    placeholder="e.g. International flights"
                    className={INPUT + " flex-1"}
                  />
                  {form.excludes.length > 1 && (
                    <button
                      onClick={() => set("excludes", removeFromList(form.excludes, i))}
                      className="text-red-400 hover:text-red-600 text-lg px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => set("excludes", addToList(form.excludes))}
                className={ADD_BTN}
              >
                + Add item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ITINERARY TAB ── */}
      {activeTab === "itinerary" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {form.itineraryDays.length} day
              {form.itineraryDays.length !== 1 ? "s" : ""} — matches your duration setting.
            </p>
            <button onClick={addDay} className={ADD_BTN}>
              + Add day
            </button>
          </div>

          {form.itineraryDays.map((day, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Day {day.dayNumber}
                </span>
                {form.itineraryDays.length > 1 && (
                  <button
                    onClick={() => removeDay(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove day
                  </button>
                )}
              </div>

              <Field label="Day title" required>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => setDay(i, "title", e.target.value)}
                  placeholder="e.g. Arrival & Sundowner Drive"
                  className={INPUT}
                />
              </Field>

              <Field label="Description" required>
                <textarea
                  value={day.description}
                  onChange={(e) => setDay(i, "description", e.target.value)}
                  placeholder="What happens on this day..."
                  rows={3}
                  className={INPUT}
                />
              </Field>

              <Field label="Accommodation">
                <input
                  type="text"
                  value={day.accommodation}
                  onChange={(e) => setDay(i, "accommodation", e.target.value)}
                  placeholder="e.g. Sarova Mara Game Camp"
                  className={INPUT}
                />
              </Field>

              <div>
                <label className={LABEL}>Meals included</label>
                <div className="flex gap-3 mt-2">
                  {MEALS.map((meal) => (
                    <label key={meal} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.mealsIncluded.includes(meal)}
                        onChange={() => toggleMeal(i, meal)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-stone-600 capitalize">{meal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={LABEL}>Activities</label>
                <div className="space-y-2 mt-2">
                  {(day.activities.length === 0 ? [""] : day.activities).map(
                    (act, ai) => (
                      <div key={ai} className="flex gap-2">
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => {
                            const updated = [...day.activities];
                            if (updated.length === 0) updated.push("");
                            updated[ai] = e.target.value;
                            setDay(i, "activities", updated);
                          }}
                          placeholder="e.g. Game drive"
                          className={INPUT + " flex-1"}
                        />
                        {day.activities.length > 1 && (
                          <button
                            onClick={() =>
                              setDay(
                                i,
                                "activities",
                                day.activities.filter((_, idx) => idx !== ai)
                              )
                            }
                            className="text-red-400 hover:text-red-600 text-lg px-2"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}
                  <button
                    onClick={() =>
                      setDay(i, "activities", [...day.activities, ""])
                    }
                    className={ADD_BTN}
                  >
                    + Add activity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PRICING TAB ── */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-stone-900">Pricing & Capacity</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per person" required>
              <input
                type="number"
                min={0}
                step={100}
                value={form.pricePerPerson}
                onChange={(e) =>
                  set("pricePerPerson", parseFloat(e.target.value) || 0)
                }
                className={INPUT}
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={INPUT}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Max capacity">
              <input
                type="number"
                min={1}
                value={form.maxCapacity}
                onChange={(e) =>
                  set("maxCapacity", parseInt(e.target.value) || 1)
                }
                className={INPUT}
              />
            </Field>
            <Field label="Min group size">
              <input
                type="number"
                min={1}
                value={form.minGroupSize}
                onChange={(e) =>
                  set("minGroupSize", parseInt(e.target.value) || 1)
                }
                className={INPUT}
              />
            </Field>
          </div>

          <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
            <strong>Note:</strong> You can add specific departure dates and seasonal pricing overrides from the safari detail page after saving.
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-stone-900">Visibility & Settings</h2>

          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-stone-800">
                Mark as Featured
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Pins this safari to the top of your public listing page.
              </p>
            </div>
            <button
              onClick={() => set("isFeatured", !form.isFeatured)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isFeatured ? "bg-amber-600" : "bg-stone-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isFeatured ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl">
            <p className="text-sm font-medium text-stone-800 mb-1">
              Top Picks score
            </p>
            <p className="text-xs text-stone-400">
              Automatically calculated based on booking volume, featured status, and recency. You cannot set this manually.
            </p>
          </div>
        </div>
      )}

      {/* ── Save buttons ── */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={saving}
          className="bg-amber-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && saveLabel === "PUBLISHED" ? (
            <>
              <Spinner />
              {isEditing ? "Saving…" : "Publishing…"}
            </>
          ) : isEditing ? (
            "Save & publish"
          ) : (
            "Publish safari"
          )}
        </button>

        <button
          onClick={() => handleSubmit("DRAFT")}
          disabled={saving}
          className="border border-stone-200 text-stone-700 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && saveLabel === "DRAFT" ? (
            <>
              <Spinner />
              Saving draft…
            </>
          ) : (
            "Save as draft"
          )}
        </button>

        <button
          onClick={() => router.push("/operator/tours")}
          disabled={saving}
          className="text-stone-400 text-sm hover:text-stone-600 transition-colors disabled:opacity-50 ml-2"
        >
          Cancel
        </button>
      </div>

    </div>
  );
}

// ─── Small shared UI helpers ──────────────────────────────────────────────────

const INPUT =
  "w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow bg-white";

const LABEL = "block text-sm font-medium text-stone-700";

const ADD_BTN =
  "text-xs text-amber-700 font-medium hover:underline";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL + " mb-1.5"}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}