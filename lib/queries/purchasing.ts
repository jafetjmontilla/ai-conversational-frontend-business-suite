import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseReceipt,
  Supplier,
} from "@/lib/interfases";
import { inventoryQueryKeys } from "@/lib/queries/inventory";

export const purchasingQueryKeys = {
  all: ["purchasing"] as const,
  suppliers: (businessId: string | null, params: { q?: string } = {}) =>
    [...purchasingQueryKeys.all, "suppliers", businessId, params] as const,
  orders: (
    businessId: string | null,
    params: { status?: PurchaseOrderStatus; supplierId?: string } = {}
  ) => [...purchasingQueryKeys.all, "orders", businessId, params] as const,
  order: (businessId: string | null, orderId: string | null) =>
    [...purchasingQueryKeys.all, "order", businessId, orderId] as const,
};

export async function fetchSuppliers(
  businessIdDoc: string,
  opts: { q?: string; includeInactive?: boolean } = {}
): Promise<Supplier[]> {
  const res = (await fetchApiV1({
    query: queries.getSuppliers,
    type: "json",
    variables: {
      id: businessIdDoc,
      q: opts.q || undefined,
      includeInactive: opts.includeInactive ?? false,
      limit: 300,
    },
  })) as Supplier[] | null;
  return Array.isArray(res) ? res : [];
}

export async function createSupplierMutation(
  businessIdDoc: string,
  args: { name: string; taxId?: string; email?: string; phone?: string; notes?: string }
): Promise<Supplier> {
  return (await fetchApiV1({
    query: queries.createSupplier,
    type: "json",
    variables: { id: businessIdDoc, args },
  })) as Supplier;
}

export async function updateSupplierMutation(
  businessIdDoc: string,
  supplierId: string,
  args: Partial<{ name: string; taxId: string; email: string; phone: string; notes: string; status: boolean }>
): Promise<Supplier> {
  return (await fetchApiV1({
    query: queries.updateSupplier,
    type: "json",
    variables: { id: businessIdDoc, _id: supplierId, args },
  })) as Supplier;
}

export async function fetchPurchaseOrders(
  businessIdDoc: string,
  opts: { status?: PurchaseOrderStatus; supplierId?: string } = {}
): Promise<PurchaseOrder[]> {
  const res = (await fetchApiV1({
    query: queries.getPurchaseOrders,
    type: "json",
    variables: {
      id: businessIdDoc,
      status: opts.status,
      supplierId: opts.supplierId,
      limit: 200,
    },
  })) as PurchaseOrder[] | null;
  return Array.isArray(res) ? res : [];
}

export async function fetchPurchaseOrder(
  businessIdDoc: string,
  orderId: string
): Promise<PurchaseOrder> {
  return (await fetchApiV1({
    query: queries.getPurchaseOrder,
    type: "json",
    variables: { id: businessIdDoc, _id: orderId },
  })) as PurchaseOrder;
}

export async function createPurchaseOrderMutation(
  businessIdDoc: string,
  args: {
    supplierId: string;
    notes?: string;
    placeOrder?: boolean;
    lines: { variantId: string; quantityOrdered: number; unitCostMinor: number; description?: string }[];
  }
): Promise<PurchaseOrder> {
  return (await fetchApiV1({
    query: queries.createPurchaseOrder,
    type: "json",
    variables: { id: businessIdDoc, args },
  })) as PurchaseOrder;
}

export async function placePurchaseOrderMutation(businessIdDoc: string, orderId: string) {
  return fetchApiV1({
    query: queries.placePurchaseOrder,
    type: "json",
    variables: { id: businessIdDoc, _id: orderId },
  });
}

export async function cancelPurchaseOrderMutation(businessIdDoc: string, orderId: string) {
  return fetchApiV1({
    query: queries.cancelPurchaseOrder,
    type: "json",
    variables: { id: businessIdDoc, _id: orderId },
  });
}

export async function receivePurchaseOrderMutation(
  businessIdDoc: string,
  orderId: string,
  input: {
    concept?: string;
    lines: { lineId: string; quantity: number; unitCostMinor?: number }[];
  }
): Promise<{ purchaseOrder: PurchaseOrder; receipt: PurchaseReceipt; stockDocumentId: string }> {
  return (await fetchApiV1({
    query: queries.receivePurchaseOrder,
    type: "json",
    variables: { id: businessIdDoc, _id: orderId, input },
  })) as any;
}

/** Invalidar compras + stock tras recepción. */
export function purchasingInvalidateKeys() {
  return [purchasingQueryKeys.all, inventoryQueryKeys.all] as const;
}
