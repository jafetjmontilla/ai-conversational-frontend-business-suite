"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputSearch } from "@/components/InputSearch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { ProductVariantForMaterial, RequiredMaterial } from "@/lib/interfases";
import { INVENTORY_HELP } from "@/lib/offerings/inventoryHelpCopy";
import { FieldHelpText } from "@/components/offerings/FieldHelpText";
import { Plus, Trash2 } from "lucide-react";

function allowsDecimalQuantity(unit: string | undefined): boolean {
  const u = (unit || "unidad").toLowerCase().trim();
  return ["kg", "g", "litro", "l", "ml", "resma", "m", "cm"].includes(u);
}

type RequiredMaterialsEditorProps = {
  businessIdDoc: string | null | undefined;
  materials: RequiredMaterial[];
  onChange: (materials: RequiredMaterial[]) => void;
  disabled?: boolean;
};

export function RequiredMaterialsEditor({
  businessIdDoc,
  materials,
  onChange,
  disabled,
}: RequiredMaterialsEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variants, setVariants] = useState<ProductVariantForMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [pickVariantId, setPickVariantId] = useState("");
  const [pickQuantity, setPickQuantity] = useState("1");

  useEffect(() => {
    if (!dialogOpen || !businessIdDoc) return;
    fetchApiV1({
      query: queries.getProductVariants,
      type: "json",
      variables: { id: businessIdDoc, includeDeleted: false },
    })
      .then((res: ProductVariantForMaterial[] | null) => setVariants(Array.isArray(res) ? res : []))
      .catch(() => setVariants([]));
  }, [dialogOpen, businessIdDoc]);

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    const used = new Set(materials.map((m) => m.materialVariantId));
    return variants.filter((v) => {
      if (used.has(v._id)) return false;
      if (!q) return true;
      return (
        v.sku.toLowerCase().includes(q) ||
        (v.product?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [variants, search, materials]);

  const selectedVariant = variants.find((v) => v._id === pickVariantId);
  const effectiveUnit = selectedVariant?.unit_of_measure ?? "unidad";

  const handleAdd = () => {
    if (!pickVariantId) return;
    const qty = parseFloat(pickQuantity);
    if (Number.isNaN(qty) || qty <= 0) return;
    const variant = variants.find((v) => v._id === pickVariantId);
    if (!variant) return;
    onChange([
      ...materials,
      {
        materialVariantId: variant._id,
        sku: variant.sku,
        quantity: qty,
        unitOfMeasure: variant.unit_of_measure ?? "unidad",
      },
    ]);
    setDialogOpen(false);
    setPickVariantId("");
    setPickQuantity("1");
    setSearch("");
  };

  const updateQuantity = (index: number, value: string) => {
    const qty = parseFloat(value);
    if (Number.isNaN(qty) || qty <= 0) return;
    onChange(
      materials.map((m, i) => (i === index ? { ...m, quantity: qty } : m))
    );
  };

  const removeAt = (index: number) => {
    onChange(materials.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
      <div>
        <Label className="text-sm font-medium">{INVENTORY_HELP.requiredMaterialsTitle}</Label>
        <FieldHelpText className="mt-1">{INVENTORY_HELP.requiredMaterialsHelp}</FieldHelpText>
      </div>

      {materials.length === 0 ? (
        <FieldHelpText>{INVENTORY_HELP.requiredMaterialsEmpty}</FieldHelpText>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Cantidad / unidad vendida</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m, index) => (
              <TableRow key={m.materialVariantId}>
                <TableCell className="font-mono text-sm">{m.sku}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={allowsDecimalQuantity(m.unitOfMeasure) ? "0.0001" : "1"}
                      min="0"
                      value={m.quantity}
                      onChange={(e) => updateQuantity(index, e.target.value)}
                      className="w-28 h-8"
                      disabled={disabled}
                    />
                    <span className="text-xs text-muted-foreground">{m.unitOfMeasure ?? "unidad"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeAt(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={disabled || !businessIdDoc}
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar insumo
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar insumo a la receta</DialogTitle>
            <DialogDescription>
              Elige una variante de materia prima e indica cuánto se consume por cada unidad vendida de este artículo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 flex-1 min-h-0 flex flex-col">
            <div>
              <Label>Buscar por SKU o nombre</Label>
              <InputSearch
                placeholder="Filtrar variantes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-auto rounded-md border max-h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground text-sm">
                        {variants.length === 0 ? "Cargando…" : "Sin variantes disponibles o ya agregadas."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVariants.slice(0, 50).map((v) => (
                      <TableRow
                        key={v._id}
                        className={pickVariantId === v._id ? "bg-muted/50" : "cursor-pointer hover:bg-muted/30"}
                        onClick={() => setPickVariantId(v._id)}
                      >
                        <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                        <TableCell className="text-sm">{v.product?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Button type="button" size="sm" variant="outline" onClick={() => setPickVariantId(v._id)}>
                            Elegir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {pickVariantId && (
              <div>
                <Label>
                  Cantidad por unidad vendida *
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({allowsDecimalQuantity(effectiveUnit) ? "decimales permitidos" : "enteros"})
                  </span>
                </Label>
                <Input
                  type="number"
                  step={allowsDecimalQuantity(effectiveUnit) ? "0.0001" : "1"}
                  min="0"
                  value={pickQuantity}
                  onChange={(e) => setPickQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!pickVariantId || Number.isNaN(parseFloat(pickQuantity)) || parseFloat(pickQuantity) <= 0}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
