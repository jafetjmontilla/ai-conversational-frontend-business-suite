"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function CaseStudiesKnowledgePage() {
  const t = getKnowledgeType("case_studies");
  return (
    <KnowledgeGenericPage
      sourceId="case_studies"
      title={t?.label ?? "Casos de estudio"}
      description={t?.description ?? "Lecciones reales"}
      narrativePlaceholder="Ej: Un cliente reclamó retraso en el envío. Revisamos el pedido y vimos que el pago se había confirmado tarde. Ofrecimos envío prioritario sin costo. Lección: comunicar plazos reales desde el inicio."
    />
  );
}
