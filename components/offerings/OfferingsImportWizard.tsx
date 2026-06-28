"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApiV1, queries } from "@/lib/Fetching";
import {
  OFFERINGS_IMPORT_PLACEHOLDER,
  OFFERINGS_IMPORT_SCOPE_OPTIONS,
  type OfferingsImportDraft,
  type OfferingsImportResult,
  type OfferingsImportScope,
  type ParsedAttributeDraft,
  type ParsedProductDraft,
  type ParsedServiceDraft,
  type ParsedModifierGroupDraft,
} from "@/lib/offerings/importTypes";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Step = "input" | "preview" | "done";

type OfferingsImportWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessIdDoc: string | null | undefined;
  onImported?: () => void;
};

function formatVariantSummary(prod: ParsedProductDraft): string | null {
  if (!prod.needs_variants || !prod.variants?.length) return null;
  const attrs =
    prod.variant_attributes?.map((a) => `${a.name}: ${a.values.join(", ")}`).join(" · ") ?? "";
  const count = prod.variants.length;
  const samples = prod.variants
    .slice(0, 3)
    .map((v) => {
      const label = v.attribute_values.map((av) => av.value).join(" / ");
      const price =
        v.price_override != null && v.price_override !== prod.base_price
          ? ` $${v.price_override}`
          : "";
      return `${v.sku ?? label}${price}`;
    })
    .join(", ");
  const more = count > 3 ? ` (+${count - 3} más)` : "";
  return attrs
    ? `${count} variantes (${attrs}) — ej: ${samples}${more}`
    : `${count} variantes — ej: ${samples}${more}`;
}

function formatModifierGroupSummary(group: ParsedModifierGroupDraft): string {
  const opts = group.options.map((o) => `${o.name} ($${o.price})`).join(" · ");
  const rules =
    group.selectionType === "SINGLE"
      ? "una opción"
      : `hasta ${group.maxSelections ?? group.options.length}`;
  const required = group.isRequired ? " · obligatorio" : "";
  const hints = [
    ...(group.product_hints ?? []).length ? [`productos: ${(group.product_hints ?? []).join(", ")}`] : [],
    ...(group.service_hints ?? []).length ? [`servicios: ${(group.service_hints ?? []).join(", ")}`] : [],
  ];
  return `${rules}${required} — ${opts}${hints.length ? ` · vincular a ${hints.join("; ")}` : ""}`;
}

function withSelected(draft: OfferingsImportDraft): OfferingsImportDraft {
  return {
    ...draft,
    attributes: draft.attributes.map((a) => ({ ...a, selected: true })),
    products: draft.products.map((p) => ({ ...p, selected: true })),
    services: draft.services.map((s) => ({ ...s, selected: true })),
    modifierGroups: (draft.modifierGroups ?? []).map((g) => ({ ...g, selected: true })),
  };
}

export function OfferingsImportWizard({
  open,
  onOpenChange,
  businessId,
  businessIdDoc,
  onImported,
}: OfferingsImportWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [scope, setScope] = useState<OfferingsImportScope>("ALL");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<OfferingsImportDraft | null>(null);
  const [result, setResult] = useState<OfferingsImportResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);

  const reset = useCallback(() => {
    setStep("input");
    setScope("ALL");
    setRawText("");
    setDraft(null);
    setResult(null);
  }, []);

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const selectedCounts = useMemo(() => {
    if (!draft) return { attributes: 0, products: 0, services: 0, modifierGroups: 0 };
    return {
      attributes: draft.attributes.filter((a) => a.selected !== false).length,
      products: draft.products.filter((p) => p.selected !== false).length,
      services: draft.services.filter((s) => s.selected !== false).length,
      modifierGroups: (draft.modifierGroups ?? []).filter((g) => g.selected !== false).length,
    };
  }, [draft]);

  const handleAnalyze = async () => {
    if (!businessIdDoc) {
      toast.error("Negocio no cargado");
      return;
    }
    if (!rawText.trim()) {
      toast.error("Escribe o pega algún texto");
      return;
    }
    setAnalyzing(true);
    try {
      const parsed = (await fetchApiV1({
        query: queries.parseOfferingsFromText,
        type: "json",
        variables: { id: businessIdDoc, rawText: rawText.trim(), scope },
      })) as OfferingsImportDraft;
      const enriched = withSelected({
        ...parsed,
        modifierGroups: parsed.modifierGroups ?? [],
      });
      const total =
        enriched.attributes.length +
        enriched.products.length +
        enriched.services.length +
        enriched.modifierGroups.length;
      if (total === 0) {
        toast.warning("No se detectaron elementos. Prueba con más detalle.");
        return;
      }
      setDraft(enriched);
      setStep("preview");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!businessIdDoc || !draft) return;
    const input = {
      attributes: draft.attributes
        .filter((a) => a.selected !== false)
        .map(({ name, values }) => ({ name, values })),
      products: draft.products
        .filter((p) => p.selected !== false)
        .map(
          ({
            name,
            description,
            base_price,
            brand,
            category_hint,
            is_sellable,
            needs_variants,
            variant_attributes,
            variants,
          }) => ({
            name,
            description,
            base_price,
            brand,
            category_hint,
            is_sellable,
            needs_variants,
            variant_attributes,
            variants,
          })
        ),
      services: draft.services
        .filter((s) => s.selected !== false)
        .map(({ name, description, unit_of_measure, options }) => ({
          name,
          description,
          unit_of_measure,
          options,
        })),
      modifierGroups: (draft.modifierGroups ?? [])
        .filter((g) => g.selected !== false)
        .map(
          ({
            name,
            isRequired,
            selectionType,
            minSelections,
            maxSelections,
            priceBehavior,
            includedQuantity,
            options,
            product_hints,
            service_hints,
          }) => ({
            name,
            isRequired,
            selectionType,
            minSelections,
            maxSelections,
            priceBehavior,
            includedQuantity,
            options,
            product_hints: product_hints ?? [],
            service_hints: service_hints ?? [],
          })
        ),
    };
    const total =
      input.attributes.length +
      input.products.length +
      input.services.length +
      input.modifierGroups.length;
    if (total === 0) {
      toast.error("Selecciona al menos un ítem para importar");
      return;
    }
    setImporting(true);
    try {
      const res = (await fetchApiV1({
        query: queries.confirmOfferingsImport,
        type: "json",
        variables: { id: businessIdDoc, input },
      })) as OfferingsImportResult;
      setResult(res);
      setStep("done");
      const created = res.created.length;
      const skipped = res.skipped.length;
      const errors = res.errors.length;
      if (created > 0) {
        toast.success(`${created} ítem(s) importado(s)`);
        onImported?.();
        router.refresh();
      }
      if (skipped > 0) toast.info(`${skipped} omitido(s)`);
      if (errors > 0) toast.error(`${errors} error(es) al importar`);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al importar");
    } finally {
      setImporting(false);
    }
  };

  const updateAttribute = (index: number, patch: Partial<ParsedAttributeDraft>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            attributes: d.attributes.map((a, i) => (i === index ? { ...a, ...patch } : a)),
          }
        : d
    );
  };

  const updateProduct = (index: number, patch: Partial<ParsedProductDraft>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            products: d.products.map((p, i) => (i === index ? { ...p, ...patch } : p)),
          }
        : d
    );
  };

  const updateService = (index: number, patch: Partial<ParsedServiceDraft>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            services: d.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
          }
        : d
    );
  };

  const updateModifierGroup = (index: number, patch: Partial<ParsedModifierGroupDraft>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            modifierGroups: (d.modifierGroups ?? []).map((g, i) =>
              i === index ? { ...g, ...patch } : g
            ),
          }
        : d
    );
  };

  const previewTabs = useMemo(() => {
    const tabs: { id: string; label: string; count: number }[] = [];
    if (draft?.attributes.length) tabs.push({ id: "attributes", label: "Atributos", count: draft.attributes.length });
    if (draft?.products.length) tabs.push({ id: "products", label: "Productos", count: draft.products.length });
    if (draft?.services.length) tabs.push({ id: "services", label: "Servicios", count: draft.services.length });
    if (draft?.modifierGroups?.length)
      tabs.push({ id: "modifiers", label: "Modificadores", count: draft.modifierGroups.length });
    return tabs;
  }, [draft]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar catálogo con IA
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Pega un menú, tarifario o lista de productos y servicios."}
            {step === "preview" && "Revisa y edita antes de importar. Desmarca lo que no quieras crear."}
            {step === "done" && "Importación completada."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <Label>Alcance</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as OfferingsImportScope)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFERINGS_IMPORT_SCOPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Texto</Label>
              <AutoResizeTextarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={OFFERINGS_IMPORT_PLACEHOLDER}
                minRows={6}
                maxRows={14}
                className="mt-1"
                disabled={analyzing}
              />
            </div>
          </div>
        )}

        {step === "preview" && draft && (
          <div className="space-y-4">
            {draft.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Avisos de la IA
                </div>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-0.5">
                  {draft.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <Tabs defaultValue={previewTabs[0]?.id ?? "attributes"}>
              <TabsList className="flex flex-wrap h-auto">
                {previewTabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>
                    {t.label} ({t.count})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="attributes" className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {draft.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 items-start rounded-lg border p-2">
                    <input
                      type="checkbox"
                      checked={attr.selected !== false}
                      onChange={(e) => updateAttribute(i, { selected: e.target.checked })}
                      className="mt-2"
                      aria-label="Importar atributo"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <Input
                        value={attr.name}
                        onChange={(e) => updateAttribute(i, { name: e.target.value })}
                        className="h-8"
                      />
                      <Input
                        value={attr.values.join(", ")}
                        onChange={(e) =>
                          updateAttribute(i, {
                            values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Valores separados por coma"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="products" className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {draft.products.map((prod, i) => {
                  const variantSummary = formatVariantSummary(prod);
                  return (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2 items-start rounded-lg border p-2",
                      prod.base_price == null && "border-amber-500/50 bg-amber-500/5"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={prod.selected !== false}
                      onChange={(e) => updateProduct(i, { selected: e.target.checked })}
                      className="mt-2"
                      aria-label="Importar producto"
                    />
                    <div className="flex-1 grid gap-1 sm:grid-cols-2 min-w-0">
                      <Input
                        value={prod.name}
                        onChange={(e) => updateProduct(i, { name: e.target.value })}
                        className="h-8 sm:col-span-2"
                        placeholder="Nombre"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={prod.base_price ?? ""}
                        onChange={(e) =>
                          updateProduct(i, {
                            base_price: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="h-8"
                        placeholder="Precio"
                      />
                      <Input
                        value={prod.brand ?? ""}
                        onChange={(e) => updateProduct(i, { brand: e.target.value || null })}
                        className="h-8"
                        placeholder="Marca"
                      />
                      <Input
                        value={prod.description ?? ""}
                        onChange={(e) => updateProduct(i, { description: e.target.value || null })}
                        className="h-8 sm:col-span-2"
                        placeholder="Descripción"
                      />
                      {variantSummary && (
                        <p className="text-xs text-primary sm:col-span-2">{variantSummary}</p>
                      )}
                    </div>
                  </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="services" className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {draft.services.map((svc, i) => (
                  <div key={i} className="flex gap-2 items-start rounded-lg border p-2">
                    <input
                      type="checkbox"
                      checked={svc.selected !== false}
                      onChange={(e) => updateService(i, { selected: e.target.checked })}
                      className="mt-2"
                      aria-label="Importar servicio"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <Input
                        value={svc.name}
                        onChange={(e) => updateService(i, { name: e.target.value })}
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Opciones:{" "}
                        {svc.options.map((o) => `${o.name} ($${o.price})`).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="modifiers" className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {(draft.modifierGroups ?? []).map((grp, i) => (
                  <div key={i} className="flex gap-2 items-start rounded-lg border p-2">
                    <input
                      type="checkbox"
                      checked={grp.selected !== false}
                      onChange={(e) => updateModifierGroup(i, { selected: e.target.checked })}
                      className="mt-2"
                      aria-label="Importar grupo de modificadores"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <Input
                        value={grp.name}
                        onChange={(e) => updateModifierGroup(i, { name: e.target.value })}
                        className="h-8"
                        placeholder="Nombre del grupo"
                      />
                      <p className="text-xs text-muted-foreground">{formatModifierGroupSummary(grp)}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <p className="text-sm text-muted-foreground">
              Se importarán {selectedCounts.attributes} atributo(s), {selectedCounts.products}{" "}
              producto(s), {selectedCounts.services} servicio(s) y {selectedCounts.modifierGroups}{" "}
              grupo(s) de modificadores.
            </p>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-3 text-sm">
            {result.created.length > 0 && (
              <div>
                <p className="font-medium flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Creados ({result.created.length})
                </p>
                <ul className="mt-1 text-muted-foreground list-disc pl-5">
                  {result.created.map((r, i) => (
                    <li key={i}>
                      {r.name} {r.message ? `— ${r.message}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.skipped.length > 0 && (
              <div>
                <p className="font-medium">Omitidos ({result.skipped.length})</p>
                <ul className="mt-1 text-muted-foreground list-disc pl-5">
                  {result.skipped.map((r, i) => (
                    <li key={i}>
                      {r.name} — {r.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.errors.length > 0 && (
              <div>
                <p className="font-medium text-destructive">Errores ({result.errors.length})</p>
                <ul className="mt-1 text-muted-foreground list-disc pl-5">
                  {result.errors.map((r, i) => (
                    <li key={i}>
                      {r.name} — {r.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "input" && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={analyzing}>
                Cancelar
              </Button>
              <Button onClick={() => void handleAnalyze()} disabled={analyzing || !businessIdDoc}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando…
                  </>
                ) : (
                  "Analizar con IA"
                )}
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("input")} disabled={importing}>
                Atrás
              </Button>
              <Button onClick={() => void handleImport()} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando…
                  </>
                ) : (
                  "Importar seleccionados"
                )}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button
              onClick={() => {
                handleClose(false);
                if (businessId) router.push(`/${businessId}/offerings/products`);
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
