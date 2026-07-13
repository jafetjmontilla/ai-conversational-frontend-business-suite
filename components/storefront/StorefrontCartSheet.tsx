"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  cartItemCount,
  removeSkuFromCart,
  setSkuQuantity,
} from "@/lib/storefront/cart-storage";
import { productImageUrl } from "@/lib/storefront/catalog-utils";
import { formatMoney } from "@/lib/storefront/format";
import { storefrontPaths } from "@/lib/storefront/paths";
import type { StorefrontCartLine, StorefrontCatalogItem } from "@/lib/storefront/types";

type StorefrontCartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessSlug: string;
  cart: StorefrontCartLine[];
  items: StorefrontCatalogItem[];
  onCartChange: (lines: StorefrontCartLine[]) => void;
};

export function StorefrontCartSheet({
  open,
  onOpenChange,
  businessSlug,
  cart,
  items,
  onCartChange,
}: StorefrontCartSheetProps) {
  const paths = storefrontPaths(businessSlug);
  const bySku = new Map(items.map((item) => [item.sku, item]));
  const lines = cart.map((line) => {
    const item = bySku.get(line.sku);
    return {
      ...line,
      name: item?.name ?? line.sku,
      price: item?.price ?? 0,
      image: productImageUrl(item?.name ?? line.sku),
    };
  });
  const count = cartItemCount(cart);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ShoppingBag className="size-5" aria-hidden />
            Tu carrito
            {count > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {count}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/40" aria-hidden />
              <h4 className="mt-3 font-semibold tracking-tight">Tu carrito está vacío</h4>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Explora el catálogo y añade lo que quieras pedir.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {lines.map((line) => (
                <li key={line.sku} className="flex gap-4 py-4 first:pt-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold">{line.name}</h4>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatMoney(line.price * line.quantity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">SKU {line.sku}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/40 p-0.5">
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground active:scale-[0.96]"
                          aria-label={`Reducir ${line.name}`}
                          onClick={() =>
                            onCartChange(setSkuQuantity(businessSlug, line.sku, line.quantity - 1))
                          }
                        >
                          <Minus className="size-3" aria-hidden />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground active:scale-[0.96]"
                          aria-label={`Aumentar ${line.name}`}
                          onClick={() =>
                            onCartChange(setSkuQuantity(businessSlug, line.sku, line.quantity + 1))
                          }
                        >
                          <Plus className="size-3" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-medium text-destructive transition-colors hover:text-destructive/80"
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
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-4 border-t border-border/60 bg-muted/30 px-6 py-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal estimado</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatMoney(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              El total y la entrega se confirman en el checkout.
            </p>
            <Button asChild size="lg" className="w-full rounded-xl active:scale-[0.98]">
              <Link href={paths.checkout} onClick={() => onOpenChange(false)}>
                Proceder al checkout
              </Link>
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Continuar comprando
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
