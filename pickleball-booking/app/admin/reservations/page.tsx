import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import AdminReservationStatusForm from "@/components/AdminReservationStatusForm";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type Reservation = {
  id: string;
  booking_reference: string;
  reservation_date: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  payment_status: string;
  total_amount: number | string;
  profiles: { full_name: string | null; email: string | null }[];
  courts: { name: string | null }[];
  time_slots: { start_time: string; end_time: string }[];
};

export default async function AdminReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      booking_reference,
      reservation_date,
      status,
      payment_status,
      total_amount,
      profiles ( full_name, email ),
      courts ( name ),
      time_slots ( start_time, end_time )
    `,
    )
    .order("reservation_date", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="rounded-lg bg-lime-500 p-1.5 text-slate-950">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="font-bold text-white">FCODES ADMIN</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-lime-400 hover:text-lime-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">
              Operations
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">
              Reservations
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review bookings and update their lifecycle status.
            </p>
          </div>
          <Calendar className="hidden h-10 w-10 text-lime-400 sm:block" />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {error ? (
            <p className="p-6 text-sm text-rose-300">
              Unable to load reservations.
            </p>
          ) : !reservations?.length ? (
            <p className="p-12 text-center text-sm text-slate-400">
              No reservations have been created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Booking</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Court / Time</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(reservations as Reservation[]).map((reservation) => {
                    const customer = reservation.profiles[0];
                    const court = reservation.courts[0];
                    const timeSlot = reservation.time_slots[0];

                    return (
                      <tr
                        key={reservation.id}
                        className="align-top hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs text-lime-400">
                            {reservation.booking_reference}
                          </p>
                          <p className="mt-1 text-slate-300">
                            {reservation.reservation_date}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-white">
                            {customer?.full_name || "Unnamed customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer?.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          <p>{court?.name || "Unknown court"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {timeSlot?.start_time} - {timeSlot?.end_time}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">
                            ₱{Number(reservation.total_amount).toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {reservation.payment_status}
                          </p>
                        </td>
                        <td className="px-5 py-4 capitalize text-slate-300">
                          {reservation.status.replace("_", " ")}
                        </td>
                        <td className="px-5 py-4">
                          <AdminReservationStatusForm
                            reservationId={reservation.id}
                            currentStatus={reservation.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
