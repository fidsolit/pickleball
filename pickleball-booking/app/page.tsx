import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Trophy,
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  const { data: courts } = await supabase
    .from("courts")
    .select("*")
    .order("name");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span className="bg-lime-500 text-slate-950 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5" />
            </span>
            FCODES <span className="text-lime-400">PICKLEBALL</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium text-slate-950 bg-lime-400 hover:bg-lime-300 rounded-lg transition duration-200 shadow-lg shadow-lime-500/10 flex items-center gap-2"
            >
              Login / Sign Up
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with 50% Opacity Background */}
      <section className="relative overflow-hidden pt-20 pb-16 border-b border-slate-800">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            // src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"
            src="PICKLEBALLBACKGROUND.avif"
            alt="Pickleball Court Background"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Subtle gradient overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider text-lime-400 bg-lime-950/80 border border-lime-800/60 rounded-full backdrop-blur-sm">
            Instant Online Reservations
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight drop-shadow-md">
            Book Your Premier <span className="text-lime-400">Pickleball</span>{" "}
            Court
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto drop-shadow">
            Reserve indoor and outdoor courts seamlessly. Check real-time
            availability and get playing in minutes.
          </p>
        </div>
      </section>

      {/* Main Content: Courts Listing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Available Courts</h2>
            <p className="text-slate-400 text-sm">
              Select a court to view open slots
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
            {courts?.length || 0} Courts Ready
          </span>
        </div>

        {courts && courts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-lime-500/50 transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-lime-400 transition">
                      {court.name}
                    </h3>
                    {court.is_active !== false && (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                    {court.description ||
                      "Standard indoor/outdoor pickleball court with pro surface lining."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 text-sm font-semibold">
                    ₱{court.price_per_hour || "---"}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      / hr
                    </span>
                  </span>
                  <Link
                    href={`/login?redirect=/book/${court.id}`}
                    className="text-xs font-medium text-slate-900 bg-lime-400 hover:bg-lime-300 px-3.5 py-2 rounded-md transition"
                  >
                    Book Court
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No courts currently available.</p>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FCODES Pickleball Booking. All rights
        reserved.
      </footer>
    </div>
  );
}
