"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  productImageUrl,
  variantLabel,
  type ProductGroup,
} from "@/lib/storefront/catalog-utils";
import { formatMoney } from "@/lib/storefront/format";

type StorefrontProductDialogProps = {
  group: ProductGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (sku: string) => void;
};

export function StorefrontProductDialog({
  group,
  open,
  onOpenChange,
  onAddToCart,
}: StorefrontProductDialogProps) {
  const [selectedSku, setSelectedSku] = useState("");
  const activeSku = selectedSku || group?.variants[0]?.sku || "";
  const selected =
    group?.variants.find((variant) => variant.sku === activeSku) ?? group?.variants[0];
  const multi = (group?.variants.length ?? 0) > 1;

  if (!group || !selected) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setSelectedSku(group.variants[0]?.sku ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="grid md:grid-cols-2">
          <div className="aspect-square bg-muted md:aspect-auto md:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl(group.name)}
              alt={group.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-4">
              <DialogHeader className="space-y-3 text-left">
                <span className="inline-flex w-fit rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.category}
                </span>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {group.name}
                </DialogTitle>
                {group.description ? (
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    {group.description}
                  </DialogDescription>
                ) : (
                  <DialogDescription className="text-sm text-muted-foreground">
                    SKU {selected.sku}
                  </DialogDescription>
                )}
              </DialogHeader>

              {multi && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Opciones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.variants.map((variant) => {
                      const label = variantLabel(variant, group.variants.length) ?? variant.sku;
                      const active = variant.sku === selected.sku;
                      return (
                        <button
                          key={variant.sku}
                          type="button"
                          onClick={() => setSelectedSku(variant.sku)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98]",
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {active && <Check className="size-3" aria-hidden />}
                          {label}
                          <span className="tabular-nums opacity-80">{formatMoney(variant.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatMoney(selected.price)}
              </span>
              <Button
                size="lg"
                className="rounded-xl active:scale-[0.98]"
                onClick={() => {
                  onAddToCart(selected.sku);
                  onOpenChange(false);
                }}
              >
                <ShoppingBag className="size-4" aria-hidden />
                Añadir al carrito
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
