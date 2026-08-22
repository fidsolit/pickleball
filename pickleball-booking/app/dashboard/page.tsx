import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { Trophy, Calendar, CheckCircle2, User, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-white"
          >
            <span className="bg-lime-500 text-slate-950 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5" />
            </span>
            FCODES <span className="text-lime-400">PICKLEBALL</span>
          </Link>

          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* HERO BANNER WITH BACKGROUND IMAGE */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"
            alt="Dashboard Banner Background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-slate-950/70 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400 bg-slate-950/80 border border-lime-800/60 rounded-full backdrop-blur-sm">
            Customer Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
            Welcome back,{" "}
            <span className="text-lime-400">
              {profile?.full_name || user.email}
            </span>
          </h1>
          <p className="mt-2 text-slate-300 max-w-xl text-sm md:text-base drop-shadow-sm">
            Ready to hit the court? View your active reservations or book a new
            slot below.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="mx-auto max-w-7xl px-6 py-10 w-full flex-1">
        {/* STATS GRID */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                Upcoming Bookings
              </p>
              <p className="mt-2 text-3xl font-extrabold text-white">0</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg text-lime-400 border border-slate-700/50">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                Total Bookings
              </p>
              <p className="mt-2 text-3xl font-extrabold text-white">0</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg text-lime-400 border border-slate-700/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                Account Role
              </p>
              <p className="mt-2 text-xl font-bold text-slate-200 capitalize">
                {profile?.role || "customer"}
              </p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg text-lime-400 border border-slate-700/50">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS SECTION */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-white">Need a reservation?</h2>
          <p className="mt-1 text-sm text-slate-400 max-w-md">
            Check availability across all courts, select your preferred time
            slot, and confirm instantly.
          </p>

          <Link
            href="/courts"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-lime-300 shadow-lg shadow-lime-500/10"
          >
            Book a Court
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        © {new Date().getFullYear()} FCODES Pickleball Booking. All rights
        reserved.
      </footer>
    </main>
  );
}
