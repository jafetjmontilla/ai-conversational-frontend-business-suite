"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function ToolsKnowledgePage() {
  const t = getKnowledgeType("tools");
  return (
    <KnowledgeGenericPage
      sourceId="tools"
      title={t?.label ?? "Herramientas"}
      description={t?.description ?? "APIs reales"}
      narrativePlaceholder="Ej: Tenemos la API de consulta de pedidos: GET /api/orders/{id} devuelve estado y detalle. La API de reembolso POST /api/refunds requiere orderId y amount. Ambas usan el header X-API-Key."
    />
  );
}
