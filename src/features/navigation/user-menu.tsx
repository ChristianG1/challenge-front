"use client";

import { useEffect, useId, useRef, useState } from "react";
import { logoutAction } from "@/app/(app)/actions";
import { setBalanceHidden, useBalanceHidden } from "@/features/home/use-balance-hidden";
import { formatHandle } from "@/domain/identifier";
import { cn } from "@/lib/cn";
import { ChevronDownIcon, EyeIcon, LogoutIcon, UserIcon } from "./icons";

export interface AccountProfile {
  name: string;
  handle: string;
}

interface UserMenuProps {
  profile: AccountProfile;
  balanceHiddenOnServer: boolean;
  variant: "header" | "tabbar";
}

const itemClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:outline-none";

export function UserMenu({ profile, balanceHiddenOnServer, variant }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const hidden = useBalanceHidden(balanceHiddenOnServer);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const initials = profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Menú de cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "cursor-pointer transition-colors",
          variant === "header"
            ? "flex items-center gap-1.5 rounded-full bg-white/10 py-1 pr-2.5 pl-1 text-ink-400 hover:text-white"
            : cn("flex w-16 flex-col items-center gap-1 text-xs", open ? "text-ink-900" : "text-ink-500"),
        )}
      >
        {variant === "header" ? (
          <>
            <span className="flex size-8 items-center justify-center rounded-full bg-lime-300 text-xs font-semibold text-ink-900">
              {initials}
            </span>
            <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
          </>
        ) : (
          <>
            <UserIcon className="size-6" />
            Cuenta
          </>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Cuenta"
          className={cn(
            "absolute right-0 z-50 w-64 animate-rise rounded-2xl bg-white p-2 text-ink-900 shadow-xl ring-1 ring-ink-100",
            variant === "header" ? "top-full mt-2" : "bottom-full mb-3",
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{profile.name}</p>
            <p className="truncate text-sm text-ink-500">{formatHandle(profile.handle)}</p>
          </div>
          <div className="my-1 border-t border-ink-100" />
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setBalanceHidden(!hidden);
              setOpen(false);
            }}
          >
            <EyeIcon off={!hidden} className="size-5 text-ink-500" />
            {hidden ? "Mostrar saldo" : "Ocultar saldo"}
          </button>
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className={cn(itemClass, "text-red-600 hover:bg-red-50 focus-visible:bg-red-50")}>
              <LogoutIcon className="size-5" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
