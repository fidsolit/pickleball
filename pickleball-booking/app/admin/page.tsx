import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

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
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-xl font-bold">
              Pickleball Admin
            </h1>

            <p className="text-sm text-gray-500">
              Administration Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {profile.full_name || user.email}
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>

            <LogoutButton />

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="mt-2 text-gray-500">
            Manage your pickleball facility.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* BOOKINGS */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Bookings
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalReservations ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              All reservations
            </p>
          </div>

          {/* CUSTOMERS */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Customers
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalCustomers ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Registered customers
            </p>
          </div>

          {/* COURTS */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Courts
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalCourts ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Total courts
            </p>
          </div>

          {/* UPCOMING */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Upcoming
            </p>

            <p className="mt-2 text-3xl font-bold">
              {upcomingBookings ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Upcoming reservations
            </p>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-10">

          <h3 className="mb-5 text-xl font-bold">
            Quick Actions
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/admin/reservations"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-3xl">
                📅
              </div>

              <h4 className="mt-4 font-bold">
                Reservations
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Manage customer bookings
              </p>
            </Link>

            <Link
              href="/admin/courts"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-3xl">
                🏓
              </div>

              <h4 className="mt-4 font-bold">
                Courts
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Manage pickleball courts
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-3xl">
                👥
              </div>

              <h4 className="mt-4 font-bold">
                Customers
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Manage registered users
              </p>
            </Link>

            <Link
              href="/courts"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-3xl">
                👀
              </div>

              <h4 className="mt-4 font-bold">
                View Website
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                View customer booking page
              </p>
            </Link>

          </div>

        </div>

        {/* TODAY'S BOOKINGS */}
        <div className="mt-10">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h3 className="text-xl font-bold">
                Today's Reservations
              </h3>

              <p className="text-sm text-gray-500">
                {today}
              </p>
            </div>

            <Link
              href="/admin/reservations"
              className="text-sm font-semibold text-green-600 hover:underline"
            >
              View All
            </Link>

          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

            {todayBookings && todayBookings.length > 0 ? (

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Booking
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Customer
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Court
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Time
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Amount
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {todayBookings.map((booking: any) => (

                      <tr
                        key={booking.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 font-medium">
                          {booking.booking_reference}
                        </td>

                        <td className="px-6 py-4">
                          {booking.profiles?.full_name ||
                            booking.profiles?.email ||
                            "Unknown"}
                        </td>

                        <td className="px-6 py-4">
                          {booking.courts?.name || "-"}
                        </td>

                        <td className="px-6 py-4">
                          {booking.time_slots?.start_time} -
                          {" "}
                          {booking.time_slots?.end_time}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          ₱
                          {Number(
                            booking.total_amount
                          ).toLocaleString()}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {booking.status}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="p-10 text-center">

                <div className="text-4xl">
                  📅
                </div>

                <h4 className="mt-4 font-semibold">
                  No reservations today
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  There are no bookings scheduled for today.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}