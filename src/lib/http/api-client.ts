import type { z } from "zod";
import { apiErrorBodySchema, type ApiErrorCode } from "@/domain/contracts";
import { err, ok, type Result } from "@/domain/result";

export type ApiFailure =
  | { kind: "network" }
  | { kind: "timeout" }
  | { kind: "aborted" }
  | { kind: "http"; status: number; code: ApiErrorCode; message: string }
  | { kind: "invalid_response"; status: number };

export interface ApiRequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  { method = "GET", body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal }: ApiRequestOptions = {},
): Promise<Result<z.output<S>, ApiFailure>> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
      credentials: "same-origin",
    });
  } catch (error) {
    if (timeoutSignal.aborted) return err({ kind: "timeout" });
    if (error instanceof DOMException && error.name === "AbortError") return err({ kind: "aborted" });
    return err({ kind: "network" });
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorBodySchema.safeParse(payload);
    if (!parsedError.success) return err({ kind: "invalid_response", status: response.status });
    return err({ kind: "http", status: response.status, ...parsedError.data.error });
  }

  const parsed = schema.safeParse(payload);
  return parsed.success ? ok(parsed.data) : err({ kind: "invalid_response", status: response.status });
}
