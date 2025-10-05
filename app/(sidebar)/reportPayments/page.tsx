"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSidebar } from "@/components/ui/sidebar";
import { Receipt, DollarSign, Calendar, Store, RefreshCw } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { DateFilter } from "@/components/payments/DateFilter";
import { PaymentFilters } from "@/lib/schemas/invoice";

export default function ReportPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { open } = useSidebar();

  const { payments, total, loading, error, fetchPayments } = usePayments();

  const handleFilterChange = useCallback((newFilters: Partial<PaymentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchPayments(updatedFilters);
  }, [filters, fetchPayments]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const updatedFilters = { ...filters, search: query || undefined };
    setFilters(updatedFilters);
    fetchPayments(updatedFilters);
  }, [filters, fetchPayments]);

  const handleStoreFilter = useCallback((store: string) => {
    handleFilterChange({
      store: store === "" ? undefined : store as 'guardians' | 'jaihom'
    });
  }, [handleFilterChange]);

  const handleStatusFilter = useCallback((status: string) => {
    handleFilterChange({
      status: status === "" ? undefined : status
    });
  }, [handleFilterChange]);

  const handleDateFilter = useCallback((dateFilters: {
    dateFilter?: 'today' | 'week' | 'month' | 'year';
    dateFrom?: string;
    dateTo?: string;
    offsetMinutes?: number;
  }) => {
    handleFilterChange(dateFilters);
  }, [handleFilterChange]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    fetchPayments({});
  }, [fetchPayments]);

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

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full h-full">
      <Card className='flex flex-col w-full h-full overflow-hidden'>
        <CardHeader className='h-[72px]'>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Reporte de Pagos
            </CardTitle>
            <CardDescription>Visualizar y filtrar todos los pagos procesados</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6 w-full flex-1 flex flex-col">
          {/* Barra de búsqueda */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <InputSearch
                  placeholder="Buscar pagos por ID, factura, tienda, cliente o método de pago"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPayments(filters)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {/* Botón para limpiar filtros */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600"
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="space-y-4 mb-4">
            {/* Filtros de tienda y estado */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="text-sm font-medium">Tienda:</span>
                <ToggleGroup
                  type="single"
                  value={filters.store || ""}
                  onValueChange={handleStoreFilter}
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
                  value={filters.status || ""}
                  onValueChange={handleStatusFilter}
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
            {/* Filtros de fecha */}
            <DateFilter
              value={{
                dateFilter: filters.dateFilter,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                offsetMinutes: filters.offsetMinutes
              }}
              onChange={handleDateFilter}
            />
          </div>
          <div id="scrolls-container" className={`${open ? 'md:w-[calc(100vw-370px)]' : 'md:w-[calc(100vw-195px)]'} h-[calc(100vh-436px)] overflow-auto relative`}>
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="md:sticky md:left-0 md:bg-background md:z-30 w-16 md:border-r">
                    <DollarSign className="h-4 w-4" />
                  </TableHead>
                  <TableHead className="md:sticky md:left-16 md:bg-background md:z-30 min-w-[120px] md:border-r">ID Pago</TableHead>
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
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-red-600">Error: {error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPayments(filters)}
                        >
                          Reintentar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-16 w-16 text-gray-300" />
                        <p className="text-lg text-gray-500">No hay pagos</p>
                        <p className="text-sm text-gray-400">
                          {hasActiveFilters
                            ? "No se encontraron pagos con los filtros aplicados"
                            : "No hay pagos registrados en el sistema"
                          }
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="mt-2"
                          >
                            Limpiar Filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments?.map((payment) => (
                    <TableRow key={payment._id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="md:sticky md:left-0 md:bg-background md:z-10 w-16 md:border-r">
                        <div className="flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                      </TableCell>
                      <TableCell className="md:sticky md:left-16 md:bg-background md:z-10 min-w-[120px] md:border-r">
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

          {/* Resumen */}
          {payments && payments.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Mostrando {payments.length} de {total} pagos
                  {hasActiveFilters && " (filtrados)"}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Total USD: <strong>{formatCurrency(
                      payments.reduce((sum, p) => sum + p.totalPaid, 0),
                      'USD'
                    )}</strong>
                  </span>
                  <span>
                    Total Bs: <strong>{formatCurrency(
                      payments.reduce((sum, p) => sum + (p.totalPaid * p.tasaBCV), 0),
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