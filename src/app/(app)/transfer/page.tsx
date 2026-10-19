import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferFlow } from "@/features/transfer/components/transfer-flow";
import { getAccountSummary } from "@/server/services/account.service";
import { listContacts } from "@/server/services/contacts.service";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Nueva transacción" };

const DOT_GRID = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

async function TransferLoader({ searchParams }: { searchParams: PageProps<"/transfer">["searchParams"] }) {
  const userId = await requireUserId();
  const [account, contacts, { to, new: startWith }] = await Promise.all([
    getAccountSummary(userId),
    listContacts(userId),
    searchParams,
  ]);
  const initialRecipientId = typeof to === "string" && contacts.some((c) => c.id === to) ? to : null;

  return (
    <TransferFlow
      key={userId}
      balance={account.balance}
      contacts={contacts}
      initialRecipientId={initialRecipientId}
      startWithNewContact={startWith === "contact"}
    />
  );
}

export default function TransferPage({ searchParams }: PageProps<"/transfer">) {
  return (
    <>
      <section className="bg-ink-900 text-white" style={DOT_GRID}>
        <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
          <Link href="/home" className="text-sm text-ink-400 transition-colors hover:text-white">
            ← Inicio
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nueva transacción</h1>
          <p className="mt-1 text-sm text-ink-400">Sin comisión. Llega en segundos.</p>
        </div>
      </section>

      <main className="mx-auto -mt-12 w-full max-w-xl flex-1 px-4 pb-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
          <TransferLoader searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
