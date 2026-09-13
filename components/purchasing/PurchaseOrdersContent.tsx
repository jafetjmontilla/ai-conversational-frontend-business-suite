"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { fetchPurchaseOrders, purchasingQueryKeys } from "@/lib/queries/purchasing";
import type { PurchaseOrderStatus } from "@/lib/interfases";
import { Plus } from "lucide-react";

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: "Borrador",
  ordered: "Confirmada",
  partial: "Parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

export function PurchaseOrdersContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { business, loading: businessLoading } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = !!canEditCurrentBusiness?.();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: purchasingQueryKeys.orders(businessIdDoc ?? null, {}),
    queryFn: () => fetchPurchaseOrders(businessIdDoc!),
    enabled: !!businessIdDoc,
  });

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
          <h1 className="text-lg font-semibold">Órdenes de compra</h1>
          <p className="text-sm text-muted-foreground">
            Confirma la OC y recibe mercancía para ingresar stock y actualizar costo promedio.
          </p>
        </div>
        {canEdit && (
          <Button asChild size="sm">
            <Link href={`/${businessSlug}/purchasing/orders/nuevo`}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva OC
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Líneas</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay órdenes de compra.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>
                    <Link
                      href={`/${businessSlug}/purchasing/orders/${o._id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      …{o._id.slice(-8)}
                    </Link>
                  </TableCell>
                  <TableCell>{o.supplier?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  </TableCell>
                  <TableCell>{o.lines?.length ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
