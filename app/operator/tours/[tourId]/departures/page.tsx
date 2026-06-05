// app/operator/tours/[tourId]/departures/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getTourById } from "@/lib/prisma/tours";
import { getDeparturesByTour } from "@/lib/prisma/departures";
import { formatCurrency, formatDate, formatNumber, occupancyRate } from "@/lib/utils";
import OperatorShell from "@/components/layout/OperatorShell";
import AddDepartureForm from "@/components/bookings/AddDepartureForm";
import DepartureStatusSelect from "@/components/bookings/DepartureStatusSelect";
import DeleteDepartureButton from "@/components/bookings/DeleteDepartureButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tourId: string }> };

export async function generateMetadata({ params }: Props) {
  const { tourId } = await params;
  return { title: `Departures — SafariTu` };
}

export default async function DeparturesPage({ params }: Props) {
  const { tourId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const tour = await getTourById(tourId, operatorUser.operator.id);
  if (!tour) notFound();

  const departures = await getDeparturesByTour(tourId, operatorUser.operator.id);
  if (!departures) notFound();

  const upcoming = departures.filter((d) => new Date(d.startDate) >= new Date());
  const past     = departures.filter((d) => new Date(d.startDate) <  new Date());

  return (
    <OperatorShell operator={operatorUser.operator}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/operator/tours"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to safaris
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Departures</h1>
            <p className="text-stone-500 text-sm mt-1">{tour.title}</p>
          </div>
          <AddDepartureForm
            tourId={tour.id}
            defaultCurrency={tour.currency}
            defaultCapacity={tour.maxCapacity}
            defaultPrice={Number(tour.pricePerPerson)}
          />
        </div>
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total departures", value: departures.length },
          { label: "Upcoming",         value: upcoming.length   },
          { label: "Past",             value: past.length       },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm text-center">
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {departures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-4">📅</p>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">No departure dates yet</h2>
          <p className="text-stone-400 text-sm mb-6 max-w-sm mx-auto">
            Add departure dates so guests can book specific dates for this safari.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Upcoming departures */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">Dates</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden sm:table-cell">Capacity</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden md:table-cell">Price</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">Occupancy</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {upcoming.map((dep) => {
                      const occ     = occupancyRate(dep.capacity, dep.bookedCount);
                      const spotsLeft = dep.capacity - dep.bookedCount;
                      return (
                        <tr key={dep.id} className="hover:bg-stone-50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-medium text-stone-900">
                              {formatDate(dep.startDate)}
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">
                              → {formatDate(dep.endDate)}
                            </p>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell text-stone-600">
                            {dep.bookedCount} / {dep.capacity}
                            <span className="text-stone-400 text-xs ml-1">
                              ({spotsLeft} left)
                            </span>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell text-stone-600">
                            {dep.priceOverride
                              ? formatCurrency(Number(dep.priceOverride), tour.currency)
                              : <span className="text-stone-400 text-xs">Default</span>
                            }
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-stone-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    occ >= 100 ? "bg-red-400" :
                                    occ >= 80  ? "bg-amber-400" : "bg-green-400"
                                  }`}
                                  style={{ width: `${Math.min(occ, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-stone-500">
                                {Math.round(occ)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <DepartureStatusSelect
                              departureId={dep.id}
                              current={dep.status}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <DeleteDepartureButton
                                departureId={dep.id}
                                hasBookings={dep._count.bookings > 0}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past departures */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">
                Past ({past.length})
              </h2>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden opacity-70">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-stone-50">
                    {past.map((dep) => (
                      <tr key={dep.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="text-stone-500">
                            {formatDate(dep.startDate)} → {formatDate(dep.endDate)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-stone-400 text-xs hidden sm:table-cell">
                          {dep.bookedCount} / {dep.capacity} booked
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                            {dep.status.charAt(0) + dep.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </OperatorShell>
  );
}