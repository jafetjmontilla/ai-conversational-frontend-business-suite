"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProtocolStepsEditor } from "@/components/knowledge/ProtocolStepsEditor";
import { toast } from "sonner";
import {
  draftToFormValues,
  formValuesToMutationInput,
  localDraftStorageKey,
  type ProtocolDraftRecord,
  type ProtocolFormValues,
  validateProtocolForm,
} from "@/lib/knowledge/protocolDraftForm";

interface ProtocolDraftFormProps {
  draft: ProtocolDraftRecord;
  saving: boolean;
  onSaveDraft: (input: Record<string, unknown>) => Promise<void>;
  onPublish?: () => Promise<void>;
  onCancel: () => void;
}

function formsEqual(a: ProtocolFormValues, b: ProtocolFormValues): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ProtocolDraftForm({
  draft,
  saving,
  onSaveDraft,
  onPublish,
  onCancel,
}: ProtocolDraftFormProps) {
  const serverValues = useMemo(() => draftToFormValues(draft), [draft]);
  const storageKey = localDraftStorageKey(draft.businessId, draft._id);
  const isPublished = draft.status === "approved";

  const [values, setValues] = useState<ProtocolFormValues>(serverValues);
  const [savedBaseline, setSavedBaseline] = useState<ProtocolFormValues>(serverValues);
  const [recoveredValues, setRecoveredValues] = useState<ProtocolFormValues | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isDirty = !formsEqual(values, savedBaseline);

  useEffect(() => {
    const nextServer = draftToFormValues(draft);
    setValues(nextServer);
    setSavedBaseline(nextServer);

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setRecoveredValues(null);
        return;
      }
      const parsed = JSON.parse(raw) as ProtocolFormValues;
      if (!formsEqual(parsed, nextServer)) {
        setRecoveredValues(parsed);
      } else {
        setRecoveredValues(null);
        localStorage.removeItem(storageKey);
      }
    } catch {
      localStorage.removeItem(storageKey);
      setRecoveredValues(null);
    }
  }, [draft, storageKey]);

  useEffect(() => {
    if (!isDirty) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(values));
  }, [values, isDirty, storageKey]);

  const patchValues = useCallback((patch: Partial<ProtocolFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearLocalDraft = () => {
    localStorage.removeItem(storageKey);
    setRecoveredValues(null);
  };

  const handleRestoreRecovered = () => {
    if (recoveredValues) {
      setValues(recoveredValues);
      setRecoveredValues(null);
    }
  };

  const handleDiscardRecovered = () => {
    clearLocalDraft();
  };

  const buildInput = () => formValuesToMutationInput(values, draft);

  const handleSave = async () => {
    const error = validateProtocolForm(values);
    if (error) {
      toast.error(error);
      return;
    }
    await onSaveDraft(buildInput());
    setSavedBaseline(values);
    clearLocalDraft();
  };

  const handlePublish = async () => {
    const error = validateProtocolForm(values);
    if (error) {
      toast.error(error);
      return;
    }
    if (isDirty) {
      await onSaveDraft(buildInput());
      setSavedBaseline(values);
      clearLocalDraft();
    }
    if (onPublish) await onPublish();
  };

  const handleCancel = () => {
    if (isDirty) {
      const leave = window.confirm(
        "Tienes cambios sin guardar. ¿Salir sin guardar? (Los cambios siguen en este navegador hasta que guardes o descartes.)"
      );
      if (!leave) return;
    }
    onCancel();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>
                {isPublished ? "Editar protocolo publicado" : "Revisar borrador"}: {draft.title}
              </CardTitle>
              <CardDescription>
                {isPublished
                  ? "Guarda para actualizar el registro y reindexar en Knowledge-RAG."
                  : "Guarda el borrador cuando termines de editar. Publica solo cuando esté listo para el agente."}
              </CardDescription>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                isDirty
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "border-muted bg-muted/50 text-muted-foreground"
              }`}
            >
              {isDirty ? "Cambios sin guardar" : isPublished ? "Publicado" : "Guardado"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          {recoveredValues && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-2">
              <p className="text-sm">
                Hay una edición recuperada de una sesión anterior en este navegador.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={handleRestoreRecovered}>
                  Restaurar cambios
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleDiscardRecovered}>
                  Descartar recuperación
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label>Título</Label>
            <Input
              value={values.title}
              onChange={(e) => patchValues({ title: e.target.value })}
              className="mt-1"
              disabled={saving}
            />
          </div>
          <div>
            <Label>Resumen</Label>
            <Textarea
              value={values.summary}
              onChange={(e) => patchValues({ summary: e.target.value })}
              rows={2}
              className="mt-1"
              disabled={saving}
            />
          </div>

          <ProtocolStepsEditor
            steps={values.steps}
            onChange={(steps) => patchValues({ steps })}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <Input
                value={values.category}
                onChange={(e) => patchValues({ category: e.target.value })}
                className="mt-1"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Versión</Label>
              <Input
                value={values.version}
                onChange={(e) => patchValues({ version: e.target.value })}
                className="mt-1"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Requiere intervención humana</Label>
              <p className="text-sm text-muted-foreground">
                El agente escalará a una persona si el protocolo lo indica.
              </p>
            </div>
            <Switch
              checked={values.requiresHandoff}
              onCheckedChange={(checked) => patchValues({ requiresHandoff: checked })}
              disabled={saving}
            />
          </div>

          <div>
            <Label>Intenciones (separadas por coma)</Label>
            <Input
              value={values.intentsText}
              onChange={(e) => patchValues({ intentsText: e.target.value })}
              placeholder="devolución, reembolso, garantía"
              className="mt-1"
              disabled={saving}
            />
          </div>
          <div>
            <Label>Etiquetas (separadas por coma)</Label>
            <Input
              value={values.tagsText}
              onChange={(e) => patchValues({ tagsText: e.target.value })}
              placeholder="postventa, soporte"
              className="mt-1"
              disabled={saving}
            />
          </div>

          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 h-auto text-muted-foreground"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
              <div>
                <Label>Identificador interno</Label>
                <Input
                  value={values.protocolId}
                  onChange={(e) => patchValues({ protocolId: e.target.value })}
                  className="mt-1 font-mono text-sm"
                  disabled={saving}
                />
              </div>
              <div>
                <Label>Texto extendido (Markdown, opcional)</Label>
                <Textarea
                  value={values.rawMarkdown}
                  onChange={(e) => patchValues({ rawMarkdown: e.target.value })}
                  rows={4}
                  className="mt-1 font-mono text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving || !isDirty}
              onClick={() => handleSave()}
            >
              {saving ? "Guardando…" : isPublished ? "Guardar y reindexar" : "Guardar borrador"}
            </Button>
            {!isPublished && onPublish && (
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  const ok = window.confirm(
                    "¿Publicar este protocolo en Knowledge-RAG? El agente podrá usarlo en conversaciones."
                  );
                  if (!ok) return;
                  handlePublish()
                }}
              >
                Publicar en conocimiento
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
