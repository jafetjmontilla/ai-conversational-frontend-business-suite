"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { useBusinessRole, useBusinessPermissions } from "@/lib/hooks/useAllowed";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { ProtocolDraftForm } from "@/components/knowledge/ProtocolDraftForm";
import { InputSearch } from "@/components/InputSearch";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { cn } from "@/lib/utils";
import {
  narrativeStorageKey,
  type ProtocolDraftRecord,
} from "@/lib/knowledge/protocolDraftForm";
import { ArrowDownAZ, BookOpen, FilePenLine, Loader2, Sparkles, X } from "lucide-react";

type ProtocolSortField = "approvedAt" | "updatedAt";
type ProtocolSortOrder = "asc" | "desc";

function protocolMatchesSearch(draft: ProtocolDraftRecord, query: string): boolean {
  const haystack = [
    draft.title,
    draft.category,
    draft.protocolId,
    draft.content.summary,
    ...(draft.content.steps ?? []),
    ...(draft.retrieval_hints?.semantic_intents ?? []),
    ...(draft.retrieval_hints?.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function protocolMetaLine(draft: ProtocolDraftRecord, published: boolean): string {
  const steps = draft.content.steps?.length ?? 0;
  if (published && draft.approvedAt) {
    return `${draft.category} · ${steps} pasos · Publicado ${new Date(draft.approvedAt).toLocaleString()}`;
  }
  return `${draft.category} · ${steps} pasos · Actualizado ${new Date(draft.updatedAt).toLocaleString()}`;
}

type ProtocolListRowProps = {
  draft: ProtocolDraftRecord;
  published: boolean;
  canEdit: boolean;
  saving: boolean;
  isViewing: boolean;
  onStartView: () => void;
  onCancelView: () => void;
  onSaveDraft: (input: Record<string, unknown>) => Promise<void>;
  onPublish?: () => void;
  onReject?: () => void;
};

function ProtocolListRow({
  draft,
  published,
  canEdit,
  saving,
  isViewing,
  onStartView,
  onCancelView,
  onSaveDraft,
  onPublish,
  onReject,
}: ProtocolListRowProps) {
  if (isViewing && canEdit) {
    return (
      <ProtocolDraftForm
        key={draft._id}
        draft={draft}
        embedded
        saving={saving}
        onSaveDraft={onSaveDraft}
        onPublish={published ? undefined : onPublish}
        onCancel={onCancelView}
      />
    );
  }

  return (
    <div className="flex items-start justify-between rounded-lg border p-3 gap-2">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium truncate">{draft.title}</p>
        <p className="text-sm text-muted-foreground">{protocolMetaLine(draft, published)}</p>
        {draft.content.summary ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{draft.content.summary}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 justify-end shrink-0">
        {canEdit && (
          <>
            <Button variant="outline" size="sm" onClick={onStartView} disabled={saving}>
              Ver
            </Button>
            {!published && onReject && (
              <Button variant="destructive" size="sm" onClick={onReject} disabled={saving}>
                Rechazar
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ProtocolsPageContent() {
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
  const [pendingDrafts, setPendingDrafts] = useState<ProtocolDraftRecord[]>([]);
  const [published, setPublished] = useState<ProtocolDraftRecord[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [viewingPublishedId, setViewingPublishedId] = useState<string | null>(null);
  const [viewingPendingId, setViewingPendingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<ProtocolSortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<ProtocolSortOrder>("desc");
  const [draftToReject, setDraftToReject] = useState<ProtocolDraftRecord | null>(null);
  const [draftToPublish, setDraftToPublish] = useState<ProtocolDraftRecord | null>(null);

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
      toast.success("Narrativa enviada. El borrador aparecerá en Borradores en unos segundos.");
      setNarrative("");
      localStorage.removeItem(narrativeStorageKey(businessId));
      setGenerateDialogOpen(false);
      setMobileDraftsOpen(true);
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
      await loadLists();
      return updated;
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
      setViewingPendingId(null);
      setDraftToPublish(null);
      await loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al publicar");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (draft: ProtocolDraftRecord) => {
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.rejectProtocolDraft,
        type: "json",
        variables: { id: draft._id },
      });
      toast.success("Borrador rechazado.");
      if (viewingPendingId === draft._id) setViewingPendingId(null);
      setDraftToReject(null);
      await loadLists();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Error al rechazar");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = canEditCurrentBusiness();

  const sortedPublished = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const copy = query
      ? published.filter((d) => protocolMatchesSearch(d, query))
      : [...published];
    copy.sort((a, b) => {
      const aTime = new Date(a[sortField] || a.updatedAt || 0).getTime();
      const bTime = new Date(b[sortField] || b.updatedAt || 0).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
    return copy;
  }, [published, searchQuery, sortField, sortOrder]);

  const sortedPending = useMemo(() => {
    const copy = [...pendingDrafts];
    copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return copy;
  }, [pendingDrafts]);

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
              Generar protocolo
            </Button>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="pt-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <FilePenLine className="h-5 w-5" />
              Borradores
            </CardTitle>
            <CardDescription>
              Pendientes de revisión. Ver, edita y publica cuando esté listo para el agente.
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
        {loadingLists && pendingDrafts.length === 0 ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : pendingDrafts.length === 0 ? (
          <p className="text-muted-foreground">
            No hay borradores pendientes. Usa &quot;Generar protocolo&quot; para enviar una narrativa a la IA.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedPending.map((d) => (
              <ProtocolListRow
                key={d._id}
                draft={d}
                published={false}
                canEdit={canEdit}
                saving={saving}
                isViewing={viewingPendingId === d._id}
                onStartView={() => {
                  setViewingPublishedId(null);
                  setViewingPendingId(d._id);
                }}
                onCancelView={() => setViewingPendingId(null)}
                onSaveDraft={async (input) => {
                  await handleSaveDraft(d, input).catch((e: unknown) => {
                    toast.error((e as Error)?.message || "Error al guardar");
                    throw e;
                  });
                }}
                onPublish={() => setDraftToPublish(d)}
                onReject={() => setDraftToReject(d)}
              />
            ))}
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
                Protocolos publicados
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
                {pendingDrafts.length > 0 ? ` (${pendingDrafts.length})` : ""}
              </Button>
            </CardTitle>
            <CardDescription>
              Protocolos aprobados disponibles para el agente. Puedes revisar y actualizar cada uno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLists && published.length === 0 ? (
              <p className="text-muted-foreground">Cargando…</p>
            ) : published.length === 0 ? (
              <p className="text-muted-foreground">Aún no hay protocolos publicados.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[12rem]">
                    <InputSearch
                      placeholder="Buscar por título, categoría o contenido…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ArrowDownAZ className="h-4 w-4" />
                      <span>Ordenar</span>
                    </div>
                    <Select
                      value={sortField}
                      onValueChange={(value) => setSortField(value as ProtocolSortField)}
                    >
                      <SelectTrigger className="h-8 w-[11.5rem] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approvedAt">Fecha de publicación</SelectItem>
                        <SelectItem value="updatedAt">Fecha de actualización</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sortOrder}
                      onValueChange={(value) => setSortOrder(value as ProtocolSortOrder)}
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
                {sortedPublished.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Ningún protocolo coincide con &quot;{searchQuery.trim()}&quot;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedPublished.map((d) => (
                      <ProtocolListRow
                        key={d._id}
                        draft={d}
                        published
                        canEdit={canEdit}
                        saving={saving}
                        isViewing={viewingPublishedId === d._id}
                        onStartView={() => {
                          setViewingPendingId(null);
                          setViewingPublishedId(d._id);
                        }}
                        onCancelView={() => setViewingPublishedId(null)}
                        onSaveDraft={async (input) => {
                          await handleSaveDraft(d, input).catch((e: unknown) => {
                            toast.error((e as Error)?.message || "Error al guardar");
                            throw e;
                          });
                        }}
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
            <DialogTitle>Generar protocolo</DialogTitle>
            <DialogDescription>
              Escribe cómo se hace algo en lenguaje natural. La IA extraerá título, resumen y pasos en un
              borrador para que lo revises en el panel derecho.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Narrativa</Label>
            <AutoResizeTextarea
              placeholder="Ej: Cuando un cliente pide devolución, validamos el pedido. Si está dentro de 30 días, ejecutamos el reembolso; si no, aplicamos la excepción de cortesía."
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              minRows={4}
              maxRows={10}
              className="mt-2"
              disabled={!canEdit || sending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              El texto se conserva en este navegador hasta que lo envíes o lo borres.
            </p>
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
        open={draftToReject !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDraftToReject(null);
        }}
        title="Rechazar borrador"
        description={
          draftToReject ? (
            <span>
              ¿Rechazar el borrador <strong>{draftToReject.title}</strong>? No se publicará en
              Knowledge-RAG.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (draftToReject) void handleReject(draftToReject);
        }}
        loading={saving}
        confirmButtonText="Rechazar"
      />

      <ConfirmDeleteDialog
        open={draftToPublish !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDraftToPublish(null);
        }}
        title="Publicar protocolo"
        description={
          draftToPublish ? (
            <span>
              ¿Publicar <strong>{draftToPublish.title}</strong> en Knowledge-RAG? El agente podrá usarlo
              en conversaciones.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (draftToPublish) void handlePublish(draftToPublish);
        }}
        loading={saving}
        confirmButtonText="Publicar"
      />
    </>
  );
}
