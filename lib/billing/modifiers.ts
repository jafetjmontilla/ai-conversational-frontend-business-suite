import { fetchApiV1, queries } from "@/lib/Fetching";
import type { InvoiceSelectedModifier } from "@/lib/interfases";
import { roundToTwoDecimals } from "@/lib/billing/invoiceLine";

export type ModifierCatalogItem = {
  _id: string;
  sku?: string;
  name: string;
  price: number;
};

export type ModifierGroupOption = {
  catalogItemId: string;
  priceOverride?: number | null;
  catalogItem?: ModifierCatalogItem | null;
};

export type ModifierGroup = {
  _id: string;
  name: string;
  isRequired: boolean;
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
  priceBehavior: "ADDITIONAL" | "INCLUDED";
  includedQuantity: number;
  options: ModifierGroupOption[];
};

export function resolveModifierOptionPrice(option: ModifierGroupOption): number {
  if (option.priceOverride != null && option.priceOverride >= 0) {
    return option.priceOverride;
  }
  return option.catalogItem?.price ?? 0;
}

export function buildModifierSelection(
  group: ModifierGroup,
  option: ModifierGroupOption,
  lineQuantity: number
): InvoiceSelectedModifier {
  const quantity = Math.max(1, lineQuantity || 1);
  const unitPrice = roundToTwoDecimals(resolveModifierOptionPrice(option));
  const total = roundToTwoDecimals(quantity * unitPrice);
  return {
    modifierGroupId: group._id,
    catalogItemId: option.catalogItemId,
    quantity,
    unitPrice,
    total,
    label: option.catalogItem?.name ?? "Modificador",
  };
}

export async function fetchModifierGroupsForProduct(
  businessId: string,
  productId: string
): Promise<ModifierGroup[]> {
  const product = (await fetchApiV1({
    query: queries.getProduct,
    type: "json",
    variables: { _id: productId, id: businessId },
  })) as { modifierGroupIds?: string[] } | null;

  const ids = product?.modifierGroupIds ?? [];
  if (!ids.length) return [];

  const all = (await fetchApiV1({
    query: queries.getModifierGroups,
    type: "json",
    variables: { id: businessId, includeInactive: false },
  })) as ModifierGroup[] | null;

  const idSet = new Set(ids);
  return (all ?? []).filter((g) => idSet.has(g._id));
}

export async function fetchModifierGroupsForService(
  businessId: string,
  serviceId: string
): Promise<ModifierGroup[]> {
  const service = (await fetchApiV1({
    query: queries.getService,
    type: "json",
    variables: { _id: serviceId, id: businessId },
  })) as { modifierGroupIds?: string[] } | null;

  const ids = service?.modifierGroupIds ?? [];
  if (!ids.length) return [];

  const all = (await fetchApiV1({
    query: queries.getModifierGroups,
    type: "json",
    variables: { id: businessId, includeInactive: false },
  })) as ModifierGroup[] | null;

  const idSet = new Set(ids);
  return (all ?? []).filter((g) => idSet.has(g._id));
}
