"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Product } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, Package, Settings2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { InventoryModeBadge } from "@/components/offerings/InventoryModeBadge";
import { getProductInventoryMode } from "@/lib/offerings/inventoryModeLabels";
import { ProductEditPanel } from "@/components/catalog/ProductEditPanel";
import { cn } from "@/lib/utils";

type ProductWithVariants = Product & {
  category?: { _id: string; name: string } | null;
  variants?: { _id: string; sku: string; stock_quantity: number; price_override: number | null }[];
};

export function ProductsCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductWithVariants | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const businessIdDoc = business?._id;
  const canEdit = !!canEditCurrentBusiness?.();

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

  const selectProduct = (product: ProductWithVariants, openMobile = false) => {
    setSelected(product);
    if (openMobile) setMobilePanelOpen(true);
  };

  const handleProductUpdated = (updated: ProductWithVariants) => {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
    setSelected((prev) => (prev?._id === updated._id ? { ...prev, ...updated } : prev));
  };

  const handleProductDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    setSelected(null);
    setMobilePanelOpen(false);
  };

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderEditPanel = (options?: { className?: string; onClose?: () => void }) => (
    <ProductEditPanel
      businessId={businessId}
      businessIdDoc={businessIdDoc}
      productId={selected?._id ?? null}
      canEdit={canEdit}
      className={options?.className}
      onClose={options?.onClose}
      onProductUpdated={handleProductUpdated}
      onProductDeleted={handleProductDeleted}
    />
  );

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
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos
            </div>
            {canEdit && (
              <Button asChild size="sm" className="shrink-0" disabled={!businessIdDoc || loading}>
                <Link href={`/${businessId}/offerings/products/nuevo`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar producto
                </Link>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Productos (maestro) y variantes (SKU). Haz clic en una fila para editar en el panel derecho.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden p-0 md:p-2">
          <div className="p-2">
            <InputSearch
              placeholder="Buscar por nombre, descripción, marca o SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
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
                  <TableHead className="min-w-[100px]">Inventario</TableHead>
                  <TableHead className="min-w-[120px]">Categoría</TableHead>
                  <TableHead className="min-w-[90px]">Precio base</TableHead>
                  <TableHead className="min-w-[80px]">Variantes</TableHead>
                  <TableHead className="min-w-[56px] md:hidden">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {query ? "Sin resultados con el filtro." : "No hay productos. Agrega uno."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => {
                    const mode = getProductInventoryMode(product);
                    const totalStock = (product.variants ?? []).reduce(
                      (sum, v) => sum + (v.stock_quantity ?? 0),
                      0
                    );
                    const isSelected = selected?._id === product._id;
                    return (
                      <TableRow
                        key={product._id}
                        className={cn(
                          "md:cursor-pointer",
                          isSelected && "bg-muted/50"
                        )}
                        onClick={() => {
                          if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                            selectProduct(product);
                          }
                        }}
                      >
                        <TableCell>
                          <span className="font-medium">{product.name}</span>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <InventoryModeBadge mode={mode} />
                            {mode.key === "direct_stock" && (
                              <span className="text-xs text-muted-foreground" title="Suma de stock en variantes">
                                Stock: {totalStock}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category?.name ?? "—"}</TableCell>
                        <TableCell>${(product.base_price ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{product.variants?.length ?? 0}</TableCell>
                        <TableCell className="md:hidden">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            aria-label={`Editar ${product.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectProduct(product, true);
                            }}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <div id="section-right" className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
        {renderEditPanel()}
      </div>

      <AnimatePresence>
        {mobilePanelOpen && selected ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={mobilePanelTransition}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobilePanelOpen(false)}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={mobilePanelTransition}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderEditPanel({
                className: "h-full rounded-none border-0 border-l",
                onClose: () => setMobilePanelOpen(false),
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
