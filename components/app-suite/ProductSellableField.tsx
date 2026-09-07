"use client";

import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { hasCapability, canUseOfferingsCatalogProduct, type BusinessInstalledApp } from "@/lib/app-suite/capabilities";
import { getProductSellableFieldCopy } from "@/lib/app-suite/featureCopy";

type ProductSellableFieldProps = {
  businessId: string;
  installedApps?: BusinessInstalledApp[] | null;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  id?: string;
};

export function ProductSellableField({
  businessId,
  installedApps,
  checked,
  onCheckedChange,
  id = "is_sellable",
}: ProductSellableFieldProps) {
  const canSell = hasCapability(installedApps, "product.sellable");
  const canRaw = hasCapability(installedApps, "product.rawMaterial");
  const canCatalog = canUseOfferingsCatalogProduct(installedApps);
  const { capabilityHint } = getProductSellableFieldCopy(installedApps, businessId);

  const switchDisabled = checked ? !canRaw && !canCatalog : !canSell;

  const handleChange = (value: boolean) => {
    if (value && !canSell) return;
    if (!value && !canRaw && !canCatalog) return;
    onCheckedChange(value);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          Vendible
        </Label>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={handleChange}
          disabled={switchDisabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Activado aparece en catálogo de ventas. Si está desactivado, queda en tu catálogo interno
        (Productos y Servicios)
      </p>
      {capabilityHint ? (
        <p className="text-xs text-muted-foreground">
          {capabilityHint}{" "}
          <Link
            href={`/${businessId}/app-suite`}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ir a Suite
          </Link>
        </p>
      ) : null}
    </div>
  );
}
