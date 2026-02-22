"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function FaqsKnowledgePage() {
  const t = getKnowledgeType("faqs");
  return (
    <KnowledgeGenericPage
      sourceId="faqs"
      title={t?.label ?? "FAQs"}
      description={t?.description ?? "Preguntas comunes"}
      narrativePlaceholder="Ej: ¿Cuánto tarda el envío? Entre 24 y 48 horas. ¿Aceptan devoluciones? Sí, en 30 días con ticket. ¿Formas de pago? Tarjeta, transferencia y efectivo."
    />
  );
}
