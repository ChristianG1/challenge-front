"use client";

import { useRouter } from "next/navigation";
import { useEffectEvent, useLayoutEffect, useReducer, useRef, useState } from "react";
import { z } from "zod";
import {
  IDEMPOTENCY_HEADER,
  SCENARIO_HEADER,
  transferReceiptSchema,
  type Contact,
  type TransferScenario,
} from "@/domain/contracts";
import { parseAmount, type Cents } from "@/domain/money";
import { validateAmount } from "@/domain/transfer-rules";
import { apiRequest } from "@/lib/http/api-client";
import { toTransferFailure } from "./transfer-failure";
import {
  createInitialTransferState,
  getStepViolations,
  TRANSFER_STEPS,
  transferReducer,
  type TransferStep,
} from "./transfer-machine";

export const TRANSFER_TIMEOUT_MS = 8_000;

export type ScenarioChoice = TransferScenario | "random";

const transferResponseSchema = z.object({ receipt: transferReceiptSchema });

interface UseTransferFlowOptions {
  balance: Cents;
  initialContacts: Contact[];
  initialRecipientId?: string | null;
  startWithNewContact?: boolean;
}

export function useTransferFlow({
  balance,
  initialContacts,
  initialRecipientId = null,
  startWithNewContact = false,
}: UseTransferFlowOptions) {
  const router = useRouter();
  const initialRecipient = initialContacts.find((c) => c.id === initialRecipientId) ?? null;
  const initialStep: TransferStep = startWithNewContact ? "recipient" : "amount";
  const [state, dispatch] = useReducer(transferReducer, null, () =>
    createInitialTransferState(initialRecipient, initialStep),
  );
  const [addingContact, setAddingContact] = useReducer((_: boolean, next: boolean) => next, startWithNewContact);
  const [contacts, setContacts] = useState(initialContacts);
  const [scenario, setScenario] = useState<ScenarioChoice>("random");
  const [showErrors, setShowErrors] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startFresh = useEffectEvent(() => {
    dispatch({ type: "RESET", recipient: initialRecipient, step: initialStep });
    setAddingContact(startWithNewContact);
  });
  useLayoutEffect(() => {
    startFresh();
    return () => {
      abortRef.current?.abort();
      dispatch({ type: "RESET" });
      setAddingContact(false);
      setShowErrors(false);
      setScenario("random");
    };
  }, [initialRecipientId, startWithNewContact]);

  const draft = state.status === "succeeded" ? null : state.draft;
  const currentStep = state.status === "editing" ? state.step : null;
  const violations = draft && currentStep ? getStepViolations(currentStep, draft, balance) : [];

  async function send(idempotencyKey: string, attempt: "SUBMITTED" | "RETRIED") {
    if (!draft?.recipient) return;
    const amount = parseAmount(draft.amountInput);
    if (amount === null) return;

    dispatch(attempt === "SUBMITTED" ? { type: "SUBMITTED", idempotencyKey } : { type: "RETRIED" });

    abortRef.current = new AbortController();
    const result = await apiRequest("/api/transfers", transferResponseSchema, {
      method: "POST",
      body: { amount, recipientId: draft.recipient.id },
      headers: {
        [IDEMPOTENCY_HEADER]: idempotencyKey,
        ...(scenario !== "random" && { [SCENARIO_HEADER]: scenario }),
      },
      timeoutMs: TRANSFER_TIMEOUT_MS,
      signal: abortRef.current.signal,
    });

    if (result.ok) {
      dispatch({ type: "SUCCEEDED", receipt: result.value.receipt });
      router.refresh();
      return;
    }
    if (result.error.kind === "aborted") return;
    dispatch({ type: "FAILED", failure: toTransferFailure(result.error) });
  }

  function goTo(step: TransferStep) {
    setShowErrors(false);
    dispatch({ type: "STEP_CHANGED", step });
  }

  return {
    state,
    contacts,
    balance,
    scenario,
    violations,
    showErrors,
    setScenario,
    setAmount: (value: string) => dispatch({ type: "AMOUNT_CHANGED", value }),
    selectRecipient: (contact: Contact) => dispatch({ type: "RECIPIENT_SELECTED", contact }),
    addingContact,
    setAddingContact,
    contactCreated: (contact: Contact) => {
      setContacts((prev) => [...prev, contact]);
      dispatch({ type: "RECIPIENT_SELECTED", contact });
      setAddingContact(false);
      const amountReady = draft !== null && validateAmount(parseAmount(draft.amountInput), balance).length === 0;
      goTo(amountReady ? "review" : "amount");
    },
    next: () => {
      if (!currentStep) return;
      if (violations.length > 0) {
        setShowErrors(true);
        return;
      }
      const nextStep = TRANSFER_STEPS[TRANSFER_STEPS.indexOf(currentStep) + 1];
      if (nextStep) goTo(nextStep);
    },
    back: () => {
      if (!currentStep) return;
      const previous = TRANSFER_STEPS[TRANSFER_STEPS.indexOf(currentStep) - 1];
      if (previous) goTo(previous);
    },
    goTo,
    confirm: () => {
      if (currentStep !== "review" || violations.length > 0) return;
      void send(crypto.randomUUID(), "SUBMITTED");
    },
    retry: () => {
      if (state.status === "failed") void send(state.idempotencyKey, "RETRIED");
    },
    edit: (step: TransferStep) => dispatch({ type: "EDIT_REQUESTED", step }),
    reset: () => {
      setShowErrors(false);
      dispatch({ type: "RESET" });
    },
  };
}

export type TransferFlow = ReturnType<typeof useTransferFlow>;
