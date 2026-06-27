/**
 * Tipos de fuente de conocimiento (sourceId) y sus etiquetas para la UI.
 * Orden y prioridad según recomendación: protocols ⭐⭐⭐⭐⭐, glossary ⭐⭐⭐⭐⭐, etc.
 */
export const KNOWLEDGE_SOURCE_TYPES = [
  { sourceId: "protocols", label: "Protocolos", description: "Cómo hacer", priority: 5 },
  { sourceId: "glossary", label: "Glosario", description: "Definiciones", priority: 5 },
  { sourceId: "faqs", label: "FAQs", description: "Preguntas comunes", priority: 4 },
  { sourceId: "policies", label: "Políticas", description: "Reglas NO romper", priority: 4 },
  { sourceId: "tools", label: "Referencia de APIs", description: "Documentación indexada para el RAG (no ejecuta llamadas)", priority: 3 },
  { sourceId: "case_studies", label: "Casos de estudio", description: "Lecciones reales", priority: 3 },
] as const;

export type KnowledgeSourceId = (typeof KNOWLEDGE_SOURCE_TYPES)[number]["sourceId"];

/** sourceIds que ya tienen backend (flujo IA → aprobar → indexar) implementado */
export const IMPLEMENTED_SOURCE_IDS: KnowledgeSourceId[] = [
  "protocols",
  "faqs",
  "glossary",
  "policies",
  "tools",
  "case_studies",
];

export function getKnowledgeType(sourceId: string) {
  return KNOWLEDGE_SOURCE_TYPES.find((t) => t.sourceId === sourceId);
}

export function isKnowledgeTypeImplemented(sourceId: string): boolean {
  return IMPLEMENTED_SOURCE_IDS.includes(sourceId as KnowledgeSourceId);
}
