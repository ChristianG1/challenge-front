import type { ApiFailure } from "@/lib/http/api-client";

export type TransferFailure =
  | { kind: "network"; retryable: true }
  | { kind: "timeout"; retryable: true }
  | { kind: "insufficient_funds"; retryable: false; message: string }
  | { kind: "rejected"; retryable: false; message: string }
  | { kind: "session_expired"; retryable: false }
  | { kind: "unknown"; retryable: true };

export function toTransferFailure(failure: ApiFailure): TransferFailure {
  switch (failure.kind) {
    case "network":
      return { kind: "network", retryable: true };
    case "timeout":
      return { kind: "timeout", retryable: true };
    case "aborted":
    case "invalid_response":
      return { kind: "unknown", retryable: true };
    case "http":
      switch (failure.code) {
        case "SERVICE_UNAVAILABLE":
          return { kind: "network", retryable: true };
        case "GATEWAY_TIMEOUT":
          return { kind: "timeout", retryable: true };
        case "INSUFFICIENT_FUNDS":
          return { kind: "insufficient_funds", retryable: false, message: failure.message };
        case "AMOUNT_REQUIRED":
        case "AMOUNT_NOT_POSITIVE":
        case "RECIPIENT_REQUIRED":
        case "RECIPIENT_NOT_FOUND":
        case "VALIDATION_ERROR":
          return { kind: "rejected", retryable: false, message: failure.message };
        case "UNAUTHORIZED":
          return { kind: "session_expired", retryable: false };
        default:
          return { kind: "unknown", retryable: true };
      }
  }
}

export interface FailureCopy {
  title: string;
  description: string;
}

export function describeFailure(failure: TransferFailure): FailureCopy {
  switch (failure.kind) {
    case "network":
      return {
        title: "Error de conexión",
        description: "No pudimos comunicarnos con el servidor. Tu dinero no se movió. Puedes reintentar de forma segura.",
      };
    case "timeout":
      return {
        title: "La operación tardó demasiado",
        description:
          "No recibimos respuesta a tiempo. Reintentar es seguro: si la transferencia ya se había procesado, no se cobrará dos veces.",
      };
    case "insufficient_funds":
      return { title: "Fondos insuficientes", description: `${failure.message}. Ajusta el monto e intenta de nuevo.` };
    case "rejected":
      return { title: "No pudimos procesar la transferencia", description: failure.message };
    case "session_expired":
      return { title: "Tu sesión expiró", description: "Vuelve a iniciar sesión para continuar." };
    case "unknown":
      return {
        title: "Algo salió mal",
        description: "Ocurrió un error inesperado. Intenta de nuevo o vuelve más tarde.",
      };
  }
}
