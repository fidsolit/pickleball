"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { cancelBooking } from "@/app/dashboard/actions";

export default function CancelBookingButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancel() {
    if (!window.confirm("Cancel this reservation? This will make the time slot available again.")) return;

    setIsCancelling(true);
    const result = await cancelBooking(reservationId);
    setIsCancelling(false);

    if (!result.success) {
      window.alert(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <button type="button" onClick={handleCancel} disabled={isCancelling} className="inline-flex items-center gap-2 rounded-lg border border-rose-800/70 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-950/60 disabled:cursor-not-allowed disabled:opacity-60">
      <XCircle className="h-4 w-4" />
      {isCancelling ? "Cancelling…" : "Cancel Booking"}
    </button>
  );
}
