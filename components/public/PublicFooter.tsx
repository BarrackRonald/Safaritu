// components/public/PublicFooter.tsx
import Link from "next/link";

type Operator = {
  name:    string;
  slug:    string;
  phone:   string | null;
  email:   string | null;
  website: string | null;
};

export default function PublicFooter({ operator }: { operator: Operator }) {
  return (
    <footer className="bg-stone-900 text-white mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-sm">
              {operator.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-lg">{operator.name}</span>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">
            Handcrafted safari experiences in East Africa. We take you closer to nature, wildlife, and culture.
          </p>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-4">
            Only Safaris
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">
            Explore
          </h4>
          <nav className="space-y-2.5">
            {[
              { label: "All Safaris",    href: `/site/${operator.slug}#safaris`  },
              { label: "Top Picks",      href: `/site/${operator.slug}#safaris`  },
              { label: "Featured Tours", href: `/site/${operator.slug}#safaris`  },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-stone-400 hover:text-amber-400 text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {operator.website && (
              <a
                href={operator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-stone-400 hover:text-amber-400 text-sm transition-colors"
              >
                Our Website ↗
              </a>
            )}
          </nav>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-stone-300 text-xs uppercase tracking-widest mb-4">
            Contact
          </h4>
          <div className="space-y-3">
            {operator.phone && (
              <a
                href={`tel:${operator.phone}`}
                className="flex items-center gap-2 text-stone-400 hover:text-amber-400 text-sm transition-colors"
              >
                <span>📞</span> {operator.phone}
              </a>
            )}
            {operator.email && (
              <a
                href={`mailto:${operator.email}`}
                className="flex items-center gap-2 text-stone-400 hover:text-amber-400 text-sm transition-colors"
              >
                <span>✉️</span> {operator.email}
              </a>
            )}
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <span>📍</span> East Africa
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {operator.name}. All rights reserved.</p>
          <p>
            Powered by{" "}
            <span className="text-amber-500 font-semibold">SafariTu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}