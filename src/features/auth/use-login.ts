"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { loginResponseSchema } from "@/domain/contracts";
import { apiRequest, type ApiFailure } from "@/lib/http/api-client";

type LoginStatus = { state: "idle" } | { state: "submitting" } | { state: "error"; message: string };

function messageFor(failure: ApiFailure): string {
  switch (failure.kind) {
    case "http":
      return failure.message;
    case "network":
      return "Sin conexión. Revisa tu internet e intenta de nuevo";
    case "timeout":
      return "El servidor tardó demasiado en responder. Intenta de nuevo";
    case "aborted":
    case "invalid_response":
      return "Ocurrió un error inesperado. Intenta de nuevo";
  }
}

export function useLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<LoginStatus>({ state: "idle" });

  async function login(identifier: string) {
    setStatus({ state: "submitting" });
    const result = await apiRequest("/api/auth/login", loginResponseSchema, {
      method: "POST",
      body: { identifier },
    });
    if (!result.ok) {
      setStatus({ state: "error", message: messageFor(result.error) });
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  const reset = useCallback(() => setStatus({ state: "idle" }), []);

  return { status, login, reset };
}
