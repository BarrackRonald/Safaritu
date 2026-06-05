"use client";
// components/home/HomepageSearch.tsx
// Hero search bar on the platform homepage.
// Submits to /explore with query params.

import { useState } from "react";
import { useRouter } from "next/navigation";

const POPULAR = ["Maasai Mara", "Amboseli", "Serengeti", "Tsavo", "Samburu"];

export default function HomepageSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      router.push("/explore");
      return;
    }
    router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destinations, safari types…"
          className="flex-1 px-6 py-4 text-stone-900 placeholder-stone-400 focus:outline-none text-base"
        />
        <button
          type="submit"
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 transition-colors text-sm shrink-0"
        >
          Search
        </button>
      </form>

      {/* Popular searches */}
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        <span className="text-white/50 text-xs">Popular:</span>
        {POPULAR.map((term) => (
          <button
            key={term}
            onClick={() => router.push(`/explore?destination=${encodeURIComponent(term)}`)}
            className="text-white/70 hover:text-white text-xs border border-white/20 hover:border-white/40 px-3 py-1 rounded-full transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}