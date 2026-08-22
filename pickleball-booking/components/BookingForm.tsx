"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/courts/[id]/actions";

type TimeSlot = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  booked?: boolean;
};

type BookingFormProps = {
  court: {
    id: string;
    name: string;
    hourly_rate: number;
  };
  timeSlots: TimeSlot[];
};

export default function BookingForm({
  court,
  timeSlots: initialTimeSlots,
}: BookingFormProps) {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  function formatTime(time: string) {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function handleDateChange(selectedDate: string) {
    setDate(selectedDate);
    setTimeSlotId("");
    setError("");
    setMessage("");

    if (!selectedDate) {
      return;
    }

    setLoadingSlots(true);

    try {
      const response = await fetch(
        `/api/availability?courtId=${court.id}&date=${selectedDate}`,
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load availability.");
        return;
      }

      setTimeSlots(data);
    } catch (error) {
      console.error(error);

      setError("Unable to load available time slots.");
    } finally {
      setLoadingSlots(false);
    }
  }

  const selectedSlot = timeSlots.find((slot) => slot.id === timeSlotId);

  async function handleBooking() {
    setError("");
    setMessage("");

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!timeSlotId) {
      setError("Please select a time slot.");
      return;
    }

    setLoadingBooking(true);

    const result = await createBooking({
      courtId: court.id,
      reservationDate: date,
      timeSlotId,
    });

    if (!result.success) {
      setError(result.message);
      setLoadingBooking(false);

      // Refresh slots because somebody may have
      // booked it while we were submitting.
      handleDateChange(date);

      return;
    }

    setMessage(`Booking confirmed! Reference: ${result.bookingReference}`);

    setLoadingBooking(false);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold">Book This Court</h2>

      <p className="mt-2 text-sm text-gray-500">
        Select your preferred date and time.
      </p>

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {message && (
        <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* DATE */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold">Select Date</label>

        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* TIME */}
      <div className="mt-6">
        <label className="mb-3 block text-sm font-semibold">Select Time</label>

        {loadingSlots ? (
          <div className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
            Checking availability...
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
            No time slots available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              const booked = slot.booked === true;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={booked}
                  onClick={() => {
                    setTimeSlotId(slot.id);
                    setError("");
                  }}
                  className={`rounded-lg border px-3 py-4 text-sm font-medium transition ${
                    booked
                      ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400"
                      : timeSlotId === slot.id
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-white hover:border-green-500 hover:bg-green-50"
                  }`}
                >
                  {formatTime(slot.start_time)}
                  {" - "}
                  {formatTime(slot.end_time)}

                  {booked && <span className="ml-2 text-xs">Booked</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      {date && selectedSlot && (
        <div className="mt-8 rounded-xl bg-gray-50 p-5">
          <h3 className="font-bold">Booking Summary</h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Court</span>

              <span className="font-semibold">{court.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>

              <span className="font-semibold">{date}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>

              <span className="font-semibold">
                {formatTime(selectedSlot.start_time)}
                {" - "}
                {formatTime(selectedSlot.end_time)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>

                <span className="text-xl font-bold text-green-600">
                  ₱{court.hourly_rate.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM */}
      <button
        type="button"
        onClick={handleBooking}
        disabled={loadingBooking || loadingSlots || !date || !timeSlotId}
        className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingBooking ? "Confirming Booking..." : "Confirm Reservation"}
      </button>
    </div>
  );
}
