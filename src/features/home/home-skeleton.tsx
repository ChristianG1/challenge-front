import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10" aria-busy="true" aria-label="Cargando saldo">
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-12 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-44 animate-pulse rounded-lg bg-white/10" />
        <div className="h-16 w-full animate-pulse rounded-lg bg-white/5" />
        <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="flex flex-col gap-3 md:pl-8">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-white/10" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-9 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 flex-1 animate-pulse rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando movimientos" className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
