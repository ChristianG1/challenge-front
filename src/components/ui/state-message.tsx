import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "error" | "success" | "warning";

const TONES: Record<Tone, { ring: string; glyph: string }> = {
  neutral: { ring: "bg-ink-100 text-ink-600", glyph: "•" },
  error: { ring: "bg-red-100 text-red-600", glyph: "!" },
  success: { ring: "bg-lime-300 text-ink-900", glyph: "✓" },
  warning: { ring: "bg-amber-100 text-amber-700", glyph: "⏱" },
};

interface StateMessageProps {
  tone?: Tone;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function StateMessage({ tone = "neutral", title, description, actions, className }: StateMessageProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-8 text-center", className)} role={tone === "error" ? "alert" : "status"}>
      <span className={cn("flex size-12 items-center justify-center rounded-full text-xl font-bold", TONES[tone].ring)} aria-hidden="true">
        {TONES[tone].glyph}
      </span>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {description && <p className="max-w-sm text-sm text-ink-600">{description}</p>}
      {actions && <div className="mt-2 grid w-full max-w-sm gap-2 sm:flex sm:justify-center">{actions}</div>}
    </div>
  );
}
