"use client";

import React, { useState, useEffect, useMemo, useRef, useReducer } from 'react';
import { usePDF } from 'react-to-pdf';
import { Column, ColumnDef, ColumnFiltersState, FilterFn, SortingFn, Table, createColumnHelper, flexRender, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, sortingFns, useReactTable } from "@tanstack/react-table";
import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils';
import { fetchApiJaihomV1, queries } from '@/lib/Fetching';
import { PaymentReportResult, FetchPaymentReportResults, getFormaPagoNombre } from '@/lib/types/payment-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, RefreshCw, Phone, ExternalLink, Settings, Search, FilterIcon, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Configuración de filtros fuzzy para la tabla
declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0;
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!
    );
  }
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

const columnHelper = createColumnHelper<PaymentReportResult>();

// Función para formatear fechas
const getDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-VE');
};

const getDateTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('es-VE');
};

// Función para obtener el primer y último día de la semana
const obtenerPrimerYUltimoDiaSemana = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar cuando es domingo
  const primero = new Date(hoy.setDate(diff));
  const ultimo = new Date(primero);
  ultimo.setDate(primero.getDate() + 6);
  return { primero, ultimo };
};

export default function PaymentsReportsPage() {
  const { toPDF, targetRef } = usePDF({ filename: 'payment-reports.pdf' });

  // Estados principales
  const [data, setData] = useState<PaymentReportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectRow, setSelectRow] = useState<string | null>(null);
  const [searchColumn, setSearchColumn] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [columnsView, setColumnsView] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const rerender = useReducer(() => ({}), {})[1];

  // Estados de filtros
  const [estadoFilter, setEstadoFilter] = useState<"all" | "procesado" | "no procesado">("no procesado");
  const [dateFilter, setDateFilter] = useState("month");
  const [rangeFilter, setRangeFilter] = useState<{ startDateFilter: Date; endDateFilter: Date } | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<Date>(new Date());
  const [endDateFilter, setEndDateFilter] = useState<Date>(new Date());

  // Estados de la tabla
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id_factura: true,
    estado: true,
    total_cobrado: true,
    accion: false,
    messages: true,
    referencia: true,
    fecha_pago: false,
    saldo: true,
    total: true,
    forma_pago: true,
    telefono: false,
    createdAt: true,
    updatedAt: false,
    acciones: true
  });

  // Función para recargar factura
  const handleReloadInvoice = async (id_factura: string, rowIndex: number) => {
    try {
      setLoading(true);
      const result = await fetchApiJaihomV1({
        query: queries.reloadInvoice,
        variables: { id_factura },
      });

      if (result && result.estado === "procesado") {
        setData(prevData => {
          const newData = [...prevData];
          newData[rowIndex] = result;
          return newData;
        });
      }
    } catch (error) {
      console.error('Error al recargar factura:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para copiar teléfono
  const handleCopyPhone = async (telefono: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(telefono);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = telefono;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackError) {
          console.error('Error en fallback de copia:', fallbackError);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Error al copiar teléfono:', error);
    }
  };

  // Definición de columnas de la tabla
  const columns = useMemo(() => [
    columnHelper.accessor('id_factura', {
      id: 'id_factura',
      header: () => <span>ID Factura</span>,
      cell: info => <div className="text-center font-mono text-sm">{info.getValue()}</div>,
      filterFn: 'fuzzy',
      sortingFn: fuzzySort,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('estado', {
      header: () => <span>Estado</span>,
      cell: info => {
        const estado = info.getValue();
        return (
          <Badge
            variant={estado === "procesado" ? "default" : "destructive"}
            className="text-xs"
          >
            {estado}
          </Badge>
        );
      },
      filterFn: 'fuzzy',
      sortingFn: fuzzySort,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('total_cobrado', {
      header: () => <span>Total Cobrado</span>,
      cell: info => {
        const value = info.getValue();
        return (
          <div className="text-right font-mono">
            {value ? value.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) : '-'}
          </div>
        );
      },
      filterFn: 'fuzzy',
      sortingFn: fuzzySort,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('accion', {
      header: () => <span>Acción</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center">{value || '-'}</div>;
      },
      size: 120,
    }),
    columnHelper.accessor('messages', {
      header: () => <span>Mensajes</span>,
      cell: info => {
        const messages = info.getValue();
        if (messages.length) {
          return (
            <div className="flex flex-wrap gap-1">
              {messages.map((message, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {message}
                </Badge>
              ))}
            </div>
          );
        }
        return null;
      },
      enableColumnFilter: false,
      size: 200,
    }),
    columnHelper.accessor('referencia', {
      header: () => <span>Referencia</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center font-mono text-sm">{value || '-'}</div>;
      },
      filterFn: 'fuzzy',
      sortingFn: fuzzySort,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('fecha_pago', {
      header: () => <span>Fecha Pago</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center text-sm">{value ? getDate(value) : '-'}</div>;
      },
      enableColumnFilter: false,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('saldo', {
      header: () => <span>Saldo</span>,
      cell: info => {
        const value = info.getValue();
        return (
          <div className="text-right font-mono">
            {value ? value.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) : '-'}
          </div>
        );
      },
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('total', {
      header: () => <span>Total</span>,
      cell: info => {
        const value = info.getValue();
        return (
          <div className="text-right font-mono">
            {value ? value.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) : '-'}
          </div>
        );
      },
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('forma_pago', {
      header: () => <span>Forma Pago</span>,
      cell: info => {
        const value = info.getValue();
        if (!value) return <div className="text-center">-</div>;
        return <div className="text-center text-sm">{getFormaPagoNombre(value)}</div>;
      },
      enableHiding: false,
      size: 150,
    }),
    columnHelper.accessor('telefono', {
      header: () => <span>Teléfono</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center font-mono text-sm">{value || '-'}</div>;
      },
      filterFn: 'fuzzy',
      sortingFn: fuzzySort,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor('createdAt', {
      header: () => <span>Creado</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center text-sm">{value ? getDateTime(value) : '-'}</div>;
      },
      enableColumnFilter: false,
      enableHiding: false,
      size: 150,
    }),
    columnHelper.accessor('updatedAt', {
      header: () => <span>Actualizado</span>,
      cell: info => {
        const value = info.getValue();
        return <div className="text-center text-sm">{value ? getDateTime(value) : '-'}</div>;
      },
      enableColumnFilter: false,
      size: 150,
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => (
        <div className="flex justify-center">
          <Settings className="w-4 h-4" />
        </div>
      ),
      cell: info => {
        const row = info.row.original;
        const hasPhone = row.telefono && row.telefono.trim() !== '';
        return (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasPhone && handleCopyPhone(row.telefono!)}
              disabled={!hasPhone}
              className="h-8 w-8 p-0"
              title={hasPhone ? "Copiar teléfono al portapapeles" : "No hay teléfono disponible"}
            >
              <Phone className="w-4 h-4" />
            </Button>
            {row.estado === "no procesado" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a
                    href={`https://wisphub.io/registrar/pago/4fournet/${row.id_factura}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver factura en WispHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReloadInvoice(row.id_factura, info.row.index)}
                  className="h-8 w-8 p-0"
                  title="Recargar factura"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
      size: 120,
    }),
  ], []);

  // Configuración de la tabla
  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  // Efecto para configurar el tamaño de página
  useEffect(() => {
    table?.setPageSize(250);
  }, []);

  // Efecto para manejar filtros de fecha
  useEffect(() => {
    if (startDateFilter && endDateFilter) {
      setRangeFilter({ startDateFilter, endDateFilter: new Date(endDateFilter.getTime() + 86399000) });
    } else {
      setRangeFilter(null);
    }
  }, [startDateFilter, endDateFilter]);

  // Efecto principal para cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let args: any = {};

        // Filtros de fecha
        if (dateFilter === "lastmonth") {
          const dt = new Date();
          const y = dt.getFullYear();
          const m = dt.getMonth();
          args = {
            rangeDate: {
              gt: new Date(`${y}-${m}-1`).toISOString(),
              lt: new Date(new Date(`${y}-${m + 1}-1 23:59:59`).getTime() - 86400000).toISOString(),
            }
          };
        }
        if (dateFilter === "month") {
          const dt = new Date();
          const y = dt.getFullYear();
          const m = dt.getMonth();
          args = {
            rangeDate: {
              gt: new Date(`${y}-${m + 1}-1`).toISOString(),
              lt: new Date(new Date(`${y}-${m + 2}-1 23:59:59`).getTime() - 86400000).toISOString(),
            }
          };
        }
        if (dateFilter === "week") {
          const r = obtenerPrimerYUltimoDiaSemana();
          args = {
            rangeDate: {
              gt: r.primero.toISOString(),
              lt: r.ultimo.toISOString(),
            }
          };
        }
        if (dateFilter === "day") {
          const dt = new Date();
          const y = dt.getFullYear();
          const m = dt.getMonth();
          const d = dt.getDate();
          args = {
            rangeDate: {
              gt: new Date(`${y}-${m + 1}-${d}`).toISOString(),
              lt: new Date(`${y}-${m + 1}-${d} 23:59:59`).toISOString(),
            }
          };
        }
        if (rangeFilter && dateFilter === "range") {
          args = {
            rangeDate: {
              gt: new Date(rangeFilter.startDateFilter).toISOString(),
              lt: new Date(rangeFilter.endDateFilter).toISOString(),
            }
          };
        }

        // Filtros de estado
        if (estadoFilter !== "all") {
          args = { ...args, estado: estadoFilter };
        }

        const resp: FetchPaymentReportResults = await fetchApiJaihomV1({
          query: queries.getPaymentReportResults,
          variables: {
            args,
            skip: 0,
            limit: 0
          },
        });

        setData(resp?.results || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estadoFilter, dateFilter, rangeFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Reportes de Pagos</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toPDF()}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnsView(!columnsView)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Columnas
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={estadoFilter} onValueChange={(value: any) => setEstadoFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="procesado">Procesados</SelectItem>
                  <SelectItem value="no procesado">No Procesados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastmonth">Mes Anterior</SelectItem>
                  <SelectItem value="month">Mes Actual</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="day">Hoy</SelectItem>
                  <SelectItem value="range">Rango Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por rango de fechas */}
            {dateFilter === "range" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Fechas</label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDateFilter && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateFilter ? format(startDateFilter, "dd/MM/yyyy") : "Desde"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateFilter}
                        onSelect={(date) => date && setStartDateFilter(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDateFilter && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDateFilter ? format(endDateFilter, "dd/MM/yyyy") : "Hasta"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateFilter}
                        onSelect={(date) => date && setEndDateFilter(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, idx) => (
                      <th
                        key={header.id}
                        className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground ${idx !== 0 && "border-l"
                          }`}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              {idx === 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowSearch(!showSearch)}
                                  className="h-6 w-6 p-0 mr-2"
                                >
                                  <Search className="w-3 h-3" />
                                </Button>
                              )}
                              <div
                                className={`${header.column.getCanSort()
                                  ? 'cursor-pointer select-none flex items-center space-x-1'
                                  : ''
                                  }`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </span>
                                {{
                                  asc: <ChevronUp className="w-3 h-3" />,
                                  desc: <ChevronDown className="w-3 h-3" />,
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            </div>
                            {showSearch && header.column.getCanFilter() && (
                              <div className="px-1">
                                <Filter column={header.column} table={table} />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectRow(row.id === selectRow ? null : row.id)}
                    className={`${row.id === selectRow && "bg-muted"
                      } hover:bg-muted/50 cursor-pointer border-b`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center space-x-2">
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 250].map(pageSize => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize} filas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Total: {table.getPrePaginationRowModel().rows.length} registros
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {'<<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {'<'}
              </Button>
              <span className="text-sm">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {'>'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                {'>>'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de columnas */}
      {columnsView && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurar Columnas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={table.getIsAllColumnsVisible()}
                  onChange={table.getToggleAllColumnsVisibilityHandler()}
                />
                <label className="text-sm">Mostrar/Ocultar Todas</label>
              </div>
              {table.getAllLeafColumns().map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  <label className="text-sm">{column.id}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente Filter para la tabla
function Filter({ column, table }: { column: Column<any, unknown>, table: Table<any> }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
    return () => {
      column.setFilterValue("");
      setIsMounted(false);
    };
  }, []);

  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = useMemo(
    () =>
      typeof firstValue === 'number'
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  );

  return typeof firstValue === 'number' ? (
    <div className="flex space-x-2">
      <Input
        type="number"
        min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
        max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
        value={(columnFilterValue as [number, number])?.[0] ?? ''}
        onChange={e =>
          column.setFilterValue((old: [number, number]) => [e.target.value, old?.[1]])
        }
        placeholder="Min"
        className="h-8 text-xs"
      />
      <Input
        type="number"
        min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
        max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
        value={(columnFilterValue as [number, number])?.[1] ?? ''}
        onChange={e =>
          column.setFilterValue((old: [number, number]) => [old?.[0], e.target.value])
        }
        placeholder="Max"
        className="h-8 text-xs"
      />
    </div>
  ) : (
    <Input
      value={(columnFilterValue ?? '') as string}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Filtrar ${column.id}...`}
      className="h-8 text-xs"
    />
  );
}
