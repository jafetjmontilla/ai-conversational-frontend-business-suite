"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { InvoiceSelectedModifier } from "@/lib/interfases";
import {
  buildModifierSelection,
  fetchModifierGroupsForProduct,
  fetchModifierGroupsForService,
  type ModifierGroup,
} from "@/lib/billing/modifiers";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Label } from "@/components/ui/label";

type InvoiceLineModifiersProps = {
  businessId: string;
  productId?: string;
  productVariantId?: string;
  serviceId?: string;
  lineQuantity: number;
  value: InvoiceSelectedModifier[];
  onChange: (modifiers: InvoiceSelectedModifier[]) => void;
  disabled?: boolean;
  className?: string;
};

export function InvoiceLineModifiers({
  businessId,
  productId: productIdProp,
  productVariantId,
  serviceId,
  lineQuantity,
  value,
  onChange,
  disabled,
  className,
}: InvoiceLineModifiersProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvedProductId, setResolvedProductId] = useState<string | undefined>(productIdProp);

  useEffect(() => {
    setResolvedProductId(productIdProp);
  }, [productIdProp]);

  useEffect(() => {
    if (productIdProp || !productVariantId || !businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const variants = (await fetchApiV1({
          query: queries.getProductVariants,
          type: "json",
          variables: { id: businessId },
        })) as { _id: string; product_id: string }[] | null;
        const match = (variants ?? []).find((v) => v._id === productVariantId);
        if (!cancelled) setResolvedProductId(match?.product_id);
      } catch {
        if (!cancelled) setResolvedProductId(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, productIdProp, productVariantId]);

  const productId = productIdProp || resolvedProductId;

  useEffect(() => {
    if (!businessId || (!productId && !serviceId)) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = productId
          ? await fetchModifierGroupsForProduct(businessId, productId)
          : await fetchModifierGroupsForService(businessId, serviceId!);
        if (!cancelled) setGroups(result);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, productId, serviceId]);

  if (!productId && !serviceId) return null;
  if (loading) {
    return <p className={cn("text-xs text-muted-foreground", className)}>Cargando modificadores…</p>;
  }
  if (!groups.length) return null;

  const toggleSingle = (group: ModifierGroup, optionId: string) => {
    if (disabled) return;
    const option = group.options.find((o) => o.catalogItemId === optionId);
    if (!option) return;
    const withoutGroup = value.filter((m) => m.modifierGroupId !== group._id);
    const next = buildModifierSelection(group, option, lineQuantity);
    onChange([...withoutGroup, next]);
  };

  const toggleMultiple = (group: ModifierGroup, optionId: string, checked: boolean) => {
    if (disabled) return;
    const option = group.options.find((o) => o.catalogItemId === optionId);
    if (!option) return;
    const without = value.filter((m) => m.catalogItemId !== optionId);
    if (!checked) {
      onChange(without);
      return;
    }
    const currentForGroup = value.filter((m) => m.modifierGroupId === group._id);
    if (currentForGroup.length >= group.maxSelections) return;
    onChange([...without, buildModifierSelection(group, option, lineQuantity)]);
  };

  return (
    <div className={cn("space-y-2 rounded-md border border-dashed p-2 bg-muted/20", className)}>
      <Label className="text-xs text-muted-foreground">Modificadores</Label>
      {groups.map((group) => (
        <div key={group._id} className="space-y-1">
          <p className="text-xs font-medium">
            {group.name}
            {group.isRequired ? <span className="text-destructive"> *</span> : null}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.options.map((opt) => {
              const selected = value.some((m) => m.catalogItemId === opt.catalogItemId);
              const name = opt.catalogItem?.name ?? "Opción";
              const price = opt.priceOverride ?? opt.catalogItem?.price ?? 0;
              if (group.selectionType === "SINGLE") {
                return (
                  <button
                    key={opt.catalogItemId}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSingle(group, opt.catalogItemId)}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-border"
                    )}
                  >
                    {name}
                    {price > 0 ? ` (+${price.toFixed(2)})` : ""}
                  </button>
                );
              }
              return (
                <label
                  key={opt.catalogItemId}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border cursor-pointer inline-flex items-center gap-1",
                    selected ? "bg-primary/15 border-primary" : "bg-background border-border",
                    disabled && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    disabled={disabled}
                    onChange={(e) => toggleMultiple(group, opt.catalogItemId, e.target.checked)}
                  />
                  {name}
                  {price > 0 ? ` (+${price.toFixed(2)})` : ""}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
