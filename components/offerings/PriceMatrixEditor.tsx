"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PriceMatrixEntry } from "@/lib/interfases";
import { Plus, Trash2 } from "lucide-react";

type PriceMatrixEditorProps = {
  value: PriceMatrixEntry[];
  onChange: (entries: PriceMatrixEntry[]) => void;
  disabled?: boolean;
  /** Etiquetas sugeridas (codes de valores del atributo de precio). */
  suggestedKeys?: string[];
};

export function PriceMatrixEditor({
  value,
  onChange,
  disabled,
  suggestedKeys = [],
}: PriceMatrixEditorProps) {
  const updateRow = (index: number, patch: Partial<PriceMatrixEntry>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = (priceKey = "") => {
    onChange([...value, { priceKey, price: 0 }]);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const missingSuggestions = suggestedKeys.filter(
    (k) => !value.some((v) => v.priceKey.toLowerCase() === k.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Precios por priceKey</Label>
      <p className="text-xs text-muted-foreground">
        Claves alineadas con los códigos de valores del atributo de precio (ej. mediana, familiar).
        Si falta una clave, se usa el precio base o override fijo.
      </p>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-1">Sin matriz — solo precio fijo.</p>
      ) : (
        <ul className="space-y-2">
          {value.map((row, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Input
                value={row.priceKey}
                onChange={(e) => updateRow(idx, { priceKey: e.target.value })}
                placeholder="priceKey"
                disabled={disabled}
                className="h-8 flex-1"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={row.price}
                onChange={(e) =>
                  updateRow(idx, { price: parseFloat(e.target.value) || 0 })
                }
                disabled={disabled}
                className="h-8 w-24"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(idx)}
                  aria-label="Quitar fila"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addRow()}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar precio
          </Button>
          {missingSuggestions.map((key) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addRow(key)}
            >
              + {key}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function priceMatrixToInput(entries: PriceMatrixEntry[] | undefined): PriceMatrixEntry[] {
  return (entries ?? []).map((e) => ({ priceKey: e.priceKey, price: e.price }));
}
