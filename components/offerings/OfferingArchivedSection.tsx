"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export type ArchivedGroupItem = {
  id: string;
  title: string;
  values?: string[];
  onRestore: () => void;
};

export type ArchivedFlatItem = {
  id: string;
  title: string;
  subtitle?: string;
  onRestore: () => void;
};

type OfferingArchivedSectionProps = {
  groups?: ArchivedGroupItem[];
  items?: ArchivedFlatItem[];
  restoring?: boolean;
  canEdit?: boolean;
  description?: string;
};

export function OfferingArchivedSection({
  groups = [],
  items = [],
  restoring = false,
  canEdit = false,
  description = "Elementos en uso que fueron ocultados. Puedes restaurarlos para volver a usarlos en el catálogo.",
}: OfferingArchivedSectionProps) {
  if (groups.length === 0 && items.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium">Archivados</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {groups.length > 0 ? (
        <ul className="space-y-3">
          {groups.map((group) => (
            <li key={group.id} className="border border-dashed rounded-lg p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{group.title}</div>
                </div>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={restoring}
                    onClick={group.onRestore}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restaurar
                  </Button>
                ) : null}
              </div>
              {group.values && group.values.length > 0 ? (
                <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-2">
                  {group.values.map((v) => (
                    <span key={v} className="bg-muted px-2 py-0.5 rounded text-xs">
                      {v}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 border border-dashed rounded-lg px-3 py-2 bg-muted/30"
            >
              <div className="text-sm min-w-0">
                <span className="font-medium">{item.title}</span>
                {item.subtitle ? <span className="text-muted-foreground"> · {item.subtitle}</span> : null}
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={restoring}
                  onClick={item.onRestore}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restaurar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function offeringDeleteToast(
  entityLabel: string,
  result: { mode: "HARD" | "SOFT"; referenceCount: number },
  toast: { success: (m: string) => void; info: (m: string) => void }
) {
  if (result.mode === "SOFT") {
    toast.info(
      `${entityLabel} archivado (en uso por ${result.referenceCount} referencia${result.referenceCount === 1 ? "" : "s"}). Las referencias existentes se conservan.`
    );
  } else {
    toast.success(`${entityLabel} eliminado permanentemente`);
  }
}
