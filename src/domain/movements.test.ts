import { describe, expect, it } from "vitest";
import type { Movement } from "./contracts";
import { toCents } from "./money";
import { balanceTrend, groupMovementsByDay, summarizeMonth } from "./movements";

const movement = (id: string, createdAt: string, direction: Movement["direction"], amount: number): Movement => ({
  id,
  createdAt,
  direction,
  amount: toCents(amount),
  counterparty: id,
  concept: "x",
});

const now = new Date("2026-10-15T18:00:00Z");

describe("groupMovementsByDay", () => {
  it("groups by business-timezone day, newest first, with relative labels", () => {
    const days = groupMovementsByDay(
      [
        movement("old", "2026-10-10T18:00:00Z", "outgoing", 100),
        movement("today-1", "2026-10-15T15:00:00Z", "incoming", 100),
        movement("yesterday", "2026-10-14T20:00:00Z", "outgoing", 100),
        movement("today-2", "2026-10-15T17:00:00Z", "outgoing", 100),
      ],
      now,
    );

    expect(days.map((d) => d.label)).toEqual(["Hoy", "Ayer", "Sábado, 10 de octubre"]);
    expect(days[0].movements.map((m) => m.id)).toEqual(["today-2", "today-1"]);
  });

  it("uses Mexico City time, not UTC, to decide the day", () => {
    const [day] = groupMovementsByDay([movement("late", "2026-10-15T02:00:00Z", "incoming", 1)], now);
    expect(day.label).toBe("Ayer");
  });

  it("returns no groups for no movements", () => {
    expect(groupMovementsByDay([], now)).toEqual([]);
  });
});

describe("summarizeMonth", () => {
  it("sums incoming and outgoing for the current month only", () => {
    const summary = summarizeMonth(
      [
        movement("a", "2026-10-02T18:00:00Z", "incoming", 1_500_000),
        movement("b", "2026-10-14T18:00:00Z", "outgoing", 45_000),
        movement("c", "2026-10-15T18:00:00Z", "outgoing", 5_000),
        movement("prev", "2026-09-30T18:00:00Z", "incoming", 999_999),
      ],
      now,
    );
    expect(summary).toEqual({ incoming: 1_500_000, outgoing: 50_000 });
  });
});

describe("balanceTrend", () => {
  it("walks back from the current balance undoing later movements", () => {
    const points = balanceTrend(
      toCents(10_000),
      [
        movement("in-today", "2026-10-15T15:00:00Z", "incoming", 3_000),
        movement("out-2d", "2026-10-13T18:00:00Z", "outgoing", 1_000),
      ],
      now,
      3,
    );

    expect(points.map((p) => p.day)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"]);
    expect(points.map((p) => p.balance)).toEqual([8_000, 7_000, 7_000, 10_000]);
  });
});
