"use client";
// components/booking/StepIndicator.tsx

interface Props {
  steps: readonly string[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done ? "bg-amber-700 text-white" : active ? "bg-amber-700 text-white ring-4 ring-amber-100" : "bg-stone-100 text-stone-400"}`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${active ? "text-stone-900" : done ? "text-amber-700" : "text-stone-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < current ? "bg-amber-700" : "bg-stone-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}