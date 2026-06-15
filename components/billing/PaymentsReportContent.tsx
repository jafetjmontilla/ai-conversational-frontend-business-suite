"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Payment, PaymentResponse } from "@/lib/interfases";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

export function PaymentsReportContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const { businessIdDoc } = useBusiness(businessId);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateFilter] = useState<string>("");
  const [statusFilter] = useState<string>("");
  const [searchQuery] = useState("");
  const [dateFrom] = useState("");
  const [dateTo] = useState("");

  const fetchPayments = useCallback(() => {
    if (!businessIdDoc) return;
    setLoading(true);
    const filters: Record<string, unknown> = {};
    if (dateFilter && dateFilter !== "custom") {
      filters.dateFilter = dateFilter;
      filters.offsetMinutes = new Date().getTimezoneOffset();
    }
    if (dateFilter === "custom") {
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
    }
    if (statusFilter) filters.status = statusFilter;
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    fetchApiV1({
      query: queries.getPayments,
      type: "json",
      variables: { id: businessIdDoc, filters: Object.keys(filters).length ? filters : undefined },
    })
      .then((res: PaymentResponse) => {
        setPayments(res?.results ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => {
        toast.error("Error al cargar pagos");
        setPayments([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [businessIdDoc, dateFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchPayments();
  }, [businessIdDoc, fetchPayments]);

  const totalUsd = payments.reduce((s, p) => s + (p.totalPaid ?? 0), 0);
  const totalBs = payments.reduce((s, p) => {
    const pm = p.paymentMethods ?? [];
    return s + pm.reduce((sm: number, m: { amountBs?: number }) => sm + (m.amountBs ?? 0), 0);
  }, 0);

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver reportes de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos
          </CardTitle>
          <CardDescription>Historial de pagos del negocio</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden p-0 md:p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>ID Pago</TableHead>
                    <TableHead>ID Factura</TableHead>
                    <TableHead>Total pagado (USD)</TableHead>
                    <TableHead>Total Bs</TableHead>
                    <TableHead>Tasa</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay pagos con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell>
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleString("es", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p._id.slice(-8)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(p.invoiceId).slice(-8)}</TableCell>
                        <TableCell>{p.totalPaid?.toFixed(2) ?? "0.00"}</TableCell>
                        <TableCell>
                          {(p.paymentMethods ?? []).reduce((s: number, m: { amountBs?: number }) => s + (m.amountBs ?? 0), 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{p.exchangeRate?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell>{p.status ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {payments.length > 0 && (
                <div className="p-4 mt-2 bg-muted/50 rounded-lg text-sm flex justify-between">
                  <span>
                    {total} pago(s)
                  </span>
                  <span>
                    Total USD: <strong>{totalUsd.toFixed(2)}</strong> · Total Bs: <strong>{totalBs.toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
