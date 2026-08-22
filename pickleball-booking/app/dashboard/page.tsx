import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

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
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">
              Pickleball Booking
            </h1>

            <p className="text-sm text-gray-500">
              Customer Dashboard
            </p>
          </div>

          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Welcome, {profile?.full_name || user.email}!
          </h2>

          <p className="mt-2 text-gray-500">
            Ready to play pickleball?
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">

            <div className="rounded-xl border p-6">
              <p className="text-sm text-gray-500">
                Upcoming Bookings
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <p className="text-sm text-gray-500">
                Total Bookings
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <p className="text-sm text-gray-500">
                Account
              </p>

              <p className="mt-2 font-semibold">
                {profile?.role || "customer"}
              </p>
            </div>

          </div>

          <div className="mt-8">
            <a
              href="/courts"
              className="inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Book a Court
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}