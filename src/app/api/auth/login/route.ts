import { NextResponse } from "next/server";
import { loginRequestSchema } from "@/domain/contracts";
import { apiError, parseJsonBody } from "@/server/http";
import { setSessionCookie } from "@/server/session";
import { login } from "@/server/services/auth.service";

export async function POST(request: Request) {
  const body = await parseJsonBody(request, loginRequestSchema);
  if (!body.ok) return body.error;

  const result = await login(body.value.identifier);
  if (!result.ok) {
    return result.error === "SERVICE_UNAVAILABLE"
      ? apiError("SERVICE_UNAVAILABLE", "No pudimos iniciar sesión. Intenta de nuevo en unos minutos")
      : apiError("INVALID_CREDENTIALS", "No encontramos una cuenta con esos datos");
  }

  await setSessionCookie(result.value.token);
  return NextResponse.json({ user: result.value.user });
}
