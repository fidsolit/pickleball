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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
) {
  if (!uuidPattern.test(reservationId) || !allowedStatuses.includes(status)) {
    return { success: false, message: "Invalid reservation update." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be logged in." };
  }

  const { error } = await supabase.rpc("admin_update_reservation_status", {
    p_reservation_id: reservationId,
    p_status: status,
  });

  if (error) {
    console.error("Unable to update reservation:", error);
    return { success: false, message: "Unable to update this reservation." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/dashboard");

  return { success: true, message: "Reservation updated." };
}
