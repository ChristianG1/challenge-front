import { describe, expect, it } from "vitest";
import { toCents } from "./money";
import { describeViolation, validateTransfer } from "./transfer-rules";

const balance = toCents(10_000);

describe("validateTransfer", () => {
  it("accepts a valid transfer", () => {
    expect(validateTransfer({ amount: toCents(5_000), recipientId: "ctc_1" }, balance)).toEqual({
      ok: true,
      value: { amount: 5_000, recipientId: "ctc_1" },
    });
  });

  it("allows sending the exact balance", () => {
    expect(validateTransfer({ amount: balance, recipientId: "ctc_1" }, balance).ok).toBe(true);
  });

  it.each([0, -1, -5_000])("rejects non-positive amount %i", (amount) => {
    const result = validateTransfer({ amount: toCents(amount), recipientId: "ctc_1" }, balance);
    expect(result).toEqual({ ok: false, error: [{ code: "AMOUNT_NOT_POSITIVE" }] });
  });

  it("rejects amounts above the available balance", () => {
    const result = validateTransfer({ amount: toCents(10_001), recipientId: "ctc_1" }, balance);
    expect(result).toEqual({ ok: false, error: [{ code: "INSUFFICIENT_FUNDS", available: balance }] });
  });

  it("requires a recipient", () => {
    const result = validateTransfer({ amount: toCents(100), recipientId: null }, balance);
    expect(result).toEqual({ ok: false, error: [{ code: "RECIPIENT_REQUIRED" }] });
  });

  it("reports every violation at once", () => {
    const result = validateTransfer({ amount: null, recipientId: " " }, balance);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.map((v) => v.code)).toEqual(["AMOUNT_REQUIRED", "RECIPIENT_REQUIRED"]);
  });
});

describe("describeViolation", () => {
  it("includes the available balance in the insufficient funds message", () => {
    expect(describeViolation({ code: "INSUFFICIENT_FUNDS", available: toCents(12_345) })).toContain("$123.45");
  });
});
