"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { FieldHelpText } from "@/components/offerings/FieldHelpText";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogAvailabilityPreviewProps = {
  businessIdDoc: string;
  productVariantId?: string;
  serviceOptionId?: string;
  itemLabel?: string;
  defaultQuantity?: number;
  className?: string;
};

type AvailabilityResult = {
  available: boolean;
  reasons: string[];
};

export function CatalogAvailabilityPreview({
  businessIdDoc,
  productVariantId,
  serviceOptionId,
  itemLabel,
  defaultQuantity = 1,
  className,
}: CatalogAvailabilityPreviewProps) {
  const [quantity, setQuantity] = useState(String(defaultQuantity));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const canCheck = Boolean(businessIdDoc && (productVariantId || serviceOptionId));

  const handleCheck = async () => {
    const qty = parseFloat(quantity);
    if (!canCheck || Number.isNaN(qty) || qty <= 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = (await fetchApiV1({
        query: queries.checkCatalogAvailability,
        type: "json",
        variables: {
          id: businessIdDoc,
          productVariantId: productVariantId ?? undefined,
          serviceOptionId: serviceOptionId ?? undefined,
          quantity: qty,
        },
      })) as AvailabilityResult;
      setResult(res);
    } catch (e: unknown) {
      setResult({
        available: false,
        reasons: [(e as { message?: string })?.message ?? "Error al consultar disponibilidad"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("rounded-lg border p-4 space-y-3 bg-muted/10", className)}>
      <div>
        <p className="text-sm font-medium">Preview de disponibilidad</p>
        <FieldHelpText className="mt-1">
          Simula si hay stock suficiente para vender la cantidad indicada
          {itemLabel ? ` de «${itemLabel}»` : ""}. No reserva inventario; solo consulta.
        </FieldHelpText>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="avail-qty" className="text-xs">
            Cantidad
          </Label>
          <Input
            id="avail-qty"
            type="number"
            min="0.0001"
            step="any"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setResult(null);
            }}
            className="w-24 h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleCheck}
          disabled={!canCheck || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Consultando…
            </>
          ) : (
            "Verificar"
          )}
        </Button>
      </div>
      {result && (
        <div
          className={cn(
            "flex gap-2 rounded-md p-3 text-sm",
            result.available
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {result.available ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">
              {result.available ? "Disponible para vender" : "No disponible"}
            </p>
            {result.reasons.length > 0 && (
              <ul className="mt-1 text-xs space-y-0.5 list-disc pl-4 opacity-90">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
