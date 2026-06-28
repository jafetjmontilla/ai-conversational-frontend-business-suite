"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, Attribute, AttributeValue } from "@/lib/interfases";
import { toast } from "sonner";
import { Layers, Plus, X, Sparkles } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { cn } from "@/lib/utils";
import { OfferingsGenerateDialog } from "@/components/offerings/OfferingsGenerateDialog";
import type { OfferingsImportDraft } from "@/lib/offerings/importTypes";

type AttributeWithValues = Attribute & { values?: AttributeValue[] };

export function AttributesCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);

  const [business, setBusiness] = useState<Business | null>(null);
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const businessIdDoc = business?._id;
  const [newAttrName, setNewAttrName] = useState("");
  const [newValueAttrId, setNewValueAttrId] = useState<string>("");
  const [newValueText, setNewValueText] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<string[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);

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
      setAttributes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchApiV1({
      query: queries.getAttributes,
      type: "json",
      variables: { id: businessIdDoc },
    })
      .then((res: AttributeWithValues[] | null) => {
        if (cancelled) return;
        setAttributes(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar atributos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessIdDoc]);

  const handleGenerateResult = (draft: OfferingsImportDraft) => {
    if (draft.attributes.length === 0) {
      toast.warning("No se detectaron atributos en el texto");
      return;
    }
    if (draft.attributes.length > 1) {
      toast.info(
        `Se detectaron ${draft.attributes.length} atributos. Usa "Importar con IA" en la barra superior para cargarlos todos.`
      );
    }
    const first = draft.attributes[0];
    setNewAttrName(first.name);
    setPendingValues(first.values ?? []);
    toast.success("Nombre y valores sugeridos. Revisa y crea el atributo.");
  };

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !newAttrName.trim()) {
      toast.error("Nombre del atributo es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const created = (await fetchApiV1({
        query: queries.createAttribute,
        type: "json",
        variables: { id: businessIdDoc, args: { name: newAttrName.trim() } },
      })) as Attribute;
      const valueRecords: AttributeValue[] = [];
      for (const val of pendingValues) {
        const v = val.trim();
        if (!v) continue;
        try {
          const valueCreated = (await fetchApiV1({
            query: queries.createAttributeValue,
            type: "json",
            variables: {
              id: businessIdDoc,
              args: { attribute_id: created._id, value: v },
            },
          })) as AttributeValue;
          valueRecords.push(valueCreated);
        } catch {
          // skip duplicate values
        }
      }
      setAttributes((prev) => [...prev, { ...created, values: valueRecords }]);
      setNewAttrName("");
      setPendingValues([]);
      setNewValueAttrId(created._id);
      toast.success(
        valueRecords.length
          ? `Atributo creado con ${valueRecords.length} valor(es)`
          : "Atributo creado"
      );
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al crear atributo");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdDoc || !newValueAttrId || !newValueText.trim()) {
      toast.error("Atributo y valor son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const created = (await fetchApiV1({
        query: queries.createAttributeValue,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: { attribute_id: newValueAttrId, value: newValueText.trim() },
        },
      })) as AttributeValue;
      setAttributes((prev) =>
        prev.map((a) =>
          a._id === newValueAttrId ? { ...a, values: [...(a.values || []), created] } : a
        )
      );
      setNewValueText("");
      toast.success("Valor agregado");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al agregar valor");
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) return null;
  if (!canViewCurrentBusiness?.()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver atributos.</p>
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

  const renderManageCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>Gestionar atributos</CardTitle>
            <CardDescription>Crea atributos y valores para generar variantes de producto.</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4 mr-1" />
                IA
              </Button>
            )}
            {options?.onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={options.onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-6">
        <form onSubmit={handleCreateAttribute} className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Nuevo atributo</p>
          <div className="space-y-2">
            <Label htmlFor="attrName">Nombre</Label>
            <Input
              id="attrName"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              placeholder="Ej. Color"
              disabled={saving}
            />
          </div>
          {pendingValues.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Valores sugeridos: {pendingValues.join(", ")}
            </p>
          )}
          <Button type="submit" size="sm" disabled={saving || !newAttrName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            {saving ? "Guardando…" : "Crear atributo"}
          </Button>
        </form>

        <form onSubmit={handleCreateValue} className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Agregar valor</p>
          <div className="space-y-2">
            <Label>Atributo</Label>
            <Select value={newValueAttrId} onValueChange={setNewValueAttrId} disabled={saving || attributes.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {attributes.map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valueText">Valor</Label>
            <Input
              id="valueText"
              value={newValueText}
              onChange={(e) => setNewValueText(e.target.value)}
              placeholder="Ej. Rojo"
              disabled={saving || attributes.length === 0}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={saving || !newValueAttrId || !newValueText.trim()}>
            Agregar valor
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Atributos
            </div>
            {canEdit ? (
              <Button type="button" variant="outline" size="sm" className="flex md:hidden" onClick={() => setMobilePanelOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Gestionar
              </Button>
            ) : null}
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Define atributos (ej. Color, Talla) y sus valores. Se usan al generar variantes en un producto."
              : "Solo lectura. No tienes permiso para editar atributos."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : attributes.length === 0 ? (
            <p className="text-muted-foreground py-6">
              No hay atributos{canEdit ? ". Crea uno en el panel derecho." : " definidos."}
            </p>
          ) : (
            <ul className="space-y-4">
              {attributes.map((attr) => (
                <li key={attr._id} className="border rounded-lg p-4">
                  <div className="font-medium">{attr.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                    {(attr.values || []).length === 0 ? (
                      <span>Sin valores</span>
                    ) : (
                      (attr.values || []).map((v) => (
                        <span key={v._id} className="bg-muted px-2 py-0.5 rounded" title={v.code ? `priceKey: ${v.code}` : undefined}>
                          {v.value}
                          {v.code && v.code !== v.value.toLowerCase().replace(/\s+/g, "_") ? (
                            <span className="text-muted-foreground ml-1 text-xs">({v.code})</span>
                          ) : null}
                        </span>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderManageCard()}
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
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderManageCard({
                className: "h-full rounded-none border-0 border-l",
                onClose: () => setMobilePanelOpen(false),
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      {canEdit && (
        <OfferingsGenerateDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          businessIdDoc={businessIdDoc}
          scope="ATTRIBUTES"
          title="Generar atributo con IA"
          description='Ej: "Color: Rojo, Azul, Verde | Talla: S, M, L"'
          onResult={handleGenerateResult}
        />
      )}
    </div>
  );
}
