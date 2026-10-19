"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowUpIcon, HomeIcon } from "./icons";
import { useIsActive } from "./nav-tabs";
import { UserMenu, type AccountProfile } from "./user-menu";

interface BottomTabBarProps {
  profile: AccountProfile;
  balanceHiddenOnServer: boolean;
}

export function BottomTabBar({ profile, balanceHiddenOnServer }: BottomTabBarProps) {
  const isActive = useIsActive();
  const homeActive = isActive("/home");
  const sendActive = isActive("/transfer");

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        <li>
          <Link
            href="/home"
            aria-current={homeActive ? "page" : undefined}
            className={cn("flex w-16 flex-col items-center gap-1 text-xs", homeActive ? "text-ink-900" : "text-ink-500")}
          >
            <HomeIcon className="size-6" />
            Inicio
          </Link>
        </li>
        <li>
          <Link
            href="/transfer"
            aria-current={sendActive ? "page" : undefined}
            className="flex w-16 flex-col items-center gap-1 text-xs font-medium text-ink-900"
          >
            <span
              className={cn(
                "-mt-7 flex size-12 items-center justify-center rounded-full bg-lime-300 shadow-lg ring-4 ring-white transition-transform",
                sendActive && "scale-105",
              )}
            >
              <ArrowUpIcon className="size-6" />
            </span>
            Enviar
          </Link>
        </li>
        <li>
          <UserMenu profile={profile} balanceHiddenOnServer={balanceHiddenOnServer} variant="tabbar" />
        </li>
      </ul>
    </nav>
  );
}
