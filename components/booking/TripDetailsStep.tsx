"use client";
// components/booking/TripDetailsStep.tsx

import type { TourData, BookingFormData, Departure } from "./BookingShell";

interface Props {
  tour: TourData;
  form: BookingFormData;
  update: (patch: Partial<BookingFormData>) => void;
  totalPrice: number;
  selectedDeparture: Departure | null;
  onNext: () => void;
}

export default function TripDetailsStep({
  tour,
  form,
  update,
  totalPrice,
  selectedDeparture,
  onNext,
}: Props) {
  const currency = tour.currency || "KES";
  const canContinue = tour.departures.length === 0 || !!form.departureId;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Trip Details</h2>
        <p className="text-sm text-stone-400 mt-0.5">Select your departure date and group size</p>
      </div>

      {/* Departure picker */}
      {tour.departures.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-stone-700">Departure Date</legend>
          <div className="space-y-2">
            {tour.departures.map((dep) => {
              const start = new Date(dep.startDate);
              const end = dep.endDate ? new Date(dep.endDate) : null;
              const selected = form.departureId === dep.id;
              const full = dep.spotsAvailable !== null && dep.spotsAvailable <= 0;

              return (
                <button
                  key={dep.id}
                  type="button"
                  disabled={full}
                  onClick={() => update({ departureId: dep.id })}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between
                    ${full ? "opacity-40 cursor-not-allowed border-stone-100 bg-stone-50" :
                      selected
                        ? "border-amber-600 bg-amber-50"
                        : "border-stone-100 hover:border-stone-300 bg-white"
                    }`}
                >
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">
                      {start.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {end && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        → {end.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {dep.spotsAvailable !== null && (
                      <p className={`text-xs font-medium ${dep.spotsAvailable <= 3 ? "text-red-500" : "text-green-600"}`}>
                        {full ? "Fully booked" : `${dep.spotsAvailable} spots left`}
                      </p>
                    )}
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center ml-auto mt-1">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
          This safari runs on flexible dates — our team will confirm your preferred dates after booking.
        </div>
      )}

      {/* Guest count */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-700">Number of Guests</legend>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => update({ guests: Math.max(1, form.guests - 1) })}
            className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-amber-600 hover:text-amber-700 transition-colors font-bold text-lg"
          >
            −
          </button>
          <div className="text-center min-w-[3rem]">
            <p className="text-2xl font-bold text-stone-900">{form.guests}</p>
            <p className="text-xs text-stone-400">guest{form.guests !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={() => update({ guests: Math.min(20, form.guests + 1) })}
            className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-amber-600 hover:text-amber-700 transition-colors font-bold text-lg"
          >
            +
          </button>
          <div className="ml-4 flex-1 text-sm text-stone-500">
            <span className="font-semibold text-stone-800">{currency} {tour.pricePerPerson.toLocaleString()}</span> × {form.guests}
          </div>
        </div>
      </fieldset>

      {/* Special requests */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700">
          Special Requests <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.specialRequests}
          onChange={(e) => update({ specialRequests: e.target.value })}
          placeholder="Dietary requirements, accessibility needs, etc."
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none transition"
        />
      </div>

      {/* Total + CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div>
          <p className="text-xs text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-900">
            {currency} {totalPrice.toLocaleString()}
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="bg-amber-700 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}