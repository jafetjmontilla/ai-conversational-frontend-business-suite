"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";
import type { DraftItemPreview } from "@/lib/knowledgeDraftItems";
import { KnowledgeItemFormFields } from "@/components/knowledge/KnowledgeItemFormFields";

type Props = {
  draftItem: DraftItemPreview;
  sourceId: KnowledgeSourceId;
  canEdit: boolean;
  saving: boolean;
  isViewing: boolean;
  onStartView: () => void;
  onCancelView: () => void;
  onApprove: (payload: Record<string, unknown>) => Promise<void>;
  onReject: () => Promise<void>;
};

export function KnowledgeDraftItemRow({
  draftItem,
  sourceId,
  canEdit,
  saving,
  isViewing,
  onStartView,
  onCancelView,
  onApprove,
  onReject,
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>(() => ({ ...draftItem.data }));

  useEffect(() => {
    if (isViewing) {
      setForm({ ...draftItem.data });
    }
  }, [isViewing, draftItem.itemId]);

  if (isViewing) {
    return (
      <div className="rounded-lg border-2 border-primary ring-2 ring-primary/25 bg-primary/5 p-4 space-y-4 shadow-sm transition-colors">
        <KnowledgeItemFormFields
          sourceId={sourceId}
          value={form}
          onChange={setForm}
          disabled={saving}
        />
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancelView} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onReject()}
            disabled={saving}
          >
            Rechazar
          </Button>
          <Button size="sm" onClick={() => void onApprove(form)} disabled={saving}>
            {saving ? "Procesando…" : "Aprobar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 p-3 pl-5">
      <p className="text-sm flex-1 min-w-0 truncate">{draftItem.label}</p>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onStartView} disabled={saving}>
          Ver
        </Button>
      )}
    </div>
  );
}
