"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { FeatureGate } from "@/components/app-suite/FeatureGate";
import { StockDocumentDialog } from "@/components/inventory/StockDocumentDialog";
import { InventoryModeBadge } from "@/components/offerings/InventoryModeBadge";
import { getProductInventoryMode } from "@/lib/offerings/inventoryModeLabels";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import {
  fetchInventoryStockList,
  inventoryQueryKeys,
  updateVariantMinStockMutation,
  type InventoryStockRole,
} from "@/lib/queries/inventory";
import type { InventoryStockRow, Product, StockDocumentType } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowDownToLine, SlidersHorizontal } from "lucide-react";

function modeFromRow(row: InventoryStockRow) {
  const product = {
    is_sellable: row.is_sellable,
    trackInventory: row.trackInventory,
    hasBillOfMaterials: row.hasBillOfMaterials,
  } as Product;
  return getProductInventoryMode(product);
}

export function InventoryStockContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { business, loading: businessLoading } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;
  const { installedApps } = useBusinessApps(businessSlug);
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = !!canEditCurrentBusiness?.();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [rawOnly, setRawOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [docType, setDocType] = useState<StockDocumentType | null>(null);
  const [editingMin, setEditingMin] = useState<string | null>(null);
  const [minDraft, setMinDraft] = useState("");

  const role: InventoryStockRole = rawOnly ? "RAW" : "ALL";

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: inventoryQueryKeys.stock(businessIdDoc ?? null, {
      q: q.trim() || undefined,
      role,
      lowStockOnly,
    }),
    queryFn: () =>
      fetchInventoryStockList(businessIdDoc!, {
        q: q.trim() || undefined,
        role,
        lowStockOnly,
      }),
    enabled: !!businessIdDoc,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    await refetch();
  };

  const lowCount = useMemo(() => rows.filter((r) => r.lowStock).length, [rows]);

  const saveMinStock = async (row: InventoryStockRow) => {
    if (!businessIdDoc) return;
    const value = parseFloat(minDraft);
    if (Number.isNaN(value) || value < 0) {
      toast.error("min_stock debe ser ≥ 0");
      return;
    }
    try {
      await updateVariantMinStockMutation(businessIdDoc, row.variantId, value);
      toast.success("Mínimo actualizado");
      setEditingMin(null);
      await invalidate();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el mínimo");
    }
  };

  if (businessLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Saldos de inventario</h1>
          <p className="text-sm text-muted-foreground">
            Stock por SKU del catálogo. Los maestros se editan en Productos y servicios.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setDocType("INGRESO")}>
              <ArrowDownToLine className="h-4 w-4 mr-1" />
              Entrada
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setDocType("AJUSTE")}>
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Ajuste
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <InputSearch
            placeholder="Buscar por SKU, nombre o marca"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <FeatureGate capability="product.rawMaterial" installedApps={installedApps} businessId={businessSlug}>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Switch id="rawOnly" checked={rawOnly} onCheckedChange={setRawOnly} />
            <Label htmlFor="rawOnly" className="cursor-pointer text-sm">
              Solo insumos
            </Label>
          </div>
        </FeatureGate>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Switch id="lowOnly" checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
          <Label htmlFor="lowOnly" className="cursor-pointer text-sm">
            Bajo mínimo{lowCount > 0 ? ` (${lowCount})` : ""}
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay variantes con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const mode = modeFromRow(row);
                return (
                  <TableRow key={row.variantId}>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell>
                      <Link
                        href={`/${businessSlug}/offerings/products/${row.productId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.productName}
                      </Link>
                      {!row.is_sellable && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Insumo
                        </Badge>
                      )}
                      {row.lowStock && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Bajo mínimo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <InventoryModeBadge mode={mode} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stock_quantity}{" "}
                      <span className="text-xs text-muted-foreground">{row.unit_of_measure}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingMin === row.variantId ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            className="h-8 w-20 text-right"
                            type="number"
                            min={0}
                            step="any"
                            value={minDraft}
                            onChange={(e) => setMinDraft(e.target.value)}
                          />
                          <Button type="button" size="sm" className="h-8" onClick={() => void saveMinStock(row)}>
                            OK
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="tabular-nums text-sm hover:underline disabled:no-underline"
                          disabled={!canEdit}
                          onClick={() => {
                            setEditingMin(row.variantId);
                            setMinDraft(String(row.min_stock ?? 0));
                          }}
                        >
                          {row.min_stock ?? 0}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${businessSlug}/offerings/products/${row.productId}`}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {businessIdDoc && docType && (
        <StockDocumentDialog
          open={!!docType}
          onOpenChange={(open) => !open && setDocType(null)}
          businessIdDoc={businessIdDoc}
          type={docType}
          onSuccess={() => void invalidate()}
        />
      )}
    </div>
  );
}
