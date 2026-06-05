// app/page.tsx — SafariTu traveler homepage
// Destinations now come from the DB, not a hardcoded array.
// Tours ranked by visibilityScore (Pro > Growth > Starter + engagement).

import Link from "next/link";
import type { Metadata } from "next";
import {
  getPlatformFeaturedTours,
  getPlatformTopPicks,
  getAllOperators,
  getPlatformStats,
} from "@/lib/prisma/platform";
import { getFeaturedDestinations } from "@/lib/prisma/destinations";
import { formatCurrency, difficultyLabel, difficultyColor, truncate } from "@/lib/utils";
import HomepageSearch from "@/components/home/HomepageSearch";
import HomepageFeaturedCarousel from "@/components/home/HomepageFeaturedCarousel";
import DestinationGrid from "@/components/home/DestinationGrid";

export const metadata: Metadata = {
  title: "SafariTu — Only Safaris | Find & Book African Safaris",
  description:
    "Discover and book handcrafted safari experiences across East Africa. Browse tours from trusted local operators. Pay by Mpesa or card.",
  openGraph: {
    title:       "SafariTu — Only Safaris",
    description: "Find and book the perfect African safari. Trusted operators, secure payments, unforgettable experiences.",
    type:        "website",
  },
};

export default async function HomePage() {
  const [featured, topPicks, operators, stats, destinations] = await Promise.all([
    getPlatformFeaturedTours(5),
    getPlatformTopPicks(6),
    getAllOperators(),
    getPlatformStats(),
    getFeaturedDestinations(),
  ]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <span className="font-bold text-white text-lg drop-shadow">SafariTu</span>
            <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest hidden sm:block drop-shadow">
              Only Safaris
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/explore" className="text-white/80 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 hidden sm:block">
              Explore
            </Link>
            <Link href="/login"   className="text-white/80 hover:text-white text-sm font-medium transition-colors px-3 py-1.5">
              Operator login
            </Link>
            <Link href="/signup"  className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              List your safaris
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {featured.length > 0 ? (
        <HomepageFeaturedCarousel tours={featured} />
      ) : (
        <div className="relative bg-stone-900 min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=1600)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
          <div className="relative text-center px-6 max-w-4xl mx-auto pt-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">East Africa&apos;s Safari Marketplace</p>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Your next safari<br /><span className="text-amber-400">starts here</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Browse handcrafted safaris from trusted local operators. Book securely with Mpesa or card.
            </p>
            <HomepageSearch />
          </div>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="bg-amber-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-10">
          {[
            { value: `${stats.operators}`,  label: "Safari Operators"  },
            { value: `${stats.tours}+`,     label: "Unique Safaris"    },
            { value: `${stats.bookings}+`,  label: "Happy Travelers"   },
            { value: "Mpesa + Card",        label: "Payment Options"   },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-amber-200 text-xs uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">

        {/* ── Destinations ────────────────────────────────────────────────── */}
        {destinations.length > 0 && (
          <section className="py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-stone-900">Browse by Destination</h2>
              <p className="text-stone-400 mt-2">Where in East Africa do you want to go?</p>
            </div>
            <DestinationGrid destinations={destinations} />
            <div className="text-center mt-6">
              <Link href="/explore" className="text-sm text-amber-700 hover:underline font-medium">
                View all destinations →
              </Link>
            </div>
          </section>
        )}

        {/* ── Top Picks ───────────────────────────────────────────────────── */}
        {topPicks.length > 0 && (
          <section className="py-8 border-t border-stone-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-3xl font-bold text-stone-900">Top Picks</h2>
                </div>
                <p className="text-stone-400">Our most booked safaris across all operators</p>
              </div>
              <Link href="/explore?topPick=true" className="text-sm text-amber-700 font-semibold hover:underline hidden sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPicks.map((tour) => (
                <PlatformTourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </section>
        )}

        {/* ── Operators ───────────────────────────────────────────────────── */}
        {operators.length > 0 && (
          <section className="py-16 border-t border-stone-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-stone-900">Our Operators</h2>
                <p className="text-stone-400 mt-1">
                  {operators.length} trusted safari operator{operators.length !== 1 ? "s" : ""} in East Africa
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {operators.map((op) => (
                <Link
                  key={op.id}
                  href={`/site/${op.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="relative h-40 bg-stone-100 overflow-hidden">
                    {op.coverImageUrl ? (
                      <img src={op.coverImageUrl} alt={op.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                        <span className="text-5xl">🦁</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      {op.logoUrl ? (
                        <img src={op.logoUrl} alt={op.name} className="h-10 w-10 rounded-xl object-contain bg-white border border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold shadow-sm">
                          {op.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Plan badge */}
                    {op.plan !== "STARTER" && (
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          op.plan === "PRO" ? "bg-purple-600 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {op.plan === "PRO" ? "Pro" : "Growth"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-stone-900 group-hover:text-amber-700 transition-colors mb-1">
                      {op.name}
                    </h3>
                    {op.bio && (
                      <p className="text-stone-400 text-sm leading-relaxed flex-1">
                        {truncate(op.bio, 90)}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-stone-400 font-medium">
                        {op._count.tours} safari{op._count.tours !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-amber-700 font-bold group-hover:underline">
                        View safaris →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-stone-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900">How SafariTu Works</h2>
            <p className="text-stone-400 mt-2">Book your dream safari in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "🔍", title: "Search",    desc: "Browse safaris by destination, duration, or budget." },
              { icon: "📋", title: "Choose",    desc: "Compare itineraries, inclusions, and departure dates." },
              { icon: "💳", title: "Book",      desc: "Pay a deposit by Mpesa or card to secure your spot."  },
              { icon: "🦁", title: "Adventure", desc: "Your operator takes care of the rest. Just show up."  },
            ].map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-700 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust signals ────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-stone-100">
          <div className="bg-stone-50 rounded-3xl p-10 md:p-14">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-stone-900">Book with confidence</h2>
              <p className="text-stone-400 text-sm mt-2">Every booking on SafariTu is protected</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "🔒", title: "Secure Payments",   desc: "Mpesa and card payments processed securely."            },
                { icon: "✅", title: "Verified Operators", desc: "Every operator is manually reviewed before listing."    },
                { icon: "📞", title: "24/7 Support",       desc: "We're here if anything goes wrong before or during."   },
                { icon: "💰", title: "Best Price Promise", desc: "Book directly — no hidden fees or markups."            },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center gap-3">
                  <span className="text-4xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{item.title}</p>
                    <p className="text-stone-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Operator CTA ─────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-stone-100">
          <div className="bg-amber-700 rounded-3xl px-10 py-14 text-center text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 text-[200px] leading-none opacity-10 select-none">🦁</div>
            <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">For Safari Operators</p>
            <h2 className="text-3xl font-bold mb-4">List your safaris on SafariTu</h2>
            <p className="text-amber-100 max-w-xl mx-auto mb-8 leading-relaxed">
              Join East Africa&apos;s fastest-growing safari marketplace. Manage bookings, accept Mpesa payments, and reach thousands of travelers.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup" className="bg-white text-amber-700 font-bold px-8 py-3.5 rounded-xl hover:bg-amber-50 transition-colors">
                Start for free →
              </Link>
              <Link href="/login"  className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-sm">ST</div>
              <span className="font-bold text-lg">SafariTu</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
              East Africa&apos;s dedicated safari marketplace. Connecting travelers with the best local safari operators.
            </p>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-4">Only Safaris</p>
          </div>
          <div>
            <h4 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">For Travelers</h4>
            <nav className="space-y-2.5">
              {[
                { label: "Explore Safaris", href: "/explore"              },
                { label: "Top Picks",       href: "/explore?topPick=true" },
                { label: "Maasai Mara",     href: "/destinations/maasai-mara" },
                { label: "Serengeti",       href: "/destinations/serengeti"   },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-stone-400 hover:text-amber-400 text-sm transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">For Operators</h4>
            <nav className="space-y-2.5">
              {[
                { label: "List your safaris", href: "/signup" },
                { label: "Sign in",           href: "/login"  },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-stone-400 hover:text-amber-400 text-sm transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} SafariTu. All rights reserved.</p>
            <p>Built for East Africa 🌍</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── Shared platform tour card ──────────────────────────────────────────────────
type PlatformTour = {
  id:            string;
  slug:          string;
  title:         string;
  description:   string;
  durationDays:  number;
  durationNights:number;
  difficulty:    string;
  pricePerPerson:number;
  currency:      string;
  coverImageUrl: string | null;
  location:      string | null;
  isFeatured:    boolean;
  isTopPick:     boolean;
  destination:   { name: string; slug: string; emoji: string | null } | null;
  operator:      { name: string; slug: string; logoUrl: string | null; plan: string };
};

function PlatformTourCard({ tour }: { tour: PlatformTour }) {
  const href = `/site/${tour.operator.slug}/tours/${tour.slug}`;
  const locationLabel = tour.destination?.name ?? tour.location;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-52 bg-stone-100 overflow-hidden">
        {tour.coverImageUrl ? (
          <img src={tour.coverImageUrl} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
            <span className="text-5xl">{tour.destination?.emoji ?? "🦁"}</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {tour.isTopPick && <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">⭐ Top Pick</span>}
          {tour.isFeatured && !tour.isTopPick && <span className="bg-white/90 backdrop-blur text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">Featured</span>}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tour.durationDays}D / {tour.durationNights}N
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          {locationLabel && <span className="text-xs text-stone-400 flex items-center gap-1">📍 {locationLabel}</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(tour.difficulty)}`}>
            {difficultyLabel(tour.difficulty)}
          </span>
        </div>
        <h3 className="font-bold text-stone-900 mb-1.5 leading-snug group-hover:text-amber-700 transition-colors">
          {tour.title}
        </h3>
        <p className="text-stone-400 text-sm leading-relaxed flex-1">{truncate(tour.description, 90)}</p>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-50">
          <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
            {tour.operator.name[0]}
          </div>
          <span className="text-xs text-stone-400">{tour.operator.name}</span>
          {tour.operator.plan !== "STARTER" && (
            <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded ${
              tour.operator.plan === "PRO" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
            }`}>
              {tour.operator.plan === "PRO" ? "Pro" : "Growth"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-stone-400">From</p>
            <p className="text-lg font-bold text-stone-900">
              {formatCurrency(tour.pricePerPerson, tour.currency)}
            </p>
          </div>
          <span className="bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-amber-800 transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
