"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputSearch } from "@/components/InputSearch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { ProductVariantForMaterial, StockDocumentType } from "@/lib/interfases";
import { createStockDocumentMutation } from "@/lib/queries/inventory";
import { Plus, Trash2 } from "lucide-react";

type LineDraft = {
  variantId: string;
  sku: string;
  productName: string;
  quantity: string;
};

type StockDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessIdDoc: string;
  type: StockDocumentType;
  onSuccess: () => void;
};

export function StockDocumentDialog({
  open,
  onOpenChange,
  businessIdDoc,
  type,
  onSuccess,
}: StockDocumentDialogProps) {
  const [concept, setConcept] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [variants, setVariants] = useState<ProductVariantForMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [pickVariantId, setPickVariantId] = useState("");
  const [pickQty, setPickQty] = useState(type === "INGRESO" ? "1" : "1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !businessIdDoc) return;
    setConcept("");
    setLines([]);
    setSearch("");
    setPickVariantId("");
    setPickQty(type === "INGRESO" ? "1" : "1");
    fetchApiV1({
      query: queries.getProductVariants,
      type: "json",
      variables: { id: businessIdDoc, includeDeleted: false },
    })
      .then((res: ProductVariantForMaterial[] | null) => setVariants(Array.isArray(res) ? res : []))
      .catch(() => setVariants([]));
  }, [open, businessIdDoc, type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const used = new Set(lines.map((l) => l.variantId));
    return variants.filter((v) => {
      if (used.has(v._id)) return false;
      if (!q) return true;
      return (
        v.sku.toLowerCase().includes(q) ||
        (v.product?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [variants, search, lines]);

  const addLine = () => {
    const qty = parseFloat(pickQty);
    if (!pickVariantId || Number.isNaN(qty) || qty === 0) {
      toast.error(type === "INGRESO" ? "Cantidad debe ser mayor que 0" : "Indica un delta distinto de 0");
      return;
    }
    if (type === "INGRESO" && qty <= 0) {
      toast.error("En un ingreso la cantidad debe ser positiva");
      return;
    }
    const v = variants.find((x) => x._id === pickVariantId);
    if (!v) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: v._id,
        sku: v.sku,
        productName: v.product?.name ?? "",
        quantity: String(qty),
      },
    ]);
    setPickVariantId("");
    setPickQty(type === "INGRESO" ? "1" : "1");
  };

  const handleSubmit = async () => {
    if (!concept.trim()) {
      toast.error("Indica un concepto / motivo");
      return;
    }
    if (lines.length === 0) {
      toast.error("Agrega al menos una línea");
      return;
    }
    setSaving(true);
    try {
      await createStockDocumentMutation(businessIdDoc, {
        type,
        concept: concept.trim(),
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: parseFloat(l.quantity),
        })),
      });
      toast.success(type === "INGRESO" ? "Ingreso registrado" : "Ajuste registrado");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar el movimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type === "INGRESO" ? "Entrada de stock" : "Ajuste de stock"}</DialogTitle>
          <DialogDescription>
            {type === "INGRESO"
              ? "Suma cantidad a las variantes seleccionadas y registra el movimiento en el kardex."
              : "Aplica un delta (+ o −) por variante. El motivo es obligatorio."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="stock-concept">Concepto</Label>
            <Textarea
              id="stock-concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={type === "INGRESO" ? "Ej. Compra proveedor / recepción" : "Ej. Conteo físico / merma"}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Agregar línea</p>
            <InputSearch
              placeholder="Buscar por SKU o producto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={pickVariantId}
                onChange={(e) => setPickVariantId(e.target.value)}
              >
                <option value="">Seleccionar variante…</option>
                {filtered.slice(0, 80).map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.sku} — {v.product?.name ?? "Producto"} (stock {v.stock_quantity ?? 0})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="any"
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
                placeholder={type === "AJUSTE" ? "Delta" : "Cant."}
              />
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>
            {type === "AJUSTE" && (
              <p className="text-xs text-muted-foreground">Usa negativo para restar (ej. -2) y positivo para sumar.</p>
            )}
          </div>

          {lines.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[100px]">{type === "AJUSTE" ? "Delta" : "Cant."}</TableHead>
                  <TableHead className="w-[56px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.variantId}>
                    <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                    <TableCell>{l.productName || "—"}</TableCell>
                    <TableCell>{l.quantity}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600"
                        onClick={() => setLines((prev) => prev.filter((x) => x.variantId !== l.variantId))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
