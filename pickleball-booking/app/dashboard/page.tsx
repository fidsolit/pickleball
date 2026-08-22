import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  MapPin,
  Trophy,
  User,
} from "lucide-react";
import CancelBookingButton from "@/components/CancelBookingButton";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: reservations, error: reservationsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("reservations")
        .select(
          `
        id, booking_reference, reservation_date, status, total_amount, payment_status,
        courts ( name, location ),
        time_slots ( start_time, end_time )
      `,
        )
        .eq("user_id", user.id)
        .order("reservation_date", { ascending: true }),
    ]);

  if (profile?.role === "admin") redirect("/admin");

  const today = new Date().toISOString().slice(0, 10);
  const customerReservations = reservations ?? [];
  const upcomingBookings = customerReservations.filter(
    (reservation) =>
      reservation.reservation_date >= today &&
      !["cancelled", "completed", "no_show"].includes(reservation.status),
  );

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
          >
            <span className="rounded-lg bg-lime-500 p-1.5 text-slate-950">
              <Trophy className="h-5 w-5" />
            </span>
            FCODES <span className="text-lime-400">PICKLEBALL</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-200">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-slate-400">Customer</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"
            alt="Pickleball court"
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <span className="mb-3 inline-block rounded-full border border-lime-800/60 bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-400 backdrop-blur-sm">
            Customer Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Welcome back,{" "}
            <span className="text-lime-400">
              {profile?.full_name || user.email}
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
            View your reservations, keep track of your bookings, or reserve your
            next court.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Upcoming Bookings"
            value={upcomingBookings.length}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatCard
            label="Total Bookings"
            value={customerReservations.length}
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
          <StatCard
            label="Account Role"
            value={profile?.role || "customer"}
            icon={<User className="h-6 w-6" />}
            textValue
          />
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Need a reservation?</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
            Check court availability, choose a time slot, and confirm your
            booking.
          </p>
          <Link
            href="/courts"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-lime-300"
          >
            Book a Court <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">My Reservations</h2>
              <p className="mt-1 text-sm text-slate-400">
                View your booking details and cancel eligible reservations.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {customerReservations.length}{" "}
              {customerReservations.length === 1
                ? "reservation"
                : "reservations"}
            </p>
          </div>

          {reservationsError ? (
            <div className="rounded-xl border border-rose-900/70 bg-rose-950/40 p-5 text-sm text-rose-200">
              We could not load your reservations. Please refresh and try again.
            </div>
          ) : customerReservations.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No reservations yet
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Your next pickleball booking will appear here.
              </p>
              <Link
                href="/courts"
                className="mt-6 inline-flex rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-lime-300"
              >
                Book Your First Court
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {customerReservations.map((reservation) => {
                const status = reservation.status as ReservationStatus;
                const canCancel =
                  reservation.reservation_date >= today &&
                  !["cancelled", "completed", "no_show"].includes(status);
                const court = reservation.courts?.[0];
                const timeSlot = reservation.time_slots?.[0];
                return (
                  <article
                    key={reservation.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-mono text-sm font-semibold text-lime-400">
                            {reservation.booking_reference}
                          </h3>
                          <StatusBadge status={status} />
                        </div>
                        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <ReservationDetail
                            label="Court"
                            icon={<Trophy className="h-4 w-4" />}
                          >
                            {court?.name || "Unknown court"}
                          </ReservationDetail>
                          <ReservationDetail
                            label="Date"
                            icon={<Calendar className="h-4 w-4" />}
                          >
                            {formatDate(reservation.reservation_date)}
                          </ReservationDetail>
                          <ReservationDetail
                            label="Time"
                            icon={<Clock3 className="h-4 w-4" />}
                          >
                            {formatTime(timeSlot?.start_time)} –{" "}
                            {formatTime(timeSlot?.end_time)}
                          </ReservationDetail>
                          {court?.location && (
                            <ReservationDetail
                              label="Location"
                              icon={<MapPin className="h-4 w-4" />}
                            >
                              {court.location}
                            </ReservationDetail>
                          )}
                          <ReservationDetail
                            label="Payment"
                            icon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            {formatLabel(
                              reservation.payment_status || "unpaid",
                            )}
                          </ReservationDetail>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-5 lg:min-w-44 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Total Amount
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-lime-400">
                          ₱
                          {Number(reservation.total_amount).toLocaleString(
                            "en-PH",
                            { maximumFractionDigits: 2 },
                          )}
                        </p>
                        {canCancel && (
                          <div className="mt-4">
                            <CancelBookingButton
                              reservationId={reservation.id}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FCODES Pickleball Booking. All rights
        reserved.
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  textValue = false,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  textValue?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className={`mt-2 font-extrabold text-white ${textValue ? "text-xl capitalize" : "text-3xl"}`}
        >
          {value}
        </p>
      </div>
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/80 p-3 text-lime-400">
        {icon}
      </div>
    </div>
  );
}

function ReservationDetail({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-medium text-slate-200">
        {icon}
        {children}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const classes: Record<ReservationStatus, string> = {
    pending: "border-amber-800/50 bg-amber-950 text-amber-300",
    confirmed: "border-emerald-800/50 bg-emerald-950 text-emerald-300",
    completed: "border-sky-800/50 bg-sky-950 text-sky-300",
    cancelled: "border-rose-800/50 bg-rose-950 text-rose-300",
    no_show: "border-slate-700 bg-slate-800 text-slate-300",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status] || classes.pending}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function formatTime(time?: string) {
  return time
    ? new Date(`1970-01-01T${time}`).toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
}
function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
