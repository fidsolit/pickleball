import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BookedSlot = { time_slot_id: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

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

  if (!courtId || !date || !uuidPattern.test(courtId) || !isValidDate(date)) {
    return NextResponse.json(
      { error: "A valid court and date are required." },
      { status: 400 },
    );
  }

  // Get all time slots
  const { data: timeSlots, error: slotsError } = await supabase
    .from("time_slots")
    .select("id, start_time, end_time, status")
    .eq("status", "active")
    .order("start_time");

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  // The RPC returns only occupied slot IDs, keeping customer details private.
  const { data: reservations, error: reservationError } = await supabase.rpc(
    "booked_time_slots",
    { p_court_id: courtId, p_reservation_date: date },
  );

  if (reservationError) {
    return NextResponse.json(
      { error: reservationError.message },
      { status: 500 },
    );
  }

  const bookedSlotIds = new Set(
    ((reservations || []) as BookedSlot[]).map(
      (reservation) => reservation.time_slot_id,
    ),
  );

  const result = (timeSlots || []).map((slot) => ({
    ...slot,
    booked: bookedSlotIds.has(slot.id),
  }));

  return NextResponse.json(result);
}
