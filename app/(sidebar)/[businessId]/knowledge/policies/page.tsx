"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function PoliciesKnowledgePage() {
  const t = getKnowledgeType("policies");
  return (
    <KnowledgeGenericPage
      sourceId="policies"
      title={t?.label ?? "Políticas"}
      description={t?.description ?? "Reglas NO romper"}
      narrativePlaceholder="Ej: No se aceptan devoluciones sin ticket. Los precios publicados son finales. No se comparte información de clientes con terceros. Horario de atención: L-V 9-18h."
    />
  );
}
