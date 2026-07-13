"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export type OrderRow = {
  _id: string;
  status: string;
  salesChannel?: string;
  fulfillmentMethod?: string;
  clientName?: string;
  clientPhone?: string;
  totalUsd: number;
  summary?: string;
  invoiceId?: string;
  reservedUntil?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    reference?: string;
    phone?: string;
  };
  lines?: Array<{ sku: string; description: string; quantity: number; total: number }>;
  createdAt?: string;
};

const STATUS_LABELS: Record<string, string> = {
  quote: "Cotización",
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  in_preparation: "En preparación",
  dispatched: "Despachado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  generic: "Genérico",
  web: "Web",
  physical: "POS",
};

type Props = {
  businessId: string;
  businessSlug: string;
};

export function OrdersContent({ businessId, businessSlug }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("queue");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        statusFilter === "queue"
          ? await fetchApiV1({
            query: queries.getFulfillmentQueue,
            type: "json",
            variables: { id: businessId },
          })
          : await fetchApiV1({
            query: queries.getOrders,
            type: "json",
            variables: {
              id: businessId,
              filters: {
                status:
                  statusFilter === "all"
                    ? undefined
                    : statusFilter === "queue"
                      ? ["paid", "in_preparation", "dispatched"]
                      : [statusFilter],
              },
            },
          });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [businessId, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetchApiV1({
        query: queries.updateOrderStatus,
        type: "json",
        variables: { id: businessId, orderId, status },
      });
      toast.success("Estado actualizado");
      loadOrders();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al actualizar");
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Cola de pedidos</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="queue">Cola operativa</SelectItem>
            <SelectItem value="in_preparation">En preparación</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="dispatched">Despachados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadOrders}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No hay pedidos en esta cola.
        </p>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {order.clientName || "Cliente"} · ${order.totalUsd.toFixed(2)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.summary || order.lines?.map((l) => l.description).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  <Badge variant="secondary">{STATUS_LABELS[order.status] ?? order.status}</Badge>
                  {order.salesChannel && (
                    <Badge variant="outline">{CHANNEL_LABELS[order.salesChannel] ?? order.salesChannel}</Badge>
                  )}
                  {order.fulfillmentMethod && (
                    <Badge variant="outline">{order.fulfillmentMethod}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.shippingAddress?.street && (
                  <p className="text-xs text-muted-foreground">
                    Envío: {order.shippingAddress.street}, {order.shippingAddress.city}
                  </p>
                )}
                {order.reservedUntil && (
                  <p className="text-xs text-amber-600">
                    Reserva hasta: {new Date(order.reservedUntil).toLocaleString()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {order.status === "paid" && (
                    <Button size="sm" onClick={() => updateStatus(order._id, "in_preparation")}>
                      Iniciar preparación
                    </Button>
                  )}
                  {order.status === "in_preparation" && (
                    <Button size="sm" onClick={() => updateStatus(order._id, "dispatched")}>
                      Marcar despachado
                    </Button>
                  )}
                  {order.status === "dispatched" && (
                    <Button size="sm" onClick={() => updateStatus(order._id, "delivered")}>
                      Marcar entregado
                    </Button>
                  )}
                  {order.invoiceId && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/${businessSlug}/billing/facturas/${order.invoiceId}`}>
                        Ver factura
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
