import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";

export type DraftItemPreview = {
  itemId: string;
  label: string;
  data: Record<string, unknown>;
};

export function extractDraftItems(sourceId: KnowledgeSourceId, payload: Record<string, unknown>): DraftItemPreview[] {
  if (sourceId === "case_studies") {
    const itemId = payload.itemId as string | undefined;
    if (!itemId) return [];
    return [
      {
        itemId,
        label: String(payload.title ?? "Caso de estudio"),
        data: payload,
      },
    ];
  }
  if (sourceId === "glossary") {
    const title = String(payload.title ?? "Glosario");
    return ((payload.terms as Array<Record<string, unknown>>) ?? [])
      .filter((t) => t.itemId)
      .map((t) => ({
        itemId: String(t.itemId),
        label: `${t.term ?? "Término"} — ${title}`,
        data: t,
      }));
  }
  return ((payload.items as Array<Record<string, unknown>>) ?? [])
    .filter((i) => i.itemId)
    .map((i) => {
      let label = "Item";
      if (sourceId === "faqs") label = String(i.question ?? "FAQ");
      else if (sourceId === "policies") label = String(i.rule ?? "Política");
      else if (sourceId === "tools") label = String(i.name ?? "API");
      else if (sourceId === "products") label = String(i.name ?? "Producto");
      return { itemId: String(i.itemId), label, data: i };
    });
}

export function mergeDraftItemPayload(
  sourceId: KnowledgeSourceId,
  payload: Record<string, unknown>,
  itemId: string,
  itemData: Record<string, unknown>
): Record<string, unknown> {
  const dataWithId = { ...itemData, itemId };
  if (sourceId === "case_studies") {
    return { ...payload, ...dataWithId };
  }
  if (sourceId === "glossary") {
    const terms = ((payload.terms as Array<Record<string, unknown>>) ?? []).map((t) =>
      t.itemId === itemId ? dataWithId : t
    );
    return { ...payload, terms };
  }
  const items = ((payload.items as Array<Record<string, unknown>>) ?? []).map((i) =>
    i.itemId === itemId ? dataWithId : i
  );
  return { ...payload, items };
}

export function draftItemViewKey(draftId: string, itemId: string): string {
  return `${draftId}:${itemId}`;
}
