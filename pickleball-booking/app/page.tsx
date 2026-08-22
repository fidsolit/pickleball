// import { createClient } from "@/lib/supabase/server";
import {createClient} from "@/lib/supabase/client";

export default async function Home() {
  const supabase = await createClient();

  const { data: courts, error } = await supabase
    .from("courts")
    .select("*")
    .order("name");

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Pickleball Booking
      </h1>

      <pre className="mt-6 rounded-lg bg-gray-100 p-5">
        {JSON.stringify({ courts, error }, null, 2)}
      </pre>
    </main>
  );
}