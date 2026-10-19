import "server-only";
import {
  MOVEMENTS_PAGE_SIZE,
  type MovementDirection,
  type MovementsPage,
  type UserSummary,
} from "@/domain/contracts";
import { balanceTrend, summarizeMonth, type BalancePoint, type MonthSummary } from "@/domain/movements";
import { getDb, simulateLatency } from "../mock-db";

export class ServiceUnavailableError extends Error {
  constructor(message = "El servicio no está disponible") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class InvalidCursorError extends Error {
  constructor() {
    super("El cursor de paginación no es válido");
    this.name = "InvalidCursorError";
  }
}

function getUser(userId: string) {
  const user = getDb().users.get(userId);
  if (!user) throw new Error(`User ${userId} not found`);
  return user;
}

export async function getAccountSummary(userId: string): Promise<UserSummary> {
  await simulateLatency();
  const { id, name, balance } = getUser(userId);
  return { id, name, balance };
}

export interface UserProfile {
  name: string;
  handle: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { name, handles } = getUser(userId);
  return { name, handle: handles[0] ?? "" };
}

interface CursorPosition {
  createdAt: string;
  id: string;
}

export function encodeCursor({ createdAt, id }: CursorPosition): string {
  return Buffer.from(`${createdAt}|${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPosition {
  const [createdAt, id, ...rest] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  if (!createdAt || !id || rest.length > 0 || Number.isNaN(Date.parse(createdAt))) throw new InvalidCursorError();
  return { createdAt, id };
}

function compareDesc(a: CursorPosition, b: CursorPosition): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

export interface ListMovementsOptions {
  cursor?: string;
  limit?: number;
  direction?: MovementDirection;
  simulateFailure?: boolean;
}

export async function listMovements(
  userId: string,
  { cursor, limit = MOVEMENTS_PAGE_SIZE, direction, simulateFailure = false }: ListMovementsOptions = {},
): Promise<MovementsPage> {
  await simulateLatency();
  if (simulateFailure) throw new ServiceUnavailableError("No pudimos cargar tus movimientos");

  const after = cursor ? decodeCursor(cursor) : null;
  const matching = getUser(userId)
    .movements.filter((m) => !direction || m.direction === direction)
    .filter((m) => !after || compareDesc(after, m) < 0)
    .sort(compareDesc);

  const page = matching.slice(0, limit);
  const hasMore = matching.length > limit;
  return { movements: page, nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null };
}

export interface ActivityOverview {
  firstPage: MovementsPage;
  monthSummary: MonthSummary;
}

export async function getActivityOverview(
  userId: string,
  { simulateFailure = false }: Pick<ListMovementsOptions, "simulateFailure"> = {},
): Promise<ActivityOverview> {
  const firstPage = await listMovements(userId, { simulateFailure });
  return { firstPage, monthSummary: summarizeMonth(getUser(userId).movements, new Date()) };
}

export async function getBalanceTrend(userId: string): Promise<BalancePoint[]> {
  const user = getUser(userId);
  return balanceTrend(user.balance, user.movements, new Date());
}
