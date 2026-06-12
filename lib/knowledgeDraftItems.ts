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
      else if (sourceId === "tools") label = String(i.name ?? "Herramienta");
      else if (sourceId === "products") label = String(i.name ?? "Producto");
      return { itemId: String(i.itemId), label, data: i };
    });
}
