import { cn } from "@/lib/cn";
import { TRANSFER_STEPS, type TransferStep } from "../transfer-machine";

const LABELS: Record<TransferStep, string> = { amount: "Monto", recipient: "Destinatario", review: "Confirmar" };

export function Stepper({ current }: { current: TransferStep }) {
  const currentIndex = TRANSFER_STEPS.indexOf(current);
  return (
    <ol className="flex gap-2" aria-label="Pasos de la transferencia">
      {TRANSFER_STEPS.map((step, index) => (
        <li key={step} className="flex-1" aria-current={step === current ? "step" : undefined}>
          <div className={cn("h-1.5 rounded-full", index <= currentIndex ? "bg-ink-900" : "bg-ink-100")} />
          <span className={cn("mt-1.5 block text-xs", index === currentIndex ? "font-semibold text-ink-900" : "text-ink-500")}>
            {LABELS[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}
