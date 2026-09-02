import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy, MapPin, Building2, ArrowRight, AlertCircle, LayoutGrid } from "lucide-react";

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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span className="bg-lime-500 text-slate-950 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5" />
            </span>
            FCODES <span className="text-lime-400">PICKLEBALL</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-lime-500/50 rounded-lg transition"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-10 w-full flex-1">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400 bg-lime-950/60 border border-lime-800/50 rounded-full">
            Available Facilities
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Pickleball Courts
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select a court and choose your preferred date and time slot.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-800/50 bg-rose-950/40 p-4 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            Unable to load courts. Please try refreshing the page.
          </div>
        )}

        {/* NO COURTS */}
        {!error && (!courts || courts.length === 0) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <LayoutGrid className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white">No courts available</h2>
            <p className="mt-1 text-xs text-slate-400">
              There are currently no courts open for reservation. Please check again later.
            </p>
          </div>
        )}

        {/* COURTS */}
        {courts && courts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courts.map((court) => {
              // Extract branch safely to avoid TS array error
              const branchData = Array.isArray(court.branches)
                ? court.branches[0]
                : court.branches;

              return (
                <div
                  key={court.id}
                  className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition duration-300 hover:border-lime-500/50 flex flex-col justify-between"
                >
                  <div>
                    {/* IMAGE */}
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
                      {court.image_url ? (
                        <img
                          src={court.image_url}
                          alt={court.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-slate-900/80">
                          <div className="text-center">
                            <Trophy className="w-10 h-10 text-slate-700 mx-auto" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Pickleball Court
                            </p>
                          </div>
                        </div>
                      )}

                      {/* STATUS */}
                      <div className="absolute right-3 top-3">
                        <span className="rounded-full bg-emerald-950/80 backdrop-blur border border-emerald-800/50 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          Available
                        </span>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="p-5">
                      <h2 className="text-xl font-bold text-white group-hover:text-lime-400 transition">
                        {court.name}
                      </h2>

                      {court.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                          {court.description}
                        </p>
                      )}

                      {/* LOCATION */}
                      {court.location && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                          <span>{court.location}</span>
                        </div>
                      )}

                      {/* BRANCH */}
                      {branchData && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                          <span>
                            Branch: <strong className="text-slate-200">{branchData.name}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRICE & BUTTON */}
                  <div className="p-5 pt-0 mt-4 border-t border-slate-800/80 pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Hourly Rate</p>
                      <p className="text-xl font-extrabold text-lime-400">
                        ₱{Number(court.hourly_rate).toLocaleString()}
                        <span className="text-xs text-slate-500 font-normal"> / hr</span>
                      </p>
                    </div>

                    <Link
                      href={`/courts/${court.id}`}
                      className="px-4 py-2 text-xs font-semibold text-slate-950 bg-lime-400 hover:bg-lime-300 rounded-lg transition duration-200 flex items-center gap-1.5"
                    >
                      Book Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        © {new Date().getFullYear()} FCODES Pickleball Booking. All rights reserved.
      </footer>
    </main>
  );
}
