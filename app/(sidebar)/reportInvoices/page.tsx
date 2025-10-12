"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSidebar } from "@/components/ui/sidebar";
import { FileText, Calendar, RefreshCw } from "lucide-react";
import { fetchApiV1 } from "@/lib/Fetching";
import { queries } from "@/lib/Fetching";
import { Payment } from "@/lib/schemas/invoice";
import { DateFilter } from "@/components/payments/DateFilter";
import { PaymentFilters } from "@/lib/schemas/invoice";
import { useAllowed } from "@/lib/hooks/useAllowed";

interface PaymentMethodSummary {
  name: string;
  totalUsd: number;
  totalBs: number;
  count: number;
}

interface StoreSummary {
  store: 'guardians' | 'jaihom';
  paymentMethods: Map<string, PaymentMethodSummary>;
  totalUsd: number;
  totalBs: number;
  totalPayments: number;
}

export default function ReportInvoicesPage() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { open } = useSidebar();
  const { hasRole, getCurrentRole } = useAllowed();

  const fetchPayments = useCallback(async (filters: PaymentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchApiV1({
        query: queries.getPayments,
        type: 'json',
        variables: {
          filters: Object.keys(filters).length > 0 ? filters : undefined
        }
      });

      if (response && response.results) {
        setPayments(response.results);
        setTotal(response.total);
      } else {
        setPayments([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo pagos:', err);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar filtros desde localStorage al inicializar y aplicar restricciones de rol
  useEffect(() => {
    const savedFilters = localStorage.getItem('reportInvoices-filters');
    const savedSearchQuery = localStorage.getItem('reportInvoices-searchQuery');

    let hasFilters = false;
    let filtersToApply = {};

    // Determinar la tienda permitida según el rol del usuario
    const userRole = getCurrentRole();
    let allowedStore: 'guardians' | 'jaihom' | null = null;

    if (hasRole('customerServiceG')) {
      allowedStore = 'guardians';
    } else if (hasRole('customerServiceJ')) {
      allowedStore = 'jaihom';
    }

    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        // Verificar si hay filtros válidos (no solo un objeto vacío)
        if (Object.keys(parsedFilters).length > 0) {
          // Si el usuario tiene restricción de tienda, aplicar automáticamente
          if (allowedStore) {
            parsedFilters.store = allowedStore;
          }
          setFilters(parsedFilters);
          filtersToApply = parsedFilters;
          hasFilters = true;
        }
      } catch (error) {
        console.error('Error al cargar filtros desde localStorage:', error);
      }
    }

    // Si no hay filtros guardados pero el usuario tiene restricción de tienda, aplicar automáticamente
    if (!hasFilters && allowedStore) {
      filtersToApply = { store: allowedStore };
      setFilters(filtersToApply);
      hasFilters = true;
    }

    if (savedSearchQuery) {
      setSearchQuery(savedSearchQuery);
    }

    // Solo hacer fetch si hay filtros guardados o restricciones de rol
    if (hasFilters) {
      fetchPayments(filtersToApply);
    }
  }, [fetchPayments, hasRole, getCurrentRole]);

  const handleFilterChange = useCallback((newFilters: Partial<PaymentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    // Guardar filtros en localStorage
    localStorage.setItem('reportInvoices-filters', JSON.stringify(updatedFilters));
    fetchPayments(updatedFilters);
  }, [filters, fetchPayments]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const updatedFilters = { ...filters, search: query || undefined };
    setFilters(updatedFilters);
    // Guardar query de búsqueda y filtros en localStorage
    localStorage.setItem('reportInvoices-searchQuery', query);
    localStorage.setItem('reportInvoices-filters', JSON.stringify(updatedFilters));
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
    // Limpiar localStorage
    localStorage.removeItem('reportInvoices-filters');
    localStorage.removeItem('reportInvoices-searchQuery');
    fetchPayments({});
  }, [fetchPayments]);

  // Calcular resumen por tienda y forma de pago
  const storeSummaries = useMemo(() => {
    const summaries = new Map<string, StoreSummary>();

    payments.forEach(payment => {
      if (payment.status.toLowerCase() !== 'completed') return;

      if (!summaries.has(payment.store)) {
        summaries.set(payment.store, {
          store: payment.store,
          paymentMethods: new Map<string, PaymentMethodSummary>(),
          totalUsd: 0,
          totalBs: 0,
          totalPayments: 0
        });
      }

      const storeSummary = summaries.get(payment.store)!;
      storeSummary.totalPayments++;
      storeSummary.totalUsd += payment.totalPaid;
      storeSummary.totalBs += payment.totalPaid * payment.tasaBCV;

      payment.paymentMethods.forEach(method => {
        const methodName = method.name;
        if (!storeSummary.paymentMethods.has(methodName)) {
          storeSummary.paymentMethods.set(methodName, {
            name: methodName,
            totalUsd: 0,
            totalBs: 0,
            count: 0
          });
        }

        const methodSummary = storeSummary.paymentMethods.get(methodName)!;
        methodSummary.totalUsd += method.amountUsd;
        methodSummary.totalBs += method.amountBs;
        methodSummary.count++;
      });
    });

    return Array.from(summaries.values());
  }, [payments]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
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

  // Calcular totales generales
  const grandTotalUsd = storeSummaries.reduce((sum, store) => sum + store.totalUsd, 0);
  const grandTotalBs = storeSummaries.reduce((sum, store) => sum + store.totalBs, 0);
  const grandTotalPayments = storeSummaries.reduce((sum, store) => sum + store.totalPayments, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full h-full">
      <Card className='flex flex-col w-full h-full overflow-hidden'>
        <CardHeader className='h-[72px]'>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reporte de Facturas por Forma de Pago
            </CardTitle>
            <CardDescription>Totales discriminados por tienda y método de pago</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-2 w-full flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-1 md:gap-2 p-2 pt-0">

            {/* Barra de búsqueda */}
            <div className="flex items-center w-full justify-between gap-1 md:gap-4 text-[10px] md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 flex-1">
                <div className="flex-1">
                  <InputSearch
                    placeholder="Buscar por ID, factura, tienda, cliente o método de pago"
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600"
                  disabled={!hasActiveFilters}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
            {/* Filtros de tienda y estado */}
            {!hasRole('customerServiceG') && !hasRole('customerServiceJ') && (
              <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm">
                <span className="font-medium">Tienda:</span>
                <ToggleGroup
                  type="single"
                  value={filters.store || ""}
                  onValueChange={handleStoreFilter}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="guardians" className="px-3 py-1 text-[10px] md:text-sm">
                    Guardians
                  </ToggleGroupItem>
                  <ToggleGroupItem value="jaihom" className="px-3 py-1 text-[10px] md:text-sm">
                    Jaihom
                  </ToggleGroupItem>
                  <ToggleGroupItem value="" className="px-3 py-1 text-[10px] md:text-sm">
                    Todas
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm">
              <span className="font-medium">Estado:</span>
              <ToggleGroup
                type="single"
                value={filters.status || ""}
                onValueChange={handleStatusFilter}
                className="border rounded-md"
              >
                <ToggleGroupItem value="completed" className="px-3 py-1 text-[10px] md:text-sm">
                  Completado
                </ToggleGroupItem>
                <ToggleGroupItem value="pending" className="px-3 py-1 text-[10px] md:text-sm">
                  Pendiente
                </ToggleGroupItem>
                <ToggleGroupItem value="" className="px-3 py-1 text-[10px] md:text-sm">
                  Todos
                </ToggleGroupItem>
              </ToggleGroup>
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

          <div id="scrolls-table-container" className={`${open ? 'md:w-[calc(100vw-338px)]' : 'md:w-[calc(100vw-164px)]'} relative overflow-auto`}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-lg">Cargando datos...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <p className="text-red-600 text-lg">Error: {error}</p>
                <Button
                  variant="outline"
                  onClick={() => fetchPayments(filters)}
                >
                  Reintentar
                </Button>
              </div>
            ) : payments?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <FileText className="h-24 w-24 text-gray-300" />
                <p className="text-lg text-gray-500">No hay datos para mostrar</p>
                <p className="text-sm text-gray-400">
                  {hasActiveFilters
                    ? "No se encontraron pagos con los filtros aplicados"
                    : "No hay pagos registrados en el sistema"
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {/* Resumen por tienda */}
                {storeSummaries.map(storeSummary => (
                  <Card key={storeSummary.store} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStoreBadge(storeSummary.store)}
                          <span className="text-sm text-gray-500">
                            {storeSummary.totalPayments} pagos completados
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total USD</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(storeSummary.totalUsd, 'USD')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total Bs</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(storeSummary.totalBs, 'VES')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Forma de Pago</TableHead>
                            <TableHead className="text-center">Cantidad de Pagos</TableHead>
                            <TableHead className="text-right">Total USD</TableHead>
                            <TableHead className="text-right">Total Bs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from(storeSummary.paymentMethods.values()).map((method) => (
                            <TableRow key={method.name}>
                              <TableCell>
                                <Badge variant="outline" className="font-medium">
                                  {method.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{method.count}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-700">
                                {formatCurrency(method.totalUsd, 'USD')}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-700">
                                {formatCurrency(method.totalBs, 'VES')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}

                {/* Resumen general */}
                {storeSummaries.length > 1 && (
                  <Card className="border-2 border-primary bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Resumen General</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <p className="text-sm text-gray-500 mb-2">Total de Pagos</p>
                          <p className="text-3xl font-bold text-primary">{grandTotalPayments}</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <p className="text-sm text-gray-500 mb-2">Total USD</p>
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(grandTotalUsd, 'USD')}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <p className="text-sm text-gray-500 mb-2">Total Bs</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {formatCurrency(grandTotalBs, 'VES')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Información adicional */}
          {payments && payments.length > 0 && (
            <div className="p-4 mt-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Mostrando {payments.length} de {total} pagos
                  {hasActiveFilters && " (filtrados)"}
                </span>
                <span className="text-gray-500">
                  Solo se incluyen pagos completados en el resumen
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

