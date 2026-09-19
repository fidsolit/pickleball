"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;

type ReservationStatus = (typeof allowedStatuses)[number];

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
) {
  if (!reservationId || !allowedStatuses.includes(status)) {
    return { success: false, message: "Invalid reservation update." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be logged in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, message: "Admin access is required." };
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId);

  if (error) {
    console.error("Unable to update reservation:", error);
    return { success: false, message: "Unable to update this reservation." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/dashboard");

  return { success: true, message: "Reservation updated." };
}
