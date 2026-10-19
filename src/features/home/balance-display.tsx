"use client";

import { formatMoney, toCents, type Cents } from "@/domain/money";
import { setBalanceHidden, useBalanceHidden } from "./use-balance-hidden";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="M4 4l16 16" />}
    </svg>
  );
}

interface BalanceDisplayProps {
  amount: Cents;
  delta: Cents;
  initiallyHidden: boolean;
}

export function BalanceDisplay({ amount, delta, initiallyHidden }: BalanceDisplayProps) {
  const hidden = useBalanceHidden(initiallyHidden);
  const toggle = () => setBalanceHidden(!hidden);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <h2>Saldo disponible</h2>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={hidden}
          aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
          className="cursor-pointer rounded-full p-1 text-ink-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <EyeIcon hidden={hidden} />
        </button>
      </div>
      <p className="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl" data-testid="balance">
        {hidden ? (
          <>
            <span aria-hidden="true">$ ••••••</span>
            <span className="sr-only">Saldo oculto</span>
          </>
        ) : (
          formatMoney(amount)
        )}
      </p>
      <p className={delta >= 0 ? "mt-1 text-sm text-lime-300" : "mt-1 text-sm text-ink-400"}>
        {hidden ? "••••" : `${delta >= 0 ? "+" : "−"}${formatMoney(toCents(Math.abs(delta)))}`}
        <span className="text-ink-400"> vs. hace 30 días</span>
      </p>
    </div>
  );
}
