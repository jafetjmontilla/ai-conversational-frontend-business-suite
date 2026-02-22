"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function ProductsKnowledgePage() {
  const t = getKnowledgeType("products");
  return (
    <KnowledgeGenericPage
      sourceId="products"
      title={t?.label ?? "Productos"}
      description={t?.description ?? "Catálogo"}
      narrativePlaceholder="Ej: Plan Básico: 29€/mes, 5 usuarios, soporte por email. Plan Pro: 79€/mes, usuarios ilimitados, soporte prioritario. Plan Enterprise: precio bajo demanda, SLA garantizado."
    />
  );
}
