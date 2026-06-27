"use client";

import { INVENTORY_HELP } from "@/lib/offerings/inventoryHelpCopy";

type InventoryScenarioHintsProps = {
  variant: "product" | "service";
  hasBillOfMaterials: boolean;
};

/** Resumen visual del escenario de inventario activo. */
export function InventoryScenarioHints({ variant, hasBillOfMaterials }: InventoryScenarioHintsProps) {
  const items =
    variant === "product"
      ? hasBillOfMaterials
        ? [INVENTORY_HELP.scenarioExamples.preparedProduct]
        : [INVENTORY_HELP.scenarioExamples.directProduct]
      : hasBillOfMaterials
        ? [INVENTORY_HELP.scenarioExamples.serviceWithBom]
        : [INVENTORY_HELP.scenarioExamples.pureService];

  return (
    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
      {items.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  );
}
