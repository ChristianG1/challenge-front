import "server-only";
import { parseIdentifier } from "@/domain/identifier";
import { err, ok, type Result } from "@/domain/result";
import { getDb, simulateLatency } from "../mock-db";

export type LoginError = "INVALID_CREDENTIALS" | "SERVICE_UNAVAILABLE";

export const LOGIN_ERROR_IDENTIFIER = "error@spin.mx";

export async function login(
  rawIdentifier: string,
): Promise<Result<{ token: string; user: { id: string; name: string } }, LoginError>> {
  await simulateLatency();
  const identifier = parseIdentifier(rawIdentifier);
  if (!identifier) return err("INVALID_CREDENTIALS");
  if (identifier.value === LOGIN_ERROR_IDENTIFIER) return err("SERVICE_UNAVAILABLE");

  const db = getDb();
  const user = [...db.users.values()].find((u) => u.handles.includes(identifier.value));
  if (!user) return err("INVALID_CREDENTIALS");

  const token = crypto.randomUUID();
  db.sessions.set(token, user.id);
  return ok({ token, user: { id: user.id, name: user.name } });
}

export function logout(token: string): void {
  getDb().sessions.delete(token);
}

export function resolveSession(token: string | undefined): string | null {
  if (!token) return null;
  return getDb().sessions.get(token) ?? null;
}
