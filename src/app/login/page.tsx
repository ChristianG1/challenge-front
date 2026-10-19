import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandPanel } from "@/features/auth/brand-panel";
import { LoginForm } from "@/features/auth/login-form";
import { getSessionUserId } from "@/server/session";

export const metadata: Metadata = { title: "Iniciar sesión" };

async function RedirectIfAuthenticated() {
  if (await getSessionUserId()) redirect("/home");
  return null;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-1 bg-white lg:h-dvh lg:p-4">
      <Suspense fallback={null}>
        <RedirectIfAuthenticated />
      </Suspense>

      <main className="flex flex-1 flex-col px-6 py-8 sm:px-12 lg:basis-1/2 lg:overflow-y-auto">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ink-900 text-sm text-white">M</span>
          Mini Wallet
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 py-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="text-ink-600">Ingresa con tu email o número de teléfono.</p>
          </header>

          <LoginForm />

          <aside className="rounded-xl border border-dashed border-ink-200 p-4 text-xs text-ink-600">
            <p className="mb-1 font-semibold text-ink-700">Cuentas demo</p>
            <ul className="space-y-0.5">
              <li><code>demo@spin.mx</code> o <code>5512345678</code>: con movimientos</li>
              <li><code>nuevo@spin.mx</code>: cuenta sin movimientos</li>
              <li><code>error@spin.mx</code>: simula un error del servidor</li>
            </ul>
          </aside>
        </div>
      </main>

      <BrandPanel />
    </div>
  );
}
