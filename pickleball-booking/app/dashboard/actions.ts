"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(reservationId: string) {
  if (!reservationId)
    return { success: false, message: "Invalid reservation." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      message: "You must be logged in to cancel a reservation.",
    };

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, reservation_date, status")
    .eq("id", reservationId)
    .eq("user_id", user.id)
    .single();

  if (reservationError || !reservation)
    return { success: false, message: "Reservation not found." };

  const today = new Date().toISOString().slice(0, 10);
  if (reservation.reservation_date < today)
    return {
      success: false,
      message: "Past reservations cannot be cancelled.",
    };
  if (["cancelled", "completed", "no_show"].includes(reservation.status))
    return { success: false, message: "This reservation cannot be cancelled." };

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Unable to cancel reservation:", updateError);
    return {
      success: false,
      message: "Unable to cancel the reservation. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Reservation cancelled." };
}
