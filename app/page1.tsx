// app/page.tsx
// SafariTu public marketing homepage — what visitors see at safaritu.com
// Human-centred design · SEO-optimised · Fully responsive

import type { Metadata } from "next";
import Link from "next/link";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "SafariTu — Safari Management Platform for Kenyan Operators",
  description:
    "Manage safaris, accept Mpesa & card payments, track bookings, and grow your customer base. The all-in-one platform built exclusively for safari operators in East Africa.",
  keywords: [
    "safari booking software",
    "safari operator platform",
    "Kenya safari management",
    "Mpesa safari payments",
    "East Africa tour operator software",
    "safari CRM",
    "wildlife tour management",
  ],
  authors: [{ name: "SafariTu" }],
  creator: "SafariTu",
  openGraph: {
    title: "SafariTu — The Platform Built for Safari Operators",
    description:
      "Accept Mpesa & card payments, manage bookings, and grow your safari business. Built for Kenya. Ready for East Africa.",
    url: "https://safaritu.com",
    siteName: "SafariTu",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SafariTu — Safari Management Platform",
    description:
      "The all-in-one platform for safari operators. Mpesa STK Push, bookings, CRM, and analytics.",
    creator: "@safaritu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "https://safaritu.com" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-stone-800">

      {/* ── Skip to content (accessibility) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-amber-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>

      {/* ── Navigation ── */}
      <header role="banner">
        <nav
          aria-label="Main navigation"
          className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-amber-100"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">

            {/* Brand */}
            <Link href="/" aria-label="SafariTu home" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-hidden="true">🌍</span>
              <div>
                <span className="font-extrabold text-xl text-amber-800 tracking-tight leading-none">
                  SafariTu
                </span>
                <span className="hidden sm:block text-[10px] text-amber-600 tracking-[0.2em] uppercase leading-none mt-0.5">
                  Only Safaris
                </span>
              </div>
            </Link>

            {/* Nav links — hidden on small screens, shown md+ */}
            <div className="hidden md:flex items-center gap-6 text-sm text-stone-600 font-medium">
              <Link href="#features" className="hover:text-amber-800 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-amber-800 transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="hover:text-amber-800 transition-colors">
                Testimonials
              </Link>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/login"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Sign in to your SafariTu account"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-amber-700 text-white px-4 py-2 rounded-xl hover:bg-amber-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm"
                aria-label="Create a free SafariTu account"
              >
                Get started free
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Main content ── */}
      <div id="main-content">

        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden"
        >
          {/* Subtle decorative background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-amber-50/60 to-transparent pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-100/30 blur-3xl translate-x-1/2 -translate-y-1/4 pointer-events-none"
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
              <span role="img" aria-hidden="true">🦁</span>
              Built exclusively for safari operators
            </div>

            {/* Heading — H1 for SEO */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.1] tracking-tight mb-6"
            >
              Run your safari business
              <br />
              <span className="text-amber-700">from one place</span>
            </h1>

            {/* Sub-heading — value proposition */}
            <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-4 leading-relaxed">
              SafariTu gives safari operators in Kenya and East Africa everything
              they need — bookings, Mpesa payments, customer CRM, and analytics
              — without the complexity of generic software.
            </p>

            {/* Trust signal */}
            <p className="text-sm text-amber-700 font-medium mb-10">
              No setup fee · Free 30-day trial · Cancel any time
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-amber-700 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-amber-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-md"
                aria-label="Start your free SafariTu trial"
              >
                Start for free — no credit card
              </Link>
              <Link
                href="/demo"
                className="w-full sm:w-auto text-stone-700 px-8 py-4 rounded-2xl font-semibold text-base border border-stone-200 hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98] transition-all"
                aria-label="Watch a SafariTu product demo"
              >
                Watch a 2-min demo →
              </Link>
            </div>

            {/* Social proof micro-bar */}
            <div
              aria-label="Customer trust indicators"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-sm text-stone-400"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-amber-500" aria-hidden="true">★★★★★</span>
                Loved by operators
              </span>
              <span aria-hidden="true" className="hidden sm:block text-stone-200">|</span>
              <span>Mpesa STK Push built-in</span>
              <span aria-hidden="true" className="hidden sm:block text-stone-200">|</span>
              <span>GDPR &amp; data-safe</span>
            </div>
          </div>
        </section>

        {/* ── Problem / Empathy banner ── */}
        <section
          aria-label="Why SafariTu exists"
          className="bg-stone-900 text-white py-14 sm:py-16 px-4 sm:px-6"
        >
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-stone-100 mb-3">
              Generic booking software wasn't built for safari operators.
            </p>
            <p className="text-stone-400 text-base sm:text-lg max-w-2xl mx-auto">
              No Mpesa. No wildlife-specific itinerary tools. No understanding of
              seasonal pricing or last-minute seat management. SafariTu was built
              from scratch — by people who know the industry.
            </p>
          </div>
        </section>

        {/* ── Feature grid ── */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28"
        >
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
              Platform features
            </span>
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 leading-tight"
            >
              Everything a safari operator needs
            </h2>
            <p className="text-stone-500 mt-3 max-w-xl mx-auto text-base sm:text-lg">
              Carefully designed for how safari businesses actually work —
              not retrofitted from hotel or flights software.
            </p>
          </div>

          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {FEATURES.map((f) => (
              <li key={f.title}>
                <article className="h-full bg-white rounded-2xl p-6 sm:p-7 border border-stone-100 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div
                    className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl mb-5 group-hover:bg-amber-100 transition-colors"
                    role="img"
                    aria-label={`${f.title} icon`}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-2 group-hover:text-amber-800 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {f.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* ── How it works (3-step) ── */}
        <section
          aria-labelledby="how-heading"
          className="bg-amber-50 py-20 sm:py-28 px-4 sm:px-6"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
                How it works
              </span>
              <h2
                id="how-heading"
                className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2"
              >
                Up and running in minutes
              </h2>
            </div>

            <ol
              role="list"
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
            >
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.title} className="flex flex-col items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 rounded-2xl bg-amber-700 text-white flex items-center justify-center text-xl font-extrabold shadow-md"
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-stone-900 text-base">{step.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section
          id="testimonials"
          aria-labelledby="testimonials-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28"
        >
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
              Testimonials
            </span>
            <h2
              id="testimonials-heading"
              className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2"
            >
              Operators love SafariTu
            </h2>
          </div>

          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {TESTIMONIALS.map((t) => (
              <li key={t.name}>
                <blockquote className="h-full bg-white rounded-2xl p-6 border border-stone-100 flex flex-col gap-4">
                  <p className="text-stone-600 text-sm leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer>
                    <cite className="not-italic">
                      <span className="font-semibold text-stone-900 text-sm block">
                        {t.name}
                      </span>
                      <span className="text-xs text-stone-400">{t.role}</span>
                    </cite>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Regional callout ── */}
        <section
          aria-label="Regional availability"
          className="bg-amber-700 py-16 sm:py-20 px-4 sm:px-6"
        >
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-white text-2xl sm:text-3xl font-extrabold mb-3 leading-tight"
            >
              Built for Kenya. Ready for East Africa.
            </p>
            <p className="text-amber-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
              Native Mpesa STK Push, multi-currency pricing, and WhatsApp
              notifications — because your customers live on their phones.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-amber-800 font-bold px-8 py-3.5 rounded-2xl hover:bg-amber-50 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-amber-700 shadow-md"
              aria-label="Create your free SafariTu account"
            >
              Create your free account →
            </Link>
          </div>
        </section>

        {/* ── Final CTA strip ── */}
        <section
          aria-labelledby="final-cta-heading"
          className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center"
        >
          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-4"
          >
            Ready to grow your safari business?
          </h2>
          <p className="text-stone-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Join safari operators across Kenya and East Africa who use SafariTu
            to save time, get paid faster, and delight their guests.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-amber-700 text-white font-bold px-10 py-4 rounded-2xl text-base hover:bg-amber-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-md"
          >
            Start for free — no credit card needed
          </Link>
          <p className="text-xs text-stone-400 mt-4">
            30-day free trial. No setup fee. Cancel any time.
          </p>
        </section>

      </div>{/* end #main-content */}

      {/* ── Footer ── */}
      <footer
        role="contentinfo"
        className="border-t border-stone-100 bg-[#FDFBF7] px-4 sm:px-6 py-12"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <span className="text-xl" role="img" aria-hidden="true">🌍</span>
              <span className="font-extrabold text-lg text-amber-800">SafariTu</span>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed max-w-[220px]">
              The all-in-one platform built exclusively for safari operators in
              Kenya and East Africa.
            </p>
          </div>

          {/* Product links */}
          <nav aria-label="Product links">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              {FOOTER_PRODUCT.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-stone-600 hover:text-amber-800 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company links */}
          <nav aria-label="Company links">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {FOOTER_COMPANY.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-stone-600 hover:text-amber-800 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal / contact */}
          <nav aria-label="Legal links">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {FOOTER_LEGAL.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-stone-600 hover:text-amber-800 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} SafariTu. All rights reserved.</p>
          <p>Made by Zoom Digital</p>
        </div>
      </footer>

    </main>
  );
}

// ─── Content data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🦁",
    title: "Safari Builder",
    description:
      "Create rich safari itineraries with day-by-day details, photos, difficulty ratings, and seasonal pricing. Guests see exactly what they're booking.",
  },
  {
    icon: "📅",
    title: "Bookings & Availability",
    description:
      "Real-time availability calendar, capacity management, instant confirmation emails, and automated voucher dispatch — zero manual work.",
  },
  {
    icon: "💳",
    title: "Mpesa & Card Payments",
    description:
      "Accept Mpesa STK Push, Visa, and Mastercard directly. Auto-generate invoices, track deposits, and get paid faster.",
  },
  {
    icon: "👥",
    title: "Customer CRM",
    description:
      "Unified customer profiles, full booking history, personal notes, smart tags, and a lead pipeline to convert enquiries into bookings.",
  },
  {
    icon: "⭐",
    title: "Featured & Top Picks",
    description:
      "Pin your signature safaris as Featured listings, or let SafariTu's algorithm auto-surface your Top Picks based on real booking data.",
  },
  {
    icon: "📊",
    title: "Reports & Analytics",
    description:
      "Revenue dashboards, occupancy rates, and booking trends — all exportable to CSV or PDF so you can plan the next season with confidence.",
  },
] satisfies { icon: string; title: string; description: string }[];

const HOW_IT_WORKS = [
  {
    title: "Create your operator profile",
    description:
      "Sign up free and set up your SafariTu account in minutes. Add your company details, logo, and bank or Mpesa details.",
  },
  {
    title: "Build your safari listings",
    description:
      "Add your safaris with photos, itineraries, capacity, and pricing. Set seasonal rates and availability in your live calendar.",
  },
  {
    title: "Accept bookings & get paid",
    description:
      "Share your booking link. Customers pay via Mpesa or card. Funds settle directly to your account. You focus on the safari.",
  },
] satisfies { title: string; description: string }[];

const TESTIMONIALS = [
  {
    quote:
      "SafariTu replaced three separate tools we were juggling. Now everything is in one place and our Mpesa reconciliation takes minutes instead of hours.",
    name: "Mophart Onyango",
    role: "CEO, Mofire Adventures — Nairobi",
  },
  {
    quote:
      "The availability calendar alone saved us from double-bookings that were costing us reputation. Our guests appreciate the instant confirmation emails.",
    name: "Ronald Barrack",
    role: "Tour Operator, Ideal Adventures",
  },
  {
    quote:
      "I was sceptical because I'd tried generic booking software before. SafariTu is different — it actually understands how a safari business works.",
    name: "Amina Hassan",
    role: "Founder, Coastal Wild Tours — Mombasa",
  },
] satisfies { quote: string; name: string; role: string }[];

const FOOTER_PRODUCT = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
];

const FOOTER_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

const FOOTER_LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];