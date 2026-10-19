"use client";

import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, toCents } from "@/domain/money";
import { describeViolation } from "@/domain/transfer-rules";
import { cn } from "@/lib/cn";
import type { TransferFlow } from "../use-transfer-flow";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export function AmountStep({ flow }: { flow: TransferFlow }) {
  const id = useId();
  if (flow.state.status !== "editing") return null;

  const { draft } = flow.state;
  const error = flow.showErrors && flow.violations[0] ? describeViolation(flow.violations[0]) : null;
  const messageId = `${id}-message`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    flow.next();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {draft.recipient && (
        <p className="flex items-center justify-center gap-2 text-sm text-ink-600">
          <span className="flex size-7 items-center justify-center rounded-full bg-lime-300 text-xs font-semibold text-ink-900" aria-hidden="true">
            {draft.recipient.name[0]}
          </span>
          Para <strong className="font-semibold text-ink-900">{draft.recipient.name}</strong>
        </p>
      )}

      <div className="flex flex-col items-center gap-2 py-2">
        <label htmlFor={id} className="text-sm text-ink-500">
          ¿Cuánto quieres enviar?
        </label>
        <div className="flex w-full items-baseline justify-center">
          <span className={cn("font-mono text-3xl", draft.amountInput ? "text-ink-900" : "text-ink-400")} aria-hidden="true">
            $
          </span>
          <input
            id={id}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            placeholder="0.00"
            value={draft.amountInput}
            onChange={(e) => flow.setAmount(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            style={{ width: `${Math.max(draft.amountInput.length, 4) + 0.5}ch` }}
            className="max-w-full min-w-0 bg-transparent text-center font-mono text-5xl font-semibold tracking-tight text-ink-900 tabular-nums outline-none placeholder:text-ink-400"
          />
        </div>
        <p id={messageId} role={error ? "alert" : undefined} className={cn("text-sm", error ? "text-red-600" : "text-ink-500")}>
          {error ?? `Saldo disponible: ${formatMoney(flow.balance)}`}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Montos rápidos">
        {QUICK_AMOUNTS.map((pesos) => (
          <button
            key={pesos}
            type="button"
            onClick={() => flow.setAmount(String(pesos))}
            aria-pressed={draft.amountInput === String(pesos)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              draft.amountInput === String(pesos)
                ? "bg-ink-900 text-white"
                : "text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50",
            )}
          >
            {formatMoney(toCents(pesos * 100)).replace(".00", "")}
          </button>
        ))}
      </div>

      <Button type="submit" fullWidth>
        Continuar
      </Button>
    </form>
  );
}
