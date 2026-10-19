import type { Contact, TransferReceipt } from "@/domain/contracts";
import { parseAmount, type Cents } from "@/domain/money";
import { validateAmount, validateRecipient, type TransferRuleViolation } from "@/domain/transfer-rules";
import type { TransferFailure } from "./transfer-failure";

export const TRANSFER_STEPS = ["amount", "recipient", "review"] as const;
export type TransferStep = (typeof TRANSFER_STEPS)[number];

export interface TransferDraft {
  amountInput: string;
  recipient: Contact | null;
}

export type TransferState =
  | { status: "editing"; step: TransferStep; draft: TransferDraft }
  | { status: "submitting"; draft: TransferDraft; idempotencyKey: string }
  | { status: "failed"; draft: TransferDraft; idempotencyKey: string; failure: TransferFailure }
  | { status: "succeeded"; receipt: TransferReceipt };

export type TransferAction =
  | { type: "AMOUNT_CHANGED"; value: string }
  | { type: "RECIPIENT_SELECTED"; contact: Contact }
  | { type: "STEP_CHANGED"; step: TransferStep }
  | { type: "SUBMITTED"; idempotencyKey: string }
  | { type: "RETRIED" }
  | { type: "SUCCEEDED"; receipt: TransferReceipt }
  | { type: "FAILED"; failure: TransferFailure }
  | { type: "EDIT_REQUESTED"; step: TransferStep }
  | { type: "RESET"; recipient?: Contact | null; step?: TransferStep };

export function createInitialTransferState(recipient: Contact | null = null, step: TransferStep = "amount"): TransferState {
  return { status: "editing", step, draft: { amountInput: "", recipient } };
}

export const initialTransferState: TransferState = createInitialTransferState();

export function transferReducer(state: TransferState, action: TransferAction): TransferState {
  switch (action.type) {
    case "AMOUNT_CHANGED":
      if (state.status !== "editing") return state;
      return { ...state, draft: { ...state.draft, amountInput: action.value } };

    case "RECIPIENT_SELECTED":
      if (state.status !== "editing") return state;
      return { ...state, draft: { ...state.draft, recipient: action.contact } };

    case "STEP_CHANGED":
      if (state.status !== "editing") return state;
      return { ...state, step: action.step };

    case "SUBMITTED":
      if (state.status !== "editing" || state.step !== "review") return state;
      return { status: "submitting", draft: state.draft, idempotencyKey: action.idempotencyKey };

    case "RETRIED":
      if (state.status !== "failed" || !state.failure.retryable) return state;
      return { status: "submitting", draft: state.draft, idempotencyKey: state.idempotencyKey };

    case "SUCCEEDED":
      if (state.status !== "submitting") return state;
      return { status: "succeeded", receipt: action.receipt };

    case "FAILED":
      if (state.status !== "submitting") return state;
      return { status: "failed", draft: state.draft, idempotencyKey: state.idempotencyKey, failure: action.failure };

    case "EDIT_REQUESTED":
      if (state.status !== "failed") return state;
      return { status: "editing", step: action.step, draft: state.draft };

    case "RESET":
      return createInitialTransferState(action.recipient ?? null, action.step);
  }
}

export function getStepViolations(step: TransferStep, draft: TransferDraft, balance: Cents): TransferRuleViolation[] {
  const amountViolations = validateAmount(parseAmount(draft.amountInput), balance);
  const recipientViolations = validateRecipient(draft.recipient?.id ?? null);

  switch (step) {
    case "amount":
      return amountViolations;
    case "recipient":
      return recipientViolations;
    case "review":
      return [...amountViolations, ...recipientViolations];
  }
}
