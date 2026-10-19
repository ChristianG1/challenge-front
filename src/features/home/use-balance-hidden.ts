"use client";

import { useSyncExternalStore } from "react";
import { HIDE_BALANCE_COOKIE } from "./balance-preference";

const ONE_YEAR = 60 * 60 * 24 * 365;
const CHANGE_EVENT = "mw:balance-visibility";

function readCookie(): boolean {
  return document.cookie.split("; ").includes(`${HIDE_BALANCE_COOKIE}=1`);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function setBalanceHidden(hidden: boolean) {
  document.cookie = `${HIDE_BALANCE_COOKIE}=${hidden ? "1" : "0"}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useBalanceHidden(serverValue: boolean): boolean {
  return useSyncExternalStore(subscribe, readCookie, () => serverValue);
}
