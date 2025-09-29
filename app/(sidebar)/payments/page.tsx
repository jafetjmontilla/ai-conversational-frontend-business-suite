"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Payment } from "@/lib/schemas/invoice";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSidebar } from "@/components/ui/sidebar";
import { Receipt, DollarSign, Calendar, Store } from "lucide-react";

export default function ReportPaymentsPage() {
  const [store, setStore] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { open } = useSidebar();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetchApiV1({
        query: queries.getPayments,
        type: "json"
      });

      if (response && response.results) {
        setPayments(response.results);
      }
    } catch (error) {
      console.error("Error al cargar pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments?.filter((payment) => {
      const byStore = store ? payment.store === store : true;
      const byStatus = status ? payment.status.toLowerCase().includes(status) : true;
      const byQuery = q
        ? payment._id.toLowerCase().includes(q) ||
        payment.invoiceId.toLowerCase().includes(q) ||
        payment.store.toLowerCase().includes(q) ||
        payment.paymentMethods.some(pm =>
          pm.name.toLowerCase().includes(q) ||
          pm.id.toLowerCase().includes(q)
        )
        : true;
      return byStore && byStatus && byQuery;
    });
  }, [payments, store, status, query]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStoreBadge = (store: string) => {
    switch (store) {
      case 'guardians':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Guardians</Badge>;
      case 'jaihom':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Jaihom</Badge>;
      default:
        return <Badge variant="outline">{store}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Reporte de Pagos
            </CardTitle>
            <CardDescription>Visualizar y filtrar todos los pagos procesados</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar pagos por ID, factura, tienda o método de pago"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Tienda:</span>
              <ToggleGroup
                type="single"
                value={store || ""}
                onValueChange={(value) => setStore(value || null)}
                className="border rounded-md"
              >
                <ToggleGroupItem value="guardians" className="px-3 py-1 text-sm">
                  Guardians
                </ToggleGroupItem>
                <ToggleGroupItem value="jaihom" className="px-3 py-1 text-sm">
                  Jaihom
                </ToggleGroupItem>
                <ToggleGroupItem value="" className="px-3 py-1 text-sm">
                  Todas
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado:</span>
              <ToggleGroup
                type="single"
                value={status || ""}
                onValueChange={(value) => setStatus(value || null)}
                className="border rounded-md"
              >
                <ToggleGroupItem value="completed" className="px-3 py-1 text-sm">
                  Completado
                </ToggleGroupItem>
                <ToggleGroupItem value="pending" className="px-3 py-1 text-sm">
                  Pendiente
                </ToggleGroupItem>
                <ToggleGroupItem value="" className="px-3 py-1 text-sm">
                  Todos
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Separator className="my-4" />

          <div id="scrolls-container" className={`${open ? 'md:w-[calc(100vw-370px)] h-[calc(100vh-245px)]' : 'md:w-[calc(100vw-195px)] h-[calc(100vh-245px)]'} overflow-auto`}>
            <div className="overflow-x-auto">
              <Table className="md:min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="md:sticky md:left-0 bg-card z-10 w-16">
                      <DollarSign className="h-4 w-4" />
                    </TableHead>
                    <TableHead className="md:sticky md:left-14 bg-card z-10 min-w-[120px]">ID Pago</TableHead>
                    <TableHead className="min-w-[120px]">ID Factura</TableHead>
                    <TableHead className="min-w-[100px]">Tienda</TableHead>
                    <TableHead className="min-w-[120px]">Total Pagado</TableHead>
                    <TableHead className="min-w-[100px]">Tasa BCV</TableHead>
                    <TableHead className="min-w-[150px]">Métodos de Pago</TableHead>
                    <TableHead className="min-w-[100px]">Estado</TableHead>
                    <TableHead className="min-w-[150px]">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Cargando pagos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="h-16 w-16 text-gray-300" />
                          <p className="text-lg text-gray-500">No hay pagos</p>
                          <p className="text-sm text-gray-400">No se encontraron pagos con los filtros aplicados</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered?.map((payment) => (
                      <TableRow key={payment._id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="md:sticky md:left-0 md:z-10 md:bg-card w-16">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </div>
                        </TableCell>
                        <TableCell className="md:sticky md:left-14 md:z-10 md:bg-card min-w-[120px]">
                          <span className="font-mono text-sm">{payment._id.slice(-8)}</span>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <span className="font-mono text-sm">{payment.invoiceId.slice(-8)}</span>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {getStoreBadge(payment.store)}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {formatCurrency(payment.totalPaid, 'USD')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatCurrency(payment.totalPaid * payment.tasaBCV, 'VES')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <span className="font-mono text-sm">{payment.tasaBCV.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex flex-col gap-1">
                            {payment.paymentMethods.map((method, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {method.name}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(method.amountUsd, 'USD')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{formatDate(payment.createdAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Resumen */}
          {filtered && filtered.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Mostrando {filtered.length} de {payments.length} pagos
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Total USD: <strong>{formatCurrency(
                      filtered.reduce((sum, p) => sum + p.totalPaid, 0),
                      'USD'
                    )}</strong>
                  </span>
                  <span>
                    Total Bs: <strong>{formatCurrency(
                      filtered.reduce((sum, p) => sum + (p.totalPaid * p.tasaBCV), 0),
                      'VES'
                    )}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
