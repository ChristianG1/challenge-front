import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActivityPanel } from "@/features/home/activity-panel";
import { HomeHero } from "@/features/home/home-hero";
import { ActivitySkeleton, HeroSkeleton } from "@/features/home/home-skeleton";
import { isBalanceHidden } from "@/server/preferences";
import { getAccountSummary, getActivityOverview, getBalanceTrend } from "@/server/services/account.service";
import { listContacts } from "@/server/services/contacts.service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Inicio" };

const DOT_GRID = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

async function Hero() {
  const userId = await requireUserId();
  await connection();
  const [user, contacts, trend, balanceHidden] = await Promise.all([
    getAccountSummary(userId),
    listContacts(userId),
    getBalanceTrend(userId),
    isBalanceHidden(),
  ]);
  return <HomeHero user={user} favorites={contacts} trend={trend} balanceHidden={balanceHidden} />;
}

async function Activity({ searchParams }: { searchParams: PageProps<"/home">["searchParams"] }) {
  const userId = await requireUserId();
  await connection();

  const { simulate } = await searchParams;
  const { firstPage, monthSummary } = await getActivityOverview(userId, { simulateFailure: simulate === "error" });
  return (
    <ActivityPanel
      key={firstPage.movements[0]?.id ?? "empty"}
      firstPage={firstPage}
      monthSummary={monthSummary}
      now={new Date().toISOString()}
    />
  );
}

export default function HomePage({ searchParams }: PageProps<"/home">) {
  return (
    <>
      <section className="bg-ink-900 text-white" style={DOT_GRID}>
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 sm:px-6 sm:pt-10">
          <Suspense fallback={<HeroSkeleton />}>
            <Hero />
          </Suspense>
        </div>
      </section>

      <main className="mx-auto -mt-10 w-full max-w-3xl flex-1 px-4 pb-10 sm:px-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink-100 sm:p-6">
          <Suspense fallback={<ActivitySkeleton />}>
            <Activity searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
