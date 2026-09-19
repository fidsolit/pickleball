"use client";

import { useState, useTransition } from "react";
import { updateReservationStatus } from "@/app/admin/reservations/actions";

const statuses = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;

type Props = {
  reservationId: string;
  currentStatus: (typeof statuses)[number];
};

export default function AdminReservationStatusForm({
  reservationId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await updateReservationStatus(reservationId, status);
      setMessage(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-44 flex-col gap-2">
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as (typeof statuses)[number])
          }
          disabled={isPending}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-lime-400"
          aria-label="Reservation status"
        >
          {statuses.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || status === currentStatus}
          className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Saving" : "Save"}
        </button>
      </div>
      {message && <p className="text-[11px] text-slate-400">{message}</p>}
    </form>
  );
}
