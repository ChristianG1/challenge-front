import "server-only";
import { cookies } from "next/headers";
import { HIDE_BALANCE_COOKIE } from "@/features/home/balance-preference";

export async function isBalanceHidden(): Promise<boolean> {
  return (await cookies()).get(HIDE_BALANCE_COOKIE)?.value === "1";
}
