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

type KnowledgeDraft = {
  _id: string;
  businessId: string;
  sourceId: string;
  draftId: string;
  status: string;
  payload: string;
  createdBy: string;
  conversationId?: string;
  approvedAt?: string;
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

  const [generateMode, setGenerateMode] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<KnowledgeDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<KnowledgeDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const loadDrafts = useCallback(async () => {
    if (!businessId) return;
    try {
      const list = (await fetchApiV1({
        query: queries.listKnowledgeDrafts,
        type: "json",
        variables: { businessId, sourceId, status: "draft" },
      })) as KnowledgeDraft[] | undefined;
      setDrafts(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error("Error al cargar borradores");
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, [businessId, sourceId]);

  useEffect(() => {
    if (!businessId) return;
    loadDrafts();
    subscribeToKnowledge(businessId);
    const unsubscribe = onProtocolDraftUpdated((payload: { businessId: string }) => {
      if (payload.businessId === businessId) loadDrafts();
    });
    return () => {
      unsubscribe();
      unsubscribeFromKnowledge(businessId);
    };
  }, [businessId, loadDrafts, subscribeToKnowledge, unsubscribeFromKnowledge, onProtocolDraftUpdated]);

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

  const handleApprove = async (draft: KnowledgeDraft) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.approveKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      toast.success("Borrador aprobado e indexado en la base de conocimiento.");
      setSelectedDraft(null);
      loadDrafts();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al aprobar");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (draft: KnowledgeDraft) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      toast.success("Borrador rechazado.");
      setSelectedDraft(null);
      loadDrafts();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
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
          <CardTitle>{title} — {description}</CardTitle>
          <CardDescription>
            Escribe un texto o narrativa y la IA extraerá un borrador estructurado. Revisa, edita si hace falta y aprueba para indexarlo en Knowledge-RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Modo: Generar Conocimiento</Label>
              <p className="text-sm text-muted-foreground">Al activar, el mensaje se enviará a la IA para extraer un borrador de tipo &quot;{title}&quot;.</p>
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
          <CardDescription>Revisa, edita el JSON si hace falta y aprueba para indexar en Knowledge-RAG.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDrafts && drafts.length === 0 ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : drafts.length === 0 ? (
            <p className="text-muted-foreground">No hay borradores. Activa el modo y envía un texto.</p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{d.draftId}</p>
                    <p className="text-sm text-muted-foreground">{new Date(d.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDraft(selectedDraft?._id === d._id ? null : d)}>
                      {selectedDraft?._id === d._id ? "Cerrar" : "Editar"}
                    </Button>
                    {canEdit && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(d)} disabled={saving}>
                          Aprobar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(d)} disabled={saving}>
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDraft && canEdit && (
        <KnowledgeDraftForm
          draft={selectedDraft}
          sourceId={sourceId}
          onSave={async (payloadStr) => {
            setSaving(true);
            try {
              await fetchApiV1({
                query: queries.updateKnowledgeDraft,
                type: "json",
                variables: { id: selectedDraft._id, sourceId, payload: payloadStr },
              });
              toast.success("Borrador actualizado.");
              loadDrafts();
            } catch (e: unknown) {
              toast.error((e as Error)?.message || "Error al guardar");
            } finally {
              setSaving(false);
            }
          }}
          onApprove={() => handleApprove(selectedDraft)}
          onCancel={() => setSelectedDraft(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function KnowledgeDraftForm({
  draft,
  sourceId,
  onSave,
  onApprove,
  onCancel,
  saving,
}: {
  draft: KnowledgeDraft;
  sourceId: string;
  onSave: (payloadStr: string) => Promise<void>;
  onApprove: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [payloadStr, setPayloadStr] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(draft.payload), null, 2);
    } catch {
      return draft.payload;
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
        <CardTitle>Editar borrador: {draft.draftId}</CardTitle>
        <CardDescription>Modifica el JSON y guarda. Luego puedes aprobar para indexar.</CardDescription>
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
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          <Button onClick={onApprove} disabled={saving}>
            Aprobar e indexar
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
