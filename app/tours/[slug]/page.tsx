import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: {
    slug: string;
  };
}

export default async function TourPage({ params }: Props) {
  const tour = await prisma.tour.findFirst({
    where: {
      slug: params.slug,
    },
    include: {
      operator: true,
      itineraryDays: true,
      departures: true,
    },
  });

  if (!tour) {
    return notFound();
  }

  const nextDeparture = tour.departures?.[0];

  return (
    <main className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <section className="bg-green-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold">{tour.title}</h1>
          <p className="mt-2 text-green-100">{tour.location}</p>

          <div className="mt-3 text-sm text-green-200">
            Operated by{" "}
            <span className="font-semibold">{tour.operator.name}</span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">

        {/* LEFT SIDE */}
        <div className="md:col-span-2 space-y-8">

          {/* DESCRIPTION */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p className="text-gray-700">{tour.description}</p>
          </section>

          {/* HIGHLIGHTS */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Highlights</h2>
            <ul className="list-disc pl-5 text-gray-700">
              {tour.highlights?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* ITINERARY */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Itinerary</h2>

            <div className="space-y-4">
              {tour.itineraryDays
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day) => (
                  <div key={day.id} className="bg-white p-4 border rounded-lg">
                    <h3 className="font-semibold">
                      Day {day.dayNumber}: {day.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {day.description}
                    </p>

                    {day.activities?.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Activities: {day.activities.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section>

        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">

          {/* PRICE BOX */}
          <div className="bg-white p-5 rounded-xl border">
            <div className="text-2xl font-bold text-green-700">
              KES {Number(tour.pricePerPerson).toLocaleString()}
            </div>

            <div className="text-sm text-gray-500 mt-1">
              per person
            </div>

            <div className="mt-3 text-sm text-gray-700">
              {tour.durationDays} Days / {tour.durationNights} Nights
            </div>

            {nextDeparture && (
              <div className="text-xs text-gray-500 mt-2">
                Next departure:{" "}
                {new Date(nextDeparture.startDate).toDateString()}
              </div>
            )}

            <Link
              href={`/book/${tour.slug}`}
              className="mt-4 block text-center bg-green-700 text-white py-2 rounded-lg"
            >
              Book Now
            </Link>
          </div>

          {/* OPERATOR CARD */}
          <div className="bg-white p-5 rounded-xl border">
            <h3 className="font-semibold">Operator</h3>
            <p className="text-gray-700 mt-1">
              {tour.operator.name}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              {tour.operator.bio || "No description available."}
            </p>

            <Link
              href={`/operators/${tour.operator.slug}`}
              className="text-green-700 text-sm mt-3 inline-block"
            >
              View Operator →
            </Link>
          </div>

        </aside>
      </div>
    </main>
  );
}