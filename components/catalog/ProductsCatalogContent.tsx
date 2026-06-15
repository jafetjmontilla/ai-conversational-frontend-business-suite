"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Product } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Package, Trash2, Settings2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";

type ProductWithVariants = Product & {
  category?: { _id: string; name: string } | null;
  variants?: { _id: string; sku: string; stock_quantity: number; price_override: number | null }[];
};

export function ProductsCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (!businessIdDoc) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getProducts,
      type: "json",
      variables: { id: businessIdDoc, limit: 500, includeNonSellable: true },
    })
      .then((res: ProductWithVariants[] | null) => {
        if (cancelled) return;
        setProducts(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar productos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.variants?.some((v) => v.sku.toLowerCase().includes(q)))
    );
  }, [products, query]);

  const handleDelete = async (product: ProductWithVariants) => {
    if (!confirm(`¿Desactivar producto "${product.name}"?`)) return;
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.deleteProduct,
        type: "json",
        variables: { id: businessIdDoc, _id: product._id },
      });
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast.success("Producto desactivado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al desactivar");
    }
  };

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver el inventario de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <Card className="flex flex-col w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos
          </CardTitle>
          <CardDescription>Productos (maestro) y variantes (SKU). Cada producto tiene al menos una variante.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-2 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row gap-2 p-2">
            <div className="flex-1">
              <InputSearch
                placeholder="Buscar por nombre, descripción, marca o SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>
            {canEditCurrentBusiness?.() && (
              <Button asChild size="sm" disabled={!businessIdDoc || loading}>
                <Link href={`/${businessId}/catalog/productos/nuevo`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar producto
                </Link>
              </Button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Producto</TableHead>
                  <TableHead className="min-w-[120px]">Categoría</TableHead>
                  <TableHead className="min-w-[90px]">Precio base</TableHead>
                  <TableHead className="min-w-[80px]">Variantes</TableHead>
                  <TableHead className="min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {query ? "Sin resultados con el filtro." : "No hay productos. Agrega uno."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Link
                          href={`/${businessId}/catalog/productos/${product._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                        )}
                      </TableCell>
                      <TableCell>{product.category?.name ?? "—"}</TableCell>
                      <TableCell>${(product.base_price ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{product.variants?.length ?? 0}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/${businessId}/catalog/productos/${product._id}`}>
                            <Settings2 className="h-3 w-3" />
                          </Link>
                        </Button>
                        {canEditCurrentBusiness?.() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="p-4 mt-2 bg-muted/50 rounded-lg text-sm">
              Mostrando {filtered.length} productos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
