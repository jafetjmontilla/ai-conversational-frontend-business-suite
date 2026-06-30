"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Product, ProductCategory } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Package, Sparkles } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { hasCapability, canUseOfferingsCatalogProduct } from "@/lib/app-suite/capabilities";
import { getCapabilityHintPlain } from "@/lib/app-suite/featureCopy";
import { ProductSellableField } from "@/components/app-suite/ProductSellableField";
import { ProductInventorySection } from "@/components/offerings/ProductInventorySection";
import { OfferingsGenerateDialog } from "@/components/offerings/OfferingsGenerateDialog";
import type { OfferingsImportDraft } from "@/lib/offerings/importTypes";
import type { RequiredMaterial } from "@/lib/interfases";

const roundToTwo = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function InventoryNuevoPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const { business, businessIdDoc, installedApps } = useBusinessApps(businessId);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState("");
  const [brand, setBrand] = useState("");
  const [isSellable, setIsSellable] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [hasBillOfMaterials, setHasBillOfMaterials] = useState(false);
  const [requiredMaterials, setRequiredMaterials] = useState<RequiredMaterial[]>([]);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  useEffect(() => {
    if (!businessIdDoc) return;
    setIsSellable(hasCapability(installedApps, "product.sellable"));
  }, [installedApps, businessIdDoc]);

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

  const handleGenerateResult = (draft: OfferingsImportDraft) => {
    const prod = draft.products[0];
    if (!prod) {
      toast.warning("No se detectó un producto en el texto");
      return;
    }
    setName(prod.name);
    setDescription(prod.description ?? "");
    setBrand(prod.brand ?? "");
    if (prod.base_price != null) setBasePrice(String(prod.base_price));
    if (prod.is_sellable != null) setIsSellable(prod.is_sellable);
    if (prod.category_hint && categories.length) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === prod.category_hint!.toLowerCase()
      );
      if (match) setCategoryId(match._id);
    }
    toast.success("Campos rellenados. Revisa antes de guardar.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !name.trim()) {
      toast.error("Nombre es obligatorio");
      return;
    }
    if (isSellable && !hasCapability(installedApps, "product.sellable")) {
      toast.error(getCapabilityHintPlain("product.sellable"));
      return;
    }
    if (!isSellable && !hasCapability(installedApps, "product.rawMaterial") && !canUseOfferingsCatalogProduct(installedApps)) {
      toast.error(getCapabilityHintPlain("product.rawMaterial"));
      return;
    }
    if (isSellable && hasBillOfMaterials && requiredMaterials.length === 0) {
      toast.error("Agrega al menos un insumo a la receta o desactiva «Receta / lista de materiales».");
      return;
    }
    setSaving(true);
    try {
      const product = (await fetchApiV1({
        query: queries.createProduct,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: {
            name: name.trim(),
            description: description.trim() || undefined,
            category_id: categoryId || undefined,
            base_price: basePrice ? roundToTwo(parseFloat(basePrice)) : 0,
            brand: brand.trim() || undefined,
            is_sellable: isSellable,
            trackInventory: isSellable ? trackInventory : undefined,
            hasBillOfMaterials: isSellable ? hasBillOfMaterials : false,
            requiredMaterials: isSellable && hasBillOfMaterials
              ? requiredMaterials.map((m) => ({
                  materialVariantId: m.materialVariantId,
                  sku: m.sku,
                  quantity: m.quantity,
                  unitOfMeasure: m.unitOfMeasure,
                }))
              : [],
          },
        },
      })) as Product;
      toast.success("Producto creado con una variante por defecto");
      router.push(`/${businessId}/offerings/products/${product._id}`);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al crear producto");
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) return null;
  if (!canEditCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para agregar productos.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/${businessId}/offerings/products`}>Volver al inventario</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${businessId}/offerings/products`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inventario
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Nuevo producto
              </CardTitle>
              <CardDescription>
                Crea el producto maestro. Se creará automáticamente una variante por defecto (SKU único). Luego puedes generar más variantes desde el detalle del producto.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Camisa Oxford"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId ?? "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? null : v)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="basePrice">Precio base</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <ProductSellableField
              businessId={businessId}
              installedApps={installedApps}
              checked={isSellable}
              onCheckedChange={(checked) => {
                setIsSellable(checked);
                if (!checked) {
                  setTrackInventory(true);
                  setHasBillOfMaterials(false);
                  setRequiredMaterials([]);
                }
              }}
            />
            <ProductInventorySection
              businessIdDoc={businessIdDoc}
              isSellable={isSellable}
              trackInventory={trackInventory}
              hasBillOfMaterials={hasBillOfMaterials}
              requiredMaterials={requiredMaterials}
              onTrackInventoryChange={setTrackInventory}
              onHasBillOfMaterialsChange={setHasBillOfMaterials}
              onRequiredMaterialsChange={setRequiredMaterials}
              disabled={saving}
            />
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Crear producto"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${businessId}/offerings/products`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <OfferingsGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        businessIdDoc={businessIdDoc}
        scope="PRODUCTS"
        title="Generar producto con IA"
        description="Describe el producto en lenguaje natural. Se rellenará el formulario con los datos detectados."
        onResult={handleGenerateResult}
      />
    </div>
  );
}
