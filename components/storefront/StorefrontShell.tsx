"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { storefrontPaths } from "@/lib/storefront/paths";

type StorefrontShellProps = {
  businessSlug: string;
  businessName?: string;
  cartCount?: number;
  active?: "catalog" | "cart" | "checkout" | "order";
  children: React.ReactNode;
  className?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onCartClick?: () => void;
};

export function StorefrontShell({
  businessSlug,
  businessName,
  cartCount = 0,
  active = "catalog",
  children,
  className,
  searchQuery,
  onSearchQueryChange,
  onCartClick,
}: StorefrontShellProps) {
  const router = useRouter();
  const paths = storefrontPaths(businessSlug);
  const brand = businessName?.trim() || "Tienda";
  const showSearch = active === "catalog" && typeof onSearchQueryChange === "function";

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
      return;
    }
    router.push(paths.cart);
  };

  return (
    <div className="relative min-h-[100dvh] bg-muted/30 text-foreground">
      <a
        href="#storefront-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href={paths.base} className="min-w-0 shrink-0 group">
            <span className="block truncate text-lg font-bold tracking-tight">{brand}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tienda
            </span>
          </Link>

          {showSearch && (
            <div className="relative mx-2 hidden max-w-md flex-1 md:block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery ?? ""}
                onChange={(event) => onSearchQueryChange?.(event.target.value)}
                placeholder="Buscar productos..."
                className="h-10 w-full rounded-xl border-0 bg-muted pl-10 pr-9 text-sm transition-all placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {Boolean(searchQuery) && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => onSearchQueryChange?.("")}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {active !== "catalog" && (
              <Link
                href={paths.base}
                className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Volver a tienda
              </Link>
            )}

            <button
              type="button"
              onClick={handleCartClick}
              className="relative rounded-xl p-2.5 text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
              aria-label={cartCount > 0 ? `Carrito, ${cartCount} artículos` : "Ver carrito"}
            >
              <ShoppingBag className="size-6" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold tabular-nums text-background ring-2 ring-background">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        id="storefront-content"
        className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}
      >
        {children}
      </main>

      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-medium text-foreground/80">{brand}</p>
          <p className="text-xs sm:text-sm">Pedidos gestionados por este negocio.</p>
        </div>
      </footer>
    </div>
  );
}
