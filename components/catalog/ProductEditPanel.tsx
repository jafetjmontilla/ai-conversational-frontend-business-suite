"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import {
  buildPreviewInput,
  fetchVariantsPreview,
  attributesToOptions,
  addVariantsToProduct,
  bulkUpdateVariants,
  softDeleteProductVariant,
  restoreProductVariant,
  type VariantPreviewRow,
} from "@/lib/productVariantLogic";
import type { Product, ProductCategory, ProductVariant, InventoryLog } from "@/lib/interfases";
import { toast } from "sonner";
import { Package, Sparkles, Trash2, RotateCcw, History, X } from "lucide-react";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { cn } from "@/lib/utils";
import { hasCapability, canUseOfferingsCatalogProduct } from "@/lib/app-suite/capabilities";
import { getCapabilityHintPlain } from "@/lib/app-suite/featureCopy";
import { ProductSellableField } from "@/components/app-suite/ProductSellableField";
import { ProductInventorySection } from "@/components/offerings/ProductInventorySection";
import { InventoryScenarioHints } from "@/components/offerings/InventoryScenarioHints";
import { CatalogAvailabilityPreview } from "@/components/offerings/CatalogAvailabilityPreview";
import { InventoryModeBadge } from "@/components/offerings/InventoryModeBadge";
import { getProductInventoryMode } from "@/lib/offerings/inventoryModeLabels";
import type { RequiredMaterial } from "@/lib/interfases";
import { ModifierGroupsLinker } from "@/components/offerings/ModifierGroupsLinker";

type AttributeWithValues = { _id: string; name: string; values?: { _id: string; attribute_id: string; value: string }[] };
type ProductWithDetails = Product & {
  category?: { _id: string; name: string } | null;
  variants?: ProductVariant[];
};

const roundToTwo = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type ProductListSummary = Product & {
  category?: { _id: string; name: string } | null;
  variants?: { _id: string; sku: string; stock_quantity: number; price_override: number | null }[];
};

export type ProductEditPanelProps = {
  businessId: string;
  businessIdDoc?: string | null;
  productId: string | null;
  canEdit?: boolean;
  className?: string;
  onClose?: () => void;
  onProductUpdated?: (product: ProductListSummary) => void;
  onProductDeleted?: (productId: string) => void;
};

export function ProductEditPanel({
  businessId,
  businessIdDoc: businessIdDocProp,
  productId,
  canEdit = true,
  className,
  onClose,
  onProductUpdated,
  onProductDeleted,
}: ProductEditPanelProps) {
  const { businessIdDoc: businessIdDocFromHook, installedApps } = useBusinessApps(businessId);
  const businessIdDoc = businessIdDocProp ?? businessIdDocFromHook;
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  /** IDs de atributos que el usuario eligió para este artículo (solo con estos se generan variantes). */
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<VariantPreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [addVariantsSaving, setAddVariantsSaving] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editUnitOfMeasure, setEditUnitOfMeasure] = useState("");
  const [deletingVariant, setDeletingVariant] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreVariantId, setRestoreVariantId] = useState<string | null>(null);
  const [restoreStock, setRestoreStock] = useState("0");
  const [restoreSaving, setRestoreSaving] = useState(false);
  const [kardexOpen, setKardexOpen] = useState(false);
  const [kardexVariant, setKardexVariant] = useState<ProductVariant | null>(null);
  const [kardexLogs, setKardexLogs] = useState<InventoryLog[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchApiV1({
      query: queries.getProductCategories,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: ProductCategory[]) => setCategories(res || []))
      .catch(() => { });
  }, [businessIdDoc]);

  useEffect(() => {
    if (!businessIdDoc || !productId) {
      setProduct(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getProduct,
      type: "json",
      variables: { id: businessIdDoc, _id: productId },
    })
      .then((res: ProductWithDetails | null) => {
        if (cancelled) return;
        setProduct(res || null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar el producto");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc, productId]);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchApiV1({
      query: queries.getAttributes,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: AttributeWithValues[] | null) => {
        setAttributes(Array.isArray(res) ? res : []);
      })
      .catch(() => { });
  }, [businessIdDoc]);

  useEffect(() => {
    if (!generateOpen || !businessIdDoc) return;
    fetchApiV1({
      query: queries.getAttributes,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: AttributeWithValues[] | null) => {
        setAttributes(Array.isArray(res) ? res : []);
        setSelectedAttributeIds([]);
        setPreviewRows([]);
      })
      .catch(() => toast.error("Error al cargar atributos"));
  }, [generateOpen, businessIdDoc]);

  const handleSaveProduct = async () => {
    if (!businessIdDoc || !product) return;
    const isSellable = product.is_sellable !== false;
    if (isSellable && !hasCapability(installedApps, "product.sellable")) {
      toast.error(getCapabilityHintPlain("product.sellable"));
      return;
    }
    if (!isSellable && !hasCapability(installedApps, "product.rawMaterial") && !canUseOfferingsCatalogProduct(installedApps)) {
      toast.error(getCapabilityHintPlain("product.rawMaterial"));
      return;
    }
    if (product.hasBillOfMaterials && !(product.requiredMaterials?.length)) {
      toast.error("Agrega al menos un insumo a la receta o desactiva «Receta / lista de materiales».");
      return;
    }
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateProduct,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: product._id,
          args: {
            name: product.name,
            description: product.description,
            category_id: product.category_id ?? null,
            pricingAttributeId: product.pricingAttributeId ?? null,
            base_price: product.base_price,
            brand: product.brand,
            is_sellable: product.is_sellable !== false,
            trackInventory: product.is_sellable !== false ? (product.trackInventory ?? true) : undefined,
            hasBillOfMaterials: product.hasBillOfMaterials ?? false,
            requiredMaterials: product.hasBillOfMaterials
              ? (product.requiredMaterials ?? []).map((m: RequiredMaterial) => ({
                  materialVariantId: m.materialVariantId,
                  sku: m.sku,
                  quantity: m.quantity,
                  unitOfMeasure: m.unitOfMeasure,
                }))
              : [],
          },
        },
      });
      toast.success("Producto actualizado");
      onProductUpdated?.({
        ...product,
        category: product.category,
        variants: product.variants?.map((v) => ({
          _id: v._id,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          price_override: v.price_override,
        })),
      });
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!businessIdDoc || !product) return;
    if (!confirm(`¿Desactivar producto "${product.name}"?`)) return;
    try {
      await fetchApiV1({
        query: queries.deleteProduct,
        type: "json",
        variables: { id: businessIdDoc, _id: product._id },
      });
      toast.success("Producto desactivado");
      onProductDeleted?.(product._id);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al desactivar");
    }
  };

  const toggleAttribute = (attributeId: string) => {
    setSelectedAttributeIds((prev) =>
      prev.includes(attributeId) ? prev.filter((id) => id !== attributeId) : [...prev, attributeId]
    );
    setPreviewRows([]);
  };

  const handlePrevisualizar = async () => {
    const selectedAttrs = attributes.filter((a) => selectedAttributeIds.includes(a._id) && (a.values?.length ?? 0) > 0);
    const options = attributesToOptions(selectedAttrs);
    if (!businessIdDoc || !product || options.length === 0 || options.every((o) => o.values.length === 0)) {
      toast.error("Selecciona al menos un atributo con valores para este artículo.");
      return;
    }
    setPreviewLoading(true);
    try {
      const input = buildPreviewInput(product._id, product.name, product.base_price ?? 0, options);
      const combinations = await fetchVariantsPreview(businessIdDoc, input);
      setPreviewRows(combinations as VariantPreviewRow[]);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al generar preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateVariants = async () => {
    if (!businessIdDoc || !productId || previewRows.length === 0) return;
    setAddVariantsSaving(true);
    try {
      await addVariantsToProduct(businessIdDoc, productId, previewRows);
      toast.success("Variantes creadas");
      setGenerateOpen(false);
      setPreviewRows([]);
      if (product) {
        const updated = (await fetchApiV1({
          query: queries.getProduct,
          type: "json",
          variables: { id: businessIdDoc, _id: productId },
        })) as ProductWithDetails | null;
        if (updated) setProduct(updated);
      }
    } catch (e: unknown) {
      const err = e as { message?: string; extensions?: { code?: string; variantId?: string } };
      if (err?.extensions?.code === "RESTORE_AVAILABLE" && err.extensions.variantId) {
        setRestoreVariantId(err.extensions.variantId);
        setRestoreStock("0");
        setRestoreOpen(true);
        toast.info("Una variante con ese SKU está eliminada. Puedes restaurarla con stock inicial.");
      } else {
        toast.error(err?.message || "Error al crear variantes");
      }
    } finally {
      setAddVariantsSaving(false);
    }
  };

  const handleSoftDeleteVariant = async (variant: ProductVariant) => {
    if (!businessIdDoc || !productId) return;
    setDeletingVariant(variant._id);
    try {
      await softDeleteProductVariant(businessIdDoc, variant._id);
      toast.success("Variante desactivada (no se muestra en ventas; sigue en reportes)");
      const updated = (await fetchApiV1({
        query: queries.getProduct,
        type: "json",
        variables: { id: businessIdDoc, _id: productId },
      })) as ProductWithDetails | null;
      if (updated) setProduct(updated);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al desactivar");
    } finally {
      setDeletingVariant(null);
    }
  };

  const handleRestoreVariant = async () => {
    if (!businessIdDoc || !restoreVariantId) return;
    const qty = parseFloat(restoreStock);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Indica un stock inicial válido (número ≥ 0)");
      return;
    }
    setRestoreSaving(true);
    try {
      await restoreProductVariant(businessIdDoc, restoreVariantId, qty);
      toast.success("Variante restaurada");
      setRestoreOpen(false);
      setRestoreVariantId(null);
      if (productId) {
        const updated = (await fetchApiV1({
          query: queries.getProduct,
          type: "json",
          variables: { id: businessIdDoc, _id: productId },
        })) as ProductWithDetails | null;
        if (updated) setProduct(updated);
      }
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al restaurar");
    } finally {
      setRestoreSaving(false);
    }
  };

  const handleOpenKardex = async (variant: ProductVariant) => {
    if (!businessIdDoc) return;
    setKardexVariant(variant);
    setKardexOpen(true);
    setKardexLoading(true);
    try {
      const logs = (await fetchApiV1({
        query: queries.getInventoryLogs,
        type: "json",
        variables: { id: businessIdDoc, sku: variant.sku, limit: 100 },
      })) as InventoryLog[] | null;
      setKardexLogs(Array.isArray(logs) ? logs : []);
    } catch {
      toast.error("Error al cargar el historial");
      setKardexLogs([]);
    } finally {
      setKardexLoading(false);
    }
  };

  const updatePreviewRow = (index: number, field: "price_override" | "stock_quantity", value: number | null) => {
    setPreviewRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, [field]: value }
          : r
      )
    );
  };

  const openEditVariant = (v: ProductVariant) => {
    setEditingVariant(v._id);
    setEditPrice(String(v.price_override ?? ""));
    setEditStock(String(v.stock_quantity));
    setEditCost(String(v.cost_price ?? ""));
    setEditUnitOfMeasure(v.unit_of_measure ?? "unidad");
  };

  const handleSaveVariant = async (variant: ProductVariant) => {
    if (!businessIdDoc || editingVariant !== variant._id) return;
    const stock = editStock === "" ? undefined : roundToTwo(parseFloat(editStock));
    const price = editPrice === "" ? undefined : parseFloat(editPrice);
    const cost = editCost === "" ? undefined : roundToTwo(parseFloat(editCost));
    const unit = editUnitOfMeasure.trim() || undefined;
    const currentUnit = (variant.unit_of_measure ?? "unidad").toLowerCase();
    const priceChanged = price !== undefined && price !== (variant.price_override ?? basePrice);
    const stockChanged = stock !== undefined && stock !== variant.stock_quantity;
    const costChanged = cost !== undefined && cost !== (variant.cost_price ?? null);
    const unitChanged = unit !== undefined && unit.toLowerCase() !== currentUnit;
    const hasChange = priceChanged || stockChanged || costChanged || unitChanged;
    if (!hasChange) {
      setEditingVariant(null);
      return;
    }
    try {
      const item: {
        variant_id: string;
        stock_quantity?: number;
        price_override?: number | null;
        cost_price?: number | null;
        unit_of_measure?: string;
      } = { variant_id: variant._id };
      if (stockChanged) item.stock_quantity = stock;
      if (priceChanged) item.price_override = price;
      if (costChanged) item.cost_price = cost;
      if (unitChanged) item.unit_of_measure = unit;
      await bulkUpdateVariants(businessIdDoc, [item]);
      setProduct((prev) => {
        if (!prev?.variants) return prev;
        return {
          ...prev,
          variants: prev.variants.map((v) =>
            v._id === variant._id
              ? {
                ...v,
                stock_quantity: stockChanged && stock !== undefined ? stock : v.stock_quantity,
                price_override: priceChanged && price !== undefined ? price : v.price_override,
                cost_price: costChanged && cost !== undefined ? cost : v.cost_price,
                unit_of_measure: unitChanged && unit !== undefined ? unit : v.unit_of_measure,
              }
              : v
          ),
        };
      });
      setEditingVariant(null);
      toast.success("Variante actualizada");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al actualizar");
    }
  };

  if (!productId) {
    return (
      <Card id="card-right" className={cn("flex h-full flex-col border-none", className)}>
        <CardContent className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-muted-foreground text-sm">Selecciona un producto de la tabla.</p>
        </CardContent>
      </Card>
    );
  }

  if (!canEdit) {
    return (
      <Card id="card-right" className={cn("flex h-full flex-col border-none", className)}>
        <CardContent className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-muted-foreground text-sm">No tienes permiso para editar productos.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !product) {
    return (
      <Card id="card-right" className={cn("flex h-full flex-col border-none", className)}>
        <CardContent className="flex flex-1 items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const basePrice = product.base_price ?? 0;
  const inventoryMode = getProductInventoryMode(product);
  const defaultVariant = (product.variants ?? []).find((v) => v.status !== false && !v.deleted_at)
    ?? product.variants?.[0];
  const showAvailabilityPreview =
    product.is_sellable !== false &&
    (inventoryMode.key === "direct_stock" || inventoryMode.key === "recipe");

  return (
    <Card id="card-right" className={cn("flex h-full flex-col border-none overflow-hidden", className)}>
      <CardHeader className="space-y-2 shrink-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pt-12 pb-1">
            <CardTitle className="flex items-center gap-2 flex-wrap text-base">
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">{product.name}</span>
              <InventoryModeBadge mode={inventoryMode} className="ml-0" />
            </CardTitle>
            <CardDescription className="text-xs">
              Edita el producto y sus variantes.
            </CardDescription>
          </div>
          {onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={product.name}
                onChange={(e) => setProduct((p) => (p ? { ...p, name: e.target.value } : null))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={product.description ?? ""}
                onChange={(e) => setProduct((p) => (p ? { ...p, description: e.target.value } : null))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select
                value={product.category_id ?? "__none__"}
                onValueChange={(v) => setProduct((p) => (p ? { ...p, category_id: v === "__none__" ? null : v } : null))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atributo de precio (extras)</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Define qué variante usa cada adicional. Hereda de la categoría si no se elige.
              </p>
              <Select
                value={product.pricingAttributeId ?? "__inherit__"}
                onValueChange={(v) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          pricingAttributeId: v === "__inherit__" ? null : v,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Heredar de categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__inherit__">Heredar de categoría</SelectItem>
                  {attributes.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Precio base</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={product.base_price ?? ""}
                onChange={(e) => setProduct((p) => (p ? { ...p, base_price: e.target.value ? parseFloat(e.target.value) : 0 } : null))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                value={product.brand ?? ""}
                onChange={(e) => setProduct((p) => (p ? { ...p, brand: e.target.value } : null))}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <ProductSellableField
                businessId={businessId}
                installedApps={installedApps}
                checked={product.is_sellable !== false}
                onCheckedChange={(checked) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          is_sellable: checked,
                          ...(checked
                            ? {}
                            : {
                                trackInventory: true,
                                hasBillOfMaterials: false,
                                requiredMaterials: [],
                              }),
                        }
                      : null
                  )
                }
              />
            </div>
            <div className="md:col-span-2">
              <ProductInventorySection
                businessIdDoc={businessIdDoc}
                isSellable={product.is_sellable !== false}
                trackInventory={product.trackInventory ?? true}
                hasBillOfMaterials={product.hasBillOfMaterials ?? false}
                requiredMaterials={product.requiredMaterials ?? []}
                onTrackInventoryChange={(v) =>
                  setProduct((p) => (p ? { ...p, trackInventory: v } : null))
                }
                onHasBillOfMaterialsChange={(v) =>
                  setProduct((p) => (p ? { ...p, hasBillOfMaterials: v } : null))
                }
                onRequiredMaterialsChange={(materials) =>
                  setProduct((p) => (p ? { ...p, requiredMaterials: materials } : null))
                }
                disabled={saving}
              />
              {product.is_sellable !== false && (
                <div className="mt-3">
                  <InventoryScenarioHints
                    variant="product"
                    hasBillOfMaterials={product.hasBillOfMaterials ?? false}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveProduct} disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteProduct}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Desactivar
            </Button>
          </div>
          {showAvailabilityPreview && defaultVariant && businessIdDoc && (
            <CatalogAvailabilityPreview
              businessIdDoc={businessIdDoc}
              productVariantId={defaultVariant._id}
              itemLabel={product.name}
            />
          )}

      {product.is_sellable !== false && businessIdDoc && (
        <ModifierGroupsLinker
          businessId={businessIdDoc}
          entityId={productId}
          entityType="product"
          selectedGroupIds={product.modifierGroupIds ?? []}
          disabled={!canEdit}
          onSaved={(ids) => setProduct((p) => (p ? { ...p, modifierGroupIds: ids } : p))}
        />
      )}

        <div className="rounded-lg border space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Variantes (SKU)</p>
              <p className="text-xs text-muted-foreground">Edita stock o precio. Genera más variantes con atributos.</p>
            </div>
            <Button onClick={() => setGenerateOpen(true)} size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Generar variantes
            </Button>
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(product.variants || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No hay variantes. Usa &quot;Generar variantes&quot; o el producto debería tener al menos una variante por defecto.
                  </TableCell>
                </TableRow>
              ) : (
                (product.variants || []).map((v) => {
                  const isEditing = editingVariant === v._id;
                  const effectivePrice = v.price_override ?? basePrice;
                  const displayCost = v.cost_price ?? "";
                  const displayUnit = v.unit_of_measure ?? "unidad";
                  return (
                    <TableRow key={v._id}>
                      <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="h-8 w-24"
                            placeholder={String(effectivePrice)}
                          />
                        ) : (
                          <span className="cursor-pointer" onClick={() => openEditVariant(v)}>
                            ${effectivePrice.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            className="h-8 w-24"
                            placeholder="Costo"
                          />
                        ) : (
                          <span className="cursor-pointer" onClick={() => openEditVariant(v)}>
                            {displayCost !== "" ? `$${Number(displayCost).toFixed(2)}` : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editUnitOfMeasure}
                            onChange={(e) => setEditUnitOfMeasure(e.target.value)}
                            className="h-8 w-24"
                            placeholder="unidad"
                          />
                        ) : (
                          <span className="cursor-pointer" onClick={() => openEditVariant(v)}>
                            {displayUnit}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="h-8 w-24"
                          />
                        ) : (
                          <span className="cursor-pointer" onClick={() => openEditVariant(v)}>
                            {v.stock_quantity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {isEditing ? (
                          <Button size="sm" onClick={() => handleSaveVariant(v)}>Guardar</Button>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEditVariant(v)}>Editar</Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenKardex(v)}
                              title="Ver historial de movimientos (kardex)"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleSoftDeleteVariant(v)}
                              disabled={deletingVariant === v._id}
                              title="Desactivar variante (soft delete)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar variantes</DialogTitle>
            <DialogDescription>
              Elige los atributos que tiene este artículo. Con los seleccionados se generarán todas las combinaciones (producto cartesiano). Luego previsualiza, edita precio/stock si quieres y crea las variantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {attributes.length === 0 ? (
              <p className="text-muted-foreground">No hay atributos con valores. Ve a Atributos y crea atributos y valores.</p>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Atributos del artículo (marca los que apliquen)</Label>
                <ul className="border rounded-md divide-y divide-border max-h-[200px] overflow-y-auto">
                  {attributes.map((attr) => {
                    const hasValues = (attr.values?.length ?? 0) > 0;
                    const selected = selectedAttributeIds.includes(attr._id);
                    return (
                      <li key={attr._id}>
                        <label
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 ${!hasValues ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!hasValues}
                            onChange={() => hasValues && toggleAttribute(attr._id)}
                            className="rounded border-input"
                          />
                          <span>{attr.name}</span>
                          {attr.values?.length ? (
                            <span className="text-xs text-muted-foreground">
                              ({attr.values.length} valor{attr.values.length !== 1 ? "es" : ""})
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">(sin valores)</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {selectedAttributeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Seleccionados: {selectedAttributeIds.length}. Se generarán variantes con todas las combinaciones de valores de estos atributos.
                  </p>
                )}
              </div>
            )}
            <Button
              onClick={handlePrevisualizar}
              disabled={previewLoading || selectedAttributeIds.length === 0}
            >
              {previewLoading ? "Generando…" : "Previsualizar variantes"}
            </Button>
            {previewRows.length > 0 && (
              <>
                <p className="text-sm font-medium">{previewRows.length} combinaciones</p>
                <div className="border rounded-md overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Atributos</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                          <TableCell className="text-xs">
                            {row.attributeValues?.map((av) => `${av.attributeName}: ${av.value}`).join(", ")}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.price_override ?? ""}
                              onChange={(e) => updatePreviewRow(idx, "price_override", e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.stock_quantity ?? 0}
                              onChange={(e) => updatePreviewRow(idx, "stock_quantity", parseFloat(e.target.value) || 0)}
                              className="h-8 w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cerrar</Button>
            <Button onClick={handleCreateVariants} disabled={addVariantsSaving || previewRows.length === 0}>
              {addVariantsSaving ? "Creando…" : "Crear variantes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreOpen} onOpenChange={(open) => { setRestoreOpen(open); if (!open) setRestoreVariantId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurar variante eliminada
            </DialogTitle>
            <DialogDescription>
              Esta variante fue desactivada anteriormente. Indica el stock inicial con el que quedará al reactivarse. Se registrará en el historial como &quot;Reactivación&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Stock inicial</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={restoreStock}
                onChange={(e) => setRestoreStock(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRestoreOpen(false); setRestoreVariantId(null); }}>Cerrar</Button>
            <Button onClick={handleRestoreVariant} disabled={restoreSaving}>
              {restoreSaving ? "Restaurando…" : "Restaurar variante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={kardexOpen} onOpenChange={(open) => { setKardexOpen(open); if (!open) { setKardexVariant(null); setKardexLogs([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Kardex — {kardexVariant?.sku}
            </DialogTitle>
            <DialogDescription>
              Historial de movimientos de stock de esta variante (últimos 100 registros).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {kardexLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : kardexLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin movimientos registrados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cambio</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Concepto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${log.type === "VENTA" || log.type === "SALIDA"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : log.type === "INGRESO" || log.type === "RESTAURACIÓN"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}>
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${log.quantity_change > 0 ? "text-green-600 dark:text-green-400" : log.quantity_change < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                        {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{log.balance_after}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.concept}>
                        {log.concept}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKardexOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
}
