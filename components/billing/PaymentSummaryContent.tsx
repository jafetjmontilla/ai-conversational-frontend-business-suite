"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Payment, PaymentResponse } from "@/lib/interfases";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

interface MethodSummary {
  name: string;
  totalUsd: number;
  totalBs: number;
  count: number;
}

export function PaymentSummaryContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const { businessIdDoc } = useBusiness(businessId);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter] = useState<string>("");
  const [dateFrom] = useState("");
  const [dateTo] = useState("");

  const fetchPayments = useCallback(() => {
    if (!businessIdDoc) return;
    setLoading(true);
    const filters: Record<string, unknown> = { status: "completed" };
    if (dateFilter && dateFilter !== "custom") {
      filters.dateFilter = dateFilter;
      filters.offsetMinutes = new Date().getTimezoneOffset();
    }
    if (dateFilter === "custom") {
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
    }
    fetchApiV1({
      query: queries.getPayments,
      type: "json",
      variables: { id: businessIdDoc, filters },
    })
      .then((res: PaymentResponse) => {
        setPayments(res?.results ?? []);
      })
      .catch(() => {
        toast.error("Error al cargar datos");
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, [businessIdDoc, dateFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchPayments();
  }, [businessIdDoc, fetchPayments]);

  const byMethod = useMemo(() => {
    const map = new Map<string, MethodSummary>();
    for (const p of payments) {
      const methods = p.paymentMethods ?? [];
      for (const m of methods) {
        const name = m.name || "Sin nombre";
        const existing = map.get(name);
        const usd = m.amountUsd ?? 0;
        const bs = m.amountBs ?? 0;
        if (existing) {
          existing.totalUsd += usd;
          existing.totalBs += bs;
          existing.count += 1;
        } else {
          map.set(name, { name, totalUsd: usd, totalBs: bs, count: 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
  }, [payments]);

  const totalUsd = byMethod.reduce((s, x) => s + x.totalUsd, 0);
  const totalBs = byMethod.reduce((s, x) => s + x.totalBs, 0);
  const totalCount = payments.length;

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
            <FileBarChart className="h-5 w-5" />
            Resumen
          </CardTitle>
          <CardDescription>Totales por método de pago (pagos completados)</CardDescription>
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
                    <TableHead>Forma de pago</TableHead>
                    <TableHead>Cantidad de pagos</TableHead>
                    <TableHead>Total USD</TableHead>
                    <TableHead>Total Bs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byMethod.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay pagos completados en el período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    byMethod.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>{row.totalUsd.toFixed(2)}</TableCell>
                        <TableCell>{row.totalBs.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {byMethod.length > 0 && (
                <div className="p-4 mt-2 bg-muted/50 rounded-lg text-sm flex justify-between flex-wrap gap-2">
                  <span>Total de pagos: <strong>{totalCount}</strong></span>
                  <span>Total USD: <strong>{totalUsd.toFixed(2)}</strong></span>
                  <span>Total Bs: <strong>{totalBs.toFixed(2)}</strong></span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
