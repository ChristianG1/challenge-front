"use client";

import { Button } from "@/components/ui/button";
import { formatHandle } from "@/domain/identifier";
import { formatMoney, parseAmount, subtractCents, toCents } from "@/domain/money";
import { describeViolation } from "@/domain/transfer-rules";
import type { TransferFlow } from "../use-transfer-flow";
import { DemoScenarioPicker } from "./demo-scenario-picker";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function ReviewStep({ flow }: { flow: TransferFlow }) {
  if (flow.state.status !== "editing") return null;
  const { draft } = flow.state;
  const amount = parseAmount(draft.amountInput) ?? toCents(0);

  return (
    <div className="flex flex-col gap-5" data-testid="transfer-summary">
      <div className="flex flex-col items-center gap-1 py-2 text-center">
        <h2 className="text-sm text-ink-500">Vas a enviar</h2>
        <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums">{formatMoney(amount)}</p>
        {draft.recipient && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-600">
            <span className="flex size-7 items-center justify-center rounded-full bg-lime-300 text-xs font-semibold text-ink-900" aria-hidden="true">
              {draft.recipient.name[0]}
            </span>
            a <strong className="font-semibold text-ink-900">{draft.recipient.name}</strong>
          </p>
        )}
      </div>

      <dl className="divide-y divide-ink-100 border-y border-ink-100">
        <Row label="Cuenta" value={draft.recipient ? formatHandle(draft.recipient.handle) : "—"} />
        <Row label="Comisión" value={formatMoney(toCents(0))} />
        <Row label="Saldo después" value={formatMoney(subtractCents(flow.balance, amount))} />
      </dl>

      {flow.violations.length > 0 && (
        <ul role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {flow.violations.map((v) => (
            <li key={v.code}>{describeViolation(v)}</li>
          ))}
        </ul>
      )}

      <DemoScenarioPicker value={flow.scenario} onChange={flow.setScenario} />

      <div className="flex gap-2">
        <Button variant="secondary" onClick={flow.back} className="flex-1">
          Atrás
        </Button>
        <Button onClick={flow.confirm} disabled={flow.violations.length > 0} className="flex-[2]">
          Confirmar envío
        </Button>
      </div>
    </div>
  );
}
