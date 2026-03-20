"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Invoice, InvoiceItemType } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, CreditCard } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { PaymentDialog } from "@/components/invoice/PaymentDialog";

type SellableVariantRow = {
  _id: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
  product?: { name: string; base_price?: number } | null;
};

interface InvoiceItemRow {
  id: string;
  inventoryId: string;
  productVariantId?: string;
  serviceOptionId?: string;
  itemType?: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  searchTerm?: string;
  searchResults?: SellableVariantRow[];
}

export default function InvoiceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const invoiceId = params?.invoiceId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const businessIdDoc = business?._id;
  const exchangeRate =
    business?.billingExchangeRateSource === "custom" && business?.billingCustomExchangeRate
      ? business.billingCustomExchangeRate
      : 1;

  const canEdit = canEditCurrentBusiness?.() && invoice?.status === "draft";

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        let b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        })) as Business | null;
        if (!b && businessId) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
        }
        if (cancelled) return;
        setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  const loadInvoice = useCallback(async () => {
    if (!businessIdDoc || !invoiceId) return;
    setLoading(true);
    try {
      const inv = await fetchApiV1({
        query: queries.getInvoice,
        type: "json",
        variables: { _id: invoiceId, id: businessIdDoc },
      }) as Invoice | null;
      if (!inv) {
        toast.error("Factura no encontrada");
        router.push(`/${businessId}/invoice`);
        return;
      }
      setInvoice(inv);
      setClientName(inv.clientName || "");
      setClientId(inv.clientId || "");
      setClientPhone(inv.clientPhone || "");
      setItems(
        (inv.items || []).map((it, idx) => ({
          id: it.id || `item-${idx}`,
          inventoryId: it.inventoryId || "",
          productVariantId: it.productVariantId || undefined,
          serviceOptionId: it.serviceOptionId || undefined,
          itemType: it.itemType ?? "product_variant",
          description: it.description || "",
          quantity: it.quantity || 0,
          unitPrice: it.unitPrice || 0,
          total: it.total || 0,
        }))
      );
    } catch (e: any) {
      toast.error(e?.message || "Error al cargar la factura");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, invoiceId]);

  useEffect(() => {
    if (businessIdDoc) loadInvoice();
  }, [businessIdDoc, loadInvoice]);

  const totalBs = items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      inventoryId: "",
      productVariantId: undefined,
      serviceOptionId: undefined,
      itemType: "product_variant",
      description: "",
      quantity: 0,
      unitPrice: 0,
      total: 0,
    }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceItemRow, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      if (field === "quantity" || field === "unitPrice") {
        updated[idx].total = Math.round((updated[idx].quantity * updated[idx].unitPrice + Number.EPSILON) * 100) / 100;
      }
      return updated;
    });
  };

  const searchInventory = async (idx: number, term: string) => {
    updateItem(idx, "searchTerm", term);
    updateItem(idx, "description", term);
    if (!businessIdDoc || term.trim().length < 2) {
      setItems(prev => {
        const u = [...prev];
        u[idx] = { ...u[idx], searchResults: [] };
        return u;
      });
      return;
    }
    try {
      const results = await fetchApiV1({
        query: queries.getSellableVariants,
        type: "json",
        variables: { id: businessIdDoc, search: term.trim() || undefined, limit: 15 },
      }) as SellableVariantRow[] | null;
      setItems(prev => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], searchResults: results || [] };
        return updated;
      });
    } catch {
      setItems(prev => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], searchResults: [] };
        return updated;
      });
    }
  };

  const selectInventoryItem = (idx: number, row: SellableVariantRow) => {
    const productName = row.product?.name ?? "";
    const description = row.sku ? `${productName} - ${row.sku}`.trim() : productName || row.sku || "Sin nombre";
    const unitPrice = row.price_override ?? row.product?.base_price ?? 0;
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        inventoryId: "",
        productVariantId: row._id,
        itemType: "product_variant",
        description,
        unitPrice: Number(unitPrice),
        total: Math.round((updated[idx].quantity * Number(unitPrice) + Number.EPSILON) * 100) / 100,
        searchResults: [],
        searchTerm: "",
        id: row.sku || updated[idx].id,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!businessIdDoc || !invoiceId) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateInvoice,
        type: "json",
        variables: {
          _id: invoiceId,
          id: businessIdDoc,
          args: {
            clientName: clientName.trim(),
            clientId: clientId.trim(),
            clientPhone: clientPhone.trim(),
            items: items.map(it => ({
              id: it.id,
              inventoryId: it.inventoryId || "",
              itemType: it.productVariantId ? "product_variant" : (it.itemType ?? "inventory"),
              productVariantId: it.productVariantId || undefined,
              serviceOptionId: it.serviceOptionId || undefined,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: Math.round((it.quantity * it.unitPrice + Number.EPSILON) * 100) / 100,
            })),
          },
        },
      });
      toast.success("Factura guardada");
      await loadInvoice();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver esta factura.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/${businessId}/invoice`)}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${businessId}/invoice`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a facturas
        </Button>
      </div>
      <Card className="flex flex-col w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Factura {invoice?.status === "paid" ? "(Pagada)" : invoice?.status === "cancelled" ? "(Anulada)" : "(Borrador)"}</span>
            <div className="flex gap-2">
              {canEdit && (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  {items.length > 0 && totalBs > 0 && (
                    <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pagar
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardTitle>
          <CardDescription>ID: {invoiceId?.slice(-8)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nombre del cliente</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} disabled={!canEdit} placeholder="Nombre" />
            </div>
            <div>
              <Label>Cédula / RIF</Label>
              <Input value={clientId} onChange={e => setClientId(e.target.value)} disabled={!canEdit} placeholder="V-12345678" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} disabled={!canEdit} placeholder="+58..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base">Items</Label>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar item
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Descripción</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio unit.</TableHead>
                  <TableHead>Total</TableHead>
                  {canEdit && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No hay items. {canEdit ? 'Agrega uno con "Agregar item".' : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="relative">
                        {canEdit ? (
                          <div>
                            <Input
                              value={item.searchTerm !== undefined ? item.searchTerm : item.description}
                              onChange={e => searchInventory(idx, e.target.value)}
                              placeholder="Buscar producto..."
                            />
                            {(item.searchResults?.length ?? 0) > 0 && (
                              <div className="absolute z-10 bg-popover border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto w-[90%]">
                                {item.searchResults!.map(row => {
                                  const price = row.price_override ?? row.product?.base_price ?? 0;
                                  const label = row.product?.name ? `${row.product.name} - ${row.sku}` : row.sku;
                                  return (
                                    <div
                                      key={row._id}
                                      className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                                      onClick={() => selectInventoryItem(idx, row)}
                                    >
                                      <span className="font-medium">{label}</span> (Disp: {(row.stock_quantity ?? 0).toFixed(0)}, Precio: {Number(price).toFixed(2)})
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>{item.description}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min={0}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="w-24"
                            min={0}
                            step="0.01"
                          />
                        ) : (
                          item.unitPrice.toFixed(2)
                        )}
                      </TableCell>
                      <TableCell>{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="bg-muted/50 rounded-lg p-4 text-right">
              <p className="text-sm text-muted-foreground">Total Bs</p>
              <p className="text-2xl font-bold">{totalBs.toFixed(2)}</p>
              {exchangeRate > 1 && (
                <>
                  <p className="text-sm text-muted-foreground mt-1">Total USD (tasa: {exchangeRate})</p>
                  <p className="text-lg">{(totalBs / exchangeRate).toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {businessIdDoc && invoice && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          invoice={{ ...invoice, totalBs, items: items as any }}
          businessId={businessIdDoc}
          exchangeRate={exchangeRate}
          onSuccess={() => { setPaymentDialogOpen(false); loadInvoice(); }}
        />
      )}
    </div>
  );
}
