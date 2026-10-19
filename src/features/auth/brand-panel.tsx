import { LiveWalletDemo } from "./live-wallet-demo";

export function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden basis-1/2 flex-col gap-6 overflow-hidden rounded-[32px] bg-ink-900 p-10 text-white lg:flex"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="max-w-md animate-rise">
        <p className="text-sm font-medium text-lime-300">Mini Wallet</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          Mueve tu dinero
          <br />
          <span className="text-ink-400">sin pensarlo dos veces.</span>
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center pt-16 [animation-delay:150ms] animate-rise">
        <LiveWalletDemo />
      </div>

    </aside>
  );
}
