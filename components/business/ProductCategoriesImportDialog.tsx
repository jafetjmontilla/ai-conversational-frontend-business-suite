"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import {
  PRODUCT_CATEGORIES_IMPORT_PLACEHOLDER,
  type ParsedProductCategoryDraft,
  type ProductCategoriesImportDraft,
} from "@/lib/business/categoryImportTypes";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_TYPES = [
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
  { value: "ambos", label: "Ambos" },
] as const;

type Step = "input" | "preview";

type ProductCategoriesImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onImported: () => void;
};

export function ProductCategoriesImportDialog({
  open,
  onOpenChange,
  businessId,
  onImported,
}: ProductCategoriesImportDialogProps) {
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<ParsedProductCategoryDraft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setStep("input");
    setRawText("");
    setDraft([]);
    setWarnings([]);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      toast.error("Escribe o pega algún texto");
      return;
    }
    setAnalyzing(true);
    try {
      const result = (await fetchApiV1({
        query: queries.parseProductCategoriesFromText,
        type: "json",
        variables: { id: businessId, rawText: rawText.trim() },
      })) as ProductCategoriesImportDraft;

      if (!result.categories.length) {
        toast.warning("No se detectaron categorías nuevas. Revisa el texto o las existentes.");
        return;
      }
      setDraft(result.categories.map((c) => ({ ...c, selected: true })));
      setWarnings(result.warnings ?? []);
      setStep("preview");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    const selected = draft.filter((c) => c.selected !== false && c.name.trim());
    if (!selected.length) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    setImporting(true);
    let created = 0;
    let skipped = 0;
    try {
      for (const cat of selected) {
        try {
          await fetchApiV1({
            query: queries.createProductCategory,
            type: "json",
            variables: {
              id: businessId,
              args: {
                name: cat.name.trim(),
                description: cat.description?.trim() || undefined,
                type: cat.type,
              },
            },
          });
          created++;
        } catch (e: unknown) {
          const msg = (e as { message?: string })?.message ?? "";
          if (msg.toLowerCase().includes("existe")) skipped++;
          else throw e;
        }
      }
      if (created > 0) {
        toast.success(`${created} categoría(s) creada(s)`);
        onImported();
        handleClose(false);
      }
      if (skipped > 0) toast.info(`${skipped} omitida(s) por duplicado`);
      if (created === 0 && skipped > 0) toast.warning("Ninguna categoría nueva para importar");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al importar");
    } finally {
      setImporting(false);
    }
  };

  const updateRow = (index: number, patch: Partial<ParsedProductCategoryDraft>) => {
    setDraft((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Cargar categorías con IA
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Describe tu catálogo o lista las categorías que necesitas."
              : "Revisa y edita antes de crear."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div>
            <Label>Texto</Label>
            <AutoResizeTextarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={PRODUCT_CATEGORIES_IMPORT_PLACEHOLDER}
              minRows={5}
              maxRows={12}
              className="mt-2"
              disabled={analyzing}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Avisos
                </div>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {draft.map((cat, i) => (
                <div key={i} className="flex gap-2 items-start rounded-lg border p-2">
                  <input
                    type="checkbox"
                    checked={cat.selected !== false}
                    onChange={(e) => updateRow(i, { selected: e.target.checked })}
                    className="mt-2"
                    aria-label="Importar categoría"
                  />
                  <div className="flex-1 grid gap-1 min-w-0">
                    <Input
                      value={cat.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      className="h-8"
                      placeholder="Nombre"
                    />
                    <Input
                      value={cat.description ?? ""}
                      onChange={(e) => updateRow(i, { description: e.target.value || null })}
                      className="h-8 text-sm"
                      placeholder="Descripción"
                    />
                    <Select
                      value={cat.type}
                      onValueChange={(v) =>
                        updateRow(i, { type: v as ParsedProductCategoryDraft["type"] })
                      }
                    >
                      <SelectTrigger className="h-8">
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
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "input" ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={analyzing}>
                Cancelar
              </Button>
              <Button onClick={() => void handleAnalyze()} disabled={analyzing || !rawText.trim()}>
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
          ) : (
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
                  "Crear seleccionadas"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
