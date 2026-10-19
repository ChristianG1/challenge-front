import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "@/domain/contracts";
import { err, ok, type Result } from "@/domain/result";
import { getSessionUserId } from "./session";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  VALIDATION_ERROR: 400,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  INVALID_CURSOR: 400,
  AMOUNT_REQUIRED: 422,
  AMOUNT_NOT_POSITIVE: 422,
  INSUFFICIENT_FUNDS: 422,
  RECIPIENT_REQUIRED: 422,
  RECIPIENT_NOT_FOUND: 422,
  CONTACT_ALREADY_EXISTS: 409,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

export function apiError(code: ApiErrorCode, message: string) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message } },
    { status: STATUS_BY_CODE[code] },
  );
}

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Result<z.output<S>, NextResponse>> {
  const body: unknown = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Solicitud inválida";
    return err(apiError("VALIDATION_ERROR", message));
  }
  return ok(parsed.data);
}

type AuthedHandler = (request: Request, ctx: { userId: string }) => Promise<Response>;

export function withAuth(handler: AuthedHandler) {
  return async (request: Request) => {
    const userId = await getSessionUserId();
    if (!userId) return apiError("UNAUTHORIZED", "Tu sesión expiró, vuelve a iniciar sesión");
    try {
      return await handler(request, { userId });
    } catch (error) {
      console.error("[api] unexpected error", error);
      return apiError("INTERNAL_ERROR", "Ocurrió un error inesperado");
    }
  };
}
