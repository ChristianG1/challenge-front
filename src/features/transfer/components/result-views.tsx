"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";
import type { TransferReceipt } from "@/domain/contracts";
import { formatHandle } from "@/domain/identifier";
import { formatMoney, LOCALE, toCents } from "@/domain/money";
import { describeFailure, type TransferFailure } from "../transfer-failure";

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeStyle: "short" });

export function SuccessReceipt({ receipt, onNewTransfer }: { receipt: TransferReceipt; onNewTransfer: () => void }) {
  return (
    <div className="flex flex-col gap-6" data-testid="receipt">
      <div className="flex flex-col items-center gap-2 pt-2 text-center" role="status">
        <span className="flex size-14 animate-rise items-center justify-center rounded-full bg-lime-300 text-2xl font-bold text-ink-900" aria-hidden="true">
          ✓
        </span>
        <h2 className="mt-2 text-lg font-semibold">¡Transferencia enviada!</h2>
        <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums">{formatMoney(receipt.amount)}</p>
        <p className="text-sm text-ink-600">
          a <strong className="font-semibold text-ink-900">{receipt.recipient.name}</strong>
        </p>
      </div>

      <dl className="divide-y divide-ink-100 rounded-2xl bg-ink-50 px-4 text-sm">
        {[
          ["Folio", receipt.reference],
          ["Fecha", dateTimeFormatter.format(new Date(receipt.createdAt))],
          ["Cuenta", formatHandle(receipt.recipient.handle)],
          ["Comisión", formatMoney(toCents(0))],
          ["Saldo actual", formatMoney(receipt.balanceAfter)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3">
            <dt className="text-ink-500">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/home" className="flex-1">
          Volver al inicio
        </ButtonLink>
        <Button variant="secondary" onClick={onNewTransfer} className="flex-1">
          Nueva transferencia
        </Button>
      </div>
    </div>
  );
}

interface FailureViewProps {
  failure: TransferFailure;
  onRetry: () => void;
  onEditAmount: () => void;
}

export function FailureView({ failure, onRetry, onEditAmount }: FailureViewProps) {
  const copy = describeFailure(failure);
  const tone = failure.kind === "timeout" ? "warning" : "error";

  const actions = (() => {
    switch (failure.kind) {
      case "network":
      case "timeout":
      case "unknown":
        return (
          <>
            <ButtonLink href="/home" variant="secondary" className="flex-1">
              Volver al inicio
            </ButtonLink>
            <Button onClick={onRetry} className="flex-1">
              Reintentar
            </Button>
          </>
        );
      case "insufficient_funds":
      case "rejected":
        return (
          <Button onClick={onEditAmount} className="flex-1">
            Cambiar monto
          </Button>
        );
      case "session_expired":
        return (
          <ButtonLink href="/login" className="flex-1">
            Iniciar sesión
          </ButtonLink>
        );
    }
  })();

  return <StateMessage tone={tone} title={copy.title} description={copy.description} actions={actions} />;
}
