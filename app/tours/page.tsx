// app/operator/tours/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getToursByOperator } from "@/lib/prisma/tours";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import OperatorShell from "@/components/layout/OperatorShell";
import TourStatusBadge from "@/components/tours/TourStatusBadge";
import TourFeaturedToggle from "@/components/tours/TourFeaturedToggle";
import DeleteTourButton from "@/components/tours/DeleteTourButton";

export const metadata = { title: "Safaris — SafariTu" };
export const dynamic = "force-dynamic";

export default async function ToursPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const tours = await getToursByOperator(operatorUser.operator.id);

  const published = tours.filter((t) => t.status === "PUBLISHED").length;
  const drafts    = tours.filter((t) => t.status === "DRAFT").length;
  const featured  = tours.filter((t) => t.isFeatured).length;
  const topPicks  = tours.filter((t) => t.isTopPick).length;

  return (
    <OperatorShell operator={operatorUser.operator}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Safaris</h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage your safari catalogue
          </p>
        </div>
        <Link
          href="/operator/tours/new"
          className="bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm"
        >
          + New safari
        </Link>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",     value: tours.length, color: "bg-stone-50   text-stone-600"  },
          { label: "Published", value: published,    color: "bg-green-50   text-green-700"  },
          { label: "Drafts",    value: drafts,       color: "bg-amber-50   text-amber-700"  },
          { label: "Featured",  value: featured,     color: "bg-purple-50  text-purple-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-20 text-center shadow-sm">
          <p className="text-6xl mb-4">🦁</p>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">
            No safaris yet
          </h2>
          <p className="text-stone-400 text-sm mb-8 max-w-sm mx-auto">
            Create your first safari to start receiving bookings. Add an
            itinerary, set your price, and publish in minutes.
          </p>
          <Link
            href="/operator/tours/new"
            className="bg-amber-700 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors"
          >
            Create your first safari
          </Link>
        </div>
      ) : (

        /* ── Tours table ──────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Safari
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden sm:table-cell">
                  Price
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden md:table-cell">
                  Bookings
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                  Created
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Featured
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-stone-50 transition-colors group">
                  {/* Safari name + thumbnail */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {tour.coverImageUrl ? (
                        <img
                          src={tour.coverImageUrl}
                          alt={tour.title}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-100"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0 border border-amber-100">
                          🦁
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 truncate max-w-xs">
                          {tour.title}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {tour.durationDays}D / {tour.durationNights}N
                          {tour.location ? ` · ${tour.location}` : ""}
                          {tour.isTopPick && (
                            <span className="ml-2 text-amber-600 font-semibold">
                              ⭐ Top Pick
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 hidden sm:table-cell whitespace-nowrap">
                    <span className="font-semibold text-stone-800">
                      {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                    </span>
                    <span className="text-stone-400 text-xs"> /person</span>
                  </td>

                  {/* Bookings */}
                  <td className="px-4 py-4 hidden md:table-cell text-stone-600 font-medium">
                    {formatNumber(tour._count.bookings)}
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4 hidden lg:table-cell text-stone-400 text-xs">
                    {formatDate(tour.createdAt)}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-4">
                    <TourStatusBadge status={tour.status} />
                  </td>

                  {/* Featured toggle */}
                  <td className="px-4 py-4 text-center">
                    <TourFeaturedToggle
                      tourId={tour.id}
                      isFeatured={tour.isFeatured}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/operator/tours/${tour.id}/edit`}
                        className="text-xs text-amber-700 hover:underline font-semibold"
                      >
                        Edit
                      </Link>
                      <DeleteTourButton
                        tourId={tour.id}
                        tourTitle={tour.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-6 py-3 border-t border-stone-50 bg-stone-50 text-xs text-stone-400">
            {tours.length} safari{tours.length !== 1 ? "s" : ""} · {published} published · {drafts} draft{drafts !== 1 ? "s" : ""}
            {topPicks > 0 && ` · ${topPicks} Top Pick${topPicks !== 1 ? "s" : ""}`}
          </div>
        </div>
      )}
    </OperatorShell>
  );
}