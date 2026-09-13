import { fetchApiV1, queries } from "@/lib/Fetching";
import type { InventoryLog, InventoryStockRow, StockDocument, StockDocumentType } from "@/lib/interfases";

export type InventoryStockRole = "ALL" | "RAW" | "SELLABLE";

export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  stock: (
    businessId: string | null,
    params: { q?: string; role?: InventoryStockRole; lowStockOnly?: boolean } = {}
  ) => [...inventoryQueryKeys.all, "stock", businessId, params] as const,
  logs: (
    businessId: string | null,
    params: { sku?: string; fromDate?: string; toDate?: string } = {}
  ) => [...inventoryQueryKeys.all, "logs", businessId, params] as const,
};

export async function fetchInventoryStockList(
  businessIdDoc: string,
  opts: {
    q?: string;
    role?: InventoryStockRole;
    lowStockOnly?: boolean;
    skip?: number;
    limit?: number;
  } = {}
): Promise<InventoryStockRow[]> {
  const res = (await fetchApiV1({
    query: queries.getInventoryStockList,
    type: "json",
    variables: {
      id: businessIdDoc,
      q: opts.q || undefined,
      role: opts.role || "ALL",
      lowStockOnly: opts.lowStockOnly ?? false,
      skip: opts.skip ?? 0,
      limit: opts.limit ?? 500,
    },
  })) as InventoryStockRow[] | null;
  return Array.isArray(res) ? res : [];
}

export async function fetchInventoryLogs(
  businessIdDoc: string,
  opts: { sku?: string; variantId?: string; fromDate?: string; toDate?: string; limit?: number } = {}
): Promise<InventoryLog[]> {
  const res = (await fetchApiV1({
    query: queries.getInventoryLogs,
    type: "json",
    variables: {
      id: businessIdDoc,
      sku: opts.sku || undefined,
      variantId: opts.variantId || undefined,
      fromDate: opts.fromDate || undefined,
      toDate: opts.toDate || undefined,
      limit: opts.limit ?? 200,
    },
  })) as InventoryLog[] | null;
  return Array.isArray(res) ? res : [];
}

export async function createStockDocumentMutation(
  businessIdDoc: string,
  input: {
    type: StockDocumentType;
    concept: string;
    lines: { variantId: string; quantity: number }[];
  }
): Promise<StockDocument> {
  return (await fetchApiV1({
    query: queries.createStockDocument,
    type: "json",
    variables: { id: businessIdDoc, input },
  })) as StockDocument;
}

export async function updateVariantMinStockMutation(
  businessIdDoc: string,
  variantId: string,
  minStock: number
): Promise<InventoryStockRow> {
  return (await fetchApiV1({
    query: queries.updateVariantMinStock,
    type: "json",
    variables: { id: businessIdDoc, variantId, minStock },
  })) as InventoryStockRow;
}
