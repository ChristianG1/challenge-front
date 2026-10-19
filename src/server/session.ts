import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSession } from "./services/auth.service";

export const SESSION_COOKIE = "mw_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function getSessionUserId(): Promise<string | null> {
  return resolveSession(await getSessionToken());
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  return userId;
}
