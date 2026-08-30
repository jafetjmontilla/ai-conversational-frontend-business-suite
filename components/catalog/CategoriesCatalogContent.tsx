"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Attribute, Business, ProductCategory } from "@/lib/interfases";
import { toast } from "sonner";
import { Pencil, Plus, Sparkles, Tag, Trash2, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { cn } from "@/lib/utils";
import { ProductCategoriesImportDialog } from "@/components/business/ProductCategoriesImportDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

const CATEGORY_TYPES = [
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
  { value: "ambos", label: "Ambos" },
] as const;

type CategoryType = (typeof CATEGORY_TYPES)[number]["value"];

export function CategoriesCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const businessIdDoc = business?._id;

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catType, setCatType] = useState<CategoryType>("producto");
  const [catPricingAttributeId, setCatPricingAttributeId] = useState<string>("__none__");
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!businessSlug) return;
    let cancelled = false;
    (async () => {
      try {
        let b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessSlug },
        })) as Business | null;
        if (!b && businessSlug) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId: businessSlug },
          })) as Business | null;
        }
        if (!cancelled) setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  const fetchCategories = async (id: string) => {
    const res = await fetchApiV1({
      query: queries.getProductCategories,
      type: "json",
      variables: { id, includeInactive: true },
    });
    setCategories(Array.isArray(res) ? res : []);
  };

  useEffect(() => {
    if (!businessIdDoc) {
      setCategories([]);
      setAttributes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCategories(businessIdDoc),
      fetchApiV1({
        query: queries.getAttributes,
        type: "json",
        variables: { id: businessIdDoc },
      }),
    ])
      .then(([, attrsRes]) => {
        if (cancelled) return;
        setAttributes(Array.isArray(attrsRes) ? attrsRes : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar categorías");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessIdDoc]);

  useEffect(() => {
    if (editingCategory) {
      setCatName(editingCategory.name);
      setCatDescription(editingCategory.description || "");
      setCatType(editingCategory.type);
      setCatPricingAttributeId(editingCategory.pricingAttributeId ?? "__none__");
      return;
    }
    setCatName("");
    setCatDescription("");
    setCatType("producto");
    setCatPricingAttributeId("__none__");
  }, [editingCategory]);

  const resetForm = () => {
    setEditingCategory(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobilePanelOpen(false);
    }
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setMobilePanelOpen(true);
  };

  const openEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setMobilePanelOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc) return;
    if (!catName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      const args = {
        name: catName.trim(),
        description: catDescription.trim() || undefined,
        type: catType,
        pricingAttributeId: catPricingAttributeId === "__none__" ? null : catPricingAttributeId,
      };
      if (editingCategory) {
        await fetchApiV1({
          query: queries.updateProductCategory,
          type: "json",
          variables: { _id: editingCategory._id, id: businessIdDoc, args },
        });
        toast.success("Categoría actualizada");
      } else {
        await fetchApiV1({
          query: queries.createProductCategory,
          type: "json",
          variables: { id: businessIdDoc, args },
        });
        toast.success("Categoría creada");
      }
      await fetchCategories(businessIdDoc);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar categoría";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!businessIdDoc || !deleteTarget) return;
    setDeleting(true);
    try {
      await fetchApiV1({
        query: queries.deleteProductCategory,
        type: "json",
        variables: { _id: deleteTarget._id, id: businessIdDoc },
      });
      toast.success("Categoría desactivada");
      await fetchCategories(businessIdDoc);
      if (editingCategory?._id === deleteTarget._id) resetForm();
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "Error al desactivar categoría";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (!businessSlug) return null;

  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver categorías.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = canEditCurrentBusiness?.();
  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderFormCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(options?.onClose && "pt-12 pb-2")}>
            <CardTitle>{editingCategory ? "Editar categoría" : "Nueva categoría"}</CardTitle>
            <CardDescription>
              Clasifica productos y servicios. Opcionalmente vincula un atributo de precio para extras.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && !editingCategory ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Sparkles className="h-4 w-4 mr-1" />
                IA
              </Button>
            ) : null}
            {options?.onClose ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={options.onClose}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {canEdit ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                placeholder="Ej. Electrónica, Consultoría"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Descripción</label>
              <Input
                placeholder="Opcional"
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={catType}
                onValueChange={(v) => setCatType(v as CategoryType)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Atributo de precio para extras</label>
              <p className="text-xs text-muted-foreground">
                Ej. Tamaño en pizzas — los adicionales indexan precio por priceKey de sus valores.
              </p>
              <Select
                value={catPricingAttributeId}
                onValueChange={setCatPricingAttributeId}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguno</SelectItem>
                  {attributes.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Guardando..." : editingCategory ? "Actualizar" : "Agregar"}
              </Button>
              {editingCategory ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Solo lectura. No tienes permiso para editar categorías.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categorías
            </div>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex md:hidden"
                onClick={openNewCategory}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
            ) : null}
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Organiza productos y servicios del catálogo por categorías."
              : "Solo lectura. No tienes permiso para editar categorías."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No hay categorías creadas</p>
              {canEdit ? (
                <p className="text-xs mt-1">Usa el panel derecho o el botón Nueva para crear una.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    !cat.active && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {CATEGORY_TYPES.find((t) => t.value === cat.type)?.label || cat.type}
                      </span>
                      {!cat.active && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                          Inactiva
                        </span>
                      )}
                    </div>
                    {cat.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditCategory(cat)}
                        aria-label={`Editar ${cat.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {cat.active ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                          aria-label={`Desactivar ${cat.name}`}
                          disabled={deleting}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderFormCard()}
        </div>
      ) : null}

      <AnimatePresence>
        {canEdit && mobilePanelOpen ? (
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
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl bg-background"
            >
              {renderFormCard({ className: "h-full rounded-none", onClose: () => setMobilePanelOpen(false) })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {businessIdDoc ? (
        <ProductCategoriesImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          businessId={businessIdDoc}
          onImported={() => void fetchCategories(businessIdDoc)}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="¿Desactivar categoría?"
        description={
          deleteTarget
            ? `La categoría «${deleteTarget.name}» quedará inactiva. Los productos existentes conservan su referencia.`
            : undefined
        }
        confirmButtonText="Desactivar"
        cancelButtonText="Cancelar"
        loading={deleting}
      />
    </div>
  );
}
