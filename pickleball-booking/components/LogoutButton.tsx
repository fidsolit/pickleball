"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CiLogout } from "react-icons/ci";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Logout"
      className="flex items-center justify-center rounded-lg p-2 text-2xl text-gray-600 transition hover:bg-red-50 hover:text-red-600"
    >
      <CiLogout />
    </button>
  );
}