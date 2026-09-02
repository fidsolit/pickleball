import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import {
  Trophy,
  Calendar,
  Users,
  Grid,
  Clock,
  Eye,
  ArrowUpRight,
} from "lucide-react";

type TodayBooking = {
  id: string;
  booking_reference: string;
  status: string;
  total_amount: number | string;
  profiles: { full_name: string | null; email: string | null }[];
  courts: { name: string | null }[];
  time_slots: { start_time: string; end_time: string }[];
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Only admin can access this page
  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Get statistics
  const { count: totalReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true });

  const { count: totalCustomers } = await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("role", "customer");

  const { count: totalCourts } = await supabase
    .from("courts")
    .select("*", {
      count: "exact",
      head: true,
    });

  const { count: upcomingBookings } = await supabase
    .from("reservations")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("reservation_date", new Date().toISOString().split("T")[0])
    .neq("status", "cancelled");

  // Get today's bookings
  const today = new Date().toISOString().split("T")[0];

  const { data: todayBookings } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_reference,
      reservation_date,
      status,
      total_amount,
      profiles (
        full_name,
        email
      ),
      courts (
        name
      ),
      time_slots (
        start_time,
        end_time
      )
    `)
    .eq("reservation_date", today)
    .order("created_at", {
      ascending: false,
    })
    .limit(10);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="bg-lime-500 text-slate-950 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                FCODES <span className="text-lime-400">ADMIN</span>
              </h1>
              <p className="text-xs text-slate-400">Facility Operations Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-200">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-lime-400 font-medium">System Administrator</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-10 w-full flex-1">
        {/* TITLE */}
        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400 bg-lime-950/60 border border-lime-800/50 rounded-full">
            Control Center
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor court activity, view real-time statistics, and manage system resources.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* BOOKINGS */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Bookings
              </p>
              <Calendar className="w-5 h-5 text-lime-400" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {totalReservations ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-500">All-time processed reservations</p>
          </div>

          {/* CUSTOMERS */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customers
              </p>
              <Users className="w-5 h-5 text-lime-400" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {totalCustomers ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-500">Registered active accounts</p>
          </div>

          {/* COURTS */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Courts
              </p>
              <Grid className="w-5 h-5 text-lime-400" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {totalCourts ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-500">Available facility courts</p>
          </div>

          {/* UPCOMING */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming
              </p>
              <Clock className="w-5 h-5 text-lime-400" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {upcomingBookings ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-500">Scheduled active bookings</p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-bold text-white">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/reservations"
              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition duration-300 hover:border-lime-500/50 hover:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="p-2 bg-slate-800 text-lime-400 rounded-lg group-hover:bg-lime-400 group-hover:text-slate-950 transition">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-lime-400 transition" />
                </div>
                <h4 className="font-bold text-white group-hover:text-lime-400 transition">
                  Reservations
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Manage customer bookings & schedules
                </p>
              </div>
            </Link>

            <Link
              href="/admin/courts"
              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition duration-300 hover:border-lime-500/50 hover:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="p-2 bg-slate-800 text-lime-400 rounded-lg group-hover:bg-lime-400 group-hover:text-slate-950 transition">
                    <Grid className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-lime-400 transition" />
                </div>
                <h4 className="font-bold text-white group-hover:text-lime-400 transition">
                  Courts
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Configure pickleball courts & rates
                </p>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition duration-300 hover:border-lime-500/50 hover:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="p-2 bg-slate-800 text-lime-400 rounded-lg group-hover:bg-lime-400 group-hover:text-slate-950 transition">
                    <Users className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-lime-400 transition" />
                </div>
                <h4 className="font-bold text-white group-hover:text-lime-400 transition">
                  Customers
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Manage registered users & access
                </p>
              </div>
            </Link>

            <Link
              href="/courts"
              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition duration-300 hover:border-lime-500/50 hover:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="p-2 bg-slate-800 text-lime-400 rounded-lg group-hover:bg-lime-400 group-hover:text-slate-950 transition">
                    <Eye className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-lime-400 transition" />
                </div>
                <h4 className="font-bold text-white group-hover:text-lime-400 transition">
                  View Site
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Preview public booking page
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* TODAY'S BOOKINGS */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Today&apos;s Reservations</h3>
              <p className="text-xs text-slate-400">Schedule for {today}</p>
            </div>
            <Link
              href="/admin/reservations"
              className="text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {todayBookings && todayBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Booking Ref</th>
                      <th className="px-6 py-3.5 font-semibold">Customer</th>
                      <th className="px-6 py-3.5 font-semibold">Court</th>
                      <th className="px-6 py-3.5 font-semibold">Time</th>
                      <th className="px-6 py-3.5 font-semibold">Amount</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(todayBookings as TodayBooking[]).map((booking) => (
                      <BookingRow key={booking.id} booking={booking} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="font-semibold text-white">No reservations today</h4>
                <p className="mt-1 text-xs text-slate-400">
                  There are no customer bookings scheduled for today.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        © {new Date().getFullYear()} FCODES Pickleball Booking. Admin System.
      </footer>
    </main>
  );
}

function BookingRow({ booking }: { booking: TodayBooking }) {
  const profile = booking.profiles[0];
  const court = booking.courts[0];
  const timeSlot = booking.time_slots[0];

  return (
    <tr className="hover:bg-slate-800/40 transition duration-150">
      <td className="px-6 py-4 font-mono text-xs font-medium text-lime-400">
        {booking.booking_reference}
      </td>
      <td className="px-6 py-4 font-medium text-white">
        {profile?.full_name || profile?.email || "Unknown"}
      </td>
      <td className="px-6 py-4">{court?.name || "-"}</td>
      <td className="px-6 py-4 text-slate-400">
        {timeSlot?.start_time || "-"} - {timeSlot?.end_time || "-"}
      </td>
      <td className="px-6 py-4 font-semibold text-white">
        ₱{Number(booking.total_amount).toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
            booking.status === "confirmed"
              ? "bg-emerald-950 text-emerald-400 border-emerald-800/50"
              : booking.status === "cancelled"
                ? "bg-rose-950 text-rose-400 border-rose-800/50"
                : "bg-amber-950 text-amber-400 border-amber-800/50"
          }`}
        >
          {booking.status}
        </span>
      </td>
    </tr>
  );
}
