"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface DateFilterProps {
  value: {
    dateFilter?: 'today' | 'week' | 'month' | 'year';
    dateFrom?: string;
    dateTo?: string;
    offsetMinutes?: number;
  };
  onChange: (value: {
    dateFilter?: 'today' | 'week' | 'month' | 'year';
    dateFrom?: string;
    dateTo?: string;
    offsetMinutes?: number;
  }) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: value.dateFrom ? new Date(value.dateFrom) : undefined,
    to: value.dateTo ? new Date(value.dateTo) : undefined,
  });

  // Función para obtener el offset de zona horaria del usuario en minutos
  const getTimezoneOffset = () => {
    const now = new Date();
    return now.getTimezoneOffset();
  };

  const handleDateFilterChange = (filter: 'today' | 'week' | 'month' | 'year' | '') => {
    if (filter === '') {
      onChange({});
    } else {
      onChange({
        dateFilter: filter,
        dateFrom: undefined,
        dateTo: undefined,
        offsetMinutes: getTimezoneOffset()
      });
    }
    setDateRange(undefined);
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      // Para rangos personalizados, convertir las fechas a UTC
      const fromUTC = new Date(range.from.getTime() - (range.from.getTimezoneOffset() * 60000));
      const toUTC = new Date(range.to.getTime() + 86400000 - 1000 - (range.to.getTimezoneOffset() * 60000));

      onChange({
        dateFilter: undefined,
        dateFrom: fromUTC.toISOString(),
        dateTo: toUTC.toISOString(),
        offsetMinutes: getTimezoneOffset()
      });
    } else if (range?.from) {
      const fromUTC = new Date(range.from.getTime() - (range.from.getTimezoneOffset() * 60000));
      onChange({
        dateFilter: undefined,
        dateFrom: fromUTC.toISOString(),
        dateTo: undefined,
        offsetMinutes: getTimezoneOffset()
      });
    }
  };

  const clearFilters = () => {
    onChange({});
    setDateRange(undefined);
  };

  const hasActiveFilters = value.dateFilter || value.dateFrom || value.dateTo;

  return (
    <div className="flex gap-1 md:gap-2">
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-[10px] md:text-sm font-medium">Fechas:</span>
        {/* Filtros rápidos */}
        <ToggleGroup
          type="single"
          value={value.dateFilter || ""}
          onValueChange={handleDateFilterChange}
          className="border rounded-md"
        >
          <ToggleGroupItem value="today" className="px-2 py-1 text-[10px] md:text-sm">
            Hoy
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="px-2 py-1 text-[10px] md:text-sm">
            Esta Semana
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-2 py-1 text-[10px] md:text-sm">
            Este Mes
          </ToggleGroupItem>
          <ToggleGroupItem value="year" className="px-2 py-1 text-[10px] md:text-sm">
            Este Año
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {/* Selector de rango personalizado */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="px-3 py-1 text-[10px] md:text-sm"
          >
            {dateRange?.from ? (
              dateRange?.to ? (
                <>
                  {format(dateRange.from, "dd/MM", { locale: es })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              "Rango"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Seleccionar rango de fechas</Label>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleCustomDateChange}
                  numberOfMonths={2}
                  locale={es}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Aplicar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDateRange(undefined);
                    setIsOpen(false);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
        {/* Botón para limpiar filtros */}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </Popover>
    </div>
  );
}
