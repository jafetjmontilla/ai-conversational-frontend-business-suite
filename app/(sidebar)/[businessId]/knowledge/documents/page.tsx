"use client";

import { KnowledgeGenericPage } from "../KnowledgeGenericPage";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export default function DocumentsKnowledgePage() {
  const t = getKnowledgeType("documents");
  return (
    <KnowledgeGenericPage
      sourceId="documents"
      title={t?.label ?? "Documentos"}
      description={t?.description ?? "Normativas, resoluciones y referencia general"}
      narrativePlaceholder="Pega el texto de una normativa, resolución, circular o documento de referencia. Ejemplo: Resolución 045/2024 sobre plazos de entrega. Los envíos nacionales deben despacharse en 48 horas hábiles. Las excepciones se documentan por escrito…"
      composeMode="upload"
    />
  );
}
