"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Service, ServiceOption, ServiceMaterial, ProductionCostResult, ProductVariantForMaterial } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Plus, Trash2, AlertTriangle, Package, DollarSign, TrendingUp } from "lucide-react";
import { InputSearch } from "@/components/InputSearch";
import { useMemo } from "react";

/** Unidades que permiten cantidad decimal (kg, litro, etc.). Si no está en la lista, se usan enteros (unidad, etc.). */
function allowsDecimalQuantity(unit: string | undefined): boolean {
  const u = (unit || "unidad").toLowerCase().trim();
  return ["kg", "g", "litro", "l", "ml", "resma", "m", "cm"].includes(u);
}
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

export default function ServiceDetailPage() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const serviceId = params?.serviceId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionDuration, setNewOptionDuration] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialEditId, setMaterialEditId] = useState<string | null>(null);
  const [materialVariantId, setMaterialVariantId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [productionCost, setProductionCost] = useState<ProductionCostResult | null>(null);
  const [variantsForMaterial, setVariantsForMaterial] = useState<ProductVariantForMaterial[]>([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");

  const businessIdDoc = business?._id;

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        })) as Business | null;
        if (!cancelled) setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  const loadService = () => {
    if (!businessIdDoc || !serviceId) return;
    setLoading(true);
    fetchApiV1({
      query: queries.getService,
      type: "json",
      variables: { id: businessIdDoc, _id: serviceId },
    })
      .then((res: Service | null) => setService(res || null))
      .catch(() => toast.error("Error al cargar el servicio"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!businessIdDoc || !serviceId) {
      setService(null);
      setLoading(false);
      return;
    }
    loadService();
  }, [businessIdDoc, serviceId]);

  useEffect(() => {
    if (!businessIdDoc || !serviceId) return;
    fetchApiV1({
      query: queries.getProductionCost,
      type: "json",
      variables: { id: businessIdDoc, service_id: serviceId },
    })
      .then((res: ProductionCostResult | null) => setProductionCost(res ?? null))
      .catch(() => setProductionCost(null));
  }, [businessIdDoc, serviceId, service?.materials?.length]);

  const loadVariantsForMaterial = () => {
    if (!businessIdDoc) return;
    fetchApiV1({
      query: queries.getProductVariants,
      type: "json",
      variables: { id: businessIdDoc, includeDeleted: false },
    })
      .then((res: ProductVariantForMaterial[] | null) => setVariantsForMaterial(Array.isArray(res) ? res : []))
      .catch(() => setVariantsForMaterial([]));
  };

  useEffect(() => {
    if (materialDialogOpen) loadVariantsForMaterial();
  }, [materialDialogOpen, businessIdDoc]);

  const handleSaveService = async () => {
    if (!businessIdDoc || !service) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateService,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: service._id,
          args: {
            name: service.name,
            description: service.description ?? "",
            is_available: service.is_available ?? true,
            unit_of_measure: service.unit_of_measure ?? "",
          },
        },
      });
      toast.success("Servicio actualizado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCostReview = async () => {
    if (!businessIdDoc || !serviceId) return;
    try {
      await fetchApiV1({
        query: queries.clearServiceCostReview,
        type: "json",
        variables: { id: businessIdDoc, _id: serviceId },
      });
      toast.success("Marcado como revisado");
      loadService();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error");
    }
  };

  const openAddMaterial = () => {
    setMaterialEditId(null);
    setMaterialVariantId("");
    setMaterialQuantity("");
    setMaterialDialogOpen(true);
  };

  const openEditMaterial = (m: ServiceMaterial) => {
    setMaterialEditId(m._id);
    setMaterialVariantId(m.product_variant_id);
    setMaterialQuantity(String(m.quantity_required));
    setMaterialDialogOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!businessIdDoc || !serviceId) return;
    const qty = parseFloat(materialQuantity);
    if (!materialVariantId) {
      toast.error("Selecciona una variante");
      return;
    }
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Cantidad debe ser mayor a 0");
      return;
    }
    setSavingMaterial(true);
    try {
      if (materialEditId) {
        await fetchApiV1({
          query: queries.updateServiceMaterial,
          type: "json",
          variables: { id: businessIdDoc, _id: materialEditId, args: { quantity_required: qty } },
        });
        toast.success("Cantidad actualizada");
      } else {
        await fetchApiV1({
          query: queries.createServiceMaterial,
          type: "json",
          variables: {
            id: businessIdDoc,
            args: { service_id: serviceId, product_variant_id: materialVariantId, quantity_required: qty },
          },
        });
        toast.success("Insumo agregado");
      }
      setMaterialDialogOpen(false);
      loadService();
      fetchApiV1({
        query: queries.getProductionCost,
        type: "json",
        variables: { id: businessIdDoc, service_id: serviceId },
      }).then((r: ProductionCostResult | null) => setProductionCost(r ?? null));
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al guardar");
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (m: ServiceMaterial) => {
    if (!confirm(`¿Quitar insumo ${m.productVariant?.sku ?? m.product_variant_id}?`)) return;
    if (!businessIdDoc) return;
    setDeletingMaterialId(m._id);
    try {
      await fetchApiV1({
        query: queries.deleteServiceMaterial,
        type: "json",
        variables: { id: businessIdDoc, _id: m._id },
      });
      toast.success("Insumo eliminado");
      loadService();
      fetchApiV1({
        query: queries.getProductionCost,
        type: "json",
        variables: { id: businessIdDoc, service_id: serviceId },
      }).then((r: ProductionCostResult | null) => setProductionCost(r ?? null));
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error");
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const handleAddOption = async () => {
    if (!businessIdDoc || !serviceId) return;
    const price = parseFloat(newOptionPrice);
    if (!newOptionName.trim()) {
      toast.error("Nombre de la opción es requerido");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      toast.error("Precio debe ser un número ≥ 0");
      return;
    }
    setAddingOption(true);
    try {
      await fetchApiV1({
        query: queries.createServiceOption,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            service_id: serviceId,
            name: newOptionName.trim(),
            price,
            durationMinutes: newOptionDuration.trim() ? parseInt(newOptionDuration, 10) || null : null,
          },
        },
      });
      toast.success("Opción agregada");
      setOptionDialogOpen(false);
      setNewOptionName("");
      setNewOptionPrice("");
      setNewOptionDuration("");
      loadService();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al agregar opción");
    } finally {
      setAddingOption(false);
    }
  };

  const handleDeleteOption = async (option: ServiceOption) => {
    if (!confirm(`¿Desactivar opción "${option.name}"?`)) return;
    if (!businessIdDoc) return;
    setDeletingOptionId(option._id);
    try {
      await fetchApiV1({
        query: queries.deleteServiceOption,
        type: "json",
        variables: { id: businessIdDoc, _id: option._id },
      });
      toast.success("Opción desactivada");
      loadService();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al desactivar");
    } finally {
      setDeletingOptionId(null);
    }
  };

  const options = service?.options ?? [];
  const materials = service?.materials ?? [];
  const totalCost = productionCost?.totalProductionCost ?? 0;
  const minOptionPrice = options.length > 0 ? Math.min(...options.map((o) => o.price ?? 0)) : 0;
  const grossProfit = minOptionPrice - totalCost;
  const marginPercent =
    minOptionPrice > 0 ? ((minOptionPrice - totalCost) / minOptionPrice) * 100 : 0;
  const costExceedsPrice = totalCost > 0 && minOptionPrice > 0 && totalCost >= minOptionPrice;

  const filteredVariants = useMemo(() => {
    const q = materialSearchQuery.trim().toLowerCase();
    if (!q) return variantsForMaterial;
    return variantsForMaterial.filter(
      (v) =>
        v.sku.toLowerCase().includes(q) ||
        (v.product?.name ?? "").toLowerCase().includes(q)
    );
  }, [variantsForMaterial, materialSearchQuery]);

  const selectedVariantForMaterial = useMemo(
    () => variantsForMaterial.find((v) => v._id === materialVariantId) ?? null,
    [variantsForMaterial, materialVariantId]
  );
  const editingMaterial = useMemo(
    () => (materialEditId ? materials.find((m) => m._id === materialEditId) : null),
    [materialEditId, materials]
  );
  const effectiveUnitForQuantity =
    editingMaterial?.productVariant?.unit_of_measure ?? selectedVariantForMaterial?.unit_of_measure;
  const quantityStep = allowsDecimalQuantity(effectiveUnitForQuantity) ? 0.0001 : 1;
  const quantityMin = quantityStep >= 1 ? 1 : 0.0001;

  if (!businessId || !serviceId) return null;
  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para editar este servicio.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${businessId}/services`}>Volver al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (loading || !service) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-6xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${businessId}/services`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>
      </Button>

      {costExceedsPrice && (
        <Card className="mb-4 border-destructive bg-destructive/10">
          <CardContent className="pt-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">El costo de producción supera el precio de venta</p>
              <p className="text-sm text-muted-foreground mt-1">
                Costo por unidad: ${totalCost.toFixed(2)}. Precio mínimo de opción: ${minOptionPrice.toFixed(2)}.
                Sube el precio de las opciones o reduce insumos antes de guardar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {service.cost_review_pending && (
        <Card className="mb-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm">El costo de un insumo asociado cambió. Revisa si debes actualizar los precios de venta.</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCostReview}>
              Marcar como revisado
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <main className="flex-1 min-w-0">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {service.name}
          </CardTitle>
          <CardDescription>Servicio padre. Las opciones (ej. 1 hora, 4 horas) se usan en facturas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={service.name}
                onChange={(e) => setService((s) => (s ? { ...s, name: e.target.value } : null))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={service.description ?? ""}
                onChange={(e) => setService((s) => (s ? { ...s, description: e.target.value } : null))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Unidad de medida</Label>
              <Input
                value={service.unit_of_measure ?? ""}
                onChange={(e) => setService((s) => (s ? { ...s, unit_of_measure: e.target.value } : null))}
                placeholder="Ej. Página, Plato, Hora, Copia"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Disponible para venta</Label>
                <p className="text-xs text-muted-foreground">Desactiva si se agotan recursos.</p>
              </div>
              <Switch
                checked={service.is_available !== false}
                onCheckedChange={(v) => setService((s) => (s ? { ...s, is_available: v } : null))}
              />
            </div>
          </div>
          <Button onClick={handleSaveService} disabled={saving || costExceedsPrice}>
            {saving ? "Guardando…" : "Guardar servicio"}
          </Button>
          {costExceedsPrice && (
            <p className="text-sm text-destructive">Ajusta los precios de las opciones (deben ser mayores al costo de producción) para poder guardar.</p>
          )}
        </CardContent>
      </Card>

      {productionCost && productionCost.breakdown.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Desglose de costo</CardTitle>
            <CardDescription>Insumos que componen el costo de producción por unidad.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo unit.</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionCost.breakdown.map((b) => (
                  <TableRow key={b.variantId}>
                    <TableCell className="font-mono text-sm">{b.sku}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                    <TableCell>${(b.costPrice ?? 0).toFixed(4)}</TableCell>
                    <TableCell>${(b.subtotal ?? 0).toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Insumos del servicio
              </CardTitle>
              <CardDescription>
                Opcional. Si agregas insumos, al vender este servicio se descontará inventario de estas variantes.
              </CardDescription>
            </div>
            <Button onClick={openAddMaterial} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar insumo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sin insumos. Modo &quot;solo servicio&quot; (no se descuenta inventario).</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU / Variante</TableHead>
                  <TableHead>Cantidad por unidad</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell className="font-mono">{m.productVariant?.sku ?? m.product_variant_id}</TableCell>
                    <TableCell>{m.quantity_required}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditMaterial(m)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteMaterial(m)}
                          disabled={deletingMaterialId === m._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Opciones del servicio</CardTitle>
              <CardDescription>Cada opción tiene nombre y precio (ej. &quot;1 hora&quot; - $50). Se referencian en líneas de factura.</CardDescription>
            </div>
            <Button onClick={() => setOptionDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar opción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Duración (min)</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No hay opciones. Agrega una (ej. &quot;1 hora&quot;, &quot;4 horas&quot;) con su precio.
                  </TableCell>
                </TableRow>
              ) : (
                options.map((opt) => {
                  const optPrice = opt.price ?? 0;
                  const belowCost = totalCost > 0 && optPrice < totalCost;
                  return (
                  <TableRow key={opt._id}>
                    <TableCell className="font-medium">
                      {opt.name}
                      {belowCost && (
                        <span className="ml-2 text-xs text-destructive font-normal">(precio &lt; costo)</span>
                      )}
                    </TableCell>
                    <TableCell>${optPrice.toFixed(2)}</TableCell>
                    <TableCell>{opt.durationMinutes != null ? opt.durationMinutes : "—"}</TableCell>
                    <TableCell>
                      {opt.status && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteOption(opt)}
                          disabled={deletingOptionId === opt._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </main>

        <aside className="lg:w-80 shrink-0">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Resumen financiero
              </CardTitle>
              <CardDescription>Actualizado en tiempo real según insumos y precios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Costo total de producción (por unidad)</p>
                <p className="text-xl font-semibold">${totalCost.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio mín. venta (opciones)</p>
                <p className="text-xl font-semibold">{minOptionPrice > 0 ? `$${minOptionPrice.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilidad bruta (por unidad)</p>
                <p className={`text-xl font-semibold ${grossProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {minOptionPrice > 0 ? `$${grossProfit.toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margen</p>
                <p className={`text-xl font-semibold ${marginPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {minOptionPrice > 0 ? `${marginPercent.toFixed(1)}%` : "—"}
                </p>
              </div>
              {costExceedsPrice && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span>Sube el precio de venta o reduce el costo para poder guardar.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva opción</DialogTitle>
            <DialogDescription>Ej. &quot;1 hora&quot;, &quot;4 horas&quot;, &quot;Básico&quot;. Indica el precio de esta opción.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Ej. 1 hora"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Precio *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newOptionPrice}
                onChange={(e) => setNewOptionPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
              {totalCost > 0 && parseFloat(newOptionPrice) < totalCost && (
                <p className="text-sm text-destructive mt-1">
                  El precio no puede ser menor que el costo de producción (${totalCost.toFixed(2)}). Sube el precio para poder guardar.
                </p>
              )}
            </div>
            <div>
              <Label>Duración (minutos, opcional)</Label>
              <Input
                type="number"
                min="0"
                value={newOptionDuration}
                onChange={(e) => setNewOptionDuration(e.target.value)}
                placeholder="Ej. 60"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={handleAddOption}
              disabled={
                addingOption ||
                !newOptionName.trim() ||
                (totalCost > 0 && (Number.isNaN(parseFloat(newOptionPrice)) || parseFloat(newOptionPrice) < totalCost))
              }
            >
              {addingOption ? "Agregando…" : "Agregar opción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col max-w-lg">
          <DialogHeader>
            <DialogTitle>{materialEditId ? "Editar cantidad de insumo" : "Agregar insumo"}</DialogTitle>
            <DialogDescription>
              Busca un producto físico y define la cantidad consumida por unidad de servicio. La cantidad se adapta a la unidad (ej. kg = decimales, unidad = enteros).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 min-h-0 flex flex-col">
            <div>
              <Label>Buscar por SKU o nombre</Label>
              <InputSearch
                placeholder="Filtrar variantes…"
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                className="mt-1"
                disabled={!!materialEditId}
              />
            </div>
            {!materialEditId && (
              <div className="flex-1 min-h-0 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="w-20">Unidad</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                          {variantsForMaterial.length === 0 ? "Cargando…" : "Sin resultados. Escribe para filtrar."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVariants.map((v) => (
                        <TableRow
                          key={v._id}
                          className={materialVariantId === v._id ? "bg-muted/50" : "cursor-pointer hover:bg-muted/30"}
                          onClick={() => !materialEditId && setMaterialVariantId(v._id)}
                        >
                          <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                          <TableCell className="text-sm">{v.product?.name ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.unit_of_measure || "unidad"}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMaterialVariantId(v._id);
                              }}
                            >
                              Elegir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {materialEditId && (
              <p className="text-sm text-muted-foreground">
                Variante: <span className="font-mono">{selectedVariantForMaterial?.sku ?? materialVariantId}</span>
              </p>
            )}
            {(materialVariantId || materialEditId) && (
              <div>
                <Label>
                  Cantidad por unidad *
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({allowsDecimalQuantity(effectiveUnitForQuantity) ? "decimales, ej. 0.5 kg" : "enteros"})
                  </span>
                </Label>
                <Input
                  type="number"
                  step={quantityStep}
                  min={quantityMin}
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(e.target.value)}
                  placeholder={quantityStep >= 1 ? "Ej. 1, 2" : "Ej. 0.5, 0.001"}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={handleSaveMaterial}
              disabled={
                savingMaterial ||
                !materialVariantId ||
                !materialQuantity.trim() ||
                (() => {
                  const qty = parseFloat(materialQuantity);
                  return Number.isNaN(qty) || qty < quantityMin;
                })()
              }
            >
              {savingMaterial ? "Guardando…" : materialEditId ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
