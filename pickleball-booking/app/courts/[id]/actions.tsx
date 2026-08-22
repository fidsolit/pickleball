"use server";

import { createClient } from "@/lib/supabase/server";

type BookingInput = {
  courtId: string;
  reservationDate: string;
  timeSlotId: string;
};

export async function createBooking({
  courtId,
  reservationDate,
  timeSlotId,
}: BookingInput) {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be logged in to make a reservation.",
    };
  }

  // Validate date
  const selectedDate = new Date(`${reservationDate}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return {
      success: false,
      message: "You cannot book a past date.",
    };
  }

  // Get court
  const { data: court, error: courtError } = await supabase
    .from("courts")
    .select("id, name, hourly_rate, status")
    .eq("id", courtId)
    .single();

  if (courtError || !court) {
    return {
      success: false,
      message: "Court not found.",
    };
  }

  if (court.status !== "available") {
    return {
      success: false,
      message: "This court is currently unavailable.",
    };
  }

  // Get time slot
  const { data: timeSlot, error: timeSlotError } = await supabase
    .from("time_slots")
    .select("id, start_time, end_time, status")
    .eq("id", timeSlotId)
    .single();

  if (timeSlotError || !timeSlot) {
    return {
      success: false,
      message: "Time slot not found.",
    };
  }

  if (timeSlot.status !== "available") {
    return {
      success: false,
      message: "This time slot is unavailable.",
    };
  }

  // Check existing booking
  const { data: existingReservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("court_id", courtId)
    .eq("reservation_date", reservationDate)
    .eq("time_slot_id", timeSlotId)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingReservation) {
    return {
      success: false,
      message: "Sorry, this court and time slot has already been booked.",
    };
  }

  // Generate booking reference
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  const bookingReference = `PB-${reservationDate.replaceAll("-", "")}-${random}`;

  // Create reservation
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      booking_reference: bookingReference,
      user_id: user.id,
      court_id: courtId,
      time_slot_id: timeSlotId,
      reservation_date: reservationDate,
      status: "pending",
      total_amount: court.hourly_rate,
      payment_status: "pending",
    })
    .select("id, booking_reference")
    .single();

  if (reservationError) {
    console.error("Reservation error:", reservationError);

    // PostgreSQL unique violation
    if (reservationError.code === "23505") {
      return {
        success: false,
        message: "Sorry, another customer just booked this time slot.",
      };
    }

    return {
      success: false,
      message: reservationError.message,
    };
  }

  return {
    success: true,
    bookingReference: reservation.booking_reference,
  };
}
