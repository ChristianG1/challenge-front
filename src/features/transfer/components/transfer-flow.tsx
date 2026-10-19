"use client";

import type { Contact } from "@/domain/contracts";
import type { Cents } from "@/domain/money";
import { useTransferFlow } from "../use-transfer-flow";
import { AmountStep } from "./amount-step";
import { DemoScenarioPicker } from "./demo-scenario-picker";
import { RecipientStep } from "./recipient-step";
import { FailureView, SuccessReceipt } from "./result-views";
import { ReviewStep } from "./review-step";
import { Stepper } from "./stepper";
import { SubmittingView } from "./submitting-view";

interface TransferFlowProps {
  balance: Cents;
  contacts: Contact[];
  initialRecipientId?: string | null;
  startWithNewContact?: boolean;
}

export function TransferFlow({ balance, contacts, initialRecipientId = null, startWithNewContact = false }: TransferFlowProps) {
  const flow = useTransferFlow({ balance, initialContacts: contacts, initialRecipientId, startWithNewContact });
  const { state } = flow;

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink-100 sm:p-6">
      {state.status === "editing" && (
        <>
          <Stepper current={state.step} />
          {state.step === "amount" && <AmountStep flow={flow} />}
          {state.step === "recipient" && <RecipientStep flow={flow} />}
          {state.step === "review" && <ReviewStep flow={flow} />}
        </>
      )}
      {state.status === "submitting" && <SubmittingView />}
      {state.status === "failed" && (
        <>
          <FailureView failure={state.failure} onRetry={flow.retry} onEditAmount={() => flow.edit("amount")} />
          {state.failure.retryable && <DemoScenarioPicker value={flow.scenario} onChange={flow.setScenario} />}
        </>
      )}
      {state.status === "succeeded" && <SuccessReceipt receipt={state.receipt} onNewTransfer={flow.reset} />}
    </div>
  );
}
