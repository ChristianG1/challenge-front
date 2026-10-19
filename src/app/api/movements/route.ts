import { NextResponse } from "next/server";
import { movementsQuerySchema, type MovementsPage } from "@/domain/contracts";
import { apiError, withAuth } from "@/server/http";
import { InvalidCursorError, listMovements, ServiceUnavailableError } from "@/server/services/account.service";

export const GET = withAuth(async (request, { userId }) => {
  const query = movementsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return apiError("VALIDATION_ERROR", query.error.issues[0]?.message ?? "Parámetros inválidos");

  const { cursor, limit, direction, simulate } = query.data;
  try {
    const page = await listMovements(userId, { cursor, limit, direction, simulateFailure: simulate === "error" });
    return NextResponse.json<MovementsPage>(page);
  } catch (error) {
    if (error instanceof InvalidCursorError) return apiError("INVALID_CURSOR", error.message);
    if (error instanceof ServiceUnavailableError) return apiError("SERVICE_UNAVAILABLE", error.message);
    throw error;
  }
});
