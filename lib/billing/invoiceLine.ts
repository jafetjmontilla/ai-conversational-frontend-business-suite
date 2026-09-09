import type { InvoiceItemType, InvoiceSelectedModifier } from "@/lib/interfases";
import { addMinor, assertMinorUnits } from "@/lib/money";

export const roundToTwoDecimals = (num: number): number =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export type InvoiceLineDraft = {
  id: string;
  inventoryId: string;
  productVariantId?: string;
  serviceOptionId?: string;
  productId?: string;
  serviceId?: string;
  itemType?: InvoiceItemType;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  lineNote?: string;
  selectedModifiers?: InvoiceSelectedModifier[];
  searchTerm?: string;
  searchResults?: unknown[];
};

export function computeLineTotalMinor(
  quantity: number,
  unitPriceMinor: number,
  selectedModifiers?: InvoiceSelectedModifier[]
): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new TypeError("La cantidad debe ser finita y no negativa");
  }
  const baseMinor = assertMinorUnits(
    Math.round(quantity * assertMinorUnits(unitPriceMinor, "unitPriceMinor")),
    "lineBaseMinor"
  );
  return addMinor(
    baseMinor,
    ...(selectedModifiers ?? []).map((modifier) => modifier.totalMinor ?? 0)
  );
}

export function mapLineToInvoiceItemInput(line: InvoiceLineDraft) {
  const totalMinor = computeLineTotalMinor(
    line.quantity,
    line.unitPriceMinor,
    line.selectedModifiers
  );
  return {
    id: line.id,
    inventoryId: line.inventoryId || "",
    itemType: line.productVariantId
      ? ("product_variant" as const)
      : line.serviceOptionId
        ? ("service_option" as const)
        : (line.itemType ?? "inventory"),
    productVariantId: line.productVariantId || undefined,
    serviceOptionId: line.serviceOptionId || undefined,
    description: line.description,
    quantity: roundToTwoDecimals(line.quantity || 0),
    unitPriceMinor: assertMinorUnits(line.unitPriceMinor || 0, "unitPriceMinor"),
    totalMinor,
    lineNote: line.lineNote?.trim() || undefined,
    selectedModifiers: (line.selectedModifiers ?? []).map((m) => ({
      modifierGroupId: m.modifierGroupId,
      catalogItemId: m.catalogItemId,
      quantity: roundToTwoDecimals(m.quantity),
      unitPriceMinor: assertMinorUnits(m.unitPriceMinor, "unitPriceMinor"),
      totalMinor: assertMinorUnits(m.totalMinor, "totalMinor"),
    })),
  };
}
