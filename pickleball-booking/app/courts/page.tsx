import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CourtsPage() {
  const supabase = await createClient();

  const { data: courts, error } = await supabase
    .from("courts")
    .select(`
      id,
      name,
      description,
      location,
      image_url,
      hourly_rate,
      status,
      branches (
        id,
        name,
        address
      )
    `)
    .eq("status", "available")
    .order("name");

  if (error) {
    console.error("Error loading courts:", error);
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-900"
            >
              Pickleball Booking
            </Link>

            <p className="text-sm text-gray-500">
              Choose your court
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Pickleball Courts
          </h1>

          <p className="mt-2 text-gray-500">
            Select a court and choose your preferred date and time.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            Unable to load courts. Please try again.
          </div>
        )}

        {/* NO COURTS */}
        {!error && (!courts || courts.length === 0) && (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">
              No courts available
            </h2>

            <p className="mt-2 text-gray-500">
              Please check again later.
            </p>
          </div>
        )}

        {/* COURTS */}
        {courts && courts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {courts.map((court) => (
              <div
                key={court.id}
                className="overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* IMAGE */}
                <div className="relative h-52 bg-gray-200">

                  {court.image_url ? (
                    <img
                      src={court.image_url}
                      alt={court.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl">🏓</div>

                        <p className="mt-2 text-sm text-gray-500">
                          Pickleball Court
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STATUS */}
                  <div className="absolute right-4 top-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Available
                    </span>
                  </div>

                </div>

                {/* DETAILS */}
                <div className="p-6">

                  <h2 className="text-xl font-bold text-gray-900">
                    {court.name}
                  </h2>

                  {court.description && (
                    <p className="mt-2 text-sm text-gray-500">
                      {court.description}
                    </p>
                  )}

                  {/* LOCATION */}
                  {court.location && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <span>📍</span>
                      <span>{court.location}</span>
                    </div>
                  )}

                  {/* BRANCH */}
                  {court.branches && (
                    <div className="mt-2 text-sm text-gray-500">
                      Branch:{" "}
                      <span className="font-medium text-gray-700">
                        {court.branches.name}
                      </span>
                    </div>
                  )}

                  {/* PRICE */}
                  <div className="mt-6 flex items-end justify-between">

                    <div>
                      <p className="text-sm text-gray-500">
                        Hourly Rate
                      </p>

                      <p className="text-2xl font-bold text-green-600">
                        ₱{Number(court.hourly_rate).toLocaleString()}
                      </p>

                      <p className="text-xs text-gray-400">
                        per hour
                      </p>
                    </div>

                    <Link
                      href={`/courts/${court.id}`}
                      className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                    >
                      Book Now
                    </Link>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  );
}