import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, Grid3X3, Trophy } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type Court = {
  id: string;
  name: string;
  location: string | null;
  hourly_rate: number | string;
  status: "available" | "maintenance" | "inactive";
  branches: { name: string; address: string | null }[];
};

export default async function AdminCourtsPage() {
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

  const { data: courts, error } = await supabase
    .from("courts")
    .select(
      `
      id,
      name,
      location,
      hourly_rate,
      status,
      branches ( name, address )
    `,
    )
    .order("name");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AdminHeader />
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
              Facility management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Courts</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor court status, location, and hourly pricing.
            </p>
          </div>
          <Grid3X3 className="hidden h-10 w-10 text-lime-400 sm:block" />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {error ? (
            <p className="p-6 text-sm text-rose-300">Unable to load courts.</p>
          ) : !courts?.length ? (
            <p className="p-12 text-center text-sm text-slate-400">
              No courts have been configured.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Court</th>
                    <th className="px-5 py-4">Branch</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Hourly rate</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(courts as Court[]).map((court) => {
                    const branch = court.branches[0];
                    return (
                      <tr key={court.id} className="hover:bg-slate-800/30">
                        <td className="px-5 py-4 font-semibold text-white">
                          {court.name}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-lime-400" />
                            {branch?.name || "Unassigned"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {court.location || "-"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-lime-400">
                          ₱{Number(court.hourly_rate).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusStyle[court.status]}`}
                          >
                            {court.status.replace("_", " ")}
                          </span>
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

const statusStyle = {
  available: "border-emerald-800/60 bg-emerald-950 text-emerald-300",
  maintenance: "border-amber-800/60 bg-amber-950 text-amber-300",
  inactive: "border-slate-700 bg-slate-800 text-slate-300",
};

function AdminHeader() {
  return (
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
  );
}
