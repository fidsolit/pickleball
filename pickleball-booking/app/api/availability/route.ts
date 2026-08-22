import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  const courtId = searchParams.get("courtId");
  const date = searchParams.get("date");

  if (!courtId || !date) {
    return NextResponse.json(
      { error: "courtId and date are required" },
      { status: 400 },
    );
  }

  // Get all time slots
  const { data: timeSlots, error: slotsError } = await supabase
    .from("time_slots")
    .select("id, start_time, end_time, status")
    .order("start_time");

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  // Get bookings for this court and date
  const { data: reservations, error: reservationError } = await supabase
    .from("reservations")
    .select("time_slot_id, status")
    .eq("court_id", courtId)
    .eq("reservation_date", date)
    .neq("status", "cancelled");

  if (reservationError) {
    return NextResponse.json(
      { error: reservationError.message },
      { status: 500 },
    );
  }

  const bookedSlotIds = new Set(
    (reservations || []).map((reservation) => reservation.time_slot_id),
  );

  const result = (timeSlots || []).map((slot) => ({
    ...slot,
    booked: bookedSlotIds.has(slot.id),
  }));

  return NextResponse.json(result);
}
