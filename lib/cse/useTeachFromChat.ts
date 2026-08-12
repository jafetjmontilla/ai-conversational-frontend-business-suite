"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { buildTeachNarrative } from "@/lib/cse/buildTeachNarrative";
import type {
  TeachMode,
  TeachPhase,
  TeachSourceId,
  SelectedTeachTurn,
} from "@/lib/cse/types";
import {
  extractDraftItems,
  mergeDraftItemPayload,
  type DraftItemPreview,
} from "@/lib/knowledgeDraftItems";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";

export type TeachKnowledgeDraft = {
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

type SubmitArgs = {
  mode: TeachMode;
  sourceId: TeachSourceId;
  suggestion?: string;
  conversationId?: string;
};

type UseTeachFromChatOptions = {
  businessId: string;
  turn: SelectedTeachTurn | null;
  open: boolean;
};

const DRAFT_POLL_MS = 2500;
const DRAFT_WAIT_MS = 90_000;

export function useTeachFromChat({ businessId, turn, open }: UseTeachFromChatOptions) {
  const {
    onProtocolDraftUpdated,
    subscribeToKnowledge,
    unsubscribeFromKnowledge,
  } = useWebSocketContext();

  const [phase, setPhase] = useState<TeachPhase>("compose");
  const [draft, setDraft] = useState<TeachKnowledgeDraft | null>(null);
  const [items, setItems] = useState<DraftItemPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);

  const waitingRef = useRef(false);
  const sourceIdRef = useRef<TeachSourceId>("faqs");
  const submittedAtRef = useRef<number>(0);
  const knownDraftIdsRef = useRef<Set<string>>(new Set());

  const reset = useCallback(() => {
    waitingRef.current = false;
    setPhase("compose");
    setDraft(null);
    setItems([]);
    setError(null);
    setSaving(false);
    setApprovedCount(0);
    knownDraftIdsRef.current = new Set();
    submittedAtRef.current = 0;
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const applyDraft = useCallback((d: TeachKnowledgeDraft, sourceId: TeachSourceId) => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(d.payload);
    } catch {
      parsed = {};
    }
    const extracted = extractDraftItems(sourceId as KnowledgeSourceId, parsed);
    setDraft(d);
    setItems(extracted);
    setPhase(extracted.length > 0 ? "preview" : "preview");
    waitingRef.current = false;
  }, []);

  const fetchLatestDraft = useCallback(async (sourceId: TeachSourceId) => {
    const list = (await fetchApiV1({
      query: queries.listKnowledgeDrafts,
      type: "json",
      variables: { businessId, sourceId, status: "draft" },
    })) as TeachKnowledgeDraft[] | undefined;

    const drafts = Array.isArray(list) ? list : [];
    if (drafts.length === 0) return null;

    // Prefer draft created after submit, unknown to us
    const afterSubmit = drafts.filter((d) => {
      const created = new Date(d.createdAt).getTime();
      const updated = new Date(d.updatedAt).getTime();
      const ts = Math.max(created, updated);
      return (
        ts >= submittedAtRef.current - 2000 &&
        !knownDraftIdsRef.current.has(d._id)
      );
    });

    const candidate =
      afterSubmit.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0] ??
      drafts.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

    return candidate ?? null;
  }, [businessId]);

  const tryResolveDraft = useCallback(async () => {
    if (!waitingRef.current) return;
    try {
      const found = await fetchLatestDraft(sourceIdRef.current);
      if (!found) return;
      const updatedAt = new Date(found.updatedAt).getTime();
      if (updatedAt < submittedAtRef.current - 2000) return;
      applyDraft(found, sourceIdRef.current);
    } catch {
      // keep waiting; timeout handles failure
    }
  }, [applyDraft, fetchLatestDraft]);

  useEffect(() => {
    if (!open || !businessId) return;

    subscribeToKnowledge(businessId);
    const unsubscribe = onProtocolDraftUpdated((payload: { businessId: string }) => {
      if (payload.businessId === businessId && waitingRef.current) {
        void tryResolveDraft();
      } else if (payload.businessId === businessId && draft) {
        void (async () => {
          try {
            const list = (await fetchApiV1({
              query: queries.listKnowledgeDrafts,
              type: "json",
              variables: {
                businessId,
                sourceId: sourceIdRef.current,
                status: "draft",
              },
            })) as TeachKnowledgeDraft[] | undefined;
            const current = (Array.isArray(list) ? list : []).find(
              (d) => d._id === draft._id
            );
            if (!current) {
              // draft consumed (all items approved) → done if we approved something
              if (approvedCount > 0 || phase === "preview") {
                setDraft(null);
                setItems([]);
                if (approvedCount > 0) setPhase("done");
              }
              return;
            }
            applyDraft(current, sourceIdRef.current);
          } catch {
            /* ignore */
          }
        })();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromKnowledge(businessId);
    };
  }, [
    open,
    businessId,
    subscribeToKnowledge,
    unsubscribeFromKnowledge,
    onProtocolDraftUpdated,
    tryResolveDraft,
    draft,
    approvedCount,
    phase,
    applyDraft,
  ]);

  // Poll while generating (WS may miss)
  useEffect(() => {
    if (phase !== "generating") return;
    const started = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - started > DRAFT_WAIT_MS) {
        waitingRef.current = false;
        setError(
          "Tiempo de espera agotado. El borrador puede aparecer en Conocimiento."
        );
        setPhase("compose");
        return;
      }
      void tryResolveDraft();
    }, DRAFT_POLL_MS);
    return () => window.clearInterval(id);
  }, [phase, tryResolveDraft]);

  const submit = useCallback(
    async ({ mode, sourceId, suggestion, conversationId }: SubmitArgs) => {
      if (!turn) {
        setError("No hay turno seleccionado");
        return;
      }

      setError(null);
      setApprovedCount(0);
      sourceIdRef.current = sourceId;
      submittedAtRef.current = Date.now();

      // Snapshot existing draft ids so we can detect the new one
      try {
        const existing = (await fetchApiV1({
          query: queries.listKnowledgeDrafts,
          type: "json",
          variables: { businessId, sourceId, status: "draft" },
        })) as TeachKnowledgeDraft[] | undefined;
        knownDraftIdsRef.current = new Set(
          (Array.isArray(existing) ? existing : []).map((d) => d._id)
        );
      } catch {
        knownDraftIdsRef.current = new Set();
      }

      const content = buildTeachNarrative({
        mode,
        sourceId,
        userMessage: turn.user.content,
        botResponse: turn.assistant.content,
        suggestion,
        conversationId,
      });

      setPhase("generating");
      waitingRef.current = true;

      try {
        await fetchApiV1({
          query: queries.sendKnowledgeNarrative,
          type: "json",
          variables: { businessId, sourceId, content },
        });
      } catch (e: unknown) {
        waitingRef.current = false;
        setPhase("compose");
        setError((e as Error)?.message || "Error al enviar narrativa");
      }
    },
    [businessId, turn]
  );

  const refreshDraft = useCallback(async () => {
    if (!draft) return;
    const found = await fetchLatestDraft(sourceIdRef.current);
    if (found && found._id === draft._id) {
      applyDraft(found, sourceIdRef.current);
    } else if (!found) {
      setDraft(null);
      setItems([]);
      if (approvedCount > 0) setPhase("done");
    }
  }, [draft, fetchLatestDraft, applyDraft, approvedCount]);

  const approveItem = useCallback(
    async (itemId: string, itemPayload?: Record<string, unknown>) => {
      if (!draft) return;
      const sourceId = sourceIdRef.current;
      setSaving(true);
      setError(null);
      try {
        if (itemPayload) {
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(draft.payload);
          } catch {
            throw new Error("Payload del borrador inválido");
          }
          const merged = mergeDraftItemPayload(
            sourceId as KnowledgeSourceId,
            parsed,
            itemId,
            itemPayload
          );
          await fetchApiV1({
            query: queries.updateKnowledgeDraft,
            type: "json",
            variables: {
              id: draft._id,
              sourceId,
              payload: JSON.stringify(merged),
            },
          });
        }
        await fetchApiV1({
          query: queries.approveKnowledgeDraftItem,
          type: "json",
          variables: { id: draft._id, sourceId, itemId },
        });
        setApprovedCount((c) => c + 1);
        await refreshDraft();
        // If no items left, move to done
        const after = await fetchLatestDraft(sourceId);
        if (!after || after._id !== draft._id) {
          setDraft(null);
          setItems([]);
          setPhase("done");
        } else {
          applyDraft(after, sourceId);
          const remaining = extractDraftItems(
            sourceId as KnowledgeSourceId,
            JSON.parse(after.payload)
          );
          if (remaining.length === 0) {
            setPhase("done");
          }
        }
      } catch (e: unknown) {
        setError((e as Error)?.message || "Error al aprobar");
      } finally {
        setSaving(false);
      }
    },
    [draft, refreshDraft, fetchLatestDraft, applyDraft]
  );

  const rejectItem = useCallback(
    async (itemId: string) => {
      if (!draft) return;
      const sourceId = sourceIdRef.current;
      setSaving(true);
      setError(null);
      try {
        await fetchApiV1({
          query: queries.rejectKnowledgeDraftItem,
          type: "json",
          variables: { id: draft._id, sourceId, itemId },
        });
        await refreshDraft();
        const after = await fetchLatestDraft(sourceId);
        if (!after || after._id !== draft._id) {
          setDraft(null);
          setItems([]);
          setPhase(approvedCount > 0 ? "done" : "compose");
        } else {
          applyDraft(after, sourceId);
        }
      } catch (e: unknown) {
        setError((e as Error)?.message || "Error al rechazar");
      } finally {
        setSaving(false);
      }
    },
    [draft, refreshDraft, fetchLatestDraft, applyDraft, approvedCount]
  );

  const rejectDraft = useCallback(async () => {
    if (!draft) return;
    const sourceId = sourceIdRef.current;
    setSaving(true);
    setError(null);
    try {
      await fetchApiV1({
        query: queries.rejectKnowledgeDraft,
        type: "json",
        variables: { id: draft._id, sourceId },
      });
      setDraft(null);
      setItems([]);
      setPhase(approvedCount > 0 ? "done" : "compose");
    } catch (e: unknown) {
      setError((e as Error)?.message || "Error al rechazar borrador");
    } finally {
      setSaving(false);
    }
  }, [draft, approvedCount]);

  const markDone = useCallback(() => {
    setPhase("done");
  }, []);

  return {
    phase,
    draft,
    items,
    error,
    saving,
    approvedCount,
    submit,
    approveItem,
    rejectItem,
    rejectDraft,
    reset,
    markDone,
    setPhase,
  };
}
