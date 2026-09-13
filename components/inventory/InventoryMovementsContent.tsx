"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockDocumentDialog } from "@/components/inventory/StockDocumentDialog";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { fetchInventoryLogs, inventoryQueryKeys } from "@/lib/queries/inventory";
import type { StockDocumentType } from "@/lib/interfases";
import { ArrowDownToLine, SlidersHorizontal } from "lucide-react";

export function InventoryMovementsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { business } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = !!canEditCurrentBusiness?.();
  const queryClient = useQueryClient();

  const [sku, setSku] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [docType, setDocType] = useState<StockDocumentType | null>(null);

  const filters = {
    sku: sku.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: inventoryQueryKeys.logs(businessIdDoc ?? null, filters),
    queryFn: () =>
      fetchInventoryLogs(businessIdDoc!, {
        sku: filters.sku,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        limit: 200,
      }),
    enabled: !!businessIdDoc,
  });

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Kardex / movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Historial global de entradas, salidas, ventas y ajustes.
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

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="kardex-sku">SKU (opcional)</Label>
          <Input
            id="kardex-sku"
            className="mt-1"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Filtrar por SKU"
          />
        </div>
        <div>
          <Label htmlFor="kardex-from">Desde</Label>
          <Input
            id="kardex-from"
            type="date"
            className="mt-1"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="kardex-to">Hasta</Label>
          <Input
            id="kardex-to"
            type="date"
            className="mt-1"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
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
              <TableHead>Fecha</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cambio</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Concepto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin movimientos con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.sku}</TableCell>
                  <TableCell>{log.type}</TableCell>
                  <TableCell className="text-right tabular-nums">{log.quantity_change}</TableCell>
                  <TableCell className="text-right tabular-nums">{log.balance_after}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                    {log.concept}
                  </TableCell>
                </TableRow>
              ))
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
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
            void refetch();
          }}
        />
      )}
    </div>
  );
}
