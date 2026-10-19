"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { HomeIcon, SendIcon } from "./icons";

export const NAV_ITEMS = [
  { href: "/home", label: "Inicio", Icon: HomeIcon },
  { href: "/transfer", label: "Enviar", Icon: SendIcon },
] as const;

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function NavTabs() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <ul className="flex gap-1 rounded-full bg-white/10 p-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-white text-ink-900" : "text-ink-400 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
