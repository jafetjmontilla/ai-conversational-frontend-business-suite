export type ProtocolDraftRecord = {
  _id: string;
  businessId: string;
  protocolId: string;
  version: string;
  category: string;
  title: string;
  content: { summary: string; steps: string[]; raw_markdown?: string };
  retrieval_hints?: { semantic_intents?: string[]; tags?: string[] };
  tools?: { tool_name: string; required_params: string[] }[];
  metadata?: {
    priority?: number;
    author?: string;
    last_updated?: string;
    requires_human_handoff?: boolean;
  };
  status: string;
  createdBy: string;
  conversationId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProtocolFormValues = {
  protocolId: string;
  version: string;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  rawMarkdown: string;
  intentsText: string;
  tagsText: string;
  requiresHandoff: boolean;
};

export function draftToFormValues(draft: ProtocolDraftRecord): ProtocolFormValues {
  return {
    protocolId: draft.protocolId,
    version: draft.version,
    category: draft.category,
    title: draft.title,
    summary: draft.content.summary,
    steps: draft.content.steps?.length ? [...draft.content.steps] : [""],
    rawMarkdown: draft.content.raw_markdown ?? "",
    intentsText: (draft.retrieval_hints?.semantic_intents || []).join(", "),
    tagsText: (draft.retrieval_hints?.tags || []).join(", "),
    requiresHandoff: draft.metadata?.requires_human_handoff === true,
  };
}

export function formValuesToMutationInput(
  form: ProtocolFormValues,
  draft: ProtocolDraftRecord
): Record<string, unknown> {
  const steps = form.steps.map((s) => s.trim()).filter(Boolean);
  return {
    protocolId: form.protocolId.trim() || draft.protocolId,
    version: form.version.trim() || draft.version,
    category: form.category.trim() || draft.category,
    title: form.title.trim() || draft.title,
    content: {
      summary: form.summary.trim(),
      steps,
      raw_markdown: form.rawMarkdown.trim() || undefined,
    },
    retrieval_hints: {
      semantic_intents: form.intentsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
    tools: draft.tools,
    metadata: {
      ...draft.metadata,
      requires_human_handoff: form.requiresHandoff,
    },
  };
}

export function validateProtocolForm(form: ProtocolFormValues): string | null {
  if (!form.title.trim()) return "El título es obligatorio";
  if (!form.summary.trim()) return "El resumen es obligatorio";
  const steps = form.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0) return "Añade al menos un paso";
  return null;
}

export function localDraftStorageKey(businessId: string, draftId: string): string {
  return `knowledge-protocol-draft:${businessId}:${draftId}`;
}

export function narrativeStorageKey(businessId: string): string {
  return `knowledge-protocol-narrative:${businessId}`;
}
