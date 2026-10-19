"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

export default function HomeError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const router = useRouter();

  function handleRetry() {
    startTransition(() => {
      if (new URLSearchParams(window.location.search).has("simulate")) router.replace("/home");
      retry();
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-ink-100">
        <StateMessage
          tone="error"
          title="No pudimos cargar tu información"
          description="Revisa tu conexión e intenta de nuevo."
          actions={<Button onClick={handleRetry}>Reintentar</Button>}
        />
      </div>
    </main>
  );
}
