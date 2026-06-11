"use client";

import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { hasCapability, type BusinessInstalledApp } from "@/lib/app-suite/capabilities";
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
  const { label, hint } = getProductSellableFieldCopy(installedApps, businessId);

  const switchDisabled = checked ? !canRaw : !canSell;

  const handleChange = (value: boolean) => {
    if (value && !canSell) return;
    if (!value && !canRaw) return;
    onCheckedChange(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={handleChange}
          disabled={switchDisabled}
          className="mt-0.5"
        />
        <Label htmlFor={id} className="cursor-pointer leading-snug">
          {label}
        </Label>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground pl-10">
          {hint}{" "}
          <Link
            href={`/${businessId}/app-suite`}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ir a Suite
          </Link>
        </p>
      )}
    </div>
  );
}
