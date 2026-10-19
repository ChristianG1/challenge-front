import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "@/server/session";
import { logout } from "@/server/services/auth.service";

export async function POST() {
  const token = await getSessionToken();
  if (token) logout(token);
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
