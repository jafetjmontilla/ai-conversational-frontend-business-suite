"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { fetchKnowledgeAudit, type KnowledgeAuditResponse } from "@/lib/api";
import { toast } from "sonner";
import { useBusinessRole, useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Badge } from "@/components/ui/badge";
import { FileSearch, AlertTriangle, Info } from "lucide-react";

type ProtocolDraft = {
  _id: string;
  businessId: string;
  protocolId: string;
  version: string;
  category: string;
  title: string;
  content: { summary: string; steps: string[]; raw_markdown?: string };
  retrieval_hints?: { semantic_intents?: string[]; tags?: string[] };
  tools?: { tool_name: string; required_params: string[] }[];
  metadata?: { priority?: number; author?: string; last_updated?: string; requires_human_handoff?: boolean };
  status: string;
  createdBy: string;
  conversationId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProtocolsKnowledgePage() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { onProtocolDraftUpdated, subscribeToKnowledge, unsubscribeFromKnowledge } = useWebSocketContext();

  const [generateMode, setGenerateMode] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<ProtocolDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<ProtocolDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState<KnowledgeAuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAudit = useCallback(async () => {
    if (!businessId) return;
    setAuditLoading(true);
    try {
      const data = await fetchKnowledgeAudit(businessId);
      setAudit(data);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Error al cargar auditoría");
      setAudit(null);
    } finally {
      setAuditLoading(false);
    }
  }, [businessId]);

  const loadDrafts = useCallback(async () => {
    if (!businessId) return;
    try {
      const list = (await fetchApiV1({
        query: queries.listProtocolDrafts,
        type: "json",
        variables: { businessId, status: "draft" },
      })) as ProtocolDraft[] | undefined;
      setDrafts(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error("Error al cargar borradores");
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    loadDrafts();
    subscribeToKnowledge(businessId);
    const cb = (payload: { businessId: string }) => {
      if (payload.businessId === businessId) loadDrafts();
    };
    const unsubscribe = onProtocolDraftUpdated(cb);
    return () => {
      unsubscribe();
      unsubscribeFromKnowledge(businessId);
    };
  }, [businessId, loadDrafts, subscribeToKnowledge, unsubscribeFromKnowledge, onProtocolDraftUpdated]);

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
      toast.success("Narrativa enviada. El borrador se actualizará en tiempo real.");
      setNarrative("");
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (draftId: string, sourceId?: string) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.approveProtocolDraft,
        type: "json",
        variables: { id: draftId, sourceId: sourceId || "protocols" },
      });
      toast.success("Protocolo aprobado e indexado en la base de conocimiento.");
      setSelectedDraft(null);
      loadDrafts();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al aprobar");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (draftId: string) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectProtocolDraft,
        type: "json",
        variables: { id: draftId },
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

  const handleUpdateAndApprove = async (draft: ProtocolDraft, form: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateProtocolDraft,
        type: "json",
        variables: {
          id: draft._id,
          input: {
            protocolId: form.protocolId ?? draft.protocolId,
            version: form.version ?? draft.version,
            category: form.category ?? draft.category,
            title: form.title ?? draft.title,
            content: {
              summary: form.summary ?? draft.content.summary,
              steps: Array.isArray(form.steps) ? form.steps : draft.content.steps,
              raw_markdown: (form.raw_markdown as string) ?? draft.content.raw_markdown,
            },
            retrieval_hints: form.retrieval_hints ?? draft.retrieval_hints,
            tools: form.tools ?? draft.tools,
            metadata: form.metadata ?? draft.metadata,
          },
        },
      });
      await handleApprove(draft._id);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al guardar");
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
          <CardTitle>Protocolos — Cómo hacer</CardTitle>
          <CardDescription>
            Modo &quot;De Charla a Protocolo&quot;: escribe una narrativa y la IA extraerá un protocolo en JSON. Revisa el borrador, edita si hace falta y confirma para indexarlo en la base de conocimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Modo: Generar Conocimiento</Label>
              <p className="text-sm text-muted-foreground">Al activar, el mensaje se enviará a la IA para extraer un protocolo (no conversación).</p>
            </div>
            <Switch checked={generateMode} onCheckedChange={setGenerateMode} />
          </div>

          {generateMode && (
            <>
              <div>
                <Label>Narrativa</Label>
                <Textarea
                  placeholder="Ej: Cuando un cliente pide devolución, validamos el pedido con la herramienta de consulta. Si está dentro de 30 días, ejecutamos la API de reembolso; si no, aplicamos la Excepción de Cortesía."
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
          <CardTitle>Borradores de protocolos</CardTitle>
          <CardDescription>Borradores pendientes de revisión. Edita y pulsa &quot;Confirmar y Guardar&quot; para indexar en Knowledge-RAG.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDrafts && drafts.length === 0 ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : drafts.length === 0 ? (
            <p className="text-muted-foreground">No hay borradores. Activa el modo y envía una narrativa.</p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-sm text-muted-foreground">{d.protocolId} · {d.category} · {new Date(d.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDraft(selectedDraft?._id === d._id ? null : d)}>
                      {selectedDraft?._id === d._id ? "Cerrar" : "Editar"}
                    </Button>
                    {canEdit && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(d._id)} disabled={saving}>
                          Aprobar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(d._id)} disabled={saving}>
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
        <DraftForm
          draft={selectedDraft}
          onSave={(form) => handleUpdateAndApprove(selectedDraft, form)}
          onCancel={() => setSelectedDraft(null)}
          saving={saving}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Auditoría del conocimiento
          </CardTitle>
          <CardDescription>
            Compara la configuración del negocio (fuentes y roles) con el contenido realmente indexado en Knowledge-RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={loadAudit}
            disabled={auditLoading}
          >
            {auditLoading ? "Cargando…" : "Cargar auditoría"}
          </Button>

          {audit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Documentos totales</p>
                  <p className="text-xl font-semibold">{audit.summary.totalDocuments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Fuentes configuradas</p>
                  <p className="text-xl font-semibold">{audit.summary.totalConfigSources}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Fuentes con documentos</p>
                  <p className="text-xl font-semibold">{audit.summary.sourcesWithDocuments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Coherencia</p>
                  <p className="text-xl font-semibold">
                    {audit.summary.orphanSources.length === 0 &&
                     audit.summary.sourcesWithoutDocuments.length === 0
                      ? "OK"
                      : "Revisar"}
                  </p>
                </div>
              </div>

              {(audit.summary.sourcesWithoutDocuments.length > 0 ||
                audit.summary.orphanSources.length > 0) && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                  {audit.summary.sourcesWithoutDocuments.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Fuentes configuradas sin documentos indexados
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {audit.summary.sourcesWithoutDocuments.join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {audit.summary.orphanSources.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Fuentes con documentos pero no en configuración (huérfanas)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {audit.summary.orphanSources.join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Fuentes configuradas (MongoDB)</p>
                <div className="flex flex-wrap gap-2">
                  {audit.configSources.length === 0 ? (
                    <span className="text-muted-foreground text-sm">Ninguna</span>
                  ) : (
                    audit.configSources.map((s) => (
                      <Badge key={s.sourceId} variant="secondary">
                        {s.name || s.sourceId} · {s.roles?.length ?? 0} roles
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Documentos por fuente (índice RAG)</p>
                <div className="space-y-4">
                  {audit.documentsBySource.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay documentos indexados.</p>
                  ) : (
                    audit.documentsBySource.map((src) => (
                      <div key={src.sourceId} className="rounded-lg border p-3">
                        <p className="font-medium flex items-center gap-2">
                          {src.name || src.sourceId}
                          <Badge variant="outline">{src.documentCount} docs</Badge>
                        </p>
                        <ul className="mt-2 space-y-2 pl-2 border-l border-muted">
                          {src.documents.map((doc, i) => (
                            <li key={doc.documentId ?? i} className="text-sm py-1">
                              <span className="font-mono text-muted-foreground">
                                {doc.documentId ?? `#${i + 1}`}
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({doc.contentLength} chars)
                              </span>
                              <p className="text-muted-foreground truncate max-w-full mt-0.5">
                                {doc.contentPreview || "—"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DraftForm({
  draft,
  onSave,
  onCancel,
  saving,
}: {
  draft: ProtocolDraft;
  onSave: (form: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [protocolId, setProtocolId] = useState(draft.protocolId);
  const [version, setVersion] = useState(draft.version);
  const [category, setCategory] = useState(draft.category);
  const [title, setTitle] = useState(draft.title);
  const [summary, setSummary] = useState(draft.content.summary);
  const [stepsText, setStepsText] = useState((draft.content.steps || []).join("\n"));
  const [rawMarkdown, setRawMarkdown] = useState(draft.content.raw_markdown ?? "");
  const [intentsText, setIntentsText] = useState((draft.retrieval_hints?.semantic_intents || []).join(", "));
  const [tagsText, setTagsText] = useState((draft.retrieval_hints?.tags || []).join(", "));

  const submit = () => {
    onSave({
      protocolId,
      version,
      category,
      title,
      summary,
      steps: stepsText.split("\n").map((s) => s.trim()).filter(Boolean),
      raw_markdown: rawMarkdown || undefined,
      retrieval_hints: {
        semantic_intents: intentsText.split(",").map((s) => s.trim()).filter(Boolean),
        tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      },
      metadata: draft.metadata,
      tools: draft.tools,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar borrador: {draft.title}</CardTitle>
        <CardDescription>Ajusta los campos y pulsa &quot;Confirmar y Guardar&quot; para indexar en la base de conocimiento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-2xl">
        <div>
          <Label>ID protocolo</Label>
          <Input value={protocolId} onChange={(e) => setProtocolId(e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Versión</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Categoría</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Resumen</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className="mt-1" />
        </div>
        <div>
          <Label>Pasos (uno por línea)</Label>
          <Textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} rows={5} className="mt-1 font-mono text-sm" />
        </div>
        <div>
          <Label>Raw Markdown (opcional)</Label>
          <Textarea value={rawMarkdown} onChange={(e) => setRawMarkdown(e.target.value)} rows={3} className="mt-1 font-mono text-sm" />
        </div>
        <div>
          <Label>Intenciones semánticas (separadas por coma)</Label>
          <Input value={intentsText} onChange={(e) => setIntentsText(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Tags (separados por coma)</Label>
          <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Confirmar y Guardar"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
