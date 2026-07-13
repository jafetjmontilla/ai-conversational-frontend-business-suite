"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Eye,
  PackageOpen,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorefrontCartSheet } from "@/components/storefront/StorefrontCartSheet";
import { StorefrontProductDialog } from "@/components/storefront/StorefrontProductDialog";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { cn } from "@/lib/utils";
import { cartItemCount } from "@/lib/storefront/cart-storage";
import {
  groupCatalogItems,
  productImageUrl,
  variantLabel,
  type ProductGroup,
} from "@/lib/storefront/catalog-utils";
import { formatMoney } from "@/lib/storefront/format";
import type { StorefrontCatalogPageProps } from "../types";

const ease = [0.32, 0.72, 0, 1] as const;

function ProductCard({
  group,
  index,
  reduceMotion,
  onQuickView,
  onAddToCart,
}: {
  group: ProductGroup;
  index: number;
  reduceMotion: boolean | null;
  onQuickView: () => void;
  onAddToCart: (sku: string) => void;
}) {
  const [selectedSku, setSelectedSku] = useState(group.variants[0]?.sku ?? "");
  const selected =
    group.variants.find((variant) => variant.sku === selectedSku) ?? group.variants[0];
  const multi = group.variants.length > 1;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.24), ease }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.35)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={productImageUrl(group.name)}
          alt={group.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full border border-border/50 bg-background/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-md">
          {group.category}
        </span>
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={onQuickView}
            className="flex size-11 items-center justify-center rounded-full bg-background text-foreground shadow-lg transition-transform hover:scale-110 active:scale-[0.96]"
            title="Vista rápida"
            aria-label={`Vista rápida de ${group.name}`}
          >
            <Eye className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-1 font-semibold tracking-tight transition-colors group-hover:text-foreground/80">
            {group.name}
          </h3>
          {group.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {group.description}
            </p>
          ) : multi ? (
            <p className="text-xs text-muted-foreground">
              {group.variants.length} opciones · desde {formatMoney(group.minPrice)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">SKU {selected.sku}</p>
          )}

          {multi && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {group.variants.map((variant) => {
                const label = variantLabel(variant, group.variants.length) ?? variant.sku;
                const active = variant.sku === selected.sku;
                return (
                  <button
                    key={variant.sku}
                    type="button"
                    onClick={() => setSelectedSku(variant.sku)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors active:scale-[0.98]",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
          <span className="text-lg font-bold tabular-nums tracking-tight">
            {formatMoney(selected.price)}
          </span>
          <Button
            size="sm"
            className="rounded-xl px-4 active:scale-[0.98]"
            onClick={() => onAddToCart(selected.sku)}
          >
            <Plus className="size-3.5" aria-hidden />
            Añadir
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function DefaultCatalogPage({
  businessSlug,
  businessName,
  items,
  enabled,
  cart,
  onAddToCart,
  onCartChange,
}: StorefrontCatalogPageProps) {
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<ProductGroup | null>(null);

  const groups = useMemo(() => groupCatalogItems(items), [items]);
  const categories = useMemo(() => {
    const set = new Set(groups.map((group) => group.category));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [groups]);
  const maxPrice = useMemo(
    () => Math.max(0, ...groups.map((group) => group.maxPrice), 0),
    [groups]
  );
  const effectiveMax = priceRange ?? maxPrice;

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groups.filter((group) => {
      if (selectedCategory !== "Todos" && group.category !== selectedCategory) return false;
      if (group.minPrice > effectiveMax) return false;
      if (!query) return true;
      return (
        group.name.toLowerCase().includes(query) ||
        group.category.toLowerCase().includes(query) ||
        group.variants.some((variant) => variant.sku.toLowerCase().includes(query)) ||
        Boolean(group.description?.toLowerCase().includes(query))
      );
    });
  }, [groups, selectedCategory, effectiveMax, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== "Todos" ||
    Boolean(searchQuery.trim()) ||
    (priceRange !== null && priceRange < maxPrice);
  const cartCount = cartItemCount(cart);

  const clearFilters = () => {
    setSelectedCategory("Todos");
    setSearchQuery("");
    setPriceRange(null);
  };

  if (!enabled) {
    return (
      <StorefrontShell businessSlug={businessSlug} businessName={businessName} cartCount={0}>
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
            <PackageOpen className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">Tienda no disponible</h1>
          <p className="mx-auto max-w-[45ch] text-pretty text-muted-foreground">
            El checkout web no está habilitado para este negocio.
          </p>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <>
      <StorefrontShell
        businessSlug={businessSlug}
        businessName={businessName}
        cartCount={cartCount}
        active="catalog"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCartClick={() => setCartOpen(true)}
      >
        <div className="space-y-8">
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-border/50 bg-foreground px-6 py-7 text-background shadow-sm sm:flex-row sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-background/10 blur-3xl"
            />
            <div className="z-10 space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-background/20 bg-background/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background/80">
                <Tag className="size-3" aria-hidden />
                Pedido online
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Elige, confirma y listo
              </h1>
              <p className="max-w-md text-sm text-background/70">
                Revisa el catálogo, arma tu carrito y completa el pedido en pocos pasos.
              </p>
            </div>
            <div className="z-10 rounded-xl border border-background/15 bg-background/10 px-4 py-3 text-center backdrop-blur-md">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-background/60">
                Disponibles
              </span>
              <span className="text-2xl font-bold tabular-nums">{groups.length}</span>
              <span className="mt-0.5 block text-xs text-background/60">productos</span>
            </div>
          </div>

          <div className="relative md:hidden">
            <Search
              className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar productos..."
              className="h-12 w-full rounded-xl border border-border/70 bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
            <aside className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:sticky lg:top-28">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                  <SlidersHorizontal className="size-[18px]" aria-hidden />
                  Filtros
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categoría
                </h3>
                <div className="flex flex-col gap-1.5">
                  {categories.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          active
                            ? "bg-foreground font-semibold text-background"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span>{category}</span>
                        {active && <Check className="size-3.5" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {maxPrice > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Precio máximo
                    </h3>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(effectiveMax)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    step={Math.max(1, Math.round(maxPrice / 40))}
                    value={effectiveMax}
                    onChange={(event) => setPriceRange(Number(event.target.value))}
                    className="w-full accent-foreground"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{formatMoney(0)}</span>
                    <span>{formatMoney(maxPrice)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-border/50 bg-muted/40 p-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Truck className="size-3.5" aria-hidden />
                  Entrega a elección
                </p>
                <p>Delivery o retiro en tienda. Lo defines al confirmar el pedido.</p>
              </div>
            </aside>

            <section className="space-y-6 lg:col-span-3">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Nuestra colección</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Mostrando {filtered.length} productos coincidentes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory !== "Todos" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium">
                      {selectedCategory}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("Todos")}
                        aria-label="Quitar categoría"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  )}
                  {priceRange !== null && priceRange < maxPrice && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium">
                      Hasta {formatMoney(priceRange)}
                      <button
                        type="button"
                        onClick={() => setPriceRange(null)}
                        aria-label="Quitar filtro de precio"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card px-8 py-16 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Search className="size-7" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">No encontramos productos</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Prueba limpiando los filtros o ajustando la búsqueda.
                  </p>
                  <Button className="mt-6 rounded-xl" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((group, index) => (
                    <ProductCard
                      key={group.key}
                      group={group}
                      index={index}
                      reduceMotion={reduceMotion}
                      onQuickView={() => setQuickView(group)}
                      onAddToCart={(sku) => {
                        onAddToCart(sku);
                        setCartOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}

              {groups.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
                  <ShoppingBag className="mx-auto size-8 text-muted-foreground" aria-hidden />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">Aún no hay productos</h3>
                  <p className="mx-auto mt-2 max-w-[40ch] text-sm text-muted-foreground">
                    Cuando el negocio publique su catálogo, lo verás aquí.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </StorefrontShell>

      <StorefrontCartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        businessSlug={businessSlug}
        cart={cart}
        items={items}
        onCartChange={onCartChange}
      />

      <StorefrontProductDialog
        group={quickView}
        open={Boolean(quickView)}
        onOpenChange={(open) => {
          if (!open) setQuickView(null);
        }}
        onAddToCart={(sku) => {
          onAddToCart(sku);
          setCartOpen(true);
        }}
      />
    </>
  );
}
