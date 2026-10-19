import Link from "next/link";
import type { Contact, UserSummary } from "@/domain/contracts";
import { formatHandle } from "@/domain/identifier";
import { toCents } from "@/domain/money";
import type { BalancePoint } from "@/domain/movements";
import { BalanceDisplay } from "./balance-display";
import { BalanceTrendChart } from "./balance-trend-chart";

const MAX_FAVORITES = 4;

interface HomeHeroProps {
  user: UserSummary;
  favorites: Contact[];
  trend: BalancePoint[];
  balanceHidden: boolean;
}

export function HomeHero({ user, favorites, trend, balanceHidden }: HomeHeroProps) {
  const firstName = user.name.split(" ")[0];
  const shown = favorites.filter((c) => c.favorite).slice(0, MAX_FAVORITES);
  const delta = toCents(user.balance - (trend[0]?.balance ?? user.balance));

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hola, <span className="text-lime-300">{firstName}</span>
        </h1>
        <BalanceDisplay amount={user.balance} delta={delta} initiallyHidden={balanceHidden} />
        <BalanceTrendChart points={trend} />
        <Link
          href="/transfer"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
        >
          <span aria-hidden="true">↑</span> Enviar dinero
        </Link>
      </div>

      <nav aria-label="Envío rápido" className="border-t border-white/10 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
        <h2 className="mb-3 text-sm text-ink-400">Envío rápido</h2>
        <ul className="flex flex-col gap-1">
          {shown.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/transfer?to=${contact.id}`}
                aria-label={`Enviar dinero a ${contact.name}`}
                className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition-colors group-hover:bg-lime-300 group-hover:text-ink-900">
                  {contact.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{contact.name}</span>
                  <span className="block truncate text-xs text-ink-400">{formatHandle(contact.handle)}</span>
                </span>
                <span className="text-ink-400 transition-colors group-hover:text-white" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/transfer?new=contact"
              className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-dashed border-white/25" aria-hidden="true">
                +
              </span>
              {shown.length === 0 ? "Agrega tu primer contacto" : "Nuevo contacto"}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
