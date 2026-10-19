import { beforeEach, describe, expect, it } from "vitest";
import { toCents } from "@/domain/money";
import { getDb, resetDb } from "../mock-db";
import { decodeCursor, encodeCursor, InvalidCursorError, listMovements } from "./account.service";

const USER = "usr_demo";

async function readAll(direction?: "incoming" | "outgoing") {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await listMovements(USER, { cursor, limit: 7, direction });
    ids.push(...page.movements.map((m) => m.id));
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return ids;
}

describe("listMovements (cursor pagination)", () => {
  beforeEach(() => {
    resetDb();
  });

  it("walks every movement exactly once, newest first", async () => {
    const all = getDb().users.get(USER)!.movements;
    const ids = await readAll();

    expect(ids).toHaveLength(all.length);
    expect(new Set(ids).size).toBe(all.length);
    const dates = ids.map((id) => all.find((m) => m.id === id)!.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("returns a null cursor on the last page", async () => {
    const page = await listMovements(USER, { limit: 1000 });
    expect(page.nextCursor).toBeNull();
  });

  it("filters by direction on the server", async () => {
    const ids = await readAll("incoming");
    const movements = getDb().users.get(USER)!.movements;
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => movements.find((m) => m.id === id)!.direction === "incoming")).toBe(true);
  });

  it("does not duplicate items when a new movement arrives between pages", async () => {
    const first = await listMovements(USER, { limit: 5 });
    getDb().users.get(USER)!.movements.unshift({
      id: "trx_new",
      direction: "outgoing",
      amount: toCents(100),
      counterparty: "Nuevo",
      concept: "Transferencia enviada",
      createdAt: new Date().toISOString(),
    });
    const second = await listMovements(USER, { limit: 5, cursor: first.nextCursor! });

    const firstIds = new Set(first.movements.map((m) => m.id));
    expect(second.movements.some((m) => firstIds.has(m.id) || m.id === "trx_new")).toBe(false);
  });

  it("rejects a malformed cursor", async () => {
    await expect(listMovements(USER, { cursor: "not-a-cursor" })).rejects.toBeInstanceOf(InvalidCursorError);
  });
});

describe("cursor encoding", () => {
  it("round-trips", () => {
    const position = { createdAt: "2026-10-01T10:00:00.000Z", id: "mov_1" };
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });
});
