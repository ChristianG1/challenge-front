"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

export default function TransferError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-ink-100">
      <StateMessage
        tone="error"
        title="No pudimos preparar tu transferencia"
        description="Intenta de nuevo en unos momentos."
        actions={
          <>
            <ButtonLink href="/home" variant="secondary" className="flex-1">
              Volver al inicio
            </ButtonLink>
            <Button onClick={() => retry()} className="flex-1">
              Reintentar
            </Button>
          </>
        }
      />
      </div>
    </main>
  );
}
