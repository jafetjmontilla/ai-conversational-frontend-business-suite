import { Skeleton } from "@/components/ui/skeleton";

export function StorefrontLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="min-h-[100dvh] bg-muted/30" aria-busy="true" aria-label={label}>
      <div className="border-b border-border/60 bg-background/90 px-4 py-5 sm:px-6">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <Skeleton className="hidden h-80 rounded-2xl lg:block" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border/50">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
