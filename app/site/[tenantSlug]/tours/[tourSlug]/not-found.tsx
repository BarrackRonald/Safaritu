// app/site/[tenantSlug]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-7xl mb-6">🌍</p>
        <h1 className="text-3xl font-bold text-stone-900 mb-3">
          Safari not found
        </h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          The safari or operator you&apos;re looking for doesn&apos;t exist or is no longer available.
        </p>
        <Link
          href="/"
          className="bg-amber-700 text-white px-7 py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}