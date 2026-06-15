"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { useBusinessRole, useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";
import { extractDraftItems, mergeDraftItemPayload, draftItemViewKey } from "@/lib/knowledgeDraftItems";
import { KnowledgeIndexedItemRow } from "@/components/knowledge/KnowledgeIndexedItemRow";
import { KnowledgeDraftItemRow } from "@/components/knowledge/KnowledgeDraftItemRow";
import { InputSearch } from "@/components/InputSearch";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { cn } from "@/lib/utils";
import { BookOpen, ArrowDownAZ, FilePenLine, Loader2, Sparkles, X } from "lucide-react";

type KnowledgeItemSortField = "approvedAt" | "updatedAt";
type KnowledgeItemSortOrder = "asc" | "desc";

function knowledgeItemMatchesSearch(item: KnowledgeItem, query: string): boolean {
  if (item.label.toLowerCase().includes(query)) return true;
  try {
    return JSON.stringify(JSON.parse(item.payload)).toLowerCase().includes(query);
  } catch {
    return item.payload.toLowerCase().includes(query);
  }
}

type KnowledgeDraft = {
  _id: string;
  businessId: string;
  sourceId: string;
  draftId: string;
  status: string;
  payload: string;
  createdBy: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
};

type KnowledgeItem = {
  _id: string;
  businessId: string;
  sourceId: string;
  itemId: string;
  label: string;
  payload: string;
  createdBy: string;
  approvedAt: string;
  originDraftId?: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  sourceId: KnowledgeSourceId;
  title: string;
  description: string;
  narrativePlaceholder: string;
};

export function KnowledgeGenericPage({ sourceId, title, description, narrativePlaceholder }: Props) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { onProtocolDraftUpdated, subscribeToKnowledge, unsubscribeFromKnowledge } = useWebSocketContext();
  const prefersReducedMotion = useReducedMotion();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [mobileDraftsOpen, setMobileDraftsOpen] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<KnowledgeDraft[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewingDraftItemKey, setViewingDraftItemKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [itemSortField, setItemSortField] = useState<KnowledgeItemSortField>("updatedAt");
  const [itemSortOrder, setItemSortOrder] = useState<KnowledgeItemSortOrder>("desc");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<KnowledgeDraft | null>(null);
  const [draftToReject, setDraftToReject] = useState<KnowledgeDraft | null>(null);

  const loadLists = useCallback(async () => {
    if (!businessId) return;
    try {
      const [draftList, itemList] = await Promise.all([
        fetchApiV1({
          query: queries.listKnowledgeDrafts,
          type: "json",
          variables: { businessId, sourceId, status: "draft" },
        }) as Promise<KnowledgeDraft[] | undefined>,
        fetchApiV1({
          query: queries.listKnowledgeItems,
          type: "json",
          variables: { businessId, sourceId },
        }) as Promise<KnowledgeItem[] | undefined>,
      ]);
      setDrafts(Array.isArray(draftList) ? draftList : []);
      setItems(Array.isArray(itemList) ? itemList : []);
    } catch {
      toast.error("Error al cargar conocimiento");
      setDrafts([]);
      setItems([]);
    } finally {
      setLoadingLists(false);
    }
  }, [businessId, sourceId]);

  useEffect(() => {
    if (!businessId) return;
    loadLists();
    subscribeToKnowledge(businessId);
    const unsubscribe = onProtocolDraftUpdated((payload: { businessId: string }) => {
      if (payload.businessId === businessId) loadLists();
    });
    return () => {
      unsubscribe();
      unsubscribeFromKnowledge(businessId);
    };
  }, [businessId, loadLists, subscribeToKnowledge, unsubscribeFromKnowledge, onProtocolDraftUpdated]);

  const handleSendNarrative = async () => {
    if (!businessId || !narrative.trim()) {
      toast.error("Escribe un texto para generar el borrador");
      return;
    }
    setSending(true);
    try {
      await fetchApiV1({
        query: queries.sendKnowledgeNarrative,
        type: "json",
        variables: { businessId, sourceId, content: narrative.trim() },
      });
      toast.success("Texto enviado. El borrador se actualizará en tiempo real.");
      setNarrative("");
      setGenerateDialogOpen(false);
      setMobileDraftsOpen(true);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleApproveItem = async (
    draft: KnowledgeDraft,
    itemId: string,
    itemPayload?: Record<string, unknown>
  ) => {
    setSaving(true);
    try {
      if (itemPayload) {
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(draft.payload);
        } catch {
          throw new Error("Payload del borrador inválido");
        }
        const merged = mergeDraftItemPayload(sourceId, parsed, itemId, itemPayload);
        await fetchApiV1({
          query: queries.updateKnowledgeDraft,
          type: "json",
          variables: { id: draft._id, sourceId, payload: JSON.stringify(merged) },
        });
      }
      await fetchApiV1({
        query: queries.approveKnowledgeDraftItem,
        type: "json",
        variables: { id: draft._id, sourceId, itemId },
      });
      toast.success("Item aprobado e indexado.");
      setViewingDraftItemKey(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al aprobar");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAllDraft = async (draft: KnowledgeDraft) => {
    let draftItems: ReturnType<typeof extractDraftItems>;
    try {
      draftItems = extractDraftItems(sourceId, JSON.parse(draft.payload));
    } catch {
      toast.error("Payload del borrador inválido");
      return;
    }
    if (draftItems.length === 0) {
      toast.error("El borrador no tiene items para aprobar");
      return;
    }
    setSaving(true);
    try {
      for (const item of draftItems) {
        await fetchApiV1({
          query: queries.approveKnowledgeDraftItem,
          type: "json",
          variables: { id: draft._id, sourceId, itemId: item.itemId },
        });
      }
      toast.success(`${draftItems.length} item(s) aprobados e indexados.`);
      setViewingDraftItemKey(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al aprobar");
      loadLists();
    } finally {
      setSaving(false);
    }
  };

  const handleRejectItem = async (draft: KnowledgeDraft, itemId: string) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectKnowledgeDraftItem,
        type: "json",
        variables: { id: draft._id, sourceId, itemId },
      });
      toast.success("Item rechazado y eliminado del borrador.");
      setViewingDraftItemKey(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectDraft = async (draft: KnowledgeDraft) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      toast.success("Borrador rechazado.");
      setViewingDraftItemKey(null);
      setDraftToReject(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async (draft: KnowledgeDraft) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.deleteKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      toast.success("Borrador eliminado.");
      setViewingDraftItemKey(null);
      setDraftToDelete(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: KnowledgeItem) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.deleteKnowledgeItem,
        type: "json",
        variables: { id: item._id, sourceId },
      });
      toast.success("Item eliminado del índice.");
      setEditingItemId(null);
      setItemToDelete(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItem = async (item: KnowledgeItem, payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateKnowledgeItem,
        type: "json",
        variables: { id: item._id, sourceId, payload: JSON.stringify(payload) },
      });
      toast.success("Item actualizado y reindexado.");
      setEditingItemId(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = canEditCurrentBusiness();

  const sortedItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();
    const copy = query
      ? items.filter((item) => knowledgeItemMatchesSearch(item, query))
      : [...items];
    copy.sort((a, b) => {
      const aTime = new Date(a[itemSortField] || 0).getTime();
      const bTime = new Date(b[itemSortField] || 0).getTime();
      return itemSortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
    return copy;
  }, [items, itemSortField, itemSortOrder, itemSearchQuery]);

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderDraftsCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        {canEdit && (
          <div className="flex justify-end">
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar conocimiento
            </Button>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="pt-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <FilePenLine className="h-5 w-5" />
              Borradores — {title}
            </CardTitle>
            <CardDescription>
              Pendientes de revisión. Aprueba o rechaza cada item; al aprobar, pasa al índice.
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {loadingLists && drafts.length === 0 ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : drafts.length === 0 ? (
          <p className="text-muted-foreground">
            No hay borradores. Usa &quot;Generar conocimiento&quot; para enviar un texto a la IA.
          </p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => {
              let draftItems: ReturnType<typeof extractDraftItems> = [];
              try {
                draftItems = extractDraftItems(sourceId, JSON.parse(d.payload));
              } catch {
                draftItems = [];
              }
              return (
                <div key={d._id} className="rounded-lg border">
                  <div className="flex items-center justify-between p-3 gap-2">
                    <div>
                      <p className="font-medium">{d.draftId}</p>
                      <p className="text-sm text-muted-foreground">
                        {draftItems.length} item(s) · {new Date(d.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    {canEdit && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => void handleApproveAllDraft(d)}
                          disabled={saving || draftItems.length === 0}
                        >
                          Aprobar todo
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDraftToReject(d)}
                          disabled={saving}
                        >
                          Rechazar todo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDraftToDelete(d)}
                          disabled={saving}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="border-t divide-y">
                    {draftItems.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Sin items en este borrador.</p>
                    ) : (
                      draftItems.map((item) => {
                        const itemKey = draftItemViewKey(d.draftId, item.itemId);
                        return (
                          <KnowledgeDraftItemRow
                            key={item.itemId}
                            draftItem={item}
                            sourceId={sourceId}
                            canEdit={canEdit}
                            saving={saving}
                            isViewing={viewingDraftItemKey === itemKey}
                            onStartView={() => setViewingDraftItemKey(itemKey)}
                            onCancelView={() => setViewingDraftItemKey(null)}
                            onApprove={(payload) => handleApproveItem(d, item.itemId, payload)}
                            onReject={() => handleRejectItem(d, item.itemId)}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!businessId) return null;

  return (
    <>
      <div className="flex gap-2 w-full h-full">
        <Card id="card-left" className="w-full h-full border-none overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Conocimiento indexado — {title}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex md:hidden"
                onClick={() => setMobileDraftsOpen(true)}
              >
                <FilePenLine className="h-4 w-4 mr-1" />
                Borradores
                {drafts.length > 0 ? ` (${drafts.length})` : ""}
              </Button>
            </CardTitle>
            <CardDescription>
              {description} — Items aprobados disponibles para el RAG. Puedes editar o eliminar cada uno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLists && items.length === 0 ? (
              <p className="text-muted-foreground">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">Aún no hay items indexados para esta fuente.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[12rem]">
                    <InputSearch
                      placeholder="Buscar por título, contenido o keywords…"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ArrowDownAZ className="h-4 w-4" />
                      <span>Ordenar</span>
                    </div>
                    <Select
                      value={itemSortField}
                      onValueChange={(value) => setItemSortField(value as KnowledgeItemSortField)}
                    >
                      <SelectTrigger className="h-8 w-[11.5rem] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approvedAt">Fecha de aprobación</SelectItem>
                        <SelectItem value="updatedAt">Fecha de actualización</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={itemSortOrder}
                      onValueChange={(value) => setItemSortOrder(value as KnowledgeItemSortOrder)}
                    >
                      <SelectTrigger className="h-8 w-[5.5rem] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {sortedItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Ningún item coincide con &quot;{itemSearchQuery.trim()}&quot;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedItems.map((item) => (
                      <KnowledgeIndexedItemRow
                        key={item._id}
                        item={item}
                        sourceId={sourceId}
                        canEdit={canEdit}
                        saving={saving}
                        isEditing={editingItemId === item._id}
                        onStartEdit={() => setEditingItemId(item._id)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onSave={(payload) => handleSaveItem(item, payload)}
                        onDelete={() => setItemToDelete(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderDraftsCard()}
        </div>

        <AnimatePresence>
          {mobileDraftsOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Cerrar panel"
                initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={mobilePanelTransition}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileDraftsOpen(false)}
              />
              <motion.div
                initial={{ x: prefersReducedMotion ? 0 : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: prefersReducedMotion ? 0 : "100%" }}
                transition={mobilePanelTransition}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
              >
                {renderDraftsCard({
                  className: "h-full rounded-none border-0 border-l",
                  onClose: () => setMobileDraftsOpen(false),
                })}
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generar conocimiento — {title}</DialogTitle>
            <DialogDescription>
              Escribe un texto o narrativa y la IA extraerá un borrador estructurado de tipo &quot;{title}&quot;.
              Revisa cada item en Borradores y aprueba individualmente para indexarlo.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Texto o narrativa</Label>
            <Textarea
              placeholder={narrativePlaceholder}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={6}
              className="mt-2"
              disabled={!canEdit || sending}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => void handleSendNarrative()}
              disabled={!canEdit || sending || !narrative.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                "Enviar y generar borrador"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setItemToDelete(null);
        }}
        title="Eliminar item indexado"
        description={
          itemToDelete ? (
            <span>
              ¿Estás seguro de Eliminar <strong>{itemToDelete.label}</strong> del índice y de la base de datos?.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (itemToDelete) void handleDeleteItem(itemToDelete);
        }}
        loading={saving}
        confirmButtonText="Eliminar item"
      />

      <ConfirmDeleteDialog
        open={draftToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDraftToDelete(null);
        }}
        title="Eliminar borrador"
        description={
          draftToDelete ? (
            <span>
              ¿Eliminar el borrador <strong>{draftToDelete.draftId}</strong>? Esta acción no se puede deshacer.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (draftToDelete) void handleDeleteDraft(draftToDelete);
        }}
        loading={saving}
        confirmButtonText="Eliminar borrador"
      />

      <ConfirmDeleteDialog
        open={draftToReject !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDraftToReject(null);
        }}
        title="Rechazar borrador"
        description={
          draftToReject ? (
            <span>
              ¿Al rechazar todo el borrador <strong>{draftToReject.draftId}</strong>? Se descartarán todos los
              items pendientes de revisión.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (draftToReject) void handleRejectDraft(draftToReject);
        }}
        loading={saving}
        confirmButtonText="Rechazar todo"
      />
    </>
  );
}
