// components/home/DestinationGrid.tsx
// Displays curated destination cards linking to destination landing pages.
// Server component — no client hooks needed.

import Link from "next/link";

type Destination = {
  id:       string;
  name:     string;
  slug:     string;
  country:  string;
  emoji:    string | null;
  imageUrl: string | null;
};

type Props = {
  destinations: Destination[];
};

export default function DestinationGrid({ destinations }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {destinations.map((dest) => (
        <DestinationCard key={dest.id} destination={dest} />
      ))}
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 aspect-square flex flex-col items-center justify-end"
    >
      {/* Background image or gradient */}
      {destination.imageUrl ? (
        <>
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-stone-100 group-hover:from-amber-100 transition-colors" />
      )}

      {/* Content */}
      <div className="relative z-10 text-center p-3 w-full">
        <span className="text-3xl block mb-1.5 group-hover:scale-110 transition-transform">
          {destination.emoji ?? "🌍"}
        </span>
        <p className={`font-bold text-sm leading-tight ${
          destination.imageUrl ? "text-white" : "text-stone-900"
        }`}>
          {destination.name}
        </p>
        <p className={`text-xs mt-0.5 ${
          destination.imageUrl ? "text-white/70" : "text-stone-400"
        }`}>
          {destination.country}
        </p>
      </div>
    </Link>
  );
}
