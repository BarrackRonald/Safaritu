// app/operator/tours/page.tsx
// Lists all safaris for the logged-in operator.
// Shows status, featured/top picks badges, booking count, and actions.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getToursByOperator } from "@/lib/prisma/tours";
import { formatCurrency, formatDate } from "@/lib/utils";
import TourStatusBadge from "@/components/tours/TourStatusBadge";
import TourFeaturedToggle from "@/components/tours/TourFeaturedToggle";
import DeleteTourButton from "@/components/tours/DeleteTourButton";
import OperatorShell from "@/components/layout/OperatorShell";

export const metadata = { title: "Safaris — SafariTu" };

export default async function ToursPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const tours = await getToursByOperator(operatorUser.operator.id);

  return (
    <OperatorShell operator={operatorUser.operator}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Safaris</h1>
          <p className="text-stone-500 text-sm mt-1">
            {tours.length} safari{tours.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/operator/tours/new"
          className="bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors"
        >
          + New safari
        </Link>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-4">🦁</p>
          <p className="font-semibold text-stone-900 text-lg mb-2">
            No safaris yet
          </p>
          <p className="text-stone-500 text-sm mb-6">
            Create your first safari to start receiving bookings.
          </p>
          <Link
            href="/operator/tours/new"
            className="bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition-colors"
          >
            Create your first safari
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Safari
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">
                  Bookings
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Featured
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {tour.coverImageUrl ? (
                        <img
                          src={tour.coverImageUrl}
                          alt={tour.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg shrink-0">
                          🦁
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-stone-900">{tour.title}</p>
                        <p className="text-xs text-stone-400">
                          {tour.durationDays}D/{tour.durationNights}N · {tour.location}
                          {tour.isTopPick && (
                            <span className="ml-2 text-amber-600 font-semibold">
                              ⭐ Top Pick
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="font-medium text-stone-800">
                      {formatCurrency(Number(tour.pricePerPerson), tour.currency)}
                    </span>
                    <span className="text-stone-400 text-xs"> /person</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell text-stone-600">
                    {tour._count.bookings}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell text-stone-400 text-xs">
                    {formatDate(tour.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <TourStatusBadge status={tour.status} />
                  </td>
                  <td className="px-4 py-4">
                    <TourFeaturedToggle
                      tourId={tour.id}
                      isFeatured={tour.isFeatured}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/operator/tours/${tour.id}/edit`}
                        className="text-xs text-amber-700 hover:underline font-medium"
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
        </div>
      )}
    </OperatorShell>
  );
}