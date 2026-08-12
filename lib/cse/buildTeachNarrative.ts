import type { TeachMode, TeachSourceId } from "@/lib/cse/types";
import { getKnowledgeType } from "@/lib/knowledgeTypes";

export type BuildTeachNarrativeInput = {
  mode: TeachMode;
  sourceId: TeachSourceId;
  userMessage: string;
  botResponse: string;
  suggestion?: string;
  conversationId?: string;
};

/**
 * Narrativa para sendKnowledgeNarrative / extractors.
 * Debe leerse como material de dominio (atención al cliente), no como meta del chat de prueba:
 * el extractor copia el texto al item; si hablamos de "CSE/indexar", eso termina en el FAQ.
 */
export function buildTeachNarrative(input: BuildTeachNarrativeInput): string {
  const sourceLabel = getKnowledgeType(input.sourceId)?.label ?? input.sourceId;
  const suggestion = input.suggestion?.trim();
  const question = input.userMessage.trim();
  const badAnswer = input.botResponse.trim();

  const voiceRules = [
    "El contenido generado es para el agente de atención al cliente del negocio.",
    "Redacta question/answer (o el equivalente de la fuente) como si un cliente real preguntara y el agente respondiera.",
    "Nunca menciones: chat de prueba, CSE, borrador, indexar, operador, teach, API, webhook ni el proceso de generación de conocimiento.",
    "Nunca describas el rol del generador ni el flujo técnico; solo el conocimiento útil para el cliente.",
  ].join("\n- ");

  const failedBlock = [
    "Respuesta INCORRECTA o INSUFICIENTE que dio el agente (NO uses este texto como verdad; no lo copies):",
    `"""`,
    badAnswer,
    `"""`,
  ].join("\n");

  const suggestionBlock = suggestion
    ? [
        "Indicaciones del responsable del negocio sobre la respuesta CORRECTA (prioridad alta; úsalas como base del contenido):",
        `"""`,
        suggestion,
        `"""`,
      ].join("\n")
    : [
        "No hay indicaciones adicionales del responsable.",
        "Inventa una respuesta plausible y profesional de atención al cliente para esa pregunta,",
        "sin inventar datos sensibles (precios, horarios, políticas) si no están en el texto;",
        "si faltan datos, deja la respuesta genérica y correcta en tono, sin decir que eres un generador de conocimiento.",
      ].join(" ");

  const goal =
    input.mode === "create"
      ? `Falta conocimiento en ${sourceLabel}. Crea ítems nuevos para que el agente de atención al cliente pueda responder bien la próxima vez.`
      : `El agente de atención al cliente respondió mal. Crea ítems corregidos en ${sourceLabel} con la respuesta correcta.`;

  const sourceHint =
    input.sourceId === "faqs"
      ? `Formato: FAQ. "question" debe ser la pregunta del cliente (o una reformulación natural). "answer" debe ser la respuesta del agente de atención al cliente.`
      : input.sourceId === "glossary"
        ? `Formato: glosario. Definiciones claras para que el agente de atención al cliente las use al explicar términos.`
        : input.sourceId === "policies"
          ? `Formato: políticas. Reglas que el agente de atención al cliente debe respetar al atender.`
          : input.sourceId === "tools"
            ? `Formato: referencia de herramientas/APIs útiles para que el agente sepa qué existe (descripción orientada a atención, no meta del sistema de pruebas).`
            : `Formato: caso de estudio. Situación del cliente, solución correcta y lección para el agente de atención al cliente.`;

  const lines = [
    goal,
    "",
    "Reglas de redacción:",
    `- ${voiceRules}`,
    "",
    "Pregunta del cliente:",
    `"""`,
    question,
    `"""`,
    "",
    failedBlock,
    "",
    suggestionBlock,
    "",
    sourceHint,
    "",
    `Genera el contenido estructurado para sourceId="${input.sourceId}".`,
  ];

  if (input.conversationId) {
    lines.push(
      "",
      `(Referencia interna opcional, no incluir en question/answer: ${input.conversationId})`
    );
  }

  return lines.join("\n");
}

/**
 * Dado un mensaje assistant y la lista completa, encuentra el user inmediatamente anterior.
 */
export function findTeachTurn(
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    interim?: boolean;
  }>,
  assistantMessageId: string
): { user: (typeof messages)[number]; assistant: (typeof messages)[number] } | null {
  const assistantIndex = messages.findIndex((m) => m.id === assistantMessageId);
  if (assistantIndex < 0) return null;
  const assistant = messages[assistantIndex];
  if (assistant.role !== "assistant" || assistant.interim) return null;

  for (let i = assistantIndex - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "user") {
      return { user: m, assistant };
    }
  }
  return null;
}
