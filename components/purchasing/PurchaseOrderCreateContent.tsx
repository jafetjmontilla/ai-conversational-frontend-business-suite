"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useBusiness } from "@/lib/hooks/useBusiness";
import {
  createPurchaseOrderMutation,
  fetchSuppliers,
  purchasingQueryKeys,
} from "@/lib/queries/purchasing";
import type { ProductVariantForMaterial } from "@/lib/interfases";
import { majorToMinor, minorToMajor } from "@/lib/money";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type LineDraft = {
  variantId: string;
  sku: string;
  productName: string;
  quantityOrdered: string;
  unitCost: string;
};

export function PurchaseOrderCreateContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const { business } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [variants, setVariants] = useState<ProductVariantForMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [pickVariantId, setPickVariantId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [pickCost, setPickCost] = useState("0");
  const [saving, setSaving] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: purchasingQueryKeys.suppliers(businessIdDoc ?? null, {}),
    queryFn: () => fetchSuppliers(businessIdDoc!),
    enabled: !!businessIdDoc,
  });

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchApiV1({
      query: queries.getProductVariants,
      type: "json",
      variables: { id: businessIdDoc, includeDeleted: false },
    })
      .then((res: ProductVariantForMaterial[] | null) => setVariants(Array.isArray(res) ? res : []))
      .catch(() => setVariants([]));
  }, [businessIdDoc]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const used = new Set(lines.map((l) => l.variantId));
    return variants.filter((v) => {
      if (used.has(v._id)) return false;
      if (!q) return true;
      return v.sku.toLowerCase().includes(q) || (v.product?.name ?? "").toLowerCase().includes(q);
    });
  }, [variants, search, lines]);

  const addLine = () => {
    const qty = parseFloat(pickQty);
    if (!pickVariantId || Number.isNaN(qty) || qty <= 0) {
      toast.error("Selecciona variante y cantidad > 0");
      return;
    }
    let unitCostMinor = 0;
    try {
      unitCostMinor = majorToMinor(pickCost || "0");
    } catch {
      toast.error("Costo unitario inválido");
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
        quantityOrdered: String(qty),
        unitCost: String(minorToMajor(unitCostMinor)),
      },
    ]);
    setPickVariantId("");
    setPickQty("1");
    setPickCost("0");
  };

  const handleCreate = async (placeOrder: boolean) => {
    if (!businessIdDoc) return;
    if (!supplierId) {
      toast.error("Selecciona un proveedor");
      return;
    }
    if (lines.length === 0) {
      toast.error("Agrega al menos una línea");
      return;
    }
    setSaving(true);
    try {
      const po = await createPurchaseOrderMutation(businessIdDoc, {
        supplierId,
        notes: notes.trim() || undefined,
        placeOrder,
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantityOrdered: parseFloat(l.quantityOrdered),
          unitCostMinor: majorToMinor(l.unitCost || "0"),
          description: l.productName,
        })),
      });
      toast.success(placeOrder ? "OC confirmada" : "OC guardada en borrador");
      router.push(`/${businessSlug}/purchasing/orders/${po._id}`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear la OC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-1 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold">Nueva orden de compra</h1>
        <p className="text-sm text-muted-foreground">
          <Link href={`/${businessSlug}/purchasing/orders`} className="text-primary hover:underline">
            ← Volver
          </Link>
        </p>
      </div>

      <div>
        <Label>Proveedor</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {suppliers.filter((s) => s.status).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <p className="text-sm font-medium">Líneas</p>
        <InputSearch
          placeholder="Buscar variante por SKU o producto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_80px_100px_auto]">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={pickVariantId}
            onChange={(e) => setPickVariantId(e.target.value)}
          >
            <option value="">Variante…</option>
            {filtered.slice(0, 80).map((v) => (
              <option key={v._id} value={v._id}>
                {v.sku} — {v.product?.name ?? ""}
              </option>
            ))}
          </select>
          <Input type="number" step="any" value={pickQty} onChange={(e) => setPickQty(e.target.value)} placeholder="Cant." />
          <Input type="number" step="0.01" value={pickCost} onChange={(e) => setPickCost(e.target.value)} placeholder="Costo" />
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Costo unitario en moneda mayor (ej. 12.50).</p>

        {lines.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.variantId}>
                  <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                  <TableCell>{l.productName}</TableCell>
                  <TableCell>{l.quantityOrdered}</TableCell>
                  <TableCell>{l.unitCost}</TableCell>
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

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={() => void handleCreate(false)}>
          Guardar borrador
        </Button>
        <Button type="button" disabled={saving} onClick={() => void handleCreate(true)}>
          {saving ? "Guardando…" : "Confirmar OC"}
        </Button>
      </div>
    </div>
  );
}
