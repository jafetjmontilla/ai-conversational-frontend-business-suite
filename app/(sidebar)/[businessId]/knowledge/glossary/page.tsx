"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function GlossaryKnowledgePage() {
  const t = getKnowledgeType("glossary");
  return (
    <KnowledgeGenericPage
      sourceId="glossary"
      title={t?.label ?? "Glosario"}
      description={t?.description ?? "Definiciones"}
      narrativePlaceholder="Ej: En nuestro negocio usamos estos términos: SLA es el acuerdo de nivel de servicio con el cliente; NPS es la puntuación de satisfacción; B2B significa negocio a negocio."
    />
  );
}
