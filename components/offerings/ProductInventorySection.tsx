"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RequiredMaterial } from "@/lib/interfases";
import { INVENTORY_HELP } from "@/lib/offerings/inventoryHelpCopy";
import { FieldHelpText } from "@/components/offerings/FieldHelpText";
import { RequiredMaterialsEditor } from "@/components/offerings/RequiredMaterialsEditor";
import { Info } from "lucide-react";

type ProductInventorySectionProps = {
  businessIdDoc: string | null | undefined;
  isSellable: boolean;
  trackInventory: boolean;
  hasBillOfMaterials: boolean;
  requiredMaterials: RequiredMaterial[];
  onTrackInventoryChange: (value: boolean) => void;
  onHasBillOfMaterialsChange: (value: boolean) => void;
  onRequiredMaterialsChange: (materials: RequiredMaterial[]) => void;
  disabled?: boolean;
};

export function ProductInventorySection({
  businessIdDoc,
  isSellable,
  trackInventory,
  hasBillOfMaterials,
  requiredMaterials,
  onTrackInventoryChange,
  onHasBillOfMaterialsChange,
  onRequiredMaterialsChange,
  disabled,
}: ProductInventorySectionProps) {
  if (!isSellable) {
    return (
      <div className="rounded-lg border border-dashed p-4 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          Materia prima / insumo
        </p>
        <FieldHelpText>{INVENTORY_HELP.rawMaterialNote}</FieldHelpText>
      </div>
    );
  }

  const handleTrackChange = (value: boolean) => {
    if (value && hasBillOfMaterials) {
      onHasBillOfMaterialsChange(false);
      onRequiredMaterialsChange([]);
    }
    onTrackInventoryChange(value);
  };

  const handleBomChange = (value: boolean) => {
    if (value && trackInventory) {
      onTrackInventoryChange(false);
    }
    onHasBillOfMaterialsChange(value);
    if (!value) onRequiredMaterialsChange([]);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{INVENTORY_HELP.productSectionTitle}</p>
        <FieldHelpText className="mt-1">{INVENTORY_HELP.productSectionDescription}</FieldHelpText>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <Label htmlFor="trackInventory" className="cursor-pointer">
                {INVENTORY_HELP.trackInventoryLabel}
              </Label>
              <FieldHelpText>{INVENTORY_HELP.trackInventoryHelp}</FieldHelpText>
            </div>
            <Switch
              id="trackInventory"
              checked={trackInventory}
              onCheckedChange={handleTrackChange}
              disabled={disabled || hasBillOfMaterials}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <Label htmlFor="hasBillOfMaterials" className="cursor-pointer">
                {INVENTORY_HELP.hasBillOfMaterialsLabel}
              </Label>
              <FieldHelpText>{INVENTORY_HELP.hasBillOfMaterialsHelp}</FieldHelpText>
            </div>
            <Switch
              id="hasBillOfMaterials"
              checked={hasBillOfMaterials}
              onCheckedChange={handleBomChange}
              disabled={disabled || trackInventory}
            />
          </div>
        </div>
      </div>

      <FieldHelpText className="italic">{INVENTORY_HELP.bomExclusiveNote}</FieldHelpText>

      {hasBillOfMaterials && (
        <RequiredMaterialsEditor
          businessIdDoc={businessIdDoc}
          materials={requiredMaterials}
          onChange={onRequiredMaterialsChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
