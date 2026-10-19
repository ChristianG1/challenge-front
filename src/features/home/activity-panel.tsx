"use client";

import { StateMessage } from "@/components/ui/state-message";
import type { Movement, MovementsPage } from "@/domain/contracts";
import { formatMoney, LOCALE } from "@/domain/money";
import { BUSINESS_TIME_ZONE, groupMovementsByDay, type MonthSummary } from "@/domain/movements";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovementsFeed, type MovementFilter } from "./use-movements-feed";

const FILTERS: { value: MovementFilter; label: string; empty: string }[] = [
  { value: "all", label: "Todos", empty: "" },
  { value: "incoming", label: "Entradas", empty: "No tienes entradas recientes." },
  { value: "outgoing", label: "Salidas", empty: "No tienes salidas recientes." },
];

const timeFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: BUSINESS_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: BUSINESS_TIME_ZONE, month: "long" });

function MovementRow({ movement }: { movement: Movement }) {
  const incoming = movement.direction === "incoming";
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          incoming ? "bg-lime-200 text-ink-900" : "bg-ink-100 text-ink-600",
        )}
        aria-hidden="true"
      >
        {movement.counterparty[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{movement.counterparty}</p>
        <p className="truncate text-sm text-ink-500">
          {movement.concept} · <time dateTime={movement.createdAt}>{timeFormatter.format(new Date(movement.createdAt))}</time>
        </p>
      </div>
      <p className={cn("font-semibold tabular-nums", incoming ? "text-emerald-600" : "text-ink-900")}>
        <span className="sr-only">{incoming ? "Recibido" : "Enviado"}: </span>
        {incoming ? "+" : "−"}
        {formatMoney(movement.amount)}
      </p>
    </li>
  );
}

interface ActivityPanelProps {
  firstPage: MovementsPage;
  monthSummary: MonthSummary;
  now: string;
}

export function ActivityPanel({ firstPage, monthSummary, now }: ActivityPanelProps) {
  const feed = useMovementsFeed(firstPage);
  const nowDate = new Date(now);
  const days = groupMovementsByDay(feed.movements, nowDate);
  const month = monthFormatter.format(nowDate);

  if (firstPage.movements.length === 0) {
    return (
      <StateMessage
        title="Aún no tienes movimientos"
        description="Cuando envíes o recibas dinero, aparecerá aquí."
        actions={<ButtonLink href="/transfer">Enviar dinero</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-3" aria-label={`Resumen de ${month}`}>
        <div className="rounded-2xl bg-ink-50 p-4">
          <dt className="text-sm text-ink-500">Entró en {month}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-emerald-600">+{formatMoney(monthSummary.incoming)}</dd>
        </div>
        <div className="rounded-2xl bg-ink-50 p-4">
          <dt className="text-sm text-ink-500">Salió en {month}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">−{formatMoney(monthSummary.outgoing)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Movimientos</h2>
        <div className="flex gap-1.5" role="group" aria-label="Filtrar movimientos">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={feed.filter === f.value}
              onClick={() => feed.selectFilter(f.value)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors",
                feed.filter === f.value ? "bg-ink-900 text-white" : "text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {feed.initialLoading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando movimientos">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : days.length === 0 && feed.status !== "error" ? (
        <p className="py-6 text-center text-sm text-ink-500">{FILTERS.find((f) => f.value === feed.filter)?.empty}</p>
      ) : (
        <div className="flex flex-col gap-4" data-testid="movement-list">
          {days.map((day) => (
            <section key={day.key} aria-label={day.label}>
              <h3 className="text-sm font-medium text-ink-500">{day.label}</h3>
              <ul className="divide-y divide-ink-100">
                {day.movements.map((m) => (
                  <MovementRow key={m.id} movement={m} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2" aria-live="polite">
        {feed.status === "error" ? (
          <>
            <p className="text-sm text-red-600">No pudimos cargar más movimientos.</p>
            <Button variant="secondary" onClick={feed.retry}>
              Reintentar
            </Button>
          </>
        ) : feed.hasMore ? (
          <Button variant="secondary" onClick={feed.loadMore} loading={feed.status === "loading" && !feed.initialLoading}>
            Ver más movimientos
          </Button>
        ) : (
          !feed.initialLoading && days.length > 0 && <p className="text-sm text-ink-400">Ya viste todos tus movimientos</p>
        )}
      </div>
    </div>
  );
}
