import { NextResponse } from "next/server";
import {
  IDEMPOTENCY_HEADER,
  SCENARIO_HEADER,
  transferRequestSchema,
  transferScenarioSchema,
} from "@/domain/contracts";
import { apiError, parseJsonBody, withAuth } from "@/server/http";
import { executeTransfer, pickRandomScenario } from "@/server/services/transfer.service";

export const POST = withAuth(async (request, { userId }) => {
  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
  if (!idempotencyKey) {
    return apiError("IDEMPOTENCY_KEY_REQUIRED", "Falta el encabezado Idempotency-Key");
  }

  const body = await parseJsonBody(request, transferRequestSchema);
  if (!body.ok) return body.error;

  const forced = transferScenarioSchema.safeParse(request.headers.get(SCENARIO_HEADER));
  const scenario = forced.success ? forced.data : pickRandomScenario();

  const result = await executeTransfer({ userId, idempotencyKey, scenario, ...body.value });
  if (!result.ok) return apiError(result.error.code, result.error.message);

  const { replayed, ...receipt } = result.value;
  return NextResponse.json({ receipt }, { status: replayed ? 200 : 201 });
});
