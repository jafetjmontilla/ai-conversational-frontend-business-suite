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
import { Switch } from "@/components/ui/switch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Product, ProductCategory } from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowLeft, Package } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

const roundToTwo = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function InventoryNuevoPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState("");
  const [brand, setBrand] = useState("");
  const [isSellable, setIsSellable] = useState(false);
  const [saving, setSaving] = useState(false);

  const businessIdDoc = business?._id;

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        let b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        })) as Business | null;
        if (!b && businessId) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
        }
        if (cancelled) return;
        setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  useEffect(() => {
    if (!businessIdDoc) return;
    fetchApiV1({
      query: queries.getProductCategories,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: ProductCategory[]) => setCategories(res || []))
      .catch(() => {});
  }, [businessIdDoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !name.trim()) {
      toast.error("Nombre es obligatorio");
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
          },
        },
      })) as Product;
      toast.success("Producto creado con una variante por defecto");
      router.push(`/${businessId}/inventory/${product._id}`);
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
              <Link href={`/${businessId}/inventory`}>Volver al inventario</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${businessId}/inventory`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inventario
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nuevo producto
          </CardTitle>
          <CardDescription>
            Crea el producto maestro. Se creará automáticamente una variante por defecto (SKU único). Luego puedes generar más variantes desde el detalle del producto.
          </CardDescription>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="is_sellable"
                checked={isSellable}
                onCheckedChange={setIsSellable}
              />
              <Label htmlFor="is_sellable" className="cursor-pointer">
                Vendible (aparece en catálogo de ventas). Si está desactivado puede ser usado como insumos/materia prima.
              </Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Crear producto"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${businessId}/inventory`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
