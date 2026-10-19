import { beforeEach, describe, expect, it } from "vitest";
import { toCents } from "@/domain/money";
import { getDb, resetDb } from "../mock-db";
import { executeTransfer, pickRandomScenario } from "./transfer.service";

const base = { userId: "usr_demo", recipientId: "ctc_1", amount: toCents(10_000), scenario: "success" as const };

describe("executeTransfer", () => {
  beforeEach(() => {
    resetDb();
  });

  it("debits the balance, records a movement and returns a receipt", async () => {
    const before = getDb().users.get("usr_demo")!.balance;
    const result = await executeTransfer({ ...base, idempotencyKey: "k1" });

    expect(result.ok).toBe(true);
    const user = getDb().users.get("usr_demo")!;
    expect(user.balance).toBe(before - 10_000);
    expect(user.movements[0]).toMatchObject({ direction: "outgoing", amount: 10_000, counterparty: "Carlos Ruiz" });
  });

  it("is idempotent: retrying with the same key does not charge twice", async () => {
    const before = getDb().users.get("usr_demo")!.balance;
    const first = await executeTransfer({ ...base, idempotencyKey: "same" });
    const second = await executeTransfer({ ...base, idempotencyKey: "same" });

    expect(first.ok && second.ok && second.value.replayed).toBe(true);
    if (first.ok && second.ok) expect(second.value.id).toBe(first.value.id);
    expect(getDb().users.get("usr_demo")!.balance).toBe(before - 10_000);
  });

  it("enforces business rules on the server even if the client skipped them", async () => {
    const tooMuch = await executeTransfer({ ...base, amount: toCents(999_999_999), idempotencyKey: "k2" });
    const negative = await executeTransfer({ ...base, amount: toCents(-1), idempotencyKey: "k3" });
    const noRecipient = await executeTransfer({ ...base, recipientId: "", idempotencyKey: "k4" });
    const unknownRecipient = await executeTransfer({ ...base, recipientId: "ctc_nope", idempotencyKey: "k5" });

    expect(tooMuch).toMatchObject({ ok: false, error: { code: "INSUFFICIENT_FUNDS" } });
    expect(negative).toMatchObject({ ok: false, error: { code: "AMOUNT_NOT_POSITIVE" } });
    expect(noRecipient).toMatchObject({ ok: false, error: { code: "RECIPIENT_REQUIRED" } });
    expect(unknownRecipient).toMatchObject({ ok: false, error: { code: "RECIPIENT_NOT_FOUND" } });
  });

  it.each([
    ["network_error", "SERVICE_UNAVAILABLE"],
    ["insufficient_funds", "INSUFFICIENT_FUNDS"],
    ["timeout", "GATEWAY_TIMEOUT"],
    ["unknown_error", "INTERNAL_ERROR"],
  ] as const)("scenario %s fails with %s and does not move money", async (scenario, code) => {
    const before = getDb().users.get("usr_demo")!.balance;
    const result = await executeTransfer({ ...base, scenario, idempotencyKey: `k-${scenario}` });

    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(getDb().users.get("usr_demo")!.balance).toBe(before);
  });

  it("lets a failed attempt be retried successfully with the same key", async () => {
    await executeTransfer({ ...base, scenario: "network_error", idempotencyKey: "retry" });
    const retry = await executeTransfer({ ...base, scenario: "success", idempotencyKey: "retry" });
    expect(retry).toMatchObject({ ok: true, value: { replayed: false } });
  });
});

describe("pickRandomScenario", () => {
  it("covers every scenario across the random range", () => {
    const picked = new Set([0, 0.2, 0.45, 0.5, 0.65, 0.8, 0.99].map((r) => pickRandomScenario(() => r)));
    expect(picked).toEqual(new Set(["success", "network_error", "insufficient_funds", "timeout", "unknown_error"]));
  });
});
