"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";
import {
  KnowledgeItemFormFields,
  parseKnowledgeItemPayload,
} from "@/components/knowledge/KnowledgeItemFormFields";

type KnowledgeItem = {
  _id: string;
  itemId: string;
  label: string;
  payload: string;
  approvedAt: string;
  updatedAt: string;
};

type Props = {
  item: KnowledgeItem;
  sourceId: KnowledgeSourceId;
  canEdit: boolean;
  saving: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
};

export function KnowledgeIndexedItemRow({
  item,
  sourceId,
  canEdit,
  saving,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(() => parseKnowledgeItemPayload(item.payload));

  useEffect(() => {
    if (isEditing) {
      setForm(parseKnowledgeItemPayload(item.payload));
    }
  }, [isEditing, item.payload]);

  if (isEditing) {
    return (
      <div className="rounded-lg border-2 border-primary ring-2 ring-primary/25 bg-primary/5 p-4 space-y-4 shadow-sm transition-colors">
        <KnowledgeItemFormFields
          sourceId={sourceId}
          value={form}
          onChange={setForm}
          disabled={saving}
        />
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => void onSave(form)} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    );
  }

  const parsed = parseKnowledgeItemPayload(item.payload);

  return (
    <div className="flex items-start justify-between rounded-lg border p-3 gap-2">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">{item.label}</p>
        {sourceId === "faqs" && parsed.answer ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{String(parsed.answer)}</p>
        ) : null}
        {sourceId === "glossary" && parsed.definition ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{String(parsed.definition)}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p>
            Aprobado: {item.approvedAt ? new Date(item.approvedAt).toLocaleString() : "—"}
          </p>
          <p>
            Última edición: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-end shrink-0">
        {canEdit && (
          <>
            <Button variant="outline" size="sm" onClick={onStartEdit} disabled={saving}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={saving}>
              Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
