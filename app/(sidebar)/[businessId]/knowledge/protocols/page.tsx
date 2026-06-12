"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { useBusinessRole, useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { ProtocolDraftForm } from "@/components/knowledge/ProtocolDraftForm";
import {
  narrativeStorageKey,
  type ProtocolDraftRecord,
} from "@/lib/knowledge/protocolDraftForm";

export default function ProtocolsKnowledgePage() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { onProtocolDraftUpdated, subscribeToKnowledge, unsubscribeFromKnowledge } = useWebSocketContext();

  const [generateMode, setGenerateMode] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<ProtocolDraftRecord[]>([]);
  const [published, setPublished] = useState<ProtocolDraftRecord[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<ProtocolDraftRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [listTab, setListTab] = useState<"pending" | "published">("pending");

  const loadLists = useCallback(async () => {
    if (!businessId) return;
    try {
      const [draftList, publishedList] = await Promise.all([
        fetchApiV1({
          query: queries.listProtocolDrafts,
          type: "json",
          variables: { businessId, status: "draft" },
        }) as Promise<ProtocolDraftRecord[] | undefined>,
        fetchApiV1({
          query: queries.listProtocolDrafts,
          type: "json",
          variables: { businessId, status: "approved" },
        }) as Promise<ProtocolDraftRecord[] | undefined>,
      ]);
      setPendingDrafts(Array.isArray(draftList) ? draftList : []);
      setPublished(Array.isArray(publishedList) ? publishedList : []);
    } catch {
      toast.error("Error al cargar protocolos");
      setPendingDrafts([]);
      setPublished([]);
    } finally {
      setLoadingLists(false);
    }
  }, [businessId]);

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

  useEffect(() => {
    if (!businessId) return;
    try {
      const stored = localStorage.getItem(narrativeStorageKey(businessId));
      if (stored) setNarrative(stored);
    } catch {
      /* ignore */
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    const key = narrativeStorageKey(businessId);
    if (narrative.trim()) {
      localStorage.setItem(key, narrative);
    } else {
      localStorage.removeItem(key);
    }
  }, [businessId, narrative]);

  const handleSendNarrative = async () => {
    if (!businessId || !narrative.trim()) {
      toast.error("Escribe una narrativa para generar el protocolo");
      return;
    }
    setSending(true);
    try {
      await fetchApiV1({
        query: queries.sendProtocolNarrative,
        type: "json",
        variables: { businessId, content: narrative.trim() },
      });
      toast.success("Narrativa enviada. El borrador aparecerá en Pendientes en unos segundos.");
      setNarrative("");
      localStorage.removeItem(narrativeStorageKey(businessId));
      setListTab("pending");
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async (draft: ProtocolDraftRecord, input: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = (await fetchApiV1({
        query: queries.updateProtocolDraft,
        type: "json",
        variables: { id: draft._id, input },
      })) as ProtocolDraftRecord;
      toast.success(
        draft.status === "approved"
          ? "Protocolo actualizado y reindexado."
          : "Borrador guardado."
      );
      setSelectedDraft(updated);
      await loadLists();
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (draft: ProtocolDraftRecord) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.approveProtocolDraft,
        type: "json",
        variables: { id: draft._id, sourceId: "protocols" },
      });
      toast.success("Protocolo publicado en la base de conocimiento.");
      setSelectedDraft(null);
      setListTab("published");
      await loadLists();
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (draftId: string) => {
    if (!window.confirm("¿Rechazar este borrador? No se publicará en Knowledge-RAG.")) return;
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectProtocolDraft,
        type: "json",
        variables: { id: draftId },
      });
      toast.success("Borrador rechazado.");
      if (selectedDraft?._id === draftId) setSelectedDraft(null);
      await loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
    } finally {
      setSaving(false);
    }
  };

  const openDraft = (d: ProtocolDraftRecord) => {
    setSelectedDraft((prev) => (prev?._id === d._id ? null : d));
  };

  const canEdit = canEditCurrentBusiness();

  if (!businessId) return null;

  const renderList = (items: ProtocolDraftRecord[], emptyMessage: string, showReject: boolean) => {
    if (loadingLists && items.length === 0) {
      return <p className="text-muted-foreground">Cargando…</p>;
    }
    if (items.length === 0) {
      return <p className="text-muted-foreground">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{d.title}</p>
              <p className="text-sm text-muted-foreground">
                {d.category} · {d.content.steps?.length ?? 0} pasos ·{" "}
                {d.status === "approved" && d.approvedAt
                  ? `Publicado ${new Date(d.approvedAt).toLocaleString()}`
                  : `Actualizado ${new Date(d.updatedAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDraft(d)}
              >
                {selectedDraft?._id === d._id ? "Cerrar" : "Revisar"}
              </Button>
              {canEdit && showReject && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(d._id)}
                  disabled={saving}
                >
                  Rechazar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Protocolos — Cómo hacer</CardTitle>
          <CardDescription>
            Escribe cómo se hace algo en lenguaje natural. La IA propone un borrador; tú lo revisas,
            guardas y publicas cuando esté listo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Generar desde narrativa</Label>
              <p className="text-sm text-muted-foreground">
                La IA extraerá título, resumen y pasos. No envía mensajes al agente.
              </p>
            </div>
            <Switch checked={generateMode} onCheckedChange={setGenerateMode} />
          </div>

          {generateMode && (
            <>
              <div>
                <Label>Narrativa</Label>
                <Textarea
                  placeholder="Ej: Cuando un cliente pide devolución, validamos el pedido. Si está dentro de 30 días, ejecutamos el reembolso; si no, aplicamos la excepción de cortesía."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El texto se conserva en este navegador hasta que lo envíes o lo borres.
                </p>
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
          <CardTitle>Protocolos</CardTitle>
          <CardDescription>
            Pendientes: revisa y publica. Publicados: ya disponibles para el agente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={listTab} onValueChange={(v) => setListTab(v as "pending" | "published")}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="pending">
                Pendientes ({pendingDrafts.length})
              </TabsTrigger>
              <TabsTrigger value="published">
                Publicados ({published.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              {renderList(
                pendingDrafts,
                "No hay borradores pendientes. Genera uno desde una narrativa.",
                true
              )}
            </TabsContent>
            <TabsContent value="published" className="mt-4">
              {renderList(
                published,
                "Aún no hay protocolos publicados.",
                false
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedDraft && canEdit && (
        <ProtocolDraftForm
          key={selectedDraft._id}
          draft={selectedDraft}
          saving={saving}
          onSaveDraft={(input) =>
            handleSaveDraft(selectedDraft, input).catch((e: unknown) => {
              toast.error((e as Error)?.message || "Error al guardar");
              throw e;
            })
          }
          onPublish={
            selectedDraft.status === "draft"
              ? () =>
                  handlePublish(selectedDraft).catch((e: unknown) => {
                    toast.error((e as Error)?.message || "Error al publicar");
                    throw e;
                  })
              : undefined
          }
          onCancel={() => setSelectedDraft(null)}
        />
      )}
    </div>
  );
}
