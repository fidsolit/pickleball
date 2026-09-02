import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/BookingForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CourtBookingPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: court, error } = await supabase
    .from("courts")
    .select(
      `
      id,
      branch_id,
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
    `,
    )
    .eq("id", id)
    .single();

  if (error || !court) {
    redirect("/courts");
  }

  if (court.status !== "available") {
    redirect("/courts");
  }

  // Get ALL time slots.
  // We will determine booked slots based on reservations.
  const { data: timeSlots } = await supabase
    .from("time_slots")
    .select(
      `
      id,
      start_time,
      end_time,
      status
    `,
    )
    .eq("status", "active")
    .order("start_time");

  const branch = Array.isArray(court.branches)
    ? court.branches[0]
    : court.branches;

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/courts" className="text-xl font-bold">
              Pickleball Booking
            </Link>

            <p className="text-sm text-gray-500">Book a Court</p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/courts"
          className="text-sm font-medium text-green-600 hover:underline"
        >
          ← Back to Courts
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* COURT INFO */}
          <div className="overflow-hidden rounded-2xl bg-white shadow">
            <div className="h-72 bg-gray-200">
              {court.image_url ? (
                <img
                  src={court.image_url}
                  alt={court.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl">🏓</div>

                    <p className="mt-3 text-gray-500">Pickleball Court</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{court.name}</h1>

                  {branch && (
                    <p className="mt-2 text-gray-500">
                      📍 {branch.name}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Available
                </span>
              </div>

              {court.description && (
                <p className="mt-6 text-gray-600">{court.description}</p>
              )}

              {court.location && (
                <div className="mt-4 text-sm text-gray-500">
                  📍 {court.location}
                </div>
              )}

              {branch?.address && (
                <div className="mt-2 text-sm text-gray-500">
                  {branch.address}
                </div>
              )}

              <div className="mt-6 border-t pt-6">
                <p className="text-sm text-gray-500">Hourly Rate</p>

                <p className="text-3xl font-bold text-green-600">
                  ₱{Number(court.hourly_rate).toLocaleString()}
                </p>

                <p className="text-sm text-gray-400">per hour</p>
              </div>
            </div>
          </div>

          {/* BOOKING */}
          <BookingForm
            court={{
              id: court.id,
              name: court.name,
              hourly_rate: Number(court.hourly_rate),
            }}
            timeSlots={timeSlots || []}
          />
        </div>
      </div>
    </main>
  );
}
