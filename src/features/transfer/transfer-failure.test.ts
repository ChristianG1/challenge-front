import { describe, expect, it } from "vitest";
import { toTransferFailure } from "./transfer-failure";

describe("toTransferFailure", () => {
  it.each([
    [{ kind: "network" } as const, "network"],
    [{ kind: "timeout" } as const, "timeout"],
    [{ kind: "invalid_response", status: 200 } as const, "unknown"],
    [{ kind: "http", status: 503, code: "SERVICE_UNAVAILABLE", message: "" } as const, "network"],
    [{ kind: "http", status: 504, code: "GATEWAY_TIMEOUT", message: "" } as const, "timeout"],
    [{ kind: "http", status: 422, code: "INSUFFICIENT_FUNDS", message: "" } as const, "insufficient_funds"],
    [{ kind: "http", status: 422, code: "AMOUNT_NOT_POSITIVE", message: "" } as const, "rejected"],
    [{ kind: "http", status: 401, code: "UNAUTHORIZED", message: "" } as const, "session_expired"],
    [{ kind: "http", status: 500, code: "INTERNAL_ERROR", message: "" } as const, "unknown"],
  ])("maps %j to %s", (failure, expected) => {
    expect(toTransferFailure(failure).kind).toBe(expected);
  });

  it("marks insufficient funds as not retryable", () => {
    expect(
      toTransferFailure({ kind: "http", status: 422, code: "INSUFFICIENT_FUNDS", message: "" }).retryable,
    ).toBe(false);
  });
});
