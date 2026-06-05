// components/public/PublicHeader.tsx
// Public-facing site header. Server component.

import Link from "next/link";

type Operator = {
  name:    string;
  slug:    string;
  logoUrl: string | null;
  phone:   string | null;
  email:   string | null;
};

export default function PublicHeader({ operator }: { operator: Operator }) {
  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo / brand */}
        <Link href={`/site/${operator.slug}`} className="flex items-center gap-3">
          {operator.logoUrl ? (
            <img
              src={operator.logoUrl}
              alt={operator.name}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {operator.name[0].toUpperCase()}
                </span>
              </div>
              <span className="font-bold text-stone-900 text-lg">{operator.name}</span>
            </div>
          )}
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {operator.phone && (
            <a
              href={`tel:${operator.phone}`}
              className="hidden sm:flex items-center gap-1.5 text-sm text-stone-600 hover:text-amber-700 transition-colors font-medium"
            >
              📞 <span>{operator.phone}</span>
            </a>
          )}
          <Link
            href={`/site/${operator.slug}#safaris`}
            className="bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-800 transition-colors"
          >
            View Safaris
          </Link>
        </div>

      </div>
    </header>
  );
}