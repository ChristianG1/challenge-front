import { describe, expect, it } from "vitest";
import type { Contact, TransferReceipt } from "@/domain/contracts";
import { toCents } from "@/domain/money";
import { getStepViolations, initialTransferState, transferReducer, type TransferState } from "./transfer-machine";

const contact: Contact = { id: "ctc_1", name: "Carlos", handle: "5587654321", favorite: true };
const receipt: TransferReceipt = {
  id: "trx_1",
  reference: "REF",
  amount: toCents(100),
  recipient: { name: "Carlos", handle: "5587654321" },
  balanceAfter: toCents(900),
  createdAt: new Date().toISOString(),
};

const review: TransferState = {
  status: "editing",
  step: "review",
  draft: { amountInput: "1", recipient: contact },
};

describe("transferReducer", () => {
  it("updates the draft while editing", () => {
    let state = transferReducer(initialTransferState, { type: "AMOUNT_CHANGED", value: "10" });
    state = transferReducer(state, { type: "RECIPIENT_SELECTED", contact });
    expect(state).toMatchObject({ status: "editing", draft: { amountInput: "10", recipient: contact } });
  });

  it("only submits from the review step", () => {
    expect(transferReducer(initialTransferState, { type: "SUBMITTED", idempotencyKey: "k" })).toBe(initialTransferState);
    expect(transferReducer(review, { type: "SUBMITTED", idempotencyKey: "k" })).toMatchObject({
      status: "submitting",
      idempotencyKey: "k",
    });
  });

  it("ignores a second submit while one is in flight (no double charge)", () => {
    const submitting = transferReducer(review, { type: "SUBMITTED", idempotencyKey: "k1" });
    expect(transferReducer(submitting, { type: "SUBMITTED", idempotencyKey: "k2" })).toBe(submitting);
  });

  it("keeps the idempotency key when retrying a retryable failure", () => {
    const submitting = transferReducer(review, { type: "SUBMITTED", idempotencyKey: "k1" });
    const failed = transferReducer(submitting, { type: "FAILED", failure: { kind: "network", retryable: true } });
    expect(transferReducer(failed, { type: "RETRIED" })).toMatchObject({ status: "submitting", idempotencyKey: "k1" });
  });

  it("does not retry non-retryable failures", () => {
    const submitting = transferReducer(review, { type: "SUBMITTED", idempotencyKey: "k1" });
    const failed = transferReducer(submitting, {
      type: "FAILED",
      failure: { kind: "insufficient_funds", retryable: false, message: "x" },
    });
    expect(transferReducer(failed, { type: "RETRIED" })).toBe(failed);
    expect(transferReducer(failed, { type: "EDIT_REQUESTED", step: "amount" })).toMatchObject({
      status: "editing",
      step: "amount",
      draft: review.draft,
    });
  });

  it("ignores results that arrive when not submitting", () => {
    expect(transferReducer(review, { type: "SUCCEEDED", receipt })).toBe(review);
  });

  it("resets to the initial state", () => {
    const succeeded = transferReducer(transferReducer(review, { type: "SUBMITTED", idempotencyKey: "k" }), {
      type: "SUCCEEDED",
      receipt,
    });
    expect(succeeded.status).toBe("succeeded");
    expect(transferReducer(succeeded, { type: "RESET" })).toEqual(initialTransferState);
  });
});

describe("getStepViolations", () => {
  const balance = toCents(1_000);
  const draft = { amountInput: "20", recipient: null };

  it("validates only the amount on the amount step", () => {
    expect(getStepViolations("amount", draft, balance)).toEqual([{ code: "INSUFFICIENT_FUNDS", available: balance }]);
  });

  it("validates everything on the review step", () => {
    expect(getStepViolations("review", { amountInput: "abc", recipient: null }, balance).map((v) => v.code)).toEqual([
      "AMOUNT_REQUIRED",
      "RECIPIENT_REQUIRED",
    ]);
  });
});
