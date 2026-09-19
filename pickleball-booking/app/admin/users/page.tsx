import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, Trophy, Users } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  role: "customer" | "admin";
};

type ReservationOwner = { user_id: string; status: string };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: customers, error }, { data: reservations }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at, role")
        .eq("role", "customer")
        .order("created_at", { ascending: false }),
      supabase.from("reservations").select("user_id, status"),
    ]);

  const reservationCounts = new Map<string, number>();
  (reservations as ReservationOwner[] | null)?.forEach((reservation) => {
    if (reservation.status !== "cancelled") {
      reservationCounts.set(
        reservation.user_id,
        (reservationCounts.get(reservation.user_id) || 0) + 1,
      );
    }
  });

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
              Customer management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">
              Customers
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              View registered customers and their active reservation totals.
            </p>
          </div>
          <Users className="hidden h-10 w-10 text-lime-400 sm:block" />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {error ? (
            <p className="p-6 text-sm text-rose-300">
              Unable to load customers.
            </p>
          ) : !customers?.length ? (
            <p className="p-12 text-center text-sm text-slate-400">
              No customers have registered yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Joined</th>
                    <th className="px-5 py-4">Active reservations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(customers as Customer[]).map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {customer.full_name || "Unnamed customer"}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-600">
                          {customer.id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 text-slate-300">
                          <Mail className="h-4 w-4 text-lime-400" />
                          {customer.email || "No email"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.phone || "No phone"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-lime-400">
                        {reservationCounts.get(customer.id) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
