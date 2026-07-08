import type { InvoiceItemType, InvoiceSelectedModifier } from "@/lib/interfases";

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
  unitPrice: number;
  total: number;
  lineNote?: string;
  selectedModifiers?: InvoiceSelectedModifier[];
  searchTerm?: string;
  searchResults?: unknown[];
};

export function computeLineTotal(
  quantity: number,
  unitPrice: number,
  selectedModifiers?: InvoiceSelectedModifier[]
): number {
  const base = quantity * unitPrice;
  const mods = (selectedModifiers ?? []).reduce((s, m) => s + (m.total ?? 0), 0);
  return roundToTwoDecimals(base + mods);
}

export function mapLineToInvoiceItemInput(line: InvoiceLineDraft) {
  const total = computeLineTotal(line.quantity, line.unitPrice, line.selectedModifiers);
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
    unitPrice: roundToTwoDecimals(line.unitPrice || 0),
    total,
    lineNote: line.lineNote?.trim() || undefined,
    selectedModifiers: (line.selectedModifiers ?? []).map((m) => ({
      modifierGroupId: m.modifierGroupId,
      catalogItemId: m.catalogItemId,
      quantity: roundToTwoDecimals(m.quantity),
      unitPrice: roundToTwoDecimals(m.unitPrice),
      total: roundToTwoDecimals(m.total),
    })),
  };
}
