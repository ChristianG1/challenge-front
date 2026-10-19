"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, getSessionToken } from "@/server/session";
import { logout } from "@/server/services/auth.service";

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) logout(token);
  await clearSessionCookie();
  redirect("/login");
}
