"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { formatMoney, toCents } from "@/domain/money";
import { cn } from "@/lib/cn";

interface DemoEvent {
  name: string;
  concept: string;
  amount: number;
}

const EVENTS: DemoEvent[] = [
  { name: "Mariana López", concept: "Regalo", amount: 30_000 },
  { name: "Carlos Ruiz", concept: "Cena del viernes", amount: -45_000 },
  { name: "Nómina ACME", concept: "Depósito de nómina", amount: 1_500_000 },
  { name: "Renta depa", concept: "Pago mensual", amount: -1_485_000 },
];
const BASE_BALANCE = 1_254_050;
const STEP_MS = 3_000;
const VISIBLE_ROWS = 3;

const eventAt = (index: number) => EVENTS[((index % EVENTS.length) + EVENTS.length) % EVENTS.length];

function balanceAt(tick: number) {
  let total = BASE_BALANCE;
  for (let i = 0; i <= tick % EVENTS.length; i++) total += EVENTS[i].amount;
  return total;
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}

export function LiveWalletDemo() {
  const [tick, setTick] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const balance = useCountUp(balanceAt(tick));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => clearInterval(id);
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 10, y: px * 14 });
  }

  const latest = eventAt(tick);
  const incoming = latest.amount > 0;
  const rows = Array.from({ length: VISIBLE_ROWS + 1 }, (_, i) => ({ key: tick - i, event: eventAt(tick - i) }));

  const cardStyle: CSSProperties = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
  };

  return (
    <div
      className="relative flex w-full max-w-sm flex-col items-center"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="pointer-events-none absolute inset-x-6 bottom-full z-10 mb-6">
        <div
          key={tick}
          className="flex animate-toast items-center gap-3 rounded-2xl bg-ink-700 px-4 py-2.5 text-sm text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-base",
              incoming ? "bg-lime-300 text-ink-900" : "bg-white/15 text-white",
            )}
          >
            {incoming ? "↓" : "↑"}
          </span>
          <span className="truncate leading-tight">
            {incoming ? "Recibiste " : "Enviaste "}
            <strong className="tabular-nums">{formatMoney(toCents(Math.abs(latest.amount)))}</strong>
            {incoming ? " de " : " a "}
            {latest.name}
          </span>
        </div>
      </div>

      <div className="w-full animate-float">
        <div
          style={cardStyle}
          className="w-full rounded-[28px] bg-white p-5 pt-6 text-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out will-change-transform"
        >
          <div className="flex items-center justify-between text-sm text-ink-500">
            <span>Saldo disponible</span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              En vivo
            </span>
          </div>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(toCents(balance))}</p>

          <div className="mt-4 h-42 overflow-hidden border-t border-ink-100">
            <ul key={tick} className={cn(tick > 0 && "animate-list-in")}>
            {rows.map(({ key, event }) => (
              <li key={key} className="flex h-14 items-center gap-3 border-b border-ink-100">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                    event.amount > 0 ? "bg-lime-200 text-ink-900" : "bg-ink-100 text-ink-600",
                  )}
                >
                  {event.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{event.name}</span>
                  <span className="block truncate text-xs text-ink-500">{event.concept}</span>
                </span>
                <span className={cn("text-sm font-semibold tabular-nums", event.amount > 0 && "text-emerald-600")}>
                  {event.amount > 0 ? "+" : "−"}
                  {formatMoney(toCents(Math.abs(event.amount)))}
                </span>
              </li>
            ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
