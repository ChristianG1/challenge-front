"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const SLOW_THRESHOLD_MS = 3_000;

export function SubmittingView() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
      <Spinner className="size-10 text-ink-900" />
      <p className="font-semibold">Procesando tu transferencia…</p>
      <p className="text-sm text-ink-500">
        {slow ? "Esto está tardando más de lo normal. No cierres esta pantalla." : "No cierres esta pantalla."}
      </p>
    </div>
  );
}
