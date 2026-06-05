"use client";
// components/booking/GuestInfoStep.tsx

import type { BookingFormData } from "./BookingShell";

interface Props {
  form: BookingFormData;
  update: (patch: Partial<BookingFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function GuestInfoStep({ form, update, onBack, onNext }: Props) {
  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.phone.trim().length >= 9;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Your Information</h2>
        <p className="text-sm text-stone-400 mt-0.5">Lead guest details — you'll receive the booking confirmation</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="First Name"
          type="text"
          value={form.firstName}
          onChange={(v) => update({ firstName: v })}
          placeholder="Jane"
          required
        />
        <Field
          label="Last Name"
          type="text"
          value={form.lastName}
          onChange={(v) => update({ lastName: v })}
          placeholder="Doe"
          required
        />
      </div>

      <Field
        label="Email Address"
        type="email"
        value={form.email}
        onChange={(v) => update({ email: v })}
        placeholder="jane@example.com"
        required
        hint="Booking confirmation will be sent here"
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={(v) => update({ phone: v })}
          placeholder="+254 7XX XXX XXX"
          required
        />
        <Field
          label="Nationality"
          type="text"
          value={form.nationality}
          onChange={(v) => update({ nationality: v })}
          placeholder="Kenyan"
        />
      </div>

      {/* Privacy note */}
      <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">
        Your details are shared only with {/* operator name injected by parent if needed */}
        the operator to facilitate your booking. We never sell your data.
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <button
          onClick={onBack}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors font-medium"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="bg-amber-700 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="text-amber-600 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
      />
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}