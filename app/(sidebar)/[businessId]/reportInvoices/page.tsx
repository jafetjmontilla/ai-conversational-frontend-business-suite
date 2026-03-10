"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Payment, PaymentResponse } from "@/lib/interfases";
import { toast } from "sonner";
import { FileBarChart, RefreshCw } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

interface MethodSummary {
  name: string;
  totalUsd: number;
  totalBs: number;
  count: number;
}

export default function ReportInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("");

  const businessIdDoc = business?._id;

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
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const fetchPayments = useCallback(() => {
    if (!businessIdDoc) return;
    setLoading(true);
    const filters: any = { status: "completed" };
    if (dateFilter) filters.dateFilter = dateFilter;
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
  }, [businessIdDoc, dateFilter]);

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
  if (!canEditCurrentBusiness?.()) {
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
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <Card className="flex flex-col w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Reporte de facturas por forma de pago
          </CardTitle>
          <CardDescription>Totales por método de pago (pagos completados)</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-2 flex-1">
          <div className="flex flex-wrap gap-2 p-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
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
