"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { useBusinessRole, useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";
import { extractDraftItems } from "@/lib/knowledgeDraftItems";

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

type EditTarget =
  | { kind: "draft"; draft: KnowledgeDraft }
  | { kind: "item"; item: KnowledgeItem };

export function KnowledgeGenericPage({ sourceId, title, description, narrativePlaceholder }: Props) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { onProtocolDraftUpdated, subscribeToKnowledge, unsubscribeFromKnowledge } = useWebSocketContext();

  const [generateMode, setGenerateMode] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<KnowledgeDraft[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleApproveItem = async (draft: KnowledgeDraft, itemId: string) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.approveKnowledgeDraftItem,
        type: "json",
        variables: { id: draft._id, sourceId, itemId },
      });
      toast.success("Item aprobado e indexado.");
      setEditTarget(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al aprobar");
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
      setEditTarget(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async (draft: KnowledgeDraft) => {
    if (!confirm(`¿Eliminar el borrador "${draft.draftId}"?`)) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.deleteKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      toast.success("Borrador eliminado.");
      setEditTarget(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: KnowledgeItem) => {
    if (!confirm(`¿Eliminar "${item.label}" del índice y de la base de datos?`)) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.deleteKnowledgeItem,
        type: "json",
        variables: { id: item._id, sourceId },
      });
      toast.success("Item eliminado del índice.");
      setEditTarget(null);
      loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = canEditCurrentBusiness();

  if (!businessId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {title} — {description}
          </CardTitle>
          <CardDescription>
            Escribe un texto o narrativa y la IA extraerá un borrador estructurado. Revisa cada item y aprueba
            individualmente para indexarlo en Knowledge-RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Modo: Generar Conocimiento</Label>
              <p className="text-sm text-muted-foreground">
                Al activar, el mensaje se enviará a la IA para extraer un borrador de tipo &quot;{title}&quot;.
              </p>
            </div>
            <Switch checked={generateMode} onCheckedChange={setGenerateMode} />
          </div>

          {generateMode && (
            <>
              <div>
                <Label>Texto o narrativa</Label>
                <Textarea
                  placeholder={narrativePlaceholder}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleSendNarrative} disabled={sending}>
                {sending ? "Enviando…" : "Enviar y generar borrador"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Borradores de {title}</CardTitle>
          <CardDescription>
            Pendientes de revisión. Aprueba o rechaza cada item por separado; al aprobar, el item sale del borrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLists && drafts.length === 0 ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : drafts.length === 0 ? (
            <p className="text-muted-foreground">No hay borradores. Activa el modo y envía un texto.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => {
                let draftItems: ReturnType<typeof extractDraftItems> = [];
                try {
                  draftItems = extractDraftItems(sourceId, JSON.parse(d.payload));
                } catch {
                  draftItems = [];
                }
                const isExpanded = expandedDraftId === d._id;
                return (
                  <div key={d._id} className="rounded-lg border">
                    <div className="flex items-center justify-between p-3 gap-2">
                      <div>
                        <p className="font-medium">{d.draftId}</p>
                        <p className="text-sm text-muted-foreground">
                          {draftItems.length} item(s) · {new Date(d.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedDraftId(isExpanded ? null : d._id)}
                        >
                          {isExpanded ? "Ocultar items" : "Ver items"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditTarget(
                              editTarget?.kind === "draft" && editTarget.draft._id === d._id
                                ? null
                                : { kind: "draft", draft: d }
                            )
                          }
                        >
                          Editar JSON
                        </Button>
                        {canEdit && (
                          <>
                            <Button variant="destructive" size="sm" onClick={() => handleRejectDraft(d)} disabled={saving}>
                              Rechazar todo
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteDraft(d)} disabled={saving}>
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t divide-y">
                        {draftItems.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">Sin items en este borrador.</p>
                        ) : (
                          draftItems.map((item) => (
                            <div key={item.itemId} className="flex items-center justify-between gap-2 p-3 pl-5">
                              <p className="text-sm flex-1 min-w-0 truncate">{item.label}</p>
                              {canEdit && (
                                <div className="flex gap-2 shrink-0">
                                  <Button size="sm" onClick={() => handleApproveItem(d, item.itemId)} disabled={saving}>
                                    Aprobar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectItem(d, item.itemId)}
                                    disabled={saving}
                                  >
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conocimiento indexado — {title}</CardTitle>
          <CardDescription>
            Items aprobados disponibles para el RAG. Puedes editar o eliminar cada uno de forma independiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLists && items.length === 0 ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Aún no hay items indexados para esta fuente.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border p-3 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Aprobado: {item.approvedAt ? new Date(item.approvedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditTarget(
                          editTarget?.kind === "item" && editTarget.item._id === item._id
                            ? null
                            : { kind: "item", item }
                        )
                      }
                    >
                      {editTarget?.kind === "item" && editTarget.item._id === item._id ? "Cerrar" : "Editar"}
                    </Button>
                    {canEdit && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item)} disabled={saving}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editTarget && canEdit && (
        <KnowledgePayloadForm
          key={editTarget.kind === "draft" ? editTarget.draft._id : editTarget.item._id}
          title={
            editTarget.kind === "draft"
              ? `Editar borrador: ${editTarget.draft.draftId}`
              : `Editar item: ${editTarget.item.label}`
          }
          description={
            editTarget.kind === "draft"
              ? "Modifica el JSON del borrador completo. Cada item debe conservar su itemId."
              : "Modifica el JSON del item y guarda para reindexar en Knowledge-RAG."
          }
          initialPayload={
            editTarget.kind === "draft" ? editTarget.draft.payload : editTarget.item.payload
          }
          onSave={async (payloadStr) => {
            setSaving(true);
            try {
              if (editTarget.kind === "draft") {
                await fetchApiV1({
                  query: queries.updateKnowledgeDraft,
                  type: "json",
                  variables: { id: editTarget.draft._id, sourceId, payload: payloadStr },
                });
                toast.success("Borrador actualizado.");
              } else {
                await fetchApiV1({
                  query: queries.updateKnowledgeItem,
                  type: "json",
                  variables: { id: editTarget.item._id, sourceId, payload: payloadStr },
                });
                toast.success("Item actualizado y reindexado.");
              }
              loadLists();
            } catch (e: unknown) {
              toast.error((e as Error)?.message || "Error al guardar");
            } finally {
              setSaving(false);
            }
          }}
          onCancel={() => setEditTarget(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function KnowledgePayloadForm({
  title,
  description,
  initialPayload,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  description: string;
  initialPayload: string;
  onSave: (payloadStr: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [payloadStr, setPayloadStr] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(initialPayload), null, 2);
    } catch {
      return initialPayload;
    }
  });

  const handleSave = async () => {
    try {
      JSON.parse(payloadStr);
    } catch {
      toast.error("El JSON no es válido");
      return;
    }
    await onSave(payloadStr);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Payload (JSON)</Label>
          <Textarea
            value={payloadStr}
            onChange={(e) => setPayloadStr(e.target.value)}
            rows={14}
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
