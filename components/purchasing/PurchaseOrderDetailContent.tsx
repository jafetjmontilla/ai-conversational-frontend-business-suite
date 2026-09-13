"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import {
  cancelPurchaseOrderMutation,
  fetchPurchaseOrder,
  placePurchaseOrderMutation,
  purchasingInvalidateKeys,
  purchasingQueryKeys,
  receivePurchaseOrderMutation,
} from "@/lib/queries/purchasing";
import type { PurchaseOrderStatus } from "@/lib/interfases";
import { majorToMinor, minorToMajor } from "@/lib/money";
import { toast } from "sonner";

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: "Borrador",
  ordered: "Confirmada",
  partial: "Parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

export function PurchaseOrderDetailContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const orderId = params?.orderId as string;
  const { business, loading: businessLoading } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = !!canEditCurrentBusiness?.();
  const queryClient = useQueryClient();

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [concept, setConcept] = useState("");
  const [recvQty, setRecvQty] = useState<Record<string, string>>({});
  const [recvCost, setRecvCost] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: purchasingQueryKeys.order(businessIdDoc ?? null, orderId),
    queryFn: () => fetchPurchaseOrder(businessIdDoc!, orderId),
    enabled: !!businessIdDoc && !!orderId,
  });

  const pendingLines = useMemo(
    () =>
      (order?.lines ?? []).filter(
        (l) => (l.quantityOrdered ?? 0) - (l.quantityReceived ?? 0) > 1e-9
      ),
    [order]
  );

  const invalidateAll = async () => {
    for (const key of purchasingInvalidateKeys()) {
      await queryClient.invalidateQueries({ queryKey: key });
    }
    await refetch();
  };

  const handlePlace = async () => {
    if (!businessIdDoc) return;
    setBusy(true);
    try {
      await placePurchaseOrderMutation(businessIdDoc, orderId);
      toast.success("OC confirmada");
      await invalidateAll();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo confirmar");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!businessIdDoc) return;
    setBusy(true);
    try {
      await cancelPurchaseOrderMutation(businessIdDoc, orderId);
      toast.success("OC cancelada");
      await invalidateAll();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cancelar");
    } finally {
      setBusy(false);
    }
  };

  const openReceive = () => {
    const qty: Record<string, string> = {};
    const cost: Record<string, string> = {};
    for (const l of pendingLines) {
      const rem = (l.quantityOrdered ?? 0) - (l.quantityReceived ?? 0);
      qty[l._id] = String(rem);
      cost[l._id] = String(minorToMajor(l.unitCostMinor ?? 0));
    }
    setRecvQty(qty);
    setRecvCost(cost);
    setConcept("");
    setReceiveOpen(true);
  };

  const handleReceive = async () => {
    if (!businessIdDoc || !order) return;
    const lines = pendingLines
      .map((l) => {
        const q = parseFloat(recvQty[l._id] || "0");
        if (!q || q <= 0) return null;
        let unitCostMinor: number | undefined;
        try {
          if (recvCost[l._id] != null && recvCost[l._id] !== "") {
            unitCostMinor = majorToMinor(recvCost[l._id]);
          }
        } catch {
          throw new Error(`Costo inválido en ${l.sku}`);
        }
        return { lineId: l._id, quantity: q, unitCostMinor };
      })
      .filter(Boolean) as { lineId: string; quantity: number; unitCostMinor?: number }[];

    if (lines.length === 0) {
      toast.error("Indica al menos una cantidad a recibir");
      return;
    }

    setBusy(true);
    try {
      await receivePurchaseOrderMutation(businessIdDoc, orderId, {
        concept: concept.trim() || undefined,
        lines,
      });
      toast.success("Recepción registrada: stock y costo promedio actualizados");
      setReceiveOpen(false);
      await invalidateAll();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo recibir");
    } finally {
      setBusy(false);
    }
  };

  if (businessLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground p-4">Orden no encontrada.</p>;
  }

  const canReceive = canEdit && (order.status === "ordered" || order.status === "partial");

  return (
    <div className="space-y-4 p-1 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/${businessSlug}/purchasing/orders`} className="text-primary hover:underline">
              ← Órdenes
            </Link>
          </p>
          <h1 className="text-lg font-semibold font-mono">OC …{order._id.slice(-8)}</h1>
          <p className="text-sm">
            Proveedor: <span className="font-medium">{order.supplier?.name ?? "—"}</span>{" "}
            <Badge variant="secondary" className="ml-2">
              {STATUS_LABEL[order.status]}
            </Badge>
          </p>
          {order.notes && <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>}
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {order.status === "draft" && (
              <Button type="button" size="sm" disabled={busy} onClick={() => void handlePlace()}>
                Confirmar
              </Button>
            )}
            {canReceive && (
              <Button type="button" size="sm" disabled={busy} onClick={openReceive}>
                Recibir
              </Button>
            )}
            {(order.status === "draft" || order.status === "ordered") && (
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void handleCancel()}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Pedida</TableHead>
            <TableHead className="text-right">Recibida</TableHead>
            <TableHead className="text-right">Costo u.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.lines.map((l) => (
            <TableRow key={l._id}>
              <TableCell className="font-mono text-xs">{l.sku}</TableCell>
              <TableCell>{l.description || "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{l.quantityOrdered}</TableCell>
              <TableCell className="text-right tabular-nums">{l.quantityReceived}</TableCell>
              <TableCell className="text-right tabular-nums">{minorToMajor(l.unitCostMinor).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recibir mercancía</DialogTitle>
            <DialogDescription>
              Genera un INGRESO de inventario y recalcula el costo promedio ponderado de cada SKU.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Concepto (opcional)</Label>
              <Input
                className="mt-1"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Remisión 1234"
              />
            </div>
            {pendingLines.map((l) => {
              const rem = (l.quantityOrdered ?? 0) - (l.quantityReceived ?? 0);
              return (
                <div key={l._id} className="rounded-md border p-3 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-sm font-medium">
                    {l.sku} <span className="text-muted-foreground font-normal">pendiente {rem}</span>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="any"
                      value={recvQty[l._id] ?? ""}
                      onChange={(e) => setRecvQty((m) => ({ ...m, [l._id]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Costo u.</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={recvCost[l._id] ?? ""}
                      onChange={(e) => setRecvCost((m) => ({ ...m, [l._id]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={busy} onClick={() => void handleReceive()}>
              {busy ? "Recibiendo…" : "Confirmar recepción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
