import type { Movement } from "./contracts";
import { toCents, type Cents } from "./money";

export const BUSINESS_TIME_ZONE = "America/Mexico_City";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayLabelFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function dayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function dayLabel(key: string, now: Date): string {
  if (key === dayKey(now)) return "Hoy";
  if (key === dayKey(shiftDays(now, -1))) return "Ayer";
  const label = dayLabelFormatter.format(new Date(`${key}T18:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface MovementDay {
  key: string;
  label: string;
  movements: Movement[];
}

export function groupMovementsByDay(movements: Movement[], now: Date): MovementDay[] {
  const sorted = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const days: MovementDay[] = [];
  for (const movement of sorted) {
    const key = dayKey(new Date(movement.createdAt));
    const current = days.at(-1);
    if (current?.key === key) current.movements.push(movement);
    else days.push({ key, label: dayLabel(key, now), movements: [movement] });
  }
  return days;
}

export interface MonthSummary {
  incoming: Cents;
  outgoing: Cents;
}

export function summarizeMonth(movements: Movement[], now: Date): MonthSummary {
  const month = dayKey(now).slice(0, 7);
  let incoming = 0;
  let outgoing = 0;
  for (const m of movements) {
    if (dayKey(new Date(m.createdAt)).slice(0, 7) !== month) continue;
    if (m.direction === "incoming") incoming += m.amount;
    else outgoing += m.amount;
  }
  return { incoming: toCents(incoming), outgoing: toCents(outgoing) };
}

export interface BalancePoint {
  day: string;
  balance: Cents;
}

export function balanceTrend(currentBalance: Cents, movements: Movement[], now: Date, days = 30): BalancePoint[] {
  const signed = (m: Movement) => (m.direction === "incoming" ? m.amount : -m.amount);
  const points: BalancePoint[] = [];

  for (let offset = 0; offset <= days; offset++) {
    const day = dayKey(shiftDays(now, -offset));
    const after = movements.filter((m) => dayKey(new Date(m.createdAt)) > day).reduce((sum, m) => sum + signed(m), 0);
    points.push({ day, balance: toCents(currentBalance - after) });
  }
  return points.reverse();
}
