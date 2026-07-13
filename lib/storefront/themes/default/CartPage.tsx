"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  cartItemCount,
  removeSkuFromCart,
  setSkuQuantity,
} from "@/lib/storefront/cart-storage";
import { productImageUrl } from "@/lib/storefront/catalog-utils";
import { formatMoney } from "@/lib/storefront/format";
import { storefrontPaths } from "@/lib/storefront/paths";
import type { StorefrontCartPageProps } from "../types";

const ease = [0.32, 0.72, 0, 1] as const;

export function DefaultCartPage({
  businessSlug,
  businessName,
  cart,
  items,
  onCartChange,
}: StorefrontCartPageProps) {
  const reduceMotion = useReducedMotion();
  const paths = storefrontPaths(businessSlug);
  const bySku = new Map(items.map((item) => [item.sku, item]));
  const count = cartItemCount(cart);
  const lines = cart.map((line) => {
    const item = bySku.get(line.sku);
    return {
      ...line,
      name: item?.name ?? line.sku,
      price: item?.price ?? 0,
      missing: !item,
      image: productImageUrl(item?.name ?? line.sku),
    };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <StorefrontShell
      businessSlug={businessSlug}
      businessName={businessName}
      cartCount={count}
      active="cart"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="mb-8 space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tu carrito</h1>
        <p className="text-sm text-muted-foreground">Revisa cantidades antes de pagar.</p>
      </motion.div>

      {lines.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-20 text-center shadow-sm">
          <ShoppingBag className="mx-auto size-12 text-muted-foreground/40" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Tu carrito está vacío</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Explora el catálogo y añade tus artículos favoritos.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href={paths.base}>Volver a la tienda</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {lines.map((line) => (
              <li key={line.sku} className="flex gap-4 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={line.image}
                  alt=""
                  className="size-20 shrink-0 rounded-xl object-cover bg-muted"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.missing ? "Producto no disponible" : `SKU ${line.sku}`}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatMoney(line.price * line.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
                      <button
                        type="button"
                        className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground active:scale-[0.96]"
                        aria-label={`Reducir ${line.name}`}
                        onClick={() =>
                          onCartChange(setSkuQuantity(businessSlug, line.sku, line.quantity - 1))
                        }
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground active:scale-[0.96]"
                        aria-label={`Aumentar ${line.name}`}
                        onClick={() =>
                          onCartChange(setSkuQuantity(businessSlug, line.sku, line.quantity + 1))
                        }
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-destructive"
                      onClick={() => onCartChange(removeSkuFromCart(businessSlug, line.sku))}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="border-b border-border/50 pb-3 text-lg font-semibold">Resumen</h2>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatMoney(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Impuestos y entrega se confirman en el checkout.
            </p>
            <Button asChild size="lg" className="group w-full rounded-xl active:scale-[0.98]">
              <Link href={paths.checkout}>
                Proceder al checkout
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full rounded-xl">
              <Link href={paths.base}>Continuar comprando</Link>
            </Button>
          </aside>
        </div>
      )}
    </StorefrontShell>
  );
}
