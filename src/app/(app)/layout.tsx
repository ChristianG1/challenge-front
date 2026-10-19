import Link from "next/link";
import { Suspense } from "react";
import { BottomTabBar } from "@/features/navigation/bottom-tab-bar";
import { NavTabs } from "@/features/navigation/nav-tabs";
import { UserMenu } from "@/features/navigation/user-menu";
import { isBalanceHidden } from "@/server/preferences";
import { getUserProfile } from "@/server/services/account.service";
import { requireUserId } from "@/server/session";

async function loadAccount() {
  const userId = await requireUserId();
  const [profile, balanceHidden] = await Promise.all([getUserProfile(userId), isBalanceHidden()]);
  return { profile, balanceHidden };
}

async function HeaderAccount() {
  const { profile, balanceHidden } = await loadAccount();
  return (
    <div className="hidden md:block">
      <UserMenu profile={profile} balanceHiddenOnServer={balanceHidden} variant="header" />
    </div>
  );
}

async function MobileTabBar() {
  const { profile, balanceHidden } = await loadAccount();
  return <BottomTabBar profile={profile} balanceHiddenOnServer={balanceHidden} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <header className="bg-ink-900 text-white">
        <div className="mx-auto grid h-16 w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <Link href="/home" className="flex items-center gap-2 justify-self-start font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white text-sm text-ink-900">M</span>
            Mini Wallet
          </Link>
          <NavTabs />
          <div className="justify-self-end">
            <Suspense fallback={<div className="hidden h-10 w-16 animate-pulse rounded-full bg-white/10 md:block" />}>
              <HeaderAccount />
            </Suspense>
          </div>
        </div>
      </header>
      {children}
      <Suspense fallback={null}>
        <MobileTabBar />
      </Suspense>
    </div>
  );
}
