"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KnowledgeDraftItemRow } from "@/components/knowledge/KnowledgeDraftItemRow";
import { useTeachFromChat } from "@/lib/cse/useTeachFromChat";
import {
  TEACH_SOURCE_IDS,
  type SelectedTeachTurn,
  type TeachMode,
  type TeachSourceId,
} from "@/lib/cse/types";
import { getKnowledgeType } from "@/lib/knowledgeTypes";
import { draftItemViewKey } from "@/lib/knowledgeDraftItems";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  turn: SelectedTeachTurn | null;
  conversationId?: string;
  onRetest: (userMessage: string) => void;
};

export function TeachFromChatModal({
  open,
  onOpenChange,
  businessId,
  turn,
  conversationId,
  onRetest,
}: Props) {
  const [mode, setMode] = useState<TeachMode>("create");
  const [sourceId, setSourceId] = useState<TeachSourceId>("faqs");
  const [suggestion, setSuggestion] = useState("");
  const [viewingItemKey, setViewingItemKey] = useState<string | null>(null);

  const {
    phase,
    draft,
    items,
    error,
    saving,
    approvedCount,
    submit,
    approveItem,
    rejectItem,
    rejectDraft,
    reset,
  } = useTeachFromChat({ businessId, turn, open });

  useEffect(() => {
    if (open) {
      setMode("create");
      setSourceId("faqs");
      setSuggestion("");
      setViewingItemKey(null);
    }
  }, [open, turn?.assistant.id]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (phase === "preview" && draft) {
      toast.success("Borrador listo para revisar");
    }
    if (phase === "done" && approvedCount > 0) {
      toast.success(
        approvedCount === 1
          ? "Item aprobado e indexado"
          : `${approvedCount} items aprobados e indexados`
      );
    }
  }, [phase, draft?._id, approvedCount]);

  async function handleGenerate() {
    await submit({
      mode,
      sourceId,
      suggestion,
      conversationId,
    });
  }

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  function handleRetest() {
    if (!turn) return;
    const q = turn.user.content;
    handleClose();
    onRetest(q);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Enseñar desde el chat
          </DialogTitle>
          <DialogDescription>
            Genera un borrador de conocimiento a partir del turno seleccionado.
            Se indexa solo al aprobar.
          </DialogDescription>
        </DialogHeader>

        {turn && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Pregunta
              </p>
              <p className="whitespace-pre-wrap break-words">{turn.user.content}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Respuesta del bot
              </p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {turn.assistant.content}
              </p>
            </div>
          </div>
        )}

        {phase === "compose" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Acción</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === "create" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("create")}
                >
                  Crear
                </Button>
                <Button
                  type="button"
                  variant={mode === "correct" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("correct")}
                >
                  Corregir
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {mode === "create"
                  ? "El bot no tenía información útil; genera conocimiento nuevo."
                  : "La respuesta era incorrecta; genera la versión correcta."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teach-source">Fuente de conocimiento</Label>
              <Select
                value={sourceId}
                onValueChange={(v) => setSourceId(v as TeachSourceId)}
              >
                <SelectTrigger id="teach-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEACH_SOURCE_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {getKnowledgeType(id)?.label ?? id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teach-suggestion">
                Sugerencia del operador{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="teach-suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder={
                  mode === "create"
                    ? "Qué debería saber o responder el asistente…"
                    : "Cuál es la respuesta correcta o qué hay que corregir…"
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!turn}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generar borrador
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "generating" && (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Generando borrador con IA…</p>
            <p className="text-[11px]">
              Se actualizará cuando el worker envíe el draft.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        )}

        {phase === "preview" && draft && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {getKnowledgeType(draft.sourceId)?.label ?? draft.sourceId}
              </Badge>
              <span className="truncate text-[11px] text-muted-foreground">
                {draft.draftId}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                El borrador llegó vacío. Puedes rechazarlo y volver a generar.
              </p>
            ) : (
              <div className="divide-y rounded-lg border border-border">
                {items.map((item) => {
                  const key = draftItemViewKey(draft._id, item.itemId);
                  return (
                    <KnowledgeDraftItemRow
                      key={key}
                      draftItem={item}
                      sourceId={draft.sourceId as TeachSourceId}
                      canEdit
                      saving={saving}
                      isViewing={viewingItemKey === key}
                      onStartView={() => setViewingItemKey(key)}
                      onCancelView={() => setViewingItemKey(null)}
                      onApprove={async (payload) => {
                        await approveItem(item.itemId, payload);
                        setViewingItemKey(null);
                      }}
                      onReject={async () => {
                        await rejectItem(item.itemId);
                        setViewingItemKey(null);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => void rejectDraft()}
                disabled={saving}
              >
                Rechazar borrador
              </Button>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground">
              Conocimiento guardado
              {approvedCount > 0 ? ` (${approvedCount} item${approvedCount > 1 ? "s" : ""})` : ""}.
              Puedes reenviar la misma pregunta para verificar.
            </p>
            <DialogFooter className={cn("gap-2")}>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="button" onClick={handleRetest} disabled={!turn}>
                Probar de nuevo
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
