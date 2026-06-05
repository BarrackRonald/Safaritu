// app/page.tsx
// SafariTu traveler-facing homepage.
// This is what the public sees at safaritu.com — a marketplace of safari operators.
// Server-rendered for SEO. Shows featured safaris, top picks, operators, and search.

import Link from "next/link";
import type { Metadata } from "next";
import {
  getPlatformFeaturedTours,
  getPlatformTopPicks,
  getAllOperators,
  getPlatformStats,
} from "@/lib/prisma/platform";
import {
  formatCurrency,
  difficultyLabel,
  difficultyColor,
  truncate,
} from "@/lib/utils";
import HomepageSearch from "@/components/home/HomepageSearch";
import HomepageFeaturedCarousel from "@/components/home/HomepageFeaturedCarousel";

// ─── SEO ──────────────────────────────────────────────────────────────────────

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

// ─── Static content ───────────────────────────────────────────────────────────

const DESTINATIONS = [
  { name: "Maasai Mara", emoji: "🦁", country: "Kenya"    },
  { name: "Amboseli",    emoji: "🐘", country: "Kenya"    },
  { name: "Serengeti",   emoji: "🌅", country: "Tanzania" },
  { name: "Tsavo",       emoji: "🦏", country: "Kenya"    },
  { name: "Samburu",     emoji: "🦒", country: "Kenya"    },
  { name: "Ngorongoro",  emoji: "🌋", country: "Tanzania" },
] satisfies { name: string; emoji: string; country: string }[];

const HOW_IT_WORKS = [
  { icon: "🔍", title: "Search",    desc: "Browse safaris by destination, duration, or budget."  },
  { icon: "📋", title: "Choose",    desc: "Compare itineraries, inclusions, and departure dates." },
  { icon: "💳", title: "Book",      desc: "Pay a deposit by Mpesa or card to secure your spot."  },
  { icon: "🦁", title: "Adventure", desc: "Your operator takes care of the rest. Just show up."   },
] satisfies { icon: string; title: string; desc: string }[];

const TRUST_ITEMS = [
  { icon: "🔒", title: "Secure Payments",   desc: "Mpesa and card payments processed securely."          },
  { icon: "✅", title: "Verified Operators", desc: "Every operator is manually reviewed before listing."  },
  { icon: "📞", title: "24/7 Support",       desc: "We're here if anything goes wrong before or during." },
  { icon: "💰", title: "Best Price Promise", desc: "Book directly — no hidden fees or markups."          },
] satisfies { icon: string; title: string; desc: string }[];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Fetch in parallel; .catch() ensures a single failing query never 500s the page.
  const [featured, topPicks, operators, stats] = await Promise.all([
    getPlatformFeaturedTours(5).catch(() => []),
    getPlatformTopPicks(6).catch(() => []),
    getAllOperators().catch(() => []),
    getPlatformStats().catch(() => ({ operators: 0, tours: 0, bookings: 0 })),
  ]);

  // Normalise to arrays — guards against resolvers that return null instead of []
  const safeFeatured = Array.isArray(featured)
  ? featured.filter(
      (tour) => tour?.id && tour?.slug
    )
  : [];
  //const safeFeatured  = Array.isArray(featured)  ? featured  : [];
  const safeTopPicks  = Array.isArray(topPicks)  ? topPicks  : [];
  const safeOperators = Array.isArray(operators) ? operators : [];
  

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {/*
        Fixed (not absolute) so it stays visible while scrolling and always
        floats above both the carousel and the static hero fallback.
      */}
      <header className="fixed top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          <Link
            href="/"
            aria-label="SafariTu home"
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" aria-hidden="true">ST</span>
            </div>
            <span className="font-bold text-white text-lg drop-shadow">SafariTu</span>
            <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest hidden sm:block drop-shadow">
              Only Safaris
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <Link
              href="/explore"
              className="text-white/80 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 hidden sm:block"
            >
              Explore
            </Link>
            <Link
              href="/login"
              className="text-white/80 hover:text-white text-sm font-medium transition-colors px-3 py-1.5"
            >
              Operator login
            </Link>
            <Link
              href="/signup"
              className="bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              List your safaris
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      {/*
        Carousel renders when featured tours exist.
        Both branches include a h-16 spacer to clear the fixed nav.
        The carousel also receives tours={safeFeatured} — never undefined.
      */}
      {safeFeatured.length > 0 ? (
        <HomepageFeaturedCarousel tours={safeFeatured} />
      ) : (
        <div className="relative bg-stone-900 min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600')] bg-cover bg-center opacity-40"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60"
            aria-hidden="true"
          />
          <div className="relative text-center px-4 sm:px-6 max-w-4xl mx-auto pt-16 w-full">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
              East Africa&apos;s Safari Marketplace
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              Your next safari
              <br />
              <span className="text-amber-400">starts here</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Browse handcrafted safaris from trusted local operators.
              Book securely with Mpesa or card.
            </p>
            <HomepageSearch tours={[]} />
          </div>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="bg-amber-700 text-white">
        <dl className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-8 sm:gap-10">
          {[
            { value: String(safeOperators.length || stats.operators || "—"), label: "Safari Operators" },
            { value: `${stats.tours     ?? "—"}+`,                           label: "Unique Safaris"   },
            { value: `${stats.bookings  ?? "—"}+`,                           label: "Happy Travelers"  },
            { value: "Mpesa + Card",                                          label: "Payment Options"  },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <dd className="text-2xl font-bold">{s.value}</dd>
              <dt className="text-amber-200 text-xs uppercase tracking-wide mt-0.5">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Browse by destination ─────────────────────────────────────────── */}
        <section aria-labelledby="destinations-heading" className="py-16">
          <div className="text-center mb-10">
            <h2 id="destinations-heading" className="text-3xl font-bold text-stone-900">
              Browse by Destination
            </h2>
            <p className="text-stone-400 mt-2">Where in East Africa do you want to go?</p>
          </div>

          <ul role="list" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {DESTINATIONS.map((dest) => (
              <li key={dest.name}>
                <Link
                  href={`/explore?destination=${encodeURIComponent(dest.name)}`}
                  className="group flex flex-col items-center gap-3 bg-stone-50 hover:bg-amber-50 border border-stone-100 hover:border-amber-200 rounded-2xl p-5 transition-all hover:-translate-y-0.5 text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label={`Browse safaris in ${dest.name}, ${dest.country}`}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform" aria-hidden="true">
                    {dest.emoji}
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{dest.name}</p>
                    <p className="text-stone-400 text-xs">{dest.country}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Top Picks ─────────────────────────────────────────────────────── */}
        {safeTopPicks.length > 0 && (
          <section
            aria-labelledby="top-picks-heading"
            className="py-8 border-t border-stone-100"
          >
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span aria-hidden="true" className="text-2xl">⭐</span>
                  <h2 id="top-picks-heading" className="text-3xl font-bold text-stone-900">
                    Top Picks
                  </h2>
                </div>
                <p className="text-stone-400">Our most booked safaris across all operators</p>
              </div>
              <Link
                href="/explore?topPick=true"
                className="text-sm text-amber-700 font-semibold hover:underline hidden sm:block shrink-0"
                aria-label="View all top pick safaris"
              >
                View all →
              </Link>
            </div>

            <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeTopPicks.map((tour) => (
                <li key={tour.id}>
                  <PlatformTourCard tour={tour} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── All Operators ─────────────────────────────────────────────────── */}
        {safeOperators.length > 0 && (
          <section
            aria-labelledby="operators-heading"
            className="py-16 border-t border-stone-100"
          >
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <h2 id="operators-heading" className="text-3xl font-bold text-stone-900">
                  Our Operators
                </h2>
                <p className="text-stone-400 mt-1">
                  {safeOperators.length} trusted safari operator
                  {safeOperators.length !== 1 ? "s" : ""} in East Africa
                </p>
              </div>
            </div>

            <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeOperators.map((op) => (
                <li key={op.id}>
                  <Link
                    href={`/site/${op.slug}`}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 h-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                    aria-label={`View ${op.name} — ${op._count.tours} safari${op._count.tours !== 1 ? "s" : ""}`}
                  >
                    {/* Cover image */}
                    <div className="relative h-40 bg-stone-100 overflow-hidden">
                      {op.coverImageUrl ? (
                        <img
                          src={op.coverImageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <span className="text-5xl">🦁</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
                      {/* Logo */}
                      <div className="absolute bottom-3 left-4">
                        {op.logoUrl ? (
                          <img
                            src={op.logoUrl}
                            alt={`${op.name} logo`}
                            className="h-10 w-10 rounded-xl object-contain bg-white border border-white shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold shadow-sm"
                            aria-hidden="true"
                          >
                            {op.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
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
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section aria-labelledby="how-heading" className="py-16 border-t border-stone-100">
          <div className="text-center mb-12">
            <h2 id="how-heading" className="text-3xl font-bold text-stone-900">
              How SafariTu Works
            </h2>
            <p className="text-stone-400 mt-2">Book your dream safari in minutes</p>
          </div>

          <ol role="list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl mb-4">
                  <span className="text-3xl" aria-hidden="true">{step.icon}</span>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 bg-amber-700 text-white rounded-full text-xs font-bold flex items-center justify-center"
                    aria-label={`Step ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Trust signals ─────────────────────────────────────────────────── */}
        <section aria-labelledby="trust-heading" className="py-16 border-t border-stone-100">
          <div className="bg-stone-50 rounded-3xl p-8 sm:p-10 md:p-14">
            <div className="text-center mb-10">
              <h2 id="trust-heading" className="text-2xl font-bold text-stone-900">
                Book with confidence
              </h2>
              <p className="text-stone-400 text-sm mt-2">Every booking on SafariTu is protected</p>
            </div>

            <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_ITEMS.map((item) => (
                <li key={item.title} className="flex flex-col items-center text-center gap-3">
                  <span className="text-4xl" aria-hidden="true">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{item.title}</p>
                    <p className="text-stone-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Operator CTA ──────────────────────────────────────────────────── */}
        <section aria-labelledby="operator-cta-heading" className="py-16 border-t border-stone-100">
          <div className="bg-amber-700 rounded-3xl px-8 sm:px-10 py-12 sm:py-14 text-center text-white overflow-hidden relative">
            <div
              className="absolute top-0 right-0 text-[200px] leading-none opacity-10 select-none pointer-events-none"
              aria-hidden="true"
            >
              🦁
            </div>
            <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
              For Safari Operators
            </p>
            <h2 id="operator-cta-heading" className="text-2xl sm:text-3xl font-bold mb-4">
              List your safaris on SafariTu
            </h2>
            <p className="text-amber-100 max-w-xl mx-auto mb-8 leading-relaxed text-sm sm:text-base">
              Join East Africa&apos;s fastest-growing safari marketplace. Manage bookings,
              accept Mpesa payments, and reach thousands of travelers — all from one platform.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="bg-white text-amber-700 font-bold px-8 py-3.5 rounded-xl hover:bg-amber-50 active:scale-[0.98] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-amber-700"
              >
                Start for free →
              </Link>
              <Link
                href="/login"
                className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-white mt-8" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

          <div className="md:col-span-2">
            <Link href="/" aria-label="SafariTu home" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-sm text-white" aria-hidden="true">
                ST
              </div>
              <span className="font-bold text-lg">SafariTu</span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
              East Africa&apos;s dedicated safari marketplace. Connecting travelers
              with the best local safari operators since 2026.
            </p>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-4">
              Only Safaris
            </p>
          </div>

          <nav aria-label="Traveler links">
            <h3 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">
              For Travelers
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Explore Safaris", href: "/explore"              },
                { label: "Top Picks",       href: "/explore?topPick=true" },
                { label: "Destinations",    href: "/explore"              },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-stone-400 hover:text-amber-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Operator links">
            <h3 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">
              For Operators
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "List your safaris", href: "/signup" },
                { label: "Sign in",           href: "/login"  },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-stone-400 hover:text-amber-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} SafariTu. All rights reserved.</p>
            <p>Built for East Africa 🌍</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── Platform-wide tour card ────────────────────────────────────────────────────

type PlatformTour = {
  id:             string;
  slug:           string;
  title:          string;
  description:    string;
  durationDays:   number;
  durationNights: number;
  difficulty:     string;
  pricePerPerson: number | { toString(): string };
  currency:       string;
  coverImageUrl:  string | null;
  location:       string | null;
  isFeatured:     boolean;
  isTopPick:      boolean;
  operator:       { name: string; slug: string; logoUrl: string | null };
};

function PlatformTourCard({ tour }: { tour: PlatformTour }) {
  const href = `/site/${tour.operator.slug}/tours/${tour.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full focus:outline-none focus:ring-2 focus:ring-amber-400"
      aria-label={`${tour.title} by ${tour.operator.name} — ${tour.durationDays} days`}
    >
      {/* Image */}
      <div className="relative h-52 bg-stone-100 overflow-hidden">
        {tour.coverImageUrl ? (
          <img
            src={tour.coverImageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100"
            aria-hidden="true"
          >
            <span className="text-5xl">🦁</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {tour.isTopPick && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              ⭐ Top Pick
            </span>
          )}
          {tour.isFeatured && !tour.isTopPick && (
            <span className="bg-white/90 backdrop-blur text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
              Featured
            </span>
          )}
        </div>

        {/* Duration pill */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tour.durationDays}D / {tour.durationNights}N
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2 gap-2">
          {tour.location && (
            <span className="text-xs text-stone-400 flex items-center gap-1 truncate">
              <span aria-hidden="true">📍</span>
              {tour.location}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${difficultyColor(tour.difficulty)}`}>
            {difficultyLabel(tour.difficulty)}
          </span>
        </div>

        <h3 className="font-bold text-stone-900 mb-1.5 leading-snug group-hover:text-amber-700 transition-colors">
          {tour.title}
        </h3>

        <p className="text-stone-400 text-sm leading-relaxed flex-1">
          {truncate(tour.description, 90)}
        </p>

        {/* Operator attribution */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-50">
          {tour.operator.logoUrl ? (
            <img
              src={tour.operator.logoUrl}
              alt={`${tour.operator.name} logo`}
              className="w-5 h-5 rounded object-contain"
            />
          ) : (
            <div
              className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs"
              aria-hidden="true"
            >
              {tour.operator.name[0]}
            </div>
          )}
          <span className="text-xs text-stone-400">{tour.operator.name}</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-stone-400">From</p>
            <p className="text-lg font-bold text-stone-900">
              {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
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