// app/site/[tenantSlug]/page.tsx
// Public-facing operator homepage. Server-rendered for SEO.
// Shows featured safaris in a hero carousel, then full tour grid.
// Accessible at: yourplatform.com/site/[slug] (dev) or slug.yourplatform.com (prod)

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicOperator, getPublicTours } from "@/lib/prisma/public";
import PublicHeader from "@/components/public/PublicHeader";
import FeaturedCarousel from "@/components/public/FeaturedCarousel";
import TourGrid from "@/components/public/TourGrid";
import PublicFooter from "@/components/public/PublicFooter";

type Props = { params: Promise<{ tenantSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params;
  const operator = await getPublicOperator(tenantSlug);
  if (!operator) return {};

  return {
    title:       `${operator.name} — Safaris`,
    description: operator.bio ?? `Discover handcrafted safari experiences by ${operator.name}. Book your dream African safari today.`,
    openGraph: {
      title:       operator.name,
      description: operator.bio ?? `Safari experiences by ${operator.name}`,
      images:      operator.coverImageUrl ? [operator.coverImageUrl] : [],
      type:        "website",
    },
  };
}

export default async function OperatorPublicPage({ params }: Props) {
  const { tenantSlug } = await params;

  const [operator, tours] = await Promise.all([
    getPublicOperator(tenantSlug),
    getPublicOperator(tenantSlug).then((op) =>
      op ? getPublicTours(op.id) : []
    ),
  ]);

  if (!operator) notFound();

  const featured = tours.filter((t) => t.isFeatured);
  const topPicks = tours.filter((t) => t.isTopPick && !t.isFeatured);
  const rest     = tours.filter((t) => !t.isFeatured && !t.isTopPick);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader operator={operator} />

      {/* ── Hero / Featured carousel ─────────────────────────────────── */}
      {featured.length > 0 ? (
        <FeaturedCarousel tours={featured} operatorSlug={tenantSlug} />
      ) : (
        /* Fallback hero when no featured tours */
        <div className="relative bg-stone-900 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: operator.coverImageUrl ? `url(${operator.coverImageUrl})` : "none" }}
          />
          <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
              Only Safaris
            </p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              {operator.name}
            </h1>
            {operator.bio && (
              <p className="text-stone-300 text-lg max-w-2xl mx-auto leading-relaxed">
                {operator.bio}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div className="bg-amber-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-8">
          {[
            { value: `${tours.length}+`, label: "Unique Safaris" },
            { value: "100%",             label: "Handcrafted"    },
            { value: "East Africa",      label: "Our Backyard"   },
            { value: "24/7",             label: "Support"        },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-amber-200 text-xs uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-16">

        {/* ── Top Picks ──────────────────────────────────────────────── */}
        {topPicks.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl">⭐</span>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Top Picks</h2>
                <p className="text-stone-400 text-sm">Our most booked and highest-rated safaris</p>
              </div>
            </div>
            <TourGrid tours={topPicks} operatorSlug={tenantSlug} variant="topPick" />
          </section>
        )}

        {/* ── All safaris ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                {topPicks.length > 0 ? "All Safaris" : "Our Safaris"}
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                {tours.length} safari experience{tours.length !== 1 ? "s" : ""} to choose from
              </p>
            </div>
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-24 text-stone-400">
              <p className="text-5xl mb-4">🦁</p>
              <p className="text-lg font-medium text-stone-600">No safaris available yet.</p>
              <p className="text-sm mt-2">Check back soon — new adventures are being added.</p>
            </div>
          ) : (
            <TourGrid
              tours={[...topPicks, ...rest]}
              operatorSlug={tenantSlug}
              variant="default"
            />
          )}
        </section>

        {/* ── Why choose us ───────────────────────────────────────────── */}
        <section className="mt-24 bg-stone-50 rounded-3xl p-10 md:p-14">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-10">
            Why book with {operator.name}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_ITEMS.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact CTA ─────────────────────────────────────────────── */}
        {(operator.phone || operator.email) && (
          <section className="mt-16 text-center">
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              Need help choosing a safari?
            </h2>
            <p className="text-stone-500 text-sm mb-6">
              Our team is ready to help you plan the perfect experience.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {operator.phone && (
                <a
                  href={`tel:${operator.phone}`}
                  className="flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-amber-800 transition-colors"
                >
                  📞 Call us
                </a>
              )}
              {operator.email && (
                <a
                  href={`mailto:${operator.email}`}
                  className="flex items-center gap-2 border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-stone-50 transition-colors"
                >
                  ✉️ Email us
                </a>
              )}
            </div>
          </section>
        )}

      </main>

      <PublicFooter operator={operator} />
    </div>
  );
}

const WHY_ITEMS = [
  {
    icon:  "🌿",
    title: "Authentic Experiences",
    desc:  "Every safari is carefully crafted to give you a genuine encounter with Africa's wildlife and culture.",
  },
  {
    icon:  "🛡️",
    title: "Safe & Trusted",
    desc:  "Licensed guides, vetted accommodations, and 24/7 support throughout your journey.",
  },
  {
    icon:  "💳",
    title: "Flexible Payments",
    desc:  "Pay securely by Mpesa or card. Pay a deposit to confirm and the balance before departure.",
  },
];