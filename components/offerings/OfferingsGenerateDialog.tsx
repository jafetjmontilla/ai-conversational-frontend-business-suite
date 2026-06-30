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
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { fetchApiV1, queries } from "@/lib/Fetching";
import {
  OFFERINGS_IMPORT_PLACEHOLDER,
  type OfferingsImportDraft,
  type OfferingsImportScope,
} from "@/lib/offerings/importTypes";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type OfferingsGenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessIdDoc: string | null | undefined;
  scope: OfferingsImportScope;
  title?: string;
  description?: string;
  onResult: (draft: OfferingsImportDraft) => void;
};

export function OfferingsGenerateDialog({
  open,
  onOpenChange,
  businessIdDoc,
  scope,
  title = "Generar con IA",
  description = "Describe o pega un fragmento de catálogo. La IA extraerá datos estructurados para que los revises.",
  onResult,
}: OfferingsGenerateDialogProps) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!businessIdDoc) {
      toast.error("Negocio no cargado");
      return;
    }
    if (!rawText.trim()) {
      toast.error("Escribe o pega algún texto");
      return;
    }
    setLoading(true);
    try {
      const draft = (await fetchApiV1({
        query: queries.parseOfferingsFromText,
        type: "json",
        variables: { id: businessIdDoc, rawText: rawText.trim(), scope },
      })) as OfferingsImportDraft;

      const total =
        draft.attributes.length + draft.products.length + draft.services.length;
      if (total === 0) {
        toast.warning("No se detectaron elementos. Prueba con más detalle.");
        return;
      }
      onResult({
        ...draft,
        categoryPricing: draft.categoryPricing ?? [],
        attributes: draft.attributes.map((a) => ({ ...a, selected: true })),
        products: draft.products.map((p) => ({ ...p, selected: true })),
        services: draft.services.map((s) => ({ ...s, selected: true })),
      });
      onOpenChange(false);
      setRawText("");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al analizar con IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Label>Texto o catálogo</Label>
          <AutoResizeTextarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={OFFERINGS_IMPORT_PLACEHOLDER}
            minRows={5}
            maxRows={12}
            className="mt-2"
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => void handleAnalyze()} disabled={loading || !rawText.trim() || !businessIdDoc}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar con IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
